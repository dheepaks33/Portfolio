// Pulls live GitHub + LeetCode data into src/data/generated/live.json.
// Runs weekly in CI (.github/workflows/site.yml) and on demand via `npm run sync`.
//
// Every source is fail-soft: if a request fails, that section keeps the value
// from the previous snapshot, so a flaky API never breaks the site build.

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const GITHUB_USER = 'dheepaks33';
const LEETCODE_USER = 'dheepaks33';
const OUT = new URL('../src/data/generated/live.json', import.meta.url);
const TOKEN = process.env.GITHUB_TOKEN;

const ghHeaders = {
  Accept: 'application/vnd.github+json',
  'User-Agent': `${GITHUB_USER}-portfolio-sync`,
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

class HttpError extends Error {
  constructor(res, url) {
    super(`${res.status} ${res.statusText} for ${url}`);
    this.status = res.status;
  }
}

async function request(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { ...ghHeaders, ...init.headers } });
  if (!res.ok) throw new HttpError(res, url);
  return res;
}

const getJson = async (url, init) => (await request(url, init)).json();
const getText = async (url, init) => (await request(url, init)).text();

// First prose paragraph of a README, stripped of markdown, capped at ~220 chars.
function readmeExcerpt(md) {
  const blocks = md
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  for (const block of blocks) {
    if (/^(#|!\[|\||<|[-*_]{3,})/.test(block)) continue;
    if (/^\s*([-*+]|\d+\.)\s/m.test(block)) continue; // skip lists
    if (/^\*\*[^*]+\*\*:?\s*$/m.test(block)) continue; // skip "**Label**:" headings
    const text = block
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[*_`>#]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length < 40) continue;
    return text.length > 220 ? `${text.slice(0, 217).replace(/\s+\S*$/, '')}…` : text;
  }
  return null;
}

async function syncProfile() {
  const u = await getJson(`https://api.github.com/users/${GITHUB_USER}`);
  return {
    login: u.login,
    name: u.name,
    avatarUrl: u.avatar_url,
    url: u.html_url,
    followers: u.followers,
    publicRepos: u.public_repos,
    createdAt: u.created_at,
  };
}

async function syncRepos(previous) {
  const list = await getJson(
    `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed&type=owner`,
  );
  const prevByName = new Map((previous ?? []).map((r) => [r.name, r]));
  return Promise.all(
    list.map(async (r) => {
      const prev = prevByName.get(r.name);
      // A 404 means "genuinely none"; any other failure (rate limit, outage)
      // keeps whatever the previous snapshot had for this repo.
      const [languages, excerpt] = await Promise.all([
        getJson(r.languages_url).catch((err) => (err.status === 404 ? {} : prev?.languages ?? {})),
        getText(`https://api.github.com/repos/${r.full_name}/readme`, {
          headers: { Accept: 'application/vnd.github.raw' },
        }).then(readmeExcerpt, (err) => (err.status === 404 ? null : prev?.excerpt ?? null)),
      ]);
      return {
        name: r.name,
        url: r.html_url,
        description: r.description,
        excerpt,
        homepage: r.homepage || null,
        language: r.language,
        languages,
        topics: r.topics ?? [],
        stars: r.stargazers_count,
        forks: r.forks_count,
        fork: r.fork,
        archived: r.archived,
        createdAt: r.created_at,
        pushedAt: r.pushed_at,
      };
    }),
  );
}

// Contribution calendar: GraphQL when a token is available (CI), otherwise the
// public calendar HTML that github.com renders on profile pages.
async function syncContributions() {
  if (TOKEN) {
    const query = `query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks { contributionDays { date contributionCount } }
          }
        }
      }
    }`;
    const res = await getJson('https://api.github.com/graphql', {
      method: 'POST',
      body: JSON.stringify({ query, variables: { login: GITHUB_USER } }),
    });
    if (res.errors) throw new Error(JSON.stringify(res.errors));
    const cal = res.data.user.contributionsCollection.contributionCalendar;
    const days = cal.weeks.flatMap((w) =>
      w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
    );
    return { total: cal.totalContributions, days };
  }

  const html = await getText(`https://github.com/users/${GITHUB_USER}/contributions`, {
    headers: { Accept: 'text/html' },
  });
  const dateById = new Map();
  for (const m of html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"\s+id="([^"]+)"/g)) {
    dateById.set(m[2], m[1]);
  }
  const countById = new Map();
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>(\d+) contributions?/g)) {
    countById.set(m[1], Number(m[2]));
  }
  if (dateById.size === 0) throw new Error('contribution calendar markup not recognised');
  const days = [...dateById]
    .map(([id, date]) => ({ date, count: countById.get(id) ?? 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return { total: days.reduce((sum, d) => sum + d.count, 0), days };
}

async function syncLeetCode() {
  const query = `query($u: String!) {
    matchedUser(username: $u) {
      submitStatsGlobal { acSubmissionNum { difficulty count } }
    }
    allQuestionsCount { difficulty count }
    userContestRanking(username: $u) { rating attendedContestsCount topPercentage }
  }`;
  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' },
    body: JSON.stringify({ query, variables: { u: LEETCODE_USER } }),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} from LeetCode`);
  const { data, errors } = await res.json();
  if (errors || !data?.matchedUser) throw new Error(JSON.stringify(errors ?? 'user not found'));

  const byDifficulty = (rows) => Object.fromEntries(rows.map((r) => [r.difficulty.toLowerCase(), r.count]));
  const solved = byDifficulty(data.matchedUser.submitStatsGlobal.acSubmissionNum);
  const totals = byDifficulty(data.allQuestionsCount);
  const contest = data.userContestRanking;
  return {
    username: LEETCODE_USER,
    url: `https://leetcode.com/u/${LEETCODE_USER}/`,
    solved: { all: solved.all, easy: solved.easy, medium: solved.medium, hard: solved.hard },
    totals: { all: totals.all, easy: totals.easy, medium: totals.medium, hard: totals.hard },
    contest: contest
      ? {
          rating: Math.round(contest.rating),
          attended: contest.attendedContestsCount,
          topPercentage: contest.topPercentage,
        }
      : null,
  };
}

async function main() {
  let previous = {};
  try {
    previous = JSON.parse(await readFile(OUT, 'utf8'));
  } catch {
    // first run: nothing to fall back to
  }

  const sources = {
    profile: syncProfile,
    repos: syncRepos,
    contributions: syncContributions,
    leetcode: syncLeetCode,
  };

  const next = { syncedAt: new Date().toISOString(), status: {} };
  for (const [key, run] of Object.entries(sources)) {
    try {
      next[key] = await run(previous[key]);
      next.status[key] = { ok: true, at: next.syncedAt };
      console.log(`✓ ${key}`);
    } catch (err) {
      next[key] = previous[key] ?? null;
      next.status[key] = { ok: false, at: previous.status?.[key]?.at ?? null, error: String(err.message ?? err) };
      console.warn(`✗ ${key}: ${err.message ?? err} (kept previous snapshot)`);
    }
  }

  await mkdir(new URL('.', OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`wrote ${OUT.pathname}`);
}

main();
