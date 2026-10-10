"""Transcribe a video locally with faster-whisper (free, no API key).

Replaces the ElevenLabs Scribe call from upstream video-use. Extracts mono
16kHz audio via ffmpeg, runs Whisper with word-level timestamps, and writes
a Scribe-shaped JSON to <edit_dir>/transcripts/<video_stem>.json so every
other helper (pack_transcripts, timeline_view, render) works unchanged:

    {"language_code": "pt", "text": "...", "source": "faster-whisper/<model>",
     "words": [{"text": "Oi", "start": 0.52, "end": 0.71, "type": "word",
                "speaker_id": "speaker_0"},
               {"text": " ", "start": 0.71, "end": 0.80, "type": "spacing"}, ...]}

Differences from Scribe, by design of Whisper:
  - no speaker diarization: every word is speaker_0
  - no audio events ((risos), (aplausos))
  - Whisper tends to drop fillers ("é...", "hum"); the Portuguese prompt
    below nudges it to keep them, but look at gaps too, not just words.

Cached: if the output file already exists, transcription is skipped.

Usage:
    python helpers/transcribe.py <video_path>
    python helpers/transcribe.py <video_path> --language pt --model medium
    python helpers/transcribe.py <video_path> --edit-dir /custom/edit
"""

from __future__ import annotations

import argparse
import array
import json
import math
import os
import subprocess
import sys
import tempfile
import time
import wave
from pathlib import Path


DEFAULT_MODEL = os.environ.get("WHISPER_MODEL", "small")

# Biases Whisper towards verbatim output: a prompt full of hesitations makes
# it far more likely to transcribe the speaker's own "é..." and "hum".
VERBATIM_PROMPT = {
    "pt": "Hum, é... então, tipo, né? Eh, assim... Ah, tá. Hã, deixa eu ver... é, isso.",
    "en": "Umm, uh... so, like, you know? Uh, I mean... Hmm, okay. Uh, let me see... yeah.",
}


def load_api_key() -> str:
    """Kept for compatibility with transcribe_batch; local Whisper needs no key."""
    return ""


def count_audio_tracks(video_path: Path) -> int:
    """How many audio streams the container holds."""
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a",
         "-show_entries", "stream=index", "-of", "csv=p=0", str(video_path)],
        capture_output=True, text=True,
    )
    return len([ln for ln in out.stdout.splitlines() if ln.strip()])


def peak_dbfs(wav_path: Path) -> float:
    """Peak level of a 16-bit PCM wav, in dBFS. -inf for digital silence."""
    peak = 0
    with wave.open(str(wav_path), "rb") as w:
        while frames := w.readframes(1 << 16):
            samples = array.array("h", frames)
            peak = max(peak, max(samples), -min(samples))
    return 20 * math.log10(peak / 32768) if peak > 0 else float("-inf")


def extract_audio(video_path: Path, dest: Path, audio_track: int = 0) -> None:
    cmd = [
        "ffmpeg", "-y", "-i", str(video_path),
        "-map", f"0:a:{audio_track}",
        "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le",
        str(dest),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


_MODELS: dict[str, object] = {}


def get_model(name: str):
    if name not in _MODELS:
        from faster_whisper import WhisperModel
        _MODELS[name] = WhisperModel(name, device="cpu", compute_type="int8",
                                     cpu_threads=os.cpu_count() or 4)
    return _MODELS[name]


def call_whisper(
    audio_path: Path,
    model_name: str = DEFAULT_MODEL,
    language: str | None = None,
    verbose: bool = True,
    duration: float | None = None,
) -> dict:
    model = get_model(model_name)
    prompt = VERBATIM_PROMPT.get(language or "pt", VERBATIM_PROMPT["pt"])
    segments, info = model.transcribe(
        str(audio_path),
        language=language,
        word_timestamps=True,
        initial_prompt=prompt,
        condition_on_previous_text=False,  # stops hallucinated repeats on long files
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 300, "speech_pad_ms": 100},
        beam_size=5,
    )

    words: list[dict] = []
    texts: list[str] = []
    last_end: float | None = None
    last_report = time.time()
    for seg in segments:
        texts.append(seg.text.strip())
        for w in seg.words or []:
            token = w.word.strip()
            if not token:
                continue
            start, end = round(w.start, 3), round(w.end, 3)
            if last_end is not None and start > last_end:
                words.append({"text": " ", "start": last_end, "end": start, "type": "spacing"})
            words.append({"text": token, "start": start, "end": end,
                          "type": "word", "speaker_id": "speaker_0",
                          "logprob": round(math.log(max(w.probability, 1e-6)), 3)})
            last_end = end
        if verbose and duration and time.time() - last_report > 15:
            print(f"    {seg.end / duration:5.1%}  ({seg.end / 60:.1f} de {duration / 60:.1f} min)",
                  flush=True)
            last_report = time.time()

    return {
        "language_code": info.language,
        "language_probability": round(info.language_probability, 3),
        "text": " ".join(texts),
        "source": f"faster-whisper/{model_name}",
        "words": words,
    }


