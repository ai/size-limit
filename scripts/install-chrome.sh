#!/bin/bash

set -eu

RPM="https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm"
ARCHIVE="/tmp/google-chrome.rpm"
CHROME="$HOME/.local/opt/google/chrome/chrome"
BIN="$HOME/.local/bin/google-chrome-stable"

if [ -x "$BIN" ]; then
  echo "Chrome is already installed: $("$BIN" --version 2>/dev/null)"
  exit 0
fi

echo "Downloading Google Chrome"
mkdir -p "$HOME/.local/bin"
curl -sSfL "$RPM" -o "$ARCHIVE"
rpm2archive - < "$ARCHIVE" | tar -xz -C "$HOME/.local" --strip-components=1 ./opt
rm "$ARCHIVE"
ln -sf "$CHROME" "$BIN"

echo "Installed $("$BIN" --version 2>/dev/null)"
