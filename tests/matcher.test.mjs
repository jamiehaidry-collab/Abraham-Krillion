// Unit tests for the game engine inside index.html.
// Run with:  node --test tests/
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engineSrc = html.match(/\/\* === ENGINE START === \*\/([\s\S]*?)\/\* === ENGINE END === \*\//)[1];
const Engine = new Function(`${engineSrc}\nreturn Engine;`)();
const BANK = html.match(/<script type="text\/plain" id="question-bank">([\s\S]*?)<\/script>/)[1];

const prompt = (text) => {
  const { prompts, errors } = Engine.parseBank(text);
  assert.deepEqual(errors, [], 'test bank should parse cleanly');
  return prompts[0];
};
// Display name of the scoring entry, or null for no score.
const hit = (answer, p) => {
  const m = Engine.matchAnswer(answer, p);
  return m && m.entry.tier > 0 ? m.entry.display : null;
};
const tierOf = (answer, p) => {
  const m = Engine.matchAnswer(answer, p);
  return m ? m.entry.tier : 0;
};

const staff = prompt(`
# Name a member of Abraham house staff
Mr Kulin / Kulin = 1
Mrs Kulin = 2
Mr Geyton / Geyton = 3
Dr Johnson = 4
`);
const tube = prompt(`
# Name a London Underground line
Central = 1
Northern = 1
Piccadilly = 2
Victoria = 2
Hammersmith & City = 5
Waterloo & City = 6
`);
const pms = prompt(`
# Name a PM
Thatcher = 1
Tony Blair = 2
Alec Douglas-Home = 6
`);

describe('normalize', () => {
  const n = Engine.normalize;
  test('case, spaces and punctuation', () => {
    assert.equal(n('  MR.   Kulin!! '), 'mr kulin');
    assert.equal(n("O'Neill"), 'oneill');
    assert.equal(n('U.S.A.'), 'usa');
    assert.equal(n('Douglas-Home'), 'douglas home');
  });
  test('accents', () => {
    assert.equal(n('Pokémon'), 'pokemon');
    assert.equal(n('Éire'), 'eire');
    assert.equal(n('Straße'), 'strasse');
  });
  test('leading "the" and trailing "line" / "house"', () => {
    assert.equal(n('The Northern Line'), 'northern');
    assert.equal(n('School House'), 'school');
    assert.equal(n('the tempest'), 'tempest');
  });
  test('& means "and"', () => {
    assert.equal(n('Hammersmith & City line'), 'hammersmith and city');
    assert.equal(n('Hammersmith&City'), 'hammersmith and city');
  });
  test('does not empty a one-word answer', () => {
    assert.equal(n('Line'), 'line');
    assert.equal(n('The'), 'the');
    assert.equal(n('   '), '');
  });
});

describe('levenshtein', () => {
  test('basic distances', () => {
    assert.equal(Engine.levenshtein('kitten', 'sitting'), 3);
    assert.equal(Engine.levenshtein('abc', 'abc'), 0);
    assert.equal(Engine.levenshtein('', 'abc'), 3);
  });
  test('typo allowance by length', () => {
    assert.equal(Engine.allowance(4), 0);
    assert.equal(Engine.allowance(5), 1);
    assert.equal(Engine.allowance(7), 1);
    assert.equal(Engine.allowance(8), 2);
  });
});

describe('parseBank', () => {
  test('prompts, alternatives, tiers and notes', () => {
    const { prompts, errors } = Engine.parseBank(`
// a note
# Name a member of Abraham house staff
Mr Kulin / Kulin = 1   // housemaster
Mr Geyton / Geyton = 3
`);
    assert.deepEqual(errors, []);
    assert.equal(prompts.length, 1);
    assert.equal(prompts[0].text, 'Name a member of Abraham house staff');
    assert.deepEqual(prompts[0].entries.map((e) => [e.display, e.forms, e.tier]), [
      ['Mr Kulin', ['Mr Kulin', 'Kulin'], 1],
      ['Mr Geyton', ['Mr Geyton', 'Geyton'], 3],
    ]);
  });
  test('reports mistakes with line numbers', () => {
    const { prompts, errors } = Engine.parseBank(`Stray = 1
# Good prompt
No tier here
Bad tier = 7
Fine = 2
# Empty prompt
`);
    assert.equal(prompts.length, 1);
    assert.deepEqual(errors.map((e) => e.line), [1, 3, 4, 6]);
  });
  test('flags the same answer listed twice in a prompt', () => {
    const { errors } = Engine.parseBank(`# P
Mars = 1
The Mars = 2
`);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].line, 3);
  });
});

