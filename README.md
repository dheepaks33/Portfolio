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
| `skills.ts` | Toolbox groups |
| `background.ts` | Education, publication, certifications, achievements |
| `sections.ts` | Section order and their `0x..` addresses |

After changing the headline, run `npm run og` to regenerate the social preview image (`public/og.png`).

## Weekly data sync

`npm run sync` (`scripts/sync.mjs`) writes `src/data/generated/live.json` with:

- public repos: description, language, topics, last push, README excerpt
- the contribution calendar
- LeetCode solved counts and contest rating

Each source fails soft. If an API call fails, that section keeps its previous value, so the build never breaks. Without a `GITHUB_TOKEN` the sync uses unauthenticated requests, which are limited to 60 per hour.

`.github/workflows/site.yml` runs on every push to `main`, every Monday at 03:00 UTC, and on demand. It syncs the data, builds the site and deploys to Pages. Scheduled runs also commit the refreshed snapshot.

You can change what shows up without editing code:

- **New public repos** appear in the "All repositories" table automatically.
- **Add the GitHub topic `featured`** to a repo to promote it to a featured card. Add curated copy in `projects.ts` for a richer card.
- **The contribution heatmap** shows up automatically once there are 50 or more public contributions in a year.

### One-time setup

In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
