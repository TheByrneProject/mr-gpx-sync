# Mr GPX Sync Library Assets

This directory contains assets that are packaged with the mr-gpx-sync library and made available to consuming applications.

## Directory Structure

```
assets/
├── icons/          # SVG icons and graphics
├── images/         # Images and photos
├── fonts/          # Custom fonts
└── styles/         # Additional stylesheets
```

## Usage in Applications

When you build the mr-gpx-sync-app (or any consuming application), these assets will be available at:

```
assets/mr-gpx-sync/[asset-path]
```

### Examples:

**In HTML templates:**
```html
<img src="assets/mr-gpx-sync/icons/gpx-icon.svg" alt="GPX Icon">
```

**In CSS/SCSS:**
```css
.gpx-icon {
  background-image: url('assets/mr-gpx-sync/icons/gpx-icon.svg');
}
```

**In TypeScript:**
```typescript
const iconPath = 'assets/mr-gpx-sync/icons/gpx-icon.svg';
```

## Adding New Assets

1. Add your assets to the appropriate subdirectory
2. Rebuild the library: `ng build mr-gpx-sync`
3. The assets will be automatically copied to the consuming application

## Asset Types Supported

- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`
- Icons: `.svg`, `.ico`
- Fonts: `.woff`, `.woff2`, `.ttf`, `.otf`
- Styles: `.css`, `.scss`
- Data: `.json`, `.xml`
- Any other static files
