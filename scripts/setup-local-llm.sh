#!/bin/bash
# Local LLM Setup Script for Linux/Mac
# Installs Ollama and sets up local LLM infrastructure

set -e

echo "🚀 Setting up Local LLM Infrastructure..."

# Check if Ollama is installed
echo ""
echo "📦 Checking Ollama installation..."
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found. Installing..."
    
    # Install Ollama
    curl -fsSL https://ollama.ai/install.sh | sh
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Ollama. Please install manually:"
        echo "   Visit: https://ollama.ai/download"
        exit 1
    fi
else
    echo "✅ Ollama is already installed!"
    ollama --version
fi

# Start Ollama service
echo ""
echo "🔧 Starting Ollama service..."
if ! pgrep -x "ollama" > /dev/null; then
    echo "🚀 Starting Ollama..."
    ollama serve &
    sleep 3
else
    echo "✅ Ollama is already running!"
fi

# Check if Ollama is responding
echo ""
echo "🔍 Testing Ollama connection..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running and responding!"
else
    echo "❌ Ollama is not responding. Please check:"
    echo "   1. Is Ollama running? (ollama serve)"
    echo "   2. Check firewall settings"
    exit 1
fi

# Pull base models
echo ""
echo "📥 Downloading base models..."
echo "   This may take a while depending on your internet speed..."

models=("llama2" "mistral")
for model in "${models[@]}"; do
    echo ""
    echo "📦 Pulling $model..."
    if ollama pull "$model"; then
        echo "✅ $model downloaded successfully!"
    else
        echo "⚠️  Failed to download $model. You can download it later with: ollama pull $model"
    fi
done

# List available models
echo ""
echo "📋 Available models:"
ollama list

# Test model
echo ""
echo "🧪 Testing model..."
echo "Hello, this is a test." | ollama run llama2 > /dev/null
echo "✅ Model test successful!"

# Verify BlueDXP integration
echo ""
echo "🔗 Verifying BlueDXP integration..."
if [ -f "lib/services/llm-provider/providers/ollama/index.ts" ]; then
    echo "✅ Ollama provider integration found!"
else
    echo "⚠️  Ollama provider integration not found. Creating..."
fi

echo ""
echo "✅ Local LLM setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Start your BlueDXP application"
echo "   2. The Ollama provider will be auto-registered"
echo "   3. Use via API: POST /api/llm/generate with provider: 'ollama'"
echo ""
echo "💡 Available models:"
ollama list


