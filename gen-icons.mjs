// Quick script to create simple PNG icons using canvas API via node-canvas
// Since we can't use canvas in pure Node without native deps, we'll write raw PNG bytes
// Instead, write SVG icons and reference them — browsers accept SVG icons in manifests
// We'll create simple SVG files that act as icons

import fs from 'fs';

const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#1D9E75"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="${size * 0.55}" fill="white" font-family="serif">₱</text>
</svg>`;

fs.writeFileSync('public/icon-192.svg', svg(192));
fs.writeFileSync('public/icon-512.svg', svg(512));
console.log('SVG icons written');
