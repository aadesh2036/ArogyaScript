#!/usr/bin/env python3
"""
Node.js ↔ Python bridge for the YOLO cropper.
Called as a subprocess by cropperService.js.

Usage:
    python _node_bridge.py <input_image_path> <output_save_path>

Outputs a JSON object to stdout:
    { "success": true }                 — crop saved to output path
    { "success": false, "reason": "…" } — no detection or error
"""

import sys
import json
import os
import io

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "reason": "Missing arguments: input_path output_path"}))
        sys.exit(0)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    if not os.path.isfile(input_path):
        print(json.dumps({"success": False, "reason": f"Input file not found: {input_path}"}))
        sys.exit(0)

    try:
        # Redirect stdout while importing/running YOLO to suppress its logging
        real_stdout = sys.stdout
        sys.stdout = io.StringIO()

        from cropper import crop_prescription
        result = crop_prescription(input_path, save_path=output_path)

        # Restore stdout for our JSON output
        sys.stdout = real_stdout

        if result is not None and os.path.isfile(output_path):
            print(json.dumps({"success": True}))
        else:
            print(json.dumps({"success": False, "reason": "No document detected in image"}))

    except Exception as e:
        # Ensure stdout is restored even on error
        sys.stdout = sys.__stdout__
        print(json.dumps({"success": False, "reason": str(e)}))

    sys.exit(0)

if __name__ == "__main__":
    main()
