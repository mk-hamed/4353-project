import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Bundle a convenient read-only preview of the current build into one HTML file.
// Edit src/, then run npm run build:preview to regenerate it.
let html = await readFile('dist/index.html', 'utf8');
const script = html.match(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/);
const style = html.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if (!script || !style) throw new Error('Build output did not contain the expected JS and CSS files.');
const assetPath = asset => resolve('dist', asset.replace(/^\//, ''));
const js = await readFile(assetPath(script[1]), 'utf8');
const css = await readFile(assetPath(style[1]), 'utf8');
html = html.replace(script[0], () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`);
html = html.replace(style[0], () => `<style>${css}</style>`);
const icon = await readFile('public/favicon.svg', 'utf8');
html = html.replace('href="/favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(icon)}"`);
await writeFile('OPEN_PREVIEW.html', html);
console.log('Created OPEN_PREVIEW.html. Open it directly in a browser.');
