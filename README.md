# Abrahamillion

A daily rare-answer trivia game for Abraham House, Brighton College. Ten open prompts, 40 seconds each; players can keep guessing until their first right answer. The rarer a correct answer, the higher the eagle flies: it starts perched on a pixel-art Abraham House in a sunlit wood and climbs through the clouds into the night sky with every answer. Fan-made, based on [Krillion](https://krillion.io) by kp.

The whole game is one file, `game.html`, which also holds the question bank. It can be published open to anyone with the link, or locked with a house password (see Hosting). There is no server code. The pixel art (house, woodland, eagle, sky, clouds, gulls) is drawn in code in the `Scene` section of the script; the fonts (Jersey 10 and Silkscreen, both SIL Open Font License) are embedded.

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
- Tiers: 1 Perch (10 pts), 2 Treetops (15), 3 Clifftop (30), 4 Clouds (60), 5 Jet Stream (85), 6 One in an Abrahamillion (100). One point is 10 m of altitude, so a perfect flight reaches 10,000 m. Wrong answers don't end a prompt: players keep trying until the 40 seconds run out, and their first right answer locks in. Nothing right in time shows "Time's up" and scores 0; tapping Pass shows "Passed".
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

## Leaderboard (for the big screen)

After their flight, each boy types his name and taps **Send**, and his altitude goes to a Google Form. The big screen is the game's link with `?board` on the end (for example `https://<username>.github.io/<repo>/?board`). Without the Google links below it just shows the house, the eagle and a large **Scan to play** QR code; with them, it also shows how many eagles have landed and the house average, refreshing every few seconds. A large **Scan to play** QR code beside the count opens the game on boys' phones (it hides when the results are revealed). **Reveal the top 10** counts down from 10th to 1st, and the eagle flies to the winner's altitude. The host can hide any name with its ×, and nothing else changes.

Setup, once (about 5 minutes, best with a personal Google account, because school accounts can block people from outside):

1. At forms.google.com, make a blank form (e.g. "Abrahamillion results") with three **Short answer** questions titled **Name**, **Altitude** and **Tiers**.
2. In the form's **Settings**, under Responses, make sure it does **not** collect email addresses, does **not** limit to 1 response and is **not** restricted to your organisation, so boys can send without signing in.
3. **⋮ → Get pre-filled link**, type `NAME`, `ALTITUDE` and `TIERS` as the three answers, then **Get link → Copy link**. Paste it after `form =` in the leaderboard settings near the top of `game.html`.
4. **Responses → Link to Sheets → Create a new spreadsheet.** In the sheet, **Share → General access → Anyone with the link (Viewer) → Copy link**. Paste it after `results =`.

Leave both blank and the leaderboard stays switched off. Each name counts once (their first send), and scores are capped at the maximum possible. Anyone who digs the form link out of the page could send a fake score, which is what the host's hide button is for.

## Hosting

GitHub Pages. The workflow in `.github/workflows/pages.yml` runs on every push (or from Actions → Publish game → Run workflow): it checks the questions with the tests, builds `dist/index.html` with `tools/build.mjs`, and publishes it.

- **Open (default):** anyone with the link can play.
- **Locked (optional):** add a repository secret named `SITE_PASSWORD` (Settings → Secrets and variables → Actions, 8+ characters) and the game is encrypted behind that password. Players enter it once per device. Delete the secret to open it up again.

GitHub Pages is free for public repositories. From a private repository it needs GitHub Pro (free for students through the GitHub Student Developer Pack).

To publish:

1. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Actions → Publish game → Run workflow (or push any change).

The link appears in Settings → Pages and on the finished workflow run. If the question bank has a mistake, the tests fail and the live game is left as it was until it's fixed.

To build it yourself: `node tools/build.mjs` (open) or `SITE_PASSWORD='your password' node tools/build.mjs` (locked).

## Limits of a no-backend game

- Published open, anyone with the link can play and can read the answers in the page source. Locked, people without the password see only the password box; anyone with the password can still read the answers.
- "One go per day" is stored on the phone (localStorage). A private tab or cleared browser data gives another go.
- The day rolls over at midnight UK time.
