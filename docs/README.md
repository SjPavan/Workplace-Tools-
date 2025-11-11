# Workplace Tools Documentation

Comprehensive documentation for Workplace Tools built with [Docusaurus 3](https://docusaurus.io/).

## Quick Start

### Prerequisites

- Node.js 18+ (recommended 20+)
- npm 10+ or yarn

### Installation

```bash
npm install
```

### Local Development

```bash
npm run start
```

This command starts a local development server and opens the browser at [http://localhost:3000](http://localhost:3000).

Changes are reflected live without having to restart the server.

### Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Documentation Structure

```
docs/
├── docs/                           # Documentation files
│   ├── index.md                   # Welcome page
│   ├── getting-started/           # Setup and installation
│   │   ├── quick-start.md
│   │   ├── installation.md
│   │   └── setup.md
│   ├── user-guide/                # User documentation
│   │   ├── overview.md
│   │   ├── features.md
│   │   └── workflows.md
│   ├── onboarding/                # Onboarding guides
│   │   ├── wizard.md
│   │   └── initial-setup.md
│   ├── tutorials/                 # Tutorial guides
│   │   ├── basic-usage.md
│   │   ├── advanced-features.md
│   │   └── integrations.md
│   ├── support/                   # Support documentation
│   │   ├── troubleshooting.md
│   │   ├── faq.md
│   │   └── privacy-policy.md
│   └── development/               # Developer documentation
│       ├── architecture.md
│       ├── installation-guide.md
│       └── apk-guide.md
├── sidebars.js                    # Sidebar configuration
├── docusaurus.config.js           # Docusaurus configuration
├── package.json                   # NPM dependencies
└── src/
    └── css/
        └── custom.css             # Custom styles
```

## Adding New Documentation

### Adding a New Page

1. Create a markdown file in appropriate directory
2. Add frontmatter:
   ```markdown
   ---
   sidebar_position: 1
   title: My Page Title
   ---
   
   # My Page Title
   
   Page content here...
   ```

3. File will be automatically added to sidebar based on directory

### Adding Sections to Sidebar

Edit `sidebars.js`:

```javascript
{
  label: 'My Section',
  items: [
    'path/to/page1',
    'path/to/page2',
  ],
}
```

### Using Markdown Features

**Code blocks:**
````markdown
```bash
npm install
```

```typescript
const hello = "world";
```
````

**Admonitions:**
```markdown
:::note
This is a note
:::

:::tip
This is a tip
:::

:::warning
This is a warning
:::

:::danger
This is dangerous
:::
```

**Tabs:**
```markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="apple" label="Apple" default>
    Apple content
  </TabItem>
  <TabItem value="orange" label="Orange">
    Orange content
  </TabItem>
</Tabs>
```

## Deployment

### Vercel

Docusaurus sites can be deployed to Vercel:

1. Push code to GitHub
2. Connect repo to Vercel
3. Set root directory to `docs/`
4. Deploy!

### Other Providers

- GitHub Pages
- Netlify
- AWS S3
- Azure Static Web Apps

See [Docusaurus deployment guide](https://docusaurus.io/docs/deployment) for more options.

## Customization

### Configuration

Edit `docusaurus.config.js` to customize:
- Site title and tagline
- Navigation menu
- Footer links
- Theme colors
- Plugins

### Styling

Customize styles in `src/css/custom.css`:
- CSS variables
- Component styles
- Responsive design
- Theme switching

### Navbar & Footer

Edit `docusaurus.config.js` `themeConfig` section:
- Logo and title
- Navigation items
- Social links
- Copyright

## Editing Guide

### Writing Style

- Use clear, concise language
- Active voice preferred
- Short paragraphs
- Code examples where helpful
- Links to related content

### Frontmatter

```markdown
---
sidebar_position: 1          # Position in sidebar
title: Page Title            # Page title
description: Short desc      # SEO description
keywords: [keyword1, key2]   # SEO keywords
---
```

### Cross-References

Link to other pages:
```markdown
[Link Text](../path/to/page)
[Link Text](../getting-started/quick-start)
```

## Troubleshooting

### Build Fails

```bash
npm cache clean --force
rm -rf node_modules
npm install
npm run build
```

### Port Already in Use

```bash
npm run start -- -p 3001
```

### Cannot Find Module

```bash
npm install
```

## Performance

The documentation builds to static HTML, making it very fast. No server-side processing needed.

- Build time: < 30 seconds
- Page load: < 1 second
- Deploy time: < 5 minutes

## Contributing

To improve documentation:

1. Fork repository
2. Create feature branch
3. Make changes
4. Build locally to verify
5. Create pull request

## Support

- [Docusaurus docs](https://docusaurus.io/)
- [Markdown guide](https://daringfireball.net/projects/markdown/)
- [GitHub Issues](https://github.com/workplace-tools/repository/issues)

## License

Documentation is private. See repository LICENSE.

---

**Last Updated:** November 2024
**Docusaurus Version:** 3.x
**Node Version:** 20+
