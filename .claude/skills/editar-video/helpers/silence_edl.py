"""Build an EDL that cuts dead air, from the audio alone (no transcript).

Uses ffmpeg silencedetect, so it works with no Whisper model at all and
runs at several times real speed even on hour-long recordings. Use it when
transcription is unavailable, or as a fast first pass on long footage.
It cannot see filler words or retakes - only silence. When a transcript
exists, prefer auto_edl.py, which snaps to word boundaries.

Usage:
    python helpers/silence_edl.py <video> -o <edit>/edl.json
    python helpers/silence_edl.py <video> --min-silence 0.8 --threshold -35
    python helpers/silence_edl.py <video> --remove 0-12.3 --keep-gap 0.3
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


def detect_silences(video: Path, threshold_db: float, min_silence: float,
                    audio_track: int) -> tuple[list[tuple[float, float]], float]:
    proc = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-map", f"0:a:{audio_track}",
         "-af", f"silencedetect=noise={threshold_db}dB:d={min_silence}", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", proc.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", proc.stderr)]
    dur = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)],
        capture_output=True, text=True).stdout.strip()
    duration = float(dur)
    if len(ends) < len(starts):          # file ends in silence
        ends.append(duration)
    return [(max(0.0, s), e) for s, e in zip(starts, ends)], duration


def main() -> None:
    ap = argparse.ArgumentParser(description="EDL that removes silences (audio-only)")
    ap.add_argument("video", type=Path)
    ap.add_argument("-o", "--output", type=Path, default=None)
    ap.add_argument("--threshold", type=float, default=-35.0,
                    help="Below this level (dBFS) counts as silence (default -35; "
                         "noisy room: -30, very clean mic: -40)")
    ap.add_argument("--min-silence", type=float, default=0.7,
                    help="Only silences longer than this (s) are cut (default 0.7)")
    ap.add_argument("--keep-gap", type=float, default=0.3,
                    help="Air left in place of each removed silence (default 0.3s)")
    ap.add_argument("--remove", action="append", default=[], metavar="A-B",
                    help="Seconds range to cut entirely; repeatable")
    ap.add_argument("--grade", default=None)
    ap.add_argument("--audio-track", type=int, default=0)
    args = ap.parse_args()

    video = args.video.resolve()
    if not video.exists():
        sys.exit(f"video not found: {video}")
    silences, duration = detect_silences(video, args.threshold, args.min_silence, args.audio_track)

    half = args.keep_gap / 2
    cuts = [(s + half, e - half) for s, e in silences if e - s > args.keep_gap]
    for r in args.remove:
        a, b = (float(x) for x in r.split("-", 1))
        cuts.append((a, b))
    cuts.sort()

    # Merge overlapping cuts, then keep the complement
    merged: list[list[float]] = []
    for a, b in cuts:
        if merged and a <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])

    ranges, t = [], 0.0
    for a, b in merged:
        if a - t > 0.15:
            ranges.append({"source": video.stem, "start": round(t, 3), "end": round(a, 3)})
        t = max(t, b)
    if duration - t > 0.15:
        ranges.append({"source": video.stem, "start": round(t, 3), "end": round(duration, 3)})
    if not ranges:
        sys.exit("everything is silence at this threshold - raise --threshold (e.g. -45)")

    total = sum(r["end"] - r["start"] for r in ranges)
    edl = {"version": 1, "sources": {video.stem: str(video)}, "ranges": ranges,
           "total_duration_s": round(total, 2)}
    if args.grade:
        edl["grade"] = args.grade

    out = (args.output or video.parent / "edit" / "edl.json").resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(edl, indent=2, ensure_ascii=False))
    print(f"{len(silences)} silences found, {len(ranges)} ranges kept: "
          f"{total / 60:.1f} of {duration / 60:.1f} min ({1 - total / duration:.0%} cut) -> {out}")


if __name__ == "__main__":
    main()
