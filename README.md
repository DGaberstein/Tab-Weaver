# 🕸️ The Tab Weaver

**The Ultimate Browser Extension for Advanced Tab Management with Opera GX Gaming Theme**

The Tab Weaver is a comprehensive browser extension that transforms how you manage tabs with meme-powered hibernation, advanced feedback systems, and a stunning Opera GX-optimized dark theme. Built with privacy-first principles and universal browser compatibility, it delivers professional-grade tab management with a gaming aesthetic that's more fire than a distracted boyfriend meme! 🔥

## 🚀 Features

### 🎮 **Opera GX Gaming Experience**
- **Gaming-Optimized Theme**: Stunning red/black/gold color scheme designed for Opera GX
- **Universal Browser Support**: Magically detects Opera GX, Chrome, Edge, Firefox, Brave with adaptive theming ✨🎩
- **Professional Interface**: Compact 400x500px popup with smooth animations and gradients
- **Extension Icons**: Beautiful SVG icons integrated throughout the interface
- **Gaming Aesthetics**: Designed for gamers with smooth hover effects and visual feedback

### ⚡ **Advanced Tab Hibernation**
- **Meme-Powered Tab Hibernation**: Big brain energy memory management with individual tab control that hits different 🧠✨
- **Bulk Operations**: Hibernate All and Restore All with one click
- **Real-Time Statistics**: Live display of hibernated tabs and memory savings
- **Chad-Level Protection**: Automatically excludes tabs with audio, forms, or pinned content (because we're not monsters! 👹)
- **Memory Optimization**: Save 20-500MB per hibernated tab depending on complexity

### � **Comprehensive Feedback System**
- **Privacy-First Storage**: All feedback stored locally on your device by default
- **Multiple Submission Options**: Save locally, create GitHub issues, or send emails
- **Developer Access Tools**: Console commands, secret panels, and UI export options
- **Complete Data Control**: View, export, or delete all your feedback data anytime
- **GitHub Integration**: Direct issue creation with pre-filled templates and browser info

### 🔍 **200 IQ Tab Management**
- **Real-Time Search**: Filter tabs instantly by title or URL
- **Domain Grouping**: Tabs automatically organized by website with favicon headers
- **Tab Metadata**: View creation time, memory usage, and visit counts for each tab
- **Quick Switching**: Click any tab to instantly navigate to it
- **Status Indicators**: Clear visual distinction between active and hibernated tabs

### 📊 **Analytics & Monitoring**
- **Usage Tracking**: Monitor extension usage patterns and performance metrics
- **Local Analytics**: All analytics stored locally with privacy-first approach
- **Performance Dashboard**: Real-time statistics and memory savings display
- **Developer Tools**: Comprehensive debugging and data access capabilities
- **Export Options**: Download all data as JSON for analysis or backup

### ⚙️ **User Experience & Settings**
- **Beautiful Settings Page**: Dark-themed options page matching the Opera GX aesthetic
- **Comprehensive Help System**: Built-in help panel with keyboard shortcuts and usage guides
- **Keyboard Shortcuts**: Safe, non-conflicting shortcuts (Alt+Shift combinations)
- **Responsive Design**: Optimized layouts for different screen sizes and browsers
- **Manifest V3 Compliant**: Built for security, performance, and future compatibility

## 📦 Installation

### 🚀 **Quick Install (Ready-to-Use)**

**The extension is pre-built and ready to install!**

1. **Download this repository** or clone it:
   ```bash
   git clone https://github.com/yourusername/the-tab-weaver.git
   ```

2. **Load in your browser**:
   - **Chrome/Opera GX/Edge**: Go to `chrome://extensions/` (or `opera://extensions/`)
   - **Firefox**: Go to `about:debugging#/runtime/this-firefox`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist/` folder
   - The Tab Weaver icon should appear in your toolbar! 🕸️

3. **Start using**:
   - Click the extension icon to open the popup
   - Try hibernating tabs with the "😴 Hibernate All" button
   - Access settings and help via the header buttons

### 🔧 **Development Setup (Optional)**

Only needed if you want to modify the source code:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build from source** (optional):
   ```bash
   npm run build
   ```

   > **Note**: The `dist/` folder already contains the built extension!

### Production Build

For a production-ready build:
```bash
npm run build
npm run package
```

This creates a `.zip` file in the `packages/` directory ready for Chrome Web Store submission.

## 🎯 Quick Start

### 🎮 **Basic Usage (5 Minutes)**

1. **Click the Tab Weaver icon** 🕸️ in your toolbar
2. **See your tabs** listed with beautiful Opera GX styling
3. **Try hibernation**: Click "😴 Hibernate All" to save memory
4. **Restore tabs**: Click "🔥 Restore All" to wake them up
5. **Search tabs**: Use the search box to filter by title or URL

### 💬 **Test the Feedback System**

1. **Click the feedback button** 💬 in the header
2. **Type some feedback** and click "Save Locally"
3. **View your feedback**: Settings ⚙️ → "👁️ View Feedback"
4. **Export data**: Settings ⚙️ → "📁 Export Data"

### 🔧 **Access Developer Tools**

1. **Secret panel**: Press `Ctrl+Shift+D` anywhere in the extension
2. **Console commands**: Press F12, then try `await TabWeaverDev.getFeedback()`
3. **Settings UI**: Click ⚙️ → Data Management section

### ⌨️ **Use Keyboard Shortcuts**

- `Alt+Shift+W` - Open Tab Weaver
- `Alt+Shift+P` - Command Palette (planned)
- `Alt+Shift+H` - Hibernate Current Tab
- `Ctrl+Shift+D` - Developer Panel (secret)

## ⌨️ Keyboard Shortcuts

**Safe shortcuts that don't interfere with browser functions:**

| Shortcut | Action | Status |
|----------|--------|---------|
| `Alt+Shift+W` | Open Tab Weaver popup | ✅ Implemented |
| `Alt+Shift+P` | Open command palette | 🚧 Planned |
| `Alt+Shift+H` | Hibernate current tab | ✅ Implemented |
| `Ctrl+Shift+D` | Developer panel (secret) | ✅ Implemented |
| `Escape` | Close popup/modals | ✅ Implemented |

> **Why Alt+Shift?** We use Alt+Shift combinations because they're safe and don't conflict with browser shortcuts like Ctrl+Shift+T (reopen closed tab) or Ctrl+Shift+W (close all tabs).

## 🔧 Configuration

### Hibernation Settings

```json
{
  "hibernation": {
    "enabled": true,
    "timeThreshold": 15,
    "excludePinned": true,
    "excludeAudible": true,
    "excludeWithForms": true,
    "whitelistedDomains": ["example.com"],
    "blacklistedDomains": ["neverhib.com"]
  }
}
```

### UI Preferences

- **Theme**: Light, Dark, or Auto (follows system)
- **Compact Mode**: Reduced spacing for more tabs per view
- **Show Favicons**: Display website icons next to tab titles
- **Performance Metrics**: Show/hide resource usage statistics

### Sync & Backup

- **Firebase Integration**: Sync data across browsers and devices
- **Local Backup**: Export/import workspace and session data
- **Data Retention**: Configure how long to keep analytics data

## 🏗️ Architecture

The Tab Weaver is built with a clean, production-ready architecture:

```
dist/                           # 📦 Production-Ready Extension
├── manifest.json              # Manifest V3 configuration
├── popup-universal.html       # 🎮 Main UI (Opera GX theme)
├── popup-universal.js         # 🚀 Core functionality (1,400+ lines)
├── popup.html                 # 📊 Compact dashboard popup
├── options.html               # ⚙️ Beautiful dark settings page
├── background-simple.js       # 🕸️ Service worker with tab tracking
├── browser-detector.js        # 🌐 Universal browser detection
├── analytics.js               # 📈 Privacy-first usage tracking
├── content-script.js          # 📄 Form detection and page activity
└── icons/                     # 🎨 Extension icons (SVG + PNG)

src/                           # 💻 Source Code (Optional)
├── background/                # TypeScript source
├── popup/                     # React components (legacy)
├── options/                   # Settings source
└── shared/                    # Utilities and types
```

### 🔧 **Key Components**

- **🕸️ Background Service Worker**: Enhanced tab lifecycle management with hibernation intelligence
- **🎮 Universal Popup**: Opera GX-themed interface with comprehensive tab management
- **💬 Feedback System**: Multi-channel feedback with local storage and GitHub integration  
- **📄 Content Scripts**: Form detection and page activity monitoring
- **🌐 Browser Detection**: Universal compatibility across 5+ browsers
- **📊 Analytics Engine**: Privacy-first usage tracking and performance monitoring
- **⚙️ Settings Interface**: Beautiful dark-themed options page with comprehensive controls

## 🛠️ Development

### Prerequisites

- Node.js 16+ and npm
- Chrome browser for testing
- TypeScript knowledge helpful

### Development Commands

```bash
# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build

# Clean build artifacts
npm run clean

# Create extension package
npm run package
```

### Project Structure

```
the-tab-weaver/
├── src/                 # Source code
├── dist/               # Built extension (generated)
├── icons/              # Extension icons
├── manifest.json       # Extension manifest
├── package.json        # Dependencies
├── webpack.config.js   # Build configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # Documentation
```

### Adding Features

1. **Background Logic**: Add new message handlers in `background/background.ts`
2. **UI Components**: Create React components in `popup/components/`
3. **Storage**: Extend the `StorageManager` class for new data types
4. **Types**: Add TypeScript interfaces in `shared/types.ts`

### Testing

The extension can be tested by:
1. Loading it unpacked in Chrome
2. Opening the Chrome DevTools for background scripts
3. Using the popup in different scenarios
4. Testing hibernation with various tab types

## 🎨 Customization

### Themes

The extension supports custom themes through CSS variables:

```scss
:root {
  --primary-500: #3b82f6;    // Main brand color
  --gray-800: #1f2937;       // Text color
  --gray-50: #f9fafb;        // Background color
  // ... more variables
}
```

### Icons

Replace icon files in the `icons/` directory:
- `icon16.png`: Toolbar icon (16x16)
- `icon48.png`: Extension management (48x48)  
- `icon128.png`: Chrome Web Store (128x128)

### Workspace Colors

Workspaces support custom colors and emojis:
```javascript
const workspace = {
  name: "Work Projects",
  color: "#ef4444",
  icon: "💼",
  // ...
}
```

## 📊 Performance Impact

The Tab Weaver is designed for minimal performance impact:

- **Memory Usage**: ~5-10MB for the extension itself
- **CPU Usage**: Negligible when idle, brief spikes during hibernation checks
- **Storage**: Configurable data retention (default: 90 days)
- **Battery**: Helps extend battery life through galaxy brain tab management that makes Elon Musk jealous 🔋🚀

### Hibernation Savings

Typical memory savings per hibernated tab:
- **Simple pages**: 20-50MB
- **Complex web apps**: 100-300MB
- **Media-rich sites**: 200-500MB

## 🔐 Privacy & Security

The Tab Weaver is built with **privacy-first principles**:

### 🛡️ **Privacy Features**
- **Local Storage First**: All data stored locally in Chrome's secure storage by default
- **User-Controlled Sharing**: External sharing only when user explicitly chooses
- **Complete Data Access**: View, export, or delete all your data anytime
- **No Personal Information**: Never collects names, emails, or private browsing data
- **Transparent Operations**: Full visibility into what data is stored and how it's used

### 🔒 **Security Standards**
- **Manifest V3**: Built with the latest security standards
- **Minimal Permissions**: Only requests necessary browser permissions
- **Secure Storage**: Uses Chrome's encrypted storage API
- **Open Source**: Fully transparent and auditable code
- **No External Servers**: Default operation requires no internet connection

### Permissions Explained

| Permission | Why Needed |
|------------|------------|
| `tabs` | Read and modify tab states for hibernation |
| `storage` | Save workspaces, sessions, and settings |
| `activeTab` | Detect active tab for activity tracking |
| `background` | Run hibernation checks and manage tabs |
| `alarms` | Schedule periodic hibernation checks |

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit with clear messages**: `git commit -m 'Add amazing feature'`
5. **Push to your fork**: `git push origin feature/amazing-feature`
6. **Create a Pull Request** with a detailed description

### Development Guidelines

- Follow TypeScript best practices
- Add JSDoc comments for public APIs
- Test on multiple tab scenarios
- Maintain backward compatibility
- Update documentation for new features

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Troubleshooting

**Extension not loading?**
- Check Chrome Developer mode is enabled
- Verify all files are present in the project directory
- Look for errors in the Chrome Extensions page

**Tabs not hibernating?**
- Check hibernation is enabled in settings
- Verify tabs meet hibernation criteria (not pinned, audible, etc.)
- Check console for background script errors

**Performance issues?**
- Try reducing hibernation threshold
- Clear old analytics data
- Check for conflicting extensions

### Getting Help

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join GitHub Discussions for questions
- **Documentation**: Check this README and inline code comments

## 🚀 Roadmap

### Version 1.1
- [ ] Advanced workspace templates
- [ ] Tab grouping integration  
- [ ] Enhanced analytics dashboard
- [ ] Import/export functionality

### Version 1.2
- [ ] Crystal ball tab predictions powered by pure meme magic ✨🔮 (Coming soon™)
- [ ] Integration with external task managers
- [ ] Advanced sync options
- [ ] Mobile companion app

### Version 2.0
- [ ] Multi-browser support (Firefox, Edge)
- [ ] Team collaboration features
- [ ] Advanced automation rules
- [ ] API for third-party integrations

---

**Made with ❤️ by developers who have too many tabs open**

*The Tab Weaver - Weaving order from browser chaos, one tab at a time.*