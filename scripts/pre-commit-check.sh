#!/bin/sh

# This script runs pre-commit checks on staged files only
# lint-staged handles running ESLint and Prettier on staged files

echo "" >&2
echo "🔧 Running pre-commit checks on staged files..." >&2
echo "" >&2

# Run lint-staged for automatic fixes and checks on staged files
echo "Running ESLint and Prettier on staged files..." >&2
if npx lint-staged; then
    echo "" >&2
    echo "✅ All staged files passed quality checks!" >&2
    
    # If files were modified by auto-fix, remind user
    if git diff --cached --quiet; then
        echo "   No files were modified." >&2
    else
        echo "   Some files were auto-fixed and re-staged." >&2
    fi
else
    echo "" >&2
    echo "❌ ERROR: Found issues that couldn't be auto-fixed." >&2
    echo "Please manually fix the errors above and try committing again." >&2
    echo "" >&2
    exit 1
fi

echo "" >&2

exit 0