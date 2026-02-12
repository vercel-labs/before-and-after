#!/bin/bash
# upload-and-copy.sh - Upload images via pluggable storage adapters
# Usage: ./upload-and-copy.sh <before.png> <after.png> [--markdown]
#
# Options:
#   --markdown    Generate PR markdown table and copy to clipboard
#
# Environment:
#   IMAGE_ADAPTER    Storage adapter to use (default: git-native)
#                    Available: git-native, 0x0st, gist, blob
#
# Adapter-specific environment variables:
#   blob:  BLOB_UPLOAD_URL - Custom upload endpoint
#
# Examples:
#   ./upload-and-copy.sh before.png after.png
#   ./upload-and-copy.sh before.png after.png --markdown
#   IMAGE_ADAPTER=0x0st ./upload-and-copy.sh before.png after.png --markdown

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADAPTERS_DIR="$SCRIPT_DIR/adapters"

# Default adapter
IMAGE_ADAPTER="${IMAGE_ADAPTER:-git-native}"

BEFORE_FILE="$1"
AFTER_FILE="$2"
shift 2 2>/dev/null || true

MARKDOWN_MODE=false

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        --markdown)
            MARKDOWN_MODE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate inputs
if [[ -z "$BEFORE_FILE" || -z "$AFTER_FILE" ]]; then
    echo "Usage: $0 <before.png> <after.png> [--markdown]"
    echo ""
    echo "Environment:"
    echo "  IMAGE_ADAPTER    Storage adapter (default: git-native)"
    echo "                   Available: git-native, 0x0st, gist, blob"
    exit 1
fi

if [[ ! -f "$BEFORE_FILE" ]]; then
    echo "Error: Before file not found: $BEFORE_FILE"
    exit 1
fi

if [[ ! -f "$AFTER_FILE" ]]; then
    echo "Error: After file not found: $AFTER_FILE"
    exit 1
fi

# Validate adapter exists
ADAPTER_SCRIPT="$ADAPTERS_DIR/$IMAGE_ADAPTER.sh"
if [[ ! -f "$ADAPTER_SCRIPT" ]]; then
    echo "Error: Unknown adapter: $IMAGE_ADAPTER"
    echo ""
    echo "Available adapters:"
    for adapter in "$ADAPTERS_DIR"/*.sh; do
        name=$(basename "$adapter" .sh)
        echo "  - $name"
    done
    exit 1
fi

# Upload function using adapter
upload_file() {
    local file="$1"
    local filename=$(basename "$file")

    echo "Uploading: $filename (via $IMAGE_ADAPTER)" >&2

    # Call the adapter script
    "$ADAPTER_SCRIPT" "$file"
}

# Upload both files
echo "=== Uploading Screenshots ==="
BEFORE_URL=$(upload_file "$BEFORE_FILE")
AFTER_URL=$(upload_file "$AFTER_FILE")

# For git-native adapter: batch commit + push after both files are staged
if [[ "$IMAGE_ADAPTER" == "git-native" ]]; then
    echo "Committing and pushing screenshots..." >&2
    git commit -m "chore: add pre/post screenshots"
    git push origin HEAD
fi

echo ""
echo "Before URL: $BEFORE_URL"
echo "After URL: $AFTER_URL"
echo ""

if [[ "$MARKDOWN_MODE" == "true" ]]; then
    # Build section with commit reference
    SHORT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M")

    SECTION="### Screenshots ($SHORT_SHA — $TIMESTAMP)

| Pre | Post |
|:---:|:----:|
| ![Pre]($BEFORE_URL) | ![Post]($AFTER_URL) |"

    echo "=== PR Markdown ==="
    echo "$SECTION"
    echo ""

    # Auto-append to PR body if gh CLI available and PR exists
    # Parse owner/repo from origin so this works correctly in forks
    REMOTE_URL=$(git remote get-url origin 2>/dev/null || true)
    GH_REPO=$(echo "$REMOTE_URL" | sed -E 's#^(https?://github\.com/|git@github\.com:)##; s#\.git$##')

    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)

    if command -v gh &> /dev/null && [[ -n "$GH_REPO" ]] && [[ -n "$CURRENT_BRANCH" ]]; then
        PR_JSON=$(gh pr view "$CURRENT_BRANCH" --repo "$GH_REPO" --json number,body 2>/dev/null || true)
        if [[ -n "$PR_JSON" ]]; then
            PR_NUMBER=$(echo "$PR_JSON" | grep -o '"number":[0-9]*' | grep -o '[0-9]*')
            PR_BODY=$(echo "$PR_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('body',''))" 2>/dev/null || echo "")

            # Stack: newest on top, right after ## Visual Changes header
            NEW_BODY=$(python3 -c "
import sys
body = sys.argv[1]
section = sys.argv[2]
marker = '## Visual Changes'
if marker in body:
    # Insert new section right after header, push older ones down
    parts = body.split(marker, 1)
    print(parts[0] + marker + '\n\n' + section + '\n\n---' + parts[1])
else:
    # First time
    print(body + '\n\n' + marker + '\n\n' + section)
" "$PR_BODY" "$SECTION")

            gh pr edit "$PR_NUMBER" --repo "$GH_REPO" --body "$NEW_BODY"
            echo "Screenshots appended to PR #$PR_NUMBER body"
        else
            echo "(no PR found for current branch — markdown copied to clipboard)"
        fi
    fi

    # Also copy to clipboard as fallback
    if command -v pbcopy &> /dev/null; then
        echo "$SECTION" | pbcopy
        echo "Markdown copied to clipboard!"
    elif command -v xclip &> /dev/null; then
        echo "$SECTION" | xclip -selection clipboard
        echo "Markdown copied to clipboard!"
    else
        echo "(clipboard copy not available - install pbcopy or xclip)"
    fi
else
    # Copy URLs to clipboard
    URLS="Before: $BEFORE_URL
After: $AFTER_URL"

    if command -v pbcopy &> /dev/null; then
        echo "$URLS" | pbcopy
        echo "URLs copied to clipboard!"
    elif command -v xclip &> /dev/null; then
        echo "$URLS" | xclip -selection clipboard
        echo "URLs copied to clipboard!"
    else
        echo "(clipboard copy not available - install pbcopy or xclip)"
    fi
fi
