# dheepaks33.github.io/Portfolio

Personal site of Dheepak Selvakumar, embedded software engineer. Built with
[Astro](https://astro.build) as a static site and deployed to GitHub Pages.
GitHub Actions rebuilds it every Monday with fresh GitHub and LeetCode data.

## Develop

```sh
npm install
npm run dev       # http://localhost:4321/Portfolio/
npm run build     # type-check + static build into dist/
npm run preview   # serve dist/
```

Requires Node 22.12 or newer.

## Editing content

All copy lives in typed data files under `src/data/`, so no component needs to change:

| File | What it holds |
| --- | --- |
| `profile.ts` | Name, headline, intro, links |
| `experience.ts` | Roles and bullets. `chain` tags link a bullet to a block in the signal-chain diagram. `hidden: true` keeps a role out of the page |
| `projects.ts` | Featured order, curated copy per repo, fork allowlist, hidden repos |
| `skills.ts` | Toolbox blocks, drawn as a chip diagram |
| `background.ts` | Education, publication, certifications, achievements |
| `sections.ts` | Section order and their `0x..` addresses |

After changing the headline, run `npm run og` to regenerate the social preview image (`public/og.png`).

## Interactive pieces

Everything works without JavaScript; these are progressive enhancements.

| Feature | Where |
| --- | --- |
| Hero I²C trace: type up to 4 characters to re-encode it; hover for a logic-analyzer probe | `src/components/I2CTrace.astro`, `src/lib/i2c.ts` |
| Bench-test lab: Web Audio model of the signal chain (3-band EQ, mid/side widening, 16 kHz SRC with a switchable anti-aliasing filter), with frequency response, live spectrum and goniometer | `src/components/DspLab.astro`, `src/scripts/dsp-lab.ts`, `src/lib/biquad.ts` |
| Command menu (⌘K / Ctrl+K or `/`), and keys `0`–`7` to jump to sections | `src/components/CommandPalette.astro`, `src/scripts/nav.ts` |
| Theme switch with a View Transitions circular reveal | `src/scripts/theme.ts` |
| Scroll progress, the rail's "program counter", count-up figures, copy email | `src/scripts/interactions.ts` |

## Weekly data sync

`npm run sync` (`scripts/sync.mjs`) writes `src/data/generated/live.json` with:

- public repos: description, language, topics, last push, README excerpt
- the contribution calendar
- LeetCode solved counts and contest rating

Each source fails soft. If an API call fails, that section keeps its previous value, so the build never breaks. Without a `GITHUB_TOKEN` the sync uses unauthenticated requests, which are limited to 60 per hour.

`.github/workflows/site.yml` runs on every push to `main`, every Monday at 03:00 UTC, and on demand. It syncs the data, builds the site and deploys to Pages. Scheduled runs also commit the refreshed snapshot.

You can change what shows up without editing code:

- **Add the GitHub topic `featured`** to a repo to show it as a project card. Add curated copy in `projects.ts` for a richer card.
- **Live repo details** on each card (last push, language) refresh with every sync.
- **The contribution heatmap** shows up automatically once there are 50 or more public contributions in a year.

### One-time setup

In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