def transcript_path(edit_dir: Path, video: Path, audio_track: int = 0) -> Path:
    """Where a video's transcript lands. Track 0 keeps the plain name."""
    suffix = "" if audio_track == 0 else f".track{audio_track}"
    return edit_dir / "transcripts" / f"{video.stem}{suffix}.json"


def media_duration(path: Path) -> float | None:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    try:
        return float(out.stdout.strip())
    except ValueError:
        return None


def transcribe_one(
    video: Path,
    edit_dir: Path,
    api_key: str = "",
    language: str | None = None,
    num_speakers: int | None = None,
    verbose: bool = True,
    audio_track: int = 0,
    model: str = DEFAULT_MODEL,
) -> Path:
    """Transcribe a single video. Returns path to transcript JSON. Cached."""
    transcripts_dir = edit_dir / "transcripts"
    transcripts_dir.mkdir(parents=True, exist_ok=True)
    out_path = transcript_path(edit_dir, video, audio_track)

    if out_path.exists():
        if verbose:
            print(f"cached: {out_path.name}")
        return out_path

    if verbose:
        print(f"  extracting audio from {video.name}", flush=True)

    n_tracks = count_audio_tracks(video)
    if n_tracks > 1 and verbose:
        print(f"  note: {video.name} has {n_tracks} audio tracks, using track "
              f"{audio_track + 1} (--audio-track to change)", flush=True)

    t0 = time.time()
    with tempfile.TemporaryDirectory() as tmp:
        audio = Path(tmp) / f"{video.stem}.wav"
        extract_audio(video, audio, audio_track)

        peak = peak_dbfs(audio)
        if peak < -60.0:
            raise RuntimeError(
                f"track {audio_track + 1} of {video.name} is silent "
                f"(peak {peak:.1f} dBFS). "
                + (f"The file has {n_tracks} audio tracks; try --audio-track "
                   + " or ".join(str(i) for i in range(n_tracks) if i != audio_track) + "."
                   if n_tracks > 1 else "Check the source audio.")
            )

        if verbose:
            print(f"  transcribing locally with whisper '{model}'", flush=True)
        payload = call_whisper(audio, model, language, verbose, media_duration(audio))

    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    dt = time.time() - t0

    if verbose:
        kb = out_path.stat().st_size / 1024
        print(f"  saved: {out_path.name} ({kb:.1f} KB) in {dt:.1f}s")
        print(f"    words: {sum(1 for w in payload['words'] if w['type'] == 'word')}")

    return out_path


def main() -> None:
    ap = argparse.ArgumentParser(description="Transcribe a video locally with faster-whisper")
    ap.add_argument("video", type=Path, help="Path to video file")
    ap.add_argument("--edit-dir", type=Path, default=None,
                    help="Edit output directory (default: <video_parent>/edit)")
    ap.add_argument("--language", type=str, default="pt",
                    help="ISO language code (default: pt). Pass 'auto' to detect.")
    ap.add_argument("--model", type=str, default=DEFAULT_MODEL,
                    help="Whisper model: tiny, base, small (default), medium, large-v3. "
                         "Bigger is more accurate and slower.")
    ap.add_argument("--num-speakers", type=int, default=None,
                    help="Ignored (Whisper does no diarization); kept for compatibility.")
    ap.add_argument("--audio-track", type=int, default=0,
                    help="Zero-based audio track to transcribe (OBS: 0 = game, 1 = mic).")
    args = ap.parse_args()

    video = args.video.resolve()
    if not video.exists():
        sys.exit(f"video not found: {video}")

    edit_dir = (args.edit_dir or (video.parent / "edit")).resolve()
    transcribe_one(
        video=video,
        edit_dir=edit_dir,
        language=None if args.language == "auto" else args.language,
        audio_track=args.audio_track,
        model=args.model,
    )


if __name__ == "__main__":
    main()
