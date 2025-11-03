# Workplace Tools

A collection of useful utilities for your daily work, built with vanilla HTML, CSS, and JavaScript. This is a Progressive Web App (PWA) that works offline after the first visit.

## 🚀 Features

- **Progressive Web App**: Installable on desktop and mobile devices
- **Offline Support**: All tools work offline after first visit
- **No Framework Dependencies**: Built with vanilla web technologies
- **Responsive Design**: Works on all screen sizes
- **Free Hosting Friendly**: Static files only, no backend required

## 🛠️ Available Tools

### 📝 Case Converter
Convert text between different cases:
- camelCase
- PascalCase
- snake_case
- kebab-case
- UPPER_CASE
- lower case

### 📋 Title Converter
Format titles and headings with various capitalization styles:
- Title Case
- Sentence Case
- UPPERCASE
- lowercase
- Capitalized Case
- Alternating Case

### 🌐 Virtual Browser
Browse websites in an isolated environment with:
- Embedded iframe browsing
- Navigation controls
- AI assistant mock panel
- Status indicators

### 📎 Clipboard Helper
Manage clipboard content with:
- Read/write clipboard access
- Clipboard history (stored locally)
- Text formatting options
- Copy to clipboard functionality

## 📱 PWA Features

### Offline Mode
- All tools are cached for offline access
- Works without internet connection after first visit
- Automatic cache management and updates

### Installation
1. Visit the website in a modern browser
2. Click the install icon in the address bar
3. Add to home screen (mobile) or desktop (desktop)

### Cache Management
The service worker automatically:
- Caches all HTML tools and assets
- Updates cache when new versions are available
- Cleans up old cache versions

## 🛠️ Development

### Local Development
```bash
# Start a local server
npm start
# or
python3 -m http.server 8000

# Update cache after adding new tools
npm run update-cache
```

### Adding New Tools
1. Create new HTML files in the `tools/` directory
2. Follow the existing code patterns and styling
3. Include service worker registration snippet
4. Run `npm run update-cache` to update the service worker
5. Test offline functionality in browser dev tools

### Project Structure
```
workplace-tools/
├── index.html              # Main landing page
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── update-cache.js         # Cache update script
├── package.json            # Node.js dependencies
├── tools/                  # Individual tools
│   ├── case-converter.html
│   ├── title-converter.html
│   ├── virtual-browser.html
│   └── clipboard-helper.html
└── README.md               # This file
```

## 🔧 PWA Technical Details

### Service Worker
- Precaches all static assets for offline access
- Implements cache-first strategy for static files
- Network-first strategy for dynamic content
- Automatic cache cleanup on updates

### Manifest Configuration
- Standalone display mode
- Custom icons and colors
- Offline-capable design
- Mobile-optimized viewport

### Browser Support
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## 🧪 Testing

### Offline Testing
1. Open browser DevTools
2. Go to Application tab
3. Check Service Worker status
4. Toggle "Offline" mode
5. Test all tools functionality

### Lighthouse Audit
Run Lighthouse audit to verify:
- PWA compliance
- Performance metrics
- Accessibility standards
- Best practices

## 📄 License

MIT License - feel free to use and modify for your own needs.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Update cache with `npm run update-cache`
5. Test offline functionality
6. Submit a pull request

---

**Note**: This PWA is designed for static hosting and works perfectly on platforms like GitHub Pages, Netlify, Vercel, or any static file hosting service.
