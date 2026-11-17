#!/usr/bin/env node
// Builds the site into dist/index.html.
//   - With SITE_PASSWORD set, the game is encrypted behind a password page.
//   - Without it, the game is published as it is: anyone with the link can play.
//
//   SITE_PASSWORD='your house password' node tools/build.mjs     (locked)
//   node tools/build.mjs                                          (open to anyone with the link)
//
// On GitHub this runs automatically (.github/workflows/pages.yml) using the repository secret
// SITE_PASSWORD. The password is never stored in the repository.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const subtle = webcrypto.subtle;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ITERATIONS = 300000;
// A fixed salt keeps the key the same between updates, so boys only re-enter the password when it changes.
export const SALT = 'abrahamillion-house-v1';
const b64 = (u) => Buffer.from(u).toString('base64');

async function deriveKey(password, salt, iterations, usages) {
  const base = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, usages);
}

export async function encrypt(html, password, iterations = ITERATIONS) {
  const salt = new TextEncoder().encode(SALT);
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, iterations, ['encrypt']);
  const data = await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(html));
  return { v: 1, iter: iterations, salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(data)) };
}

export async function decrypt(payload, password) {
  const key = await deriveKey(password, Buffer.from(payload.salt, 'base64'), payload.iter, ['decrypt']);
  const buf = await subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(payload.iv, 'base64') }, key, Buffer.from(payload.data, 'base64'));
  return new TextDecoder().decode(buf);
}

// Fill the password page with the game's icons, fonts and the encrypted game.
export function renderGate(gameHtml, payload, template) {
  const icons = (gameHtml.match(/<link rel="(?:icon|apple-touch-icon)" href="[^"]*">/g) || []).join('\n');
  const fonts = (gameHtml.match(/<style>@font-face[\s\S]*?<\/style>/) || [''])[0];
  const eagle = (gameHtml.match(/<link rel="icon" href="([^"]*)">/) || [])[1] || '';
  return template
    .replace('__ICONS__', () => icons)
    .replace('__FONTS__', () => fonts)
    .replace('__EAGLE__', () => eagle)
    .replace('__PAYLOAD__', () => JSON.stringify(payload));
}

// The published page: the game itself, or the password page when a password is given.
export async function buildPage(game, password, template) {
  if (!password) return game;
  if (password.length < 8) throw new Error('SITE_PASSWORD must be at least 8 characters.');
  return renderGate(game, await encrypt(game, password), template);
}

async function main() {
  const password = process.env.SITE_PASSWORD || '';
  const game = readFileSync(path.join(ROOT, 'game.html'), 'utf8');
  const template = readFileSync(path.join(ROOT, 'tools', 'gate.html'), 'utf8');
  const out = path.join(ROOT, process.env.OUT_DIR || 'dist');
  let page;
  try { page = await buildPage(game, password, template); } catch (e) { console.error(`Build stopped: ${e.message}`); process.exit(1); }
  mkdirSync(out, { recursive: true });
  writeFileSync(path.join(out, 'index.html'), page);
  console.log(password ? 'Locked with the house password.' : 'No SITE_PASSWORD set: published open to anyone with the link.');
  console.log(`Written to ${path.relative(ROOT, out) || '.'}/index.html`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
