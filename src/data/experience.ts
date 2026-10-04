// Points shared by both résumés (Embedded + Full-stack). Wording follows the
// Embedded version where the two say the same thing. `**text**` renders bold.

export type Domain = 'embedded' | 'product' | 'tooling';

/** Blocks of the signal-chain diagram a bullet belongs to (see SignalChain.astro). */
export type ChainBlock = 'tool' | 'link' | 'config' | 'dsp' | 'out';

export interface Role {
  id: string;
  company: string;
  title: string;
  start: string; // YYYY-MM
  end: string | null; // null = present
  domain: Domain;
  summary: string;
  bullets: { text: string; chain?: ChainBlock[] }[];
  stack: string[];
  /** Kept for the record but not shown on the site. */
  hidden?: boolean;
}

export const experience: Role[] = [
  {
    id: 'notebook',
    company: 'Notebook',
    title: 'Software Development Engineer',
    start: '2026-04',
    end: null,
    domain: 'product',
    summary: 'A fund management platform, from the database schema up to the screen.',
    bullets: [
      {
        text: 'Architected and built a **cross-platform fund management platform** (React Native, NestJS, Supabase/PostgreSQL, Redis) that digitized chit, gold, and cash financing operations, replacing notebook-based ledgers with real-time tracking of transactions, active loans, and installment schedules.',
      },
      {
        text: 'Designed a **normalized PostgreSQL schema using triggers, computed columns, and stored procedures** for atomic loan closure, enforcing balance and installment consistency at the database layer instead of in application code.',
      },
      {
        text: "Built customer management with complete transaction history, giving operators a **single source of truth** for each customer's payments, dues, and loan lifecycle.",
      },
      {
        text: 'Shipped **real-time analytics dashboards** showing fund performance, outstanding dues, and collection status, so operators can spot overdue accounts immediately.',
      },
    ],
    stack: ['React Native', 'NestJS', 'Supabase', 'PostgreSQL', 'Redis'],
    hidden: true,
  },
  {
    id: 'nbase2',
    company: 'nBase2 Systems',
    title: 'Software Development Engineer',
    start: '2024-09',
    end: '2026-04',
    domain: 'embedded',
    summary: 'Real-time Bluetooth audio on DSPs, and the links and tools around it.',
    bullets: [
      {
        text: 'Developed **Bluetooth audio algorithms** (equalizer, stereo widening, anti-aliasing filters) in **C on Cadence HiFi DSPs**, using the HiFi instruction set to meet real-time processing constraints on embedded platforms.',
        chain: ['dsp'],
      },
      {
        text: 'Developed an **Angular-based DSP tuning application** for configuring and tuning TI audio DSPs, giving engineers a UI for in-system audio tuning instead of low-level register work.',
        chain: ['tool'],
      },
      {
        text: 'Implemented communication layers over **I2C, I2S, luna-send (webOS), and Windows drivers**, enabling reliable connectivity between embedded audio hardware and host/consumer devices.',
        chain: ['link', 'out'],
      },
      {
        text: 'Drove **system-level integration** for end-to-end audio solutions, including I2C command sequencing and binary configuration file handling.',
        chain: ['config'],
      },
    ],
    stack: ['C', 'Cadence HiFi DSP', 'TI audio DSPs', 'I2C', 'I2S', 'luna-send (webOS)', 'Windows drivers', 'Angular', 'TypeScript'],
  },
  {
    id: 'bosch',
    company: 'Bosch Global Software Technologies',
    title: 'Student Trainee',
    start: '2024-02',
    end: '2024-06',
    domain: 'tooling',
    summary: 'Workflow automation for an ECU software team.',
    bullets: [
      {
        text: 'Designed and developed a **Python automation tool** (Flask, React.js, external API integrations) to automate internal checks in the embedded software development workflow for **diesel engine air-system ECU software**, cutting manual review effort for the team.',
      },
      {
        text: "Deployed the tool into the team's workspace environment, integrating it with existing development systems, and built a **GitLab CI/CD pipeline** for automated testing, deployment, and versioned releases.",
      },
      {
        text: 'Wrote **unit and integration tests** to validate the tool before production rollout, so its check results could be trusted within the embedded software release process.',
      },
    ],
    stack: ['Python', 'Flask', 'React', 'GitLab CI/CD'],
  },
];

export const visibleExperience = experience.filter((r) => !r.hidden);

export const domainLabel: Record<Domain, string> = {
  embedded: 'Embedded',
  product: 'Product',
  tooling: 'Tooling',
};
