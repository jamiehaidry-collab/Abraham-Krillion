// Tests for the password lock (tools/build.mjs). Run with: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { encrypt, decrypt, renderGate, buildPage } from '../tools/build.mjs';

const game = readFileSync(new URL('../game.html', import.meta.url), 'utf8');
const template = readFileSync(new URL('../tools/gate.html', import.meta.url), 'utf8');

test('the right password opens the game and the wrong one does not', async () => {
  const payload = await encrypt(game, 'correct horse battery', 1000);
  assert.equal(await decrypt(payload, 'correct horse battery'), game);
  await assert.rejects(decrypt(payload, 'wrong password'));
});

test('the locked page contains no questions or answers in plain text', async () => {
  const page = renderGate(game, await encrypt(game, 'correct horse battery', 1000), template);
  for (const secret of ['Name a member of Abraham staff', 'Kipferler', 'Pardon My French', 'ENGINE START']) {
    assert.ok(!page.includes(secret), `"${secret}" leaked into the locked page`);
  }
  assert.ok(page.includes('House password'));
  assert.ok(!/__(ICONS|FONTS|EAGLE|PAYLOAD)__/.test(page), 'all placeholders filled');
  assert.match(page, /<meta name="robots" content="noindex, nofollow">/);
});

test('the same password gives the same key across builds (boys stay signed in after updates)', async () => {
  const a = await encrypt(game, 'correct horse battery', 1000);
  const b = await encrypt(game, 'correct horse battery', 1000);
  assert.equal(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv, 'a fresh IV every build');
});

test('without a password the game is published open; a too-short password is refused', async () => {
  assert.equal(await buildPage(game, '', template), game);
  await assert.rejects(buildPage(game, 'short', template));
  assert.ok((await buildPage(game, 'correct horse battery', template)).includes('House password'));
});
