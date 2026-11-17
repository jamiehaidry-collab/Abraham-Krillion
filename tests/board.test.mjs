// Tests for the house leaderboard helpers in game.html. Run with: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../game.html', import.meta.url), 'utf8');
const Engine = new Function(`${html.match(/\/\* === ENGINE START === \*\/([\s\S]*?)\/\* === ENGINE END === \*\//)[1]}\nreturn Engine;`)();

const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSdTEST/viewform?usp=pp_url&entry.111=NAME&entry.222=ALTITUDE&entry.333=TIERS';
const SHEET = 'https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit?usp=sharing';

test('reads the two links from the settings block', () => {
  const c = Engine.boardConfig(`form = ${FORM}\nresults = ${SHEET}\n`);
  assert.equal(c.on, true);
  assert.equal(c.post, 'https://docs.google.com/forms/d/e/1FAIpQLSdTEST/formResponse');
  assert.deepEqual(c.fields, { NAME: 'entry.111', ALTITUDE: 'entry.222', TIERS: 'entry.333' });
  assert.equal(c.csv, 'https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/gviz/tq?tqx=out:csv');
});

test('a published CSV link is used as it is; blank settings switch it off', () => {
  const pub = 'https://docs.google.com/spreadsheets/d/e/2PACX-abc/pub?output=csv';
  assert.equal(Engine.boardConfig(`form = ${FORM}\nresults = ${pub}`).csv, pub);
  const off = Engine.boardConfig('form =\nresults =\n');
  assert.equal(off.on, false);
  assert.equal(off.csv, '');
  assert.equal(Engine.boardConfig('form = https://docs.google.com/forms/d/e/X/viewform?entry.1=NAME').on, false, 'needs NAME and ALTITUDE');
});

test('the live game file ships with the leaderboard switched off until links are added', () => {
  const block = html.match(/<script type="text\/plain" id="leaderboard-config">([\s\S]*?)<\/script>/)[1];
  assert.equal(Engine.boardConfig(block).on, false);
});

test('parses Google CSV, including quotes and commas', () => {
  const rows = Engine.parseCSV('"Timestamp","Name","Altitude","Tiers"\r\n"17/11/2026 09:01:02","Jamie","2,550","6430010"\r\n"x","O""Neill, Sam","100",""\r\n');
  assert.deepEqual(rows[1], ['17/11/2026 09:01:02', 'Jamie', '2,550', '6430010']);
  assert.deepEqual(rows[2], ['x', 'O"Neill, Sam', '100', '']);
});

test('leaderboard: highest first, one entry per name, hidden names left out, silly numbers capped', () => {
  const rows = Engine.parseCSV([
    'Timestamp,Name,Altitude,Tiers',
    't1,Lucas,3200,6430',
    't2,Jago,5100,6666',
    't3,lucas,9900,6666',      // second send from Lucas: ignored
    't4,Dan,3200,5000',        // tie with Lucas: earlier send ranks higher
    't5,  Fran  ,999999,6',    // capped
    't6,<b>Rude</b>,800,1',
    't7,,4000,1',              // no name: ignored
  ].join('\n'));
  const all = Engine.leaderboard(rows, [], 10000);
  assert.deepEqual(all.entries.map((e) => [e.name, e.alt]), [['Fran', 10000], ['Jago', 5100], ['Lucas', 3200], ['Dan', 3200], ['bRude/b', 800]]);
  assert.equal(all.count, 5);
  assert.equal(all.average, Math.round((10000 + 5100 + 3200 + 3200 + 800) / 5));
  const hidden = Engine.leaderboard(rows, ['brude/b', 'FRAN'], 10000);
  assert.deepEqual(hidden.entries.map((e) => e.name), ['Jago', 'Lucas', 'Dan']);
  assert.equal(Engine.leaderboard([], []).count, 0);
});
