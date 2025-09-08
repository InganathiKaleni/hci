#!/bin/bash

# 🚀 EdUTEND Deployment Script
# This script helps automate the deployment process

echo "🚀 Starting EdUTEND Deployment Process..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin <your-github-repo-url>"
    exit 1
fi

# Check if we have a remote origin
if ! git remote get-url origin &> /dev/null; then
    echo "❌ No remote origin found. Please add your GitHub repository:"
    echo "   git remote add origin <your-github-repo-url>"
    exit 1
fi

echo "✅ Git repository found: $(git remote get-url origin)"

# Check if we have uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    echo "   git add ."
    echo "   git commit -m 'Update before deployment'"
    exit 1
fi

echo "✅ All changes are committed"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Deploy your backend to Railway:"
    echo "   - Go to https://railway.app/"
    echo "   - Connect your GitHub repository"
    echo "   - Set environment variables (see DEPLOYMENT.md)"
    echo ""
    echo "2. Deploy your frontend to Netlify:"
    echo "   - Go to https://netlify.com/"
    echo "   - Connect your GitHub repository"
    echo "   - Update js/config.production.js with your backend URL"
    echo ""
    echo "3. Test your deployment:"
    echo "   - Check backend health: https://your-app.railway.app/health"
    echo "   - Visit your frontend URL"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
else
    echo "❌ Failed to push to GitHub"
    exit 1
fi
