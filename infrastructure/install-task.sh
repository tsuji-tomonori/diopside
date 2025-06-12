#!/bin/bash
# Install Task (Taskfile runner) if not already installed

if ! command -v task &> /dev/null; then
    echo "Installing Task..."
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -sL https://taskfile.dev/install.sh | sh
        sudo mv ./bin/task /usr/local/bin/task
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install go-task/tap/go-task
        else
            curl -sL https://taskfile.dev/install.sh | sh
            sudo mv ./bin/task /usr/local/bin/task
        fi
    else
        echo "Unsupported OS. Please install Task manually: https://taskfile.dev/installation/"
        exit 1
    fi
    
    echo "Task installed successfully!"
else
    echo "Task is already installed."
fi

task --version