"""Reframe a video to another aspect ratio (9:16 Reels/Shorts, 1:1, 4:5, 16:9).

Crops around a horizontal (and vertical) center, then scales to the
platform resolution. Run it on the SOURCE before editing, so subtitles and
overlays are laid out for the final frame - never on a subtitled render
(the crop would cut the captions).

Find the subject's position with timeline_view.py first: --x 0.5 is the
middle of the frame, 0.3 is left of center.

Usage:
    python helpers/reframe.py in.mp4 -o in_9x16.mp4 --aspect 9:16
    python helpers/reframe.py in.mp4 -o in_9x16.mp4 --aspect 9:16 --x 0.42
    python helpers/reframe.py in.mp4 -o in_1x1.mp4 --aspect 1:1 --blur
"""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

TARGETS = {"9:16": (1080, 1920), "1:1": (1080, 1080), "4:5": (1080, 1350), "16:9": (1920, 1080)}


def main() -> None:
    ap = argparse.ArgumentParser(description="Reframe to a new aspect ratio")
    ap.add_argument("input", type=Path)
    ap.add_argument("-o", "--output", type=Path, required=True)
    ap.add_argument("--aspect", choices=sorted(TARGETS), default="9:16")
    ap.add_argument("--x", type=float, default=0.5, help="Horizontal center of the crop, 0-1")
    ap.add_argument("--y", type=float, default=0.5, help="Vertical center of the crop, 0-1")
    ap.add_argument("--blur", action="store_true",
                    help="Fit the whole frame over a blurred fill instead of cropping")
    ap.add_argument("--crf", default="20")
    args = ap.parse_args()

    w, h = TARGETS[args.aspect]
    if args.blur:
        vf = (f"split[a][b];[a]scale={w}:{h}:force_original_aspect_ratio=increase,"
              f"crop={w}:{h},boxblur=20:2[bg];[b]scale={w}:{h}:force_original_aspect_ratio=decrease[fg];"
              f"[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1")
    else:
        # crop the largest w:h window, centered on (x, y) and clamped to the frame
        cw = f"min(iw\\,ih*{w}/{h})"
        ch = f"min(ih\\,iw*{h}/{w})"
        vf = (f"crop={cw}:{ch}:"
              f"max(0\\,min(iw-{cw}\\,iw*{args.x}-{cw}/2)):"
              f"max(0\\,min(ih-{ch}\\,ih*{args.y}-{ch}/2)),"
              f"scale={w}:{h},setsar=1")

    subprocess.run([
        "ffmpeg", "-y", "-i", str(args.input), "-vf", vf,
        "-c:v", "libx264", "-preset", "fast", "-crf", args.crf, "-pix_fmt", "yuv420p",
        "-c:a", "copy", "-movflags", "+faststart", str(args.output),
    ], check=True)
    print(f"reframed {args.aspect} -> {args.output}")


if __name__ == "__main__":
    main()
