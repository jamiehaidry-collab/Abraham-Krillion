# Abrahamillion

A daily rare-answer trivia game for Abraham House, Brighton College. Ten open prompts a day, 40 seconds each, one answer per prompt. The rarer a correct answer, the higher the eagle flies: it starts perched on a pixel-art Abraham House in a sunlit wood and climbs through the clouds into the night sky with every answer. Fan-made, based on [Krillion](https://krillion.io) by kp.

Everything is in one file, `index.html`. There is no build step and no server code. The pixel art (house, woodland, eagle, sky, clouds, gulls) is drawn in code in the `Scene` section of the script; the fonts (Jersey 10 and Silkscreen, both SIL Open Font License) are embedded.

## Screens

- Phones: one column, with the scene showing through gaps between the panels.
- iPad landscape and laptops: the scene fills the left of the screen and the game sits in a column on the right. A "Full screen" button appears where the browser supports it (laptops, iPad, Android; not iPhone).
- iPad and iPhone: Share → Add to Home Screen opens it full screen like an app, with its own icon.

## Editing the questions

Open `index.html` in any text editor. The question bank is the first big block of text in the file, between `<script type="text/plain" id="question-bank">` and `</script>`.

```
# Name a member of Abraham house staff
Mr Kulin / Kulin = 1     // housemaster
Mr Geyton / Geyton = 3
// lines starting // are notes
```

- `#` starts a prompt.
- Each answer goes on its own line: main spelling first, other spellings after `/`, then `=` and the tier.
- Tiers: 1 Perch (10 pts), 2 Treetops (15), 3 Clifftop (30), 4 Clouds (60), 5 Jet Stream (85), 6 Zenith (100). One point is 10 m of altitude, so a perfect flight reaches 10,000 m. Wrong or blank answers are "Grounded".
- `= 0` marks a known wrong answer that is one typo away from a right one (e.g. `Iceland = 0` under EU countries), so it can't score.
- If anything in the bank is malformed, the home screen shows a "Question bank needs fixing" box with line numbers.

You don't need to list versions that differ only by capitals, accents, punctuation, a leading "The", a trailing "line" or "house", `&` vs "and", a title (Mr, Mrs, Dr, Sir…), a first name in front of a surname, or a small typo (1 letter for 5–7 letter answers, 2 for 8+).

When an answer could match more than one entry, the closest match wins (so "Mrs Kulin" scores as Mrs Kulin, not Mr Kulin). If it's a tie, the more common (lower) tier wins (so "Kulin" scores as Mr Kulin).

Each day's 10 prompts come from the whole bank. Everyone gets the same 10, and no prompt repeats until the whole bank has been used. Changing answers or tiers is safe at any time. Adding, removing or renaming a `#` prompt changes which prompts come up, so do that before or after the day's flight, not during it.

## Tests

```
node --test tests/matcher.test.mjs
```

This needs Node 18 or later and nothing else. It also checks that every spelling in the real bank scores as its own answer, so run it after editing the bank.

## Hosting

GitHub Pages, from this repo: Settings → Pages → "Deploy from a branch" → choose the branch and `/ (root)` → Save. The link is `https://<username>.github.io/<repo>/`. Pages on a private repo needs a paid plan (GitHub Pro is free for students through the GitHub Student Developer Pack).

## Limits of a no-backend game

- The answers are in the page source, so a determined player can read them.
- "One go per day" is stored on the phone (localStorage). A private tab or cleared browser data gives another go.
- The day rolls over at midnight UK time.
