# Abrahamillion

A daily rare-answer trivia game for Abraham House, Brighton College. Ten open prompts a day, 40 seconds each, one answer per prompt. The rarer a correct answer, the higher the eagle flies: it starts perched on a pixel-art Abraham House in a sunlit wood and climbs through the clouds into the night sky with every answer. Fan-made, based on [Krillion](https://krillion.io) by kp.

The whole game is one file, `game.html`, which also holds the question bank. It's locked with a house password before it goes online (see Hosting), so only people with the link and the password can play. There is no server code. The pixel art (house, woodland, eagle, sky, clouds, gulls) is drawn in code in the `Scene` section of the script; the fonts (Jersey 10 and Silkscreen, both SIL Open Font License) are embedded.

## Screens

- Phones: one column, with the scene showing through gaps between the panels.
- iPad landscape and laptops: the scene fills the left of the screen and the game sits in a column on the right. A "Full screen" button appears where the browser supports it (laptops, iPad, Android; not iPhone).
- iPad and iPhone: Share → Add to Home Screen opens it full screen like an app, with its own icon.

## Editing the questions

Open `game.html` in any text editor. The question bank is the first big block of text in the file, between `<script type="text/plain" id="question-bank">` and `</script>`.

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
node --test tests/*.test.mjs
```

This needs Node 18 or later and nothing else. It checks the answer matching (including that every spelling in the real bank scores as its own answer, so run it after editing the bank) and the password lock.

## Hosting

Netlify, linked to this private repository. `netlify.toml` tells Netlify what to do: it runs `tools/build.mjs`, which encrypts `game.html` with the house password into `dist/index.html`, and publishes that. The repository stays private, and the password is never stored in it.

1. Sign up at app.netlify.com with GitHub.
2. Add a new site (project) → Import an existing project → GitHub, and allow access to this repository only.
3. Pick this repository and the branch to deploy. Netlify reads the build settings from `netlify.toml`.
4. Add an environment variable named `SITE_PASSWORD` with the house password (8+ characters; three random words work well). Without it the build stops on purpose rather than publish an unlocked game.
5. Deploy, then change the site name to get a tidy link.

Every push updates the site. Players enter the password once per device ("Remember on this device"); they stay signed in through updates. To change the password, edit `SITE_PASSWORD` and redeploy: everyone is asked for the new one.

To build the locked page yourself: `SITE_PASSWORD='your password' node tools/build.mjs`.

## Limits of a no-backend game

- Without the password, the page shows only the password box; the questions and answers are encrypted. Anyone who has the password can read the answers in the page source, and boys can pass the password on, so change it if it spreads.
- "One go per day" is stored on the phone (localStorage). A private tab or cleared browser data gives another go.
- The day rolls over at midnight UK time.
