#!/bin/bash
# Git-native adapter - Commit screenshots to .pre-post/ on the PR branch
#
# Usage: ./git-native.sh <file>
# Output: raw.githubusercontent.com URL (stdout)
#
# Requirements:
#   - Inside a git repo with a remote named "origin"
#   - Current branch pushed to origin
#
# Notes:
#   - Stages only the specific file, never `git add .`
#   - Does NOT commit or push — the caller (upload-and-copy.sh) batches that
#   - Returns the raw GitHub URL the file will be available at after push

set -e

FILE="$1"

if [[ -z "$FILE" ]]; then
    echo "Usage: $0 <file>" >&2
    exit 1
fi

if [[ ! -f "$FILE" ]]; then
    echo "Error: File not found: $FILE" >&2
    exit 1
fi

# Must be inside a git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    echo "Error: Not inside a git repository" >&2
    exit 1
fi

# Parse owner/repo from origin remote
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [[ -z "$REMOTE_URL" ]]; then
    echo "Error: No 'origin' remote found" >&2
    exit 1
fi

# Extract owner/repo from HTTPS or SSH URL
# HTTPS: https://github.com/owner/repo.git
# SSH:   git@github.com:owner/repo.git
OWNER_REPO=$(echo "$REMOTE_URL" | sed -E 's#^(https?://github\.com/|git@github\.com:)##; s#\.git$##')

if [[ -z "$OWNER_REPO" || ! "$OWNER_REPO" =~ / ]]; then
    echo "Error: Could not parse owner/repo from remote: $REMOTE_URL" >&2
    exit 1
fi

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [[ -z "$BRANCH" || "$BRANCH" == "HEAD" ]]; then
    echo "Error: Could not determine current branch (detached HEAD?)" >&2
    exit 1
fi

# Copy file into .pre-post/ at the repo root
REPO_ROOT=$(git rev-parse --show-toplevel)
DEST_DIR="$REPO_ROOT/.pre-post"
mkdir -p "$DEST_DIR"

FILENAME=$(basename "$FILE")
DEST="$DEST_DIR/$FILENAME"
cp "$FILE" "$DEST"

# Stage only this specific file (-f to override .gitignore)
git add -f "$DEST"

echo "Staged: .pre-post/$FILENAME" >&2

# Return the raw GitHub URL (will resolve after push)
echo "https://raw.githubusercontent.com/$OWNER_REPO/$BRANCH/.pre-post/$FILENAME"
