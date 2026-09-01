// Copies the built library into node_modules so the app can consume it like a real package.
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../dist/mr-gpx-sync');
const dest = path.resolve(__dirname, '../node_modules/mr-gpx-sync');

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
