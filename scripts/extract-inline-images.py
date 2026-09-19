#!/usr/bin/env python3
"""Move large base64 images into lossless, deduplicated static assets.

Preview: python3 scripts/extract-inline-images.py --check
Apply:   python3 scripts/extract-inline-images.py

The image bytes are preserved exactly. Content hashes keep filenames stable
across runs and change them when an image changes, so browser caches stay valid.
Paths are relative to the HTML document, including on GitHub Pages project URLs.
"""

import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile


IMAGE_DATA_URL = re.compile(
    r"data:image/(?P<type>png|jpe?g|webp|gif|avif|bmp|x-icon|vnd\.microsoft\.icon)"
    r";base64,(?P<data>[A-Za-z0-9+/]+={0,2})",
    re.IGNORECASE,
)
EXTENSIONS = {"jpeg": "jpg", "x-icon": "ico", "vnd.microsoft.icon": "ico"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--html", type=Path,
        default=Path(__file__).resolve().parent.parent / "index.html",
        help="HTML to update (default: the repository's index.html)",
    )
    parser.add_argument(
        "--check", action="store_true",
        help="Report the possible savings without writing files",
    )
    parser.add_argument(
        "--min-bytes", type=int, default=1024,
        help="Keep tiny images embedded (default: extract images of at least 1024 bytes)",
    )
    args = parser.parse_args()
    if args.min_bytes < 0:
        parser.error("--min-bytes must be non-negative")

    html_path = args.html.resolve()
    source_bytes = html_path.read_bytes()
    source = source_bytes.decode("utf-8")
    assets = {}
    occurrences = 0

    def extract(match):
        nonlocal occurrences
        image_bytes = base64.b64decode(match["data"], validate=True)
        if len(image_bytes) < args.min_bytes:
            return match[0]
        mime_type = match["type"].lower()
        extension = EXTENSIONS.get(mime_type, mime_type)
        digest = hashlib.sha256(image_bytes).hexdigest()[:16]
        relative_path = f"assets/image-{digest}.{extension}"
        if relative_path in assets and assets[relative_path] != image_bytes:
            raise ValueError(f"Content hash collision: {relative_path}")
        assets[relative_path] = image_bytes
        occurrences += 1
        return relative_path

    rewritten = IMAGE_DATA_URL.sub(extract, source).encode("utf-8")
    # Validate the full plan before changing either the HTML or any assets.
    for relative_path, image_bytes in assets.items():
        asset_path = html_path.parent / relative_path
        if asset_path.exists() and asset_path.read_bytes() != image_bytes:
            raise ValueError(f"Refusing to overwrite a different file: {asset_path}")

    if not args.check and occurrences:
        for relative_path, image_bytes in assets.items():
            asset_path = html_path.parent / relative_path
            asset_path.parent.mkdir(parents=True, exist_ok=True)
            if not asset_path.exists():
                asset_path.write_bytes(image_bytes)
        # Finish the HTML replacement only after every referenced file exists.
        with tempfile.NamedTemporaryFile(dir=html_path.parent, delete=False) as tmp:
            temporary_path = Path(tmp.name)
            tmp.write(rewritten)
        try:
            os.chmod(temporary_path, html_path.stat().st_mode)
            os.replace(temporary_path, html_path)
        finally:
            temporary_path.unlink(missing_ok=True)

    asset_bytes = sum(map(len, assets.values()))
    print(json.dumps({
        "mode": "check" if args.check else "apply",
        "html": str(html_path),
        "references_extracted": occurrences,
        "unique_images": len(assets),
        "html_bytes_before": len(source_bytes),
        "html_bytes_after": len(rewritten),
        "html_bytes_saved": len(source_bytes) - len(rewritten),
        "extracted_asset_bytes": asset_bytes,
        "total_uncompressed_bytes_saved": len(source_bytes) - len(rewritten) - asset_bytes,
    }, indent=2))


if __name__ == "__main__":
    main()
