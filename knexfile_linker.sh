#!/usr/bin/env bash

# Find out the current target of knexfile.js if it's a symlink
current_link_target=$(readlink knexfile.js)

# List all files starting with "knexfile" in the current directory
files=(knexfile-*.js)

# Check if there are any matching files
if [[ ${#files[@]} -eq 0 ]]; then
    echo "No 'knexfile*' files found in the current directory."
    exit 1
fi

# Display files and prompt the user to select one
echo "Select a file by entering the corresponding number:"
for ((i=0; i<${#files[@]}; i++)); do
    # Check if the file is the current target of the symlink and mark with asterisk if so
    if [[ "${files[$i]}" == "$current_link_target" ]]; then
        echo "$((i+1)). ${files[$i]} *"
    else
        echo "$((i+1)). ${files[$i]}"
    fi
done

read -p "Enter your choice (1-${#files[@]}): " choice

# Validate the user's input
if [[ "$choice" -lt 1 ]] || [[ "$choice" -gt ${#files[@]} ]]; then
    echo "Invalid choice. Exiting."
    exit 1
fi

# Create symlink for the selected file
ln -sf "${files[$((choice-1))]}" knexfile.js

echo "Symlink created for ${files[$((choice-1))]} as knexfile.js"