describe('matchAnswer', () => {
  test('ignores case, accents and punctuation', () => {
    assert.equal(hit('KULIN!!', staff), 'Mr Kulin');
    assert.equal(hit('mr. geyton', staff), 'Mr Geyton');
    assert.equal(hit('Mr Gèyton', staff), 'Mr Geyton');
  });
  test('alternative spellings', () => {
    assert.equal(hit('Geyton', staff), 'Mr Geyton');
  });
  test('title-free answers', () => {
    assert.equal(hit('Johnson', staff), 'Dr Johnson');
    assert.equal(hit('Mr Johnson', staff), null, 'a different title is a different person');
  });
  test('ambiguous answer gets the more common (lower) tier', () => {
    assert.equal(hit('Kulin', staff), 'Mr Kulin');
    assert.equal(tierOf('Kulin', staff), 1);
    const f1 = prompt(`# British F1 champion
Graham Hill = 4
Damon Hill = 2
`);
    assert.equal(hit('Hill', f1), 'Damon Hill');
  });
  test('an exact match beats a looser one', () => {
    assert.equal(hit('Mrs Kulin', staff), 'Mrs Kulin');
    assert.equal(tierOf('Mrs Kulin', staff), 2);
    assert.equal(hit('Mrs Kulim', staff), 'Mrs Kulin');
  });
  test('first name + surname either way round', () => {
    assert.equal(hit('Margaret Thatcher', pms), 'Thatcher');
    assert.equal(hit('Blair', pms), 'Tony Blair');
    assert.equal(hit('Douglas-Home', pms), 'Alec Douglas-Home');
    assert.equal(hit('Home', pms), 'Alec Douglas-Home');
    assert.equal(hit('Tony', pms), null, 'first name alone is not enough');
  });
  test('leading "the", trailing "line", & vs and', () => {
    assert.equal(hit('The Victoria Line', tube), 'Victoria');
    assert.equal(hit('hammersmith and city line', tube), 'Hammersmith & City');
    assert.equal(hit('Waterloo & City', tube), 'Waterloo & City');
    const houses = prompt(`# Name a Brighton College house
School House = 2
`);
    assert.equal(hit('School', houses), 'School House');
    assert.equal(hit('school house', houses), 'School House');
  });
  test('typos: none under 5 letters, 1 for 5-7, 2 for 8+', () => {
    const planets = prompt(`# Planet
Mars = 1
Venus = 2
Jupiter = 1
Piccadilly = 3
`);
    assert.equal(hit('Marz', planets), null);
    assert.equal(hit('Venis', planets), 'Venus');
    assert.equal(hit('Vanis', planets), null);
    assert.equal(hit('Jupyter', planets), 'Jupiter');
    assert.equal(hit('Picadily', planets), 'Piccadilly');
    assert.equal(hit('Pcadily', planets), null);
  });
  test('numbers and Roman numerals are never "typos"', () => {
    const plays = prompt(`# Shakespeare
Henry VI / Henry 6 = 6
Henry VIII / Henry 8 = 6
Richard II = 5
Richard III = 4
`);
    assert.equal(hit('Henry VII', plays), null);
    assert.equal(hit('Henry 7', plays), null);
    assert.equal(hit('Henry 8', plays), 'Henry VIII');
    assert.equal(hit('Richard II', plays), 'Richard II');
    assert.equal(hit('Richard III', plays), 'Richard III');
  });
  test('generic words do not match on their own', () => {
    const monopoly = prompt(`# Monopoly
Old Kent Road = 2
Euston Road = 5
Park Lane = 1
`);
    assert.equal(hit('Road', monopoly), null);
    assert.equal(hit('Lane', monopoly), null);
    assert.equal(hit('City', tube), null);
  });
  test('"= 0" blocks a wrong answer that is a typo away from a right one', () => {
    const eu = prompt(`# EU
Ireland = 2
Iceland = 0
`);
    assert.equal(hit('Iceland', eu), null);
    assert.equal(hit('Irland', eu), 'Ireland');
    const noDecoy = prompt(`# EU
Ireland = 2
`);
    assert.equal(hit('Iceland', noDecoy), 'Ireland', 'shows why the = 0 line is needed');
  });
  test('blank and junk answers score nothing', () => {
    assert.equal(Engine.matchAnswer('', staff), null);
    assert.equal(Engine.matchAnswer('   ', staff), null);
    assert.equal(Engine.matchAnswer('!!!', staff), null);
    assert.equal(hit('Mr Smith', staff), null);
  });
});

