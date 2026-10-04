// Typed access to the weekly snapshot (src/data/generated/live.json) and the
// merge of curated project copy with live repository stats.

import snapshot from '../data/generated/live.json';
import { curated, featured, forkAllowlist, hidden, type CuratedProject } from '../data/projects';

export interface LiveRepo {
  name: string;
  url: string;
  description: string | null;
  excerpt: string | null;
  homepage: string | null;
  language: string | null;
  languages: Record<string, number>;
  topics: string[];
  stars: number;
  forks: number;
  fork: boolean;
  archived: boolean;
  createdAt: string;
  pushedAt: string;
}

export interface LiveData {
  syncedAt: string;
  status: Record<string, { ok: boolean; at: string | null; error?: string }>;
  profile: {
    login: string;
    name: string;
    avatarUrl: string;
    url: string;
    followers: number;
    publicRepos: number;
    createdAt: string;
  } | null;
  repos: LiveRepo[] | null;
  contributions: { total: number; days: { date: string; count: number }[] } | null;
  leetcode: {
    username: string;
    url: string;
    solved: { all: number; easy: number; medium: number; hard: number };
    totals: { all: number; easy: number; medium: number; hard: number };
    contest: { rating: number; attended: number; topPercentage: number } | null;
  } | null;
}

export const live = snapshot as unknown as LiveData;

const GITHUB = 'https://github.com/dheepaks33';

export interface Project {
  name: string;
  title: string;
  tagline: string;
  url: string;
  curated?: CuratedProject;
  repo?: LiveRepo;
}

function isVisible(r: LiveRepo) {
  return !hidden.includes(r.name) && (!r.fork || forkAllowlist.includes(r.name));
}

function toProject(name: string, repo?: LiveRepo): Project {
  const c = curated[name];
  return {
    name,
    title: c?.title ?? name.replace(/[-_]+/g, ' '),
    tagline: c?.tagline ?? repo?.description ?? repo?.excerpt ?? '',
    url: repo?.url ?? `${GITHUB}/${name}`,
    curated: c,
    repo,
  };
}

const repos = (live.repos ?? []).filter(isVisible);
const byName = new Map(repos.map((r) => [r.name, r]));
const haveLiveRepos = repos.length > 0;

// Curated order first, then anything tagged `featured` on GitHub.
const featuredNames = [
  ...featured,
  ...repos.filter((r) => r.topics.includes('featured') && !featured.includes(r.name)).map((r) => r.name),
];

/** Featured projects. If a curated repo disappears from GitHub it drops out too. */
export const featuredProjects: Project[] = featuredNames
  .filter((name) => !haveLiveRepos || byName.has(name))
  .map((name) => toProject(name, byName.get(name)));

/** Every other visible public repo, most recently pushed first. */
export const archiveProjects: Project[] = repos
  .filter((r) => !featuredNames.includes(r.name))
  .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))
  .map((r) => toProject(r.name, r));

export const lastPushed: LiveRepo | undefined = [...repos].sort((a, b) =>
  b.pushedAt.localeCompare(a.pushedAt),
)[0];
