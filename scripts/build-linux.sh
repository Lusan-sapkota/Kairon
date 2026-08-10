#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
exec wails build -tags webkit2_41 "$@"