describe('the real question bank', () => {
  const { prompts, errors } = Engine.parseBank(BANK);
  test('parses with no errors and has at least 10 prompts', () => {
    assert.deepEqual(errors, []);
    assert.ok(prompts.length >= 10, `only ${prompts.length} prompts`);
  });
  test('every listed spelling scores as its own answer', () => {
    for (const p of prompts) {
      for (const e of p.entries) {
        for (const form of e.forms) {
          const m = Engine.matchAnswer(form, p);
          assert.ok(m, `"${form}" did not match in "${p.text}"`);
          assert.equal(m.entry, e, `"${form}" matched "${m.entry.display}" instead of "${e.display}" in "${p.text}"`);
        }
      }
    }
  });
  test('spot checks', () => {
    const find = (t) => prompts.find((p) => p.text.startsWith(t));
    assert.equal(hit('the jubilee line', find('Name a London Underground')), 'Jubilee');
    assert.equal(hit('Harold Wilson', find('Name a UK Prime Minister')), 'Harold Wilson');
    assert.equal(hit('Boris Johnson', find('Name a UK Prime Minister')), null);
    assert.equal(hit('Iceland', find('Name a member state')), null);
    assert.equal(hit('Australia', find('Name a member state')), null);
    assert.equal(hit('Pluto', find('Name a planet')), null);
    assert.equal(hit('Stanstead', find('Name a London airport')), 'Stansted');
  });
});

describe('pickDaily', () => {
  const bank = (n) => Array.from({ length: n }, (_, i) => ({ text: `Prompt ${i}` }));
  test('same date gives the same 10 distinct prompts', () => {
    const a = Engine.pickDaily(bank(13), '2026-11-17', 10);
    const b = Engine.pickDaily(bank(13), '2026-11-17', 10);
    assert.deepEqual(a, b);
    assert.equal(a.length, 10);
    assert.equal(new Set(a).size, 10);
    assert.ok(a.every((i) => i >= 0 && i < 13));
  });
  test('a different date gives a different dive', () => {
    assert.notDeepEqual(Engine.pickDaily(bank(40), '2026-11-17'), Engine.pickDaily(bank(40), '2026-11-18'));
  });
  test('no repeats until the whole bank is used', () => {
    // With 30 prompts, three consecutive days starting on a round boundary use all 30.
    let d = new Date(Date.UTC(2026, 10, 17));
    while ((Engine.dayNumber(d.toISOString().slice(0, 10)) * 10) % 30 !== 0) d = new Date(d.getTime() + 86400000);
    const days = [0, 1, 2].map((k) => new Date(d.getTime() + k * 86400000).toISOString().slice(0, 10));
    const all = days.flatMap((day) => Engine.pickDaily(bank(30), day, 10));
    assert.equal(new Set(all).size, 30);
  });
  test('smaller banks use every prompt', () => {
    assert.deepEqual([...Engine.pickDaily(bank(6), '2026-11-17', 10)].sort((x, y) => x - y), [0, 1, 2, 3, 4, 5]);
    assert.deepEqual(Engine.pickDaily([], '2026-11-17', 10), []);
  });
});

describe('dates and sharing', () => {
  test('London date and day label', () => {
    assert.equal(Engine.londonDate(new Date('2026-11-17T23:30:00Z')), '2026-11-17');
    assert.equal(Engine.londonDate(new Date('2026-07-01T23:30:00Z')), '2026-07-02', 'BST is UTC+1');
    assert.equal(Engine.formatDay('2026-11-17'), 'Tue 17 Nov 2026');
  });
  test('share text has tiers and altitude but no answers', () => {
    const results = [
      { answer: 'Bakerloo', tier: 3, pts: 30 },
      { answer: 'Elizabeth', tier: 0, pts: 0 },
      { answer: '', tier: 0, pts: 0 },
      { answer: 'Oganesson', tier: 6, pts: 100 },
    ];
    const text = Engine.shareText({ date: '2026-11-17', results, url: 'https://example.org/' });
    assert.match(text, /^ABRAHAMILLION\nDaily Flight · Tue 17 Nov 2026\n/);
    assert.match(text, /1,300 m high \(130\/400 pts\)/);
    assert.match(text, /01 Clifftop\n02 Grounded\n03 Grounded\n04 Zenith/);
    assert.ok(!/Bakerloo|Oganesson/.test(text));
    assert.ok(text.endsWith('https://example.org/'));
  });
  test('points per tier', () => {
    assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(Engine.points), [0, 10, 15, 30, 60, 85, 100]);
  });
});
