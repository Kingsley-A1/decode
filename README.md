# 🔐 DECODE - Platform Management Handbook

<div align="center">

![DECODE Logo](public/icon-192.svg)

**A Powerful PWA for QR Code Generation & Cipher Tools**

[![Deploy to GitHub Pages](https://github.com/YOUR_USERNAME/decode/actions/workflows/nextjs.yml/badge.svg)](https://github.com/YOUR_USERNAME/decode/actions/workflows/nextjs.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Live Demo](https://YOUR_USERNAME.github.io/decode) · [Report Bug](https://github.com/YOUR_USERNAME/decode/issues) · [Request Feature](https://github.com/YOUR_USERNAME/decode/issues)

</div>

---

## 📖 Table of Contents

1. [Overview](#-overview)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Getting Started](#-getting-started)
6. [Configuration Guide](#-configuration-guide)
7. [Component Documentation](#-component-documentation)
8. [Cipher Algorithms](#-cipher-algorithms)
9. [Deployment Guide](#-deployment-guide)
10. [Platform Management](#-platform-management)
11. [Maintenance & Updates](#-maintenance--updates)
12. [Troubleshooting](#-troubleshooting)
13. [Contributing](#-contributing)
14. [License](#-license)

---

## 🎯 Overview

**DECODE** is a modern, serverless Progressive Web Application (PWA) designed for generating stylish QR codes and encrypting/decrypting text using various cipher algorithms. Built with a mobile-first approach, it provides a seamless experience across all devices.

### Mission Statement

> To democratize technology by creating powerful, accessible tools that empower users. DECODE represents our commitment to building solutions that are not just functional, but delightful to use.

---

## ✨ Features

### 🔳 QR Code Generator

- **Custom Styling**: Multiple dot patterns (rounded, dots, classy, square, etc.)
- **Color Customization**: 8 preset colors + custom color picker
- **Logo Embedding**: Upload custom logos into QR codes
- **High-Quality Export**: Download as PNG format
- **Live Preview**: Real-time QR code generation
- **Mobile Optimized**: Works perfectly on all screen sizes

### 🔒 Cipher Tools

| Algorithm     | Description                                       | Reversible |
| ------------- | ------------------------------------------------- | ---------- |
| Caesar Cipher | Classic shift cipher with adjustable shift (1-25) | ✅         |
| Base64        | Standard encoding scheme                          | ✅         |
| ROT13         | Caesar with shift 13 (self-reversing)             | ✅         |
| Morse Code    | Dots and dashes encoding                          | ✅         |
| Binary        | 8-bit binary representation                       | ✅         |
| Hexadecimal   | Base-16 encoding                                  | ✅         |
| URL Encode    | Safe URL encoding                                 | ✅         |
| Reverse       | Simple text reversal                              | ✅         |

### 📱 Progressive Web App

- **Installable**: Add to home screen on mobile/desktop
- **Offline Ready**: Works without internet connection
- **Fast Loading**: Optimized for performance
- **Native Feel**: Full-screen mobile experience

### 🌐 Additional Pages

- **About**: Team information and capabilities
- **Contact**: Multi-platform contact hub
- **Review**: Feedback submission system

---

## 🛠 Tech Stack

| Technology          | Purpose         | Version |
| ------------------- | --------------- | ------- |
| **Next.js**         | React Framework | 15.x    |
| **TypeScript**      | Type Safety     | 5.x     |
| **Tailwind CSS**    | Styling         | 4.x     |
| **Framer Motion**   | Animations      | Latest  |
| **Lucide React**    | Icons           | Latest  |
| **qr-code-styling** | QR Generation   | Latest  |
| **GitHub Pages**    | Hosting         | -       |
| **GitHub Actions**  | CI/CD           | -       |

---

## 📁 Project Structure

```
decode/
├── .github/
│   └── workflows/
│       └── nextjs.yml        # GitHub Actions deployment
├── app/
│   ├── about/
│   │   └── page.tsx          # About Us page
│   ├── cipher/
│   │   └── page.tsx          # Cipher tools page
│   ├── contact/
│   │   └── page.tsx          # Contact hub page
│   ├── review/
│   │   └── page.tsx          # Review/feedback page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home (QR Generator)
├── components/
│   ├── CipherTool.tsx        # Encryption/decryption UI
│   ├── NavBar.tsx            # Bottom navigation
│   └── QRGenerator.tsx       # QR code generator UI
├── hooks/
│   └── useQRCode.ts          # QR code generation hook
├── lib/
│   ├── crypto.ts             # Cipher algorithms
│   └── utils.ts              # Utility functions
├── public/
│   ├── icon-192.svg          # PWA icon (small)
│   ├── icon-512.svg          # PWA icon (large)
│   └── manifest.json         # PWA manifest
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies
├── tailwind.config.ts        # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher (or yarn/pnpm)
- **Git** for version control

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/decode.git
   cd decode
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Available Scripts

| Command          | Description              |
| ---------------- | ------------------------ |
| `npm run dev`    | Start development server |
| `npm run build`  | Build for production     |
| `npm run start`  | Start production server  |
| `npm run lint`   | Run ESLint               |
| `npm run export` | Generate static files    |

---

## ⚙️ Configuration Guide

### Next.js Configuration (`next.config.ts`)

```typescript
const nextConfig: NextConfig = {
  output: "export", // Static HTML export
  images: {
    unoptimized: true, // Required for GitHub Pages
  },
  basePath: "/decode", // Repository name
  assetPrefix: "/decode/", // Asset path prefix
};
```

### Environment Variables

For production deployment, ensure these are set:

| Variable   | Description      | Default       |
| ---------- | ---------------- | ------------- |
| `NODE_ENV` | Environment mode | `development` |

### PWA Configuration (`public/manifest.json`)

Update the manifest for your deployment:

- `start_url`: Base URL of your app
- `icons`: Update icon paths if needed
- `shortcuts`: Customize app shortcuts

---

## 📦 Component Documentation

### QRGenerator Component

**Location**: `components/QRGenerator.tsx`

**Props**: None (self-contained)

**State**:
| State | Type | Description |
|-------|------|-------------|
| `url` | string | URL/text to encode |
| `color` | string | QR code color (hex) |
| `dotStyle` | string | Dot pattern style |
| `logoUrl` | string | Base64 logo image |

**Usage**:

```tsx
import { QRGenerator } from "@/components/QRGenerator";

export default function Page() {
  return <QRGenerator />;
}
```

### CipherTool Component

**Location**: `components/CipherTool.tsx`

**Supported Ciphers**:

- Caesar Cipher (with shift 1-25)
- Base64 Encoding
- ROT13
- Morse Code
- Binary
- Hexadecimal
- URL Encoding
- Text Reversal

### NavBar Component

**Location**: `components/NavBar.tsx`

**Features**:

- Fixed bottom navigation
- Active tab indicator with animation
- 5 navigation items

### useQRCode Hook

**Location**: `hooks/useQRCode.ts`

**Parameters**:

```typescript
interface QROptions {
  data: string;
  width?: number;
  height?: number;
  dotsColor?: string;
  backgroundColor?: string;
  dotsType?: "rounded" | "dots" | "classy" | "square" | "extra-rounded";
  cornersSquareType?: "dot" | "square" | "extra-rounded";
  cornersDotType?: "dot" | "square";
  logoUrl?: string;
  logoSize?: number;
}
```

**Returns**:

```typescript
{
  ref: RefObject<HTMLDivElement>;  // Attach to container
  download: (ext: string) => void; // Download function
  isReady: boolean;                // Ready state
}
```

---

## 🔐 Cipher Algorithms

### Caesar Cipher

Shifts each letter by a specified amount (1-25).

```typescript
// Encryption
caesarCipher("HELLO", 3); // "KHOOR"

// Decryption
caesarCipher("KHOOR", 3, true); // "HELLO"
```

### Base64

Standard Base64 encoding using browser's `btoa()` and `atob()`.

### ROT13

Special case of Caesar cipher with shift 13. Self-reversing.

### Morse Code

Converts text to International Morse Code standard.

### Binary

Converts each character to 8-bit binary representation.

### Hexadecimal

Converts each character to hexadecimal value.

### URL Encoding

Uses `encodeURIComponent()` for safe URL encoding.

---

## 🌐 Deployment Guide

### GitHub Pages Deployment

1. **Create GitHub Repository**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/decode.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**

   - Go to Repository → Settings → Pages
   - Source: Select "GitHub Actions"
   - The workflow will automatically deploy on push to `main`

3. **Verify Deployment**
   - Check Actions tab for build status
   - Access at: `https://YOUR_USERNAME.github.io/decode`

### Custom Domain (Optional)

1. Add `CNAME` file to `public/` folder:

   ```
   yourdomain.com
   ```

2. Configure DNS:

   - Add CNAME record pointing to `YOUR_USERNAME.github.io`

3. Update `next.config.ts`:
   ```typescript
   basePath: '',  // Remove basePath for custom domain
   ```

---

## 📊 Platform Management

### Analytics Integration

To add analytics, modify `app/layout.tsx`:

```tsx
// Add Google Analytics or similar
<Script src="https://www.googletagmanager.com/gtag/js?id=GA_ID" />
```

### Content Updates

| Content        | File Location                |
| -------------- | ---------------------------- |
| About text     | `app/about/page.tsx`         |
| Contact links  | `app/contact/page.tsx`       |
| Color presets  | `components/QRGenerator.tsx` |
| Cipher options | `lib/crypto.ts`              |

### Adding New Ciphers

1. Add algorithm to `lib/crypto.ts`:

   ```typescript
   export const newCipher = (str: string): string => {
     // Implementation
   };
   ```

2. Add to `cipherOptions` array:

   ```typescript
   { id: 'new', name: 'New Cipher', description: 'Description' }
   ```

3. Add cases to `encrypt()` and `decrypt()` functions.

---

## 🔧 Maintenance & Updates

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update major versions (with caution)
npm install package@latest
```

### Regular Maintenance Checklist

- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Update dependencies monthly
- [ ] Review and respond to issues
- [ ] Test on multiple devices/browsers
- [ ] Monitor GitHub Actions for failures

### Performance Optimization

1. **Image Optimization**: Use WebP format for logos
2. **Bundle Analysis**: Run `npm run build` and check output size
3. **Lighthouse Audit**: Run regularly for performance scores

---

## ❓ Troubleshooting

### Common Issues

#### 1. QR Code Not Rendering

**Cause**: `window` not available during SSR
**Solution**: The `useQRCode` hook handles this with dynamic import

#### 2. Build Fails on GitHub Actions

**Causes**:

- TypeScript errors
- Missing dependencies
- Incorrect configuration

**Solution**: Run `npm run build` locally first

#### 3. 404 on Page Refresh

**Cause**: Static export routing
**Solution**: Ensure all routes use Next.js Link component

#### 4. PWA Not Installing

**Cause**: Missing manifest or icons
**Solution**: Verify `manifest.json` and icon paths

### Debug Mode

Enable verbose logging:

```bash
DEBUG=* npm run dev
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open Pull Request**

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Add JSDoc comments for functions
- Test on mobile devices

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact & Support

- **Email**: dedcoder@gmail.com
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/decode/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/decode/discussions)

---

<div align="center">

**Built with ❤️ by the DECODE Team**

_Professional Web Developers crafting industry-standard digital solutions_

</div>

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
