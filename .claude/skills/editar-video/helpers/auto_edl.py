"""Build a first-pass EDL from a transcript: keep the speech, drop dead air.

For long recordings (lives, aulas, podcasts) hand-picking every range is
slow. This walks the word-level transcript and keeps everything spoken,
cutting:
  - silences longer than --max-gap (default 0.6s)
  - isolated filler words ("é", "hum", "ãh", ...) when --drop-fillers is on
  - optional time windows the user wants gone (--remove 120.5-188.0)
  - optional trim of the start/end (--start / --end)

Cut edges are snapped to word boundaries and padded (Hard Rules 6-7). The
result is a normal edl.json that render.py accepts, with one entry per kept
stretch. Read it, adjust by hand where the content calls for it, render.

Usage:
    python helpers/auto_edl.py <video> --edit-dir <edit> -o <edit>/edl.json
    python helpers/auto_edl.py <video> --edit-dir <edit> --max-gap 0.4 --drop-fillers
    python helpers/auto_edl.py <video> --edit-dir <edit> --remove 0-12.3 --remove 3605-3700
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from transcribe import transcript_path

FILLERS = {
    "é", "éé", "ééé", "eh", "ehh", "hum", "humm", "hm", "hmm", "ãh", "ã", "hã",
    "ah", "ahn", "uh", "um", "umm", "er", "erm",
}

PAD_BEFORE = 0.05
PAD_AFTER = 0.08


def normalize(token: str) -> str:
    return re.sub(r"[^\wãáàâéêíóôõúç]", "", token.lower())


def parse_window(s: str) -> tuple[float, float]:
    a, b = s.split("-", 1)
    return float(a), float(b)


def main() -> None:
    ap = argparse.ArgumentParser(description="Auto-build an EDL that removes pauses and fillers")
    ap.add_argument("video", type=Path)
    ap.add_argument("--edit-dir", type=Path, default=None)
    ap.add_argument("-o", "--output", type=Path, default=None)
    ap.add_argument("--max-gap", type=float, default=0.6,
                    help="Silences longer than this (s) are cut (default 0.6)")
    ap.add_argument("--keep-gap", type=float, default=0.25,
                    help="Air left in place of each removed silence (default 0.25s)")
    ap.add_argument("--drop-fillers", action="store_true",
                    help="Also cut standalone filler words (é, hum, ãh...)")
    ap.add_argument("--remove", action="append", default=[], metavar="A-B",
                    help="Seconds range to cut entirely; repeatable")
    ap.add_argument("--start", type=float, default=0.0, help="Ignore everything before (s)")
    ap.add_argument("--end", type=float, default=None, help="Ignore everything after (s)")
    ap.add_argument("--grade", default=None, help="Grade preset/filter to put in the EDL")
    ap.add_argument("--audio-track", type=int, default=0)
    args = ap.parse_args()

    video = args.video.resolve()
    edit_dir = (args.edit_dir or video.parent / "edit").resolve()
    tpath = transcript_path(edit_dir, video, args.audio_track)
    if not tpath.exists():
        sys.exit(f"transcript not found: {tpath} - run transcribe.py first")
    words = [w for w in json.loads(tpath.read_text())["words"] if w.get("type") == "word"]
    removes = [parse_window(r) for r in args.remove]

    def removed(w: dict) -> bool:
        if w["start"] < args.start or (args.end is not None and w["end"] > args.end):
            return True
        if any(a <= w["start"] < b or a < w["end"] <= b for a, b in removes):
            return True
        return args.drop_fillers and normalize(w["text"]) in FILLERS

    kept = [w for w in words if not removed(w)]
    if not kept:
        sys.exit("nothing left after filtering")

    # Group consecutive kept words; a gap > max-gap, a removed word in
    # between, or a removed window closes the range.
    ranges: list[list[dict]] = [[kept[0]]]
    index = {id(w): i for i, w in enumerate(words)}
    for prev, w in zip(kept, kept[1:]):
        contiguous = index[id(w)] == index[id(prev)] + 1
        if contiguous and w["start"] - prev["end"] <= args.max_gap:
            ranges[-1].append(w)
        else:
            ranges.append([w])

    stem = video.stem
    edl_ranges = []
    half_air = max(args.keep_gap / 2, PAD_AFTER)
    for i, group in enumerate(ranges):
        start = max(0.0, group[0]["start"] - max(PAD_BEFORE, args.keep_gap / 2))
        end = group[-1]["end"] + half_air
        # never pad into a neighbouring word (a dropped filler would come back)
        first, last = index[id(group[0])], index[id(group[-1])]
        if first > 0:
            start = max(start, words[first - 1]["end"] + 0.01)
        if last + 1 < len(words):
            end = min(end, words[last + 1]["start"] - 0.01)
        # never pad into the next kept range
        if i + 1 < len(ranges):
            end = min(end, ranges[i + 1][0]["start"] - PAD_BEFORE)
        if i > 0:
            start = max(start, edl_ranges[-1]["end"])
        quote = " ".join(w["text"] for w in group)
        edl_ranges.append({
            "source": stem,
            "start": round(start, 3),
            "end": round(end, 3),
            "quote": quote if len(quote) <= 120 else quote[:117] + "...",
        })

    # Merge ranges that ended up touching (saves segments, same result)
    merged: list[dict] = []
    for r in edl_ranges:
        if merged and r["start"] - merged[-1]["end"] < 0.02:
            merged[-1]["end"] = r["end"]
            merged[-1]["quote"] = (merged[-1]["quote"] + " " + r["quote"])[:120]
        else:
            merged.append(r)

    total = sum(r["end"] - r["start"] for r in merged)
    src_dur = words[-1]["end"]
    edl = {
        "version": 1,
        "sources": {stem: str(video)},
        "ranges": merged,
        "total_duration_s": round(total, 2),
    }
    if args.grade:
        edl["grade"] = args.grade

    out = (args.output or edit_dir / "edl.json").resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(edl, indent=2, ensure_ascii=False))
    print(f"{len(merged)} ranges, {total / 60:.1f} min kept of {src_dur / 60:.1f} min "
          f"({1 - total / src_dur:.0%} cut) -> {out}")


if __name__ == "__main__":
    main()
