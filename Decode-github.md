# 🚀 DECODE - GitHub Pages Deployment Guide

<p align="center">
  <img src="./public/logo.png" alt="DECODE Logo" width="120" height="120" />
</p>

<p align="center">
  <strong>Deploy DECODE to GitHub Pages for FREE hosting</strong>
</p>

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ A GitHub account
- ✅ Git installed on your machine
- ✅ Node.js 18+ installed
- ✅ The DECODE project built successfully

---

## 🛠️ Step-by-Step Deployment

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon in the top right → **New repository**
3. Name your repository: `decode` (lowercase, must match `basePath` in config)
4. Set visibility to **Public** (required for free GitHub Pages)
5. **Do NOT** initialize with README, .gitignore, or license
6. Click **Create repository**

---

### Step 2: Initialize Git & Push Code

Open your terminal in the project root (`DECODE/decode/`) and run:

```powershell
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: DECODE PWA - QR Generator & Cipher Tools"

# Add your GitHub repository as remote (replace Kingely-A1)
git remote add origin https://github.com/Kingely-A1/decode.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

### Step 3: Enable GitHub Pages with Actions

1. Go to your repository on GitHub
2. Click **Settings** (gear icon)
3. In the left sidebar, click **Pages**
4. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions**
5. The workflow file (`.github/workflows/nextjs.yml`) is already configured!

---

### Step 4: Trigger Deployment

The deployment will start automatically when you push to `main`. You can also:

1. Go to **Actions** tab in your repository
2. Click on the latest workflow run to monitor progress
3. Wait for both jobs to complete:
   - ✅ `build` - Builds the Next.js static site
   - ✅ `deploy` - Deploys to GitHub Pages

---

### Step 5: Access Your Live Site

Once deployment completes:

1. Go to **Settings** → **Pages**
2. You'll see: "Your site is live at `https://Kingely-A1.github.io/decode/`"
3. Click the link to visit your deployed DECODE app! 🎉

---

## 🔧 Configuration Reference

### `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  output: "export", // Static HTML export
  trailingSlash: true, // Required for GitHub Pages
  basePath: "/decode", // Must match repository name
  assetPrefix: "/decode/", // Asset prefix for static files
  images: {
    unoptimized: true, // Required for static export
  },
};
```

> **Important**: If your repository name is different from `decode`, update both `basePath` and `assetPrefix` to match.

---

## 🔄 Updating Your Site

To deploy updates:

```powershell
# Make your changes, then:
git add .
git commit -m "Your update description"
git push
```

GitHub Actions will automatically rebuild and deploy.

---

## 🐛 Troubleshooting

### Build Failed

1. Check the **Actions** tab for error details
2. Common issues:
   - Missing dependencies: Run `npm install` locally first
   - TypeScript errors: Run `npm run build` locally to test

### 404 Errors on Pages

- Ensure `trailingSlash: true` is set in `next.config.ts`
- Check that navigation links use the correct paths

### PWA Not Installing

- GitHub Pages uses HTTPS by default ✅
- Clear browser cache and revisit the site
- On mobile, wait for the install prompt or use browser menu

### Manifest/Service Worker Issues

- Hard refresh the page (Ctrl+Shift+R)
- Clear site data in browser DevTools

---

## 📱 PWA Installation Guide

### On Mobile (Android/iOS):

1. Visit `https://Kingely-A1.github.io/decode/`
2. **Android**: Tap the install prompt or menu → "Add to Home Screen"
3. **iOS**: Safari menu → "Add to Home Screen"

### On Desktop (Chrome/Edge):

1. Visit the site
2. Click the install icon in the address bar
3. Or: Menu → "Install DECODE"

---

## 🌐 Custom Domain (Optional)

To use a custom domain:

1. Go to **Settings** → **Pages**
2. Under **Custom domain**, enter your domain
3. Update `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  // Remove or update basePath for custom domain
  // basePath: '',
  images: {
    unoptimized: true,
  },
};
```

4. Rebuild and deploy

---

## 📊 Monitoring

### View Deployment Status

- **Actions** tab → View all workflow runs
- Green checkmark = Success ✅
- Red X = Failed (check logs)

### Analytics (Optional)

Add analytics by integrating:

- Google Analytics
- Vercel Analytics
- Plausible

---

## 🎨 DECODE Features

| Feature             | Description                                             |
| ------------------- | ------------------------------------------------------- |
| 📱 QR Generator     | Create stylish QR codes with custom colors and logos    |
| 🔐 Cipher Tools     | 10+ encryption algorithms (Caesar, Base64, Morse, etc.) |
| 🌙 Dark/Light Theme | Toggle between dark mode and orange-accented light mode |
| 📲 PWA              | Install as native app with offline support              |
| 📱 Mobile-First     | Responsive design that works on all devices             |

---

## 📞 Support

If you encounter issues:

1. Check the [GitHub Issues](https://github.com/Kingely-A1/decode/issues)
2. Review the [README.md](./README.md) (Platform Management Handbook)
3. Open a new issue with:
   - Browser/Device info
   - Error screenshots
   - Steps to reproduce

---

<p align="center">
  <strong>Built with ❤️ using Next.js, Tailwind CSS & GitHub Pages</strong>
</p>

<p align="center">
  <img src="./public/logo.png" alt="DECODE Logo" width="60" height="60" />
</p>
