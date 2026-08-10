#!/usr/bin/env bash
# Linux dev/build requires WebKitGTK 4.1 on Ubuntu 24.04+ (4.0 is no longer shipped).
set -euo pipefail
cd "$(dirname "$0")/.."
exec wails dev -tags webkit2_41 "$@"
