#!/bin/sh
# Hostinger-safe Vite build: fix esbuild +x / copy to /tmp, then build.
set -e
cd "$(dirname "$0")/.."
BIN="$(node tools/ensure-esbuild-bin.mjs)"
if [ -n "$BIN" ]; then
  export ESBUILD_BINARY_PATH="$BIN"
fi
node tools/generate-llms.js || true
exec vite build
