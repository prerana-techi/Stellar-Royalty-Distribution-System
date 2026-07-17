#!/bin/bash
set -euo pipefail

export PATH="/Users/preranamondal/.cargo/bin:/opt/homebrew/bin:$PATH"

echo "=== Rust version ==="
rustc --version
cargo --version

echo "=== Adding wasm32 target ==="
rustup target add wasm32-unknown-unknown

echo "=== Node version ==="
node --version
npm --version

echo "=== Checking stellar CLI ==="
if command -v stellar &> /dev/null; then
    stellar --version
else
    echo "stellar CLI not found, will install via brew"
    brew install stellar-cli || echo "brew formula not found, will try cargo install"
fi

echo "=== SETUP COMPLETE ==="
