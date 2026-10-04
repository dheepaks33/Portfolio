export const profile = {
  name: 'Dheepak Selvakumar',
  shortName: 'Dheepak',
  role: 'Embedded Software Engineer',
  location: 'Coimbatore, Tamil Nadu, India',
  currently: { title: 'Software Development Engineer', company: 'Notebook', since: '2026-04' },

  // Hero: one sentence of identity, one of proof.
  headline: 'I write software that runs close to the hardware.',
  intro:
    'Embedded software engineer with two years of building real-time Bluetooth audio algorithms in C on Cadence HiFi DSPs, the I2C, I2S and driver layers that connect audio hardware to host devices, and the tuning tools engineers use on top of it all. I own work end to end, so I also ship full products: database schemas, APIs and cross-platform apps.',

  email: 'dheepaks33@gmail.com',
  links: {
    github: 'https://github.com/dheepaks33',
    linkedin: 'https://www.linkedin.com/in/dheepaks33',
    leetcode: 'https://leetcode.com/u/dheepaks33/',
    codechef: 'https://www.codechef.com/users/dheepaks33',
    linktree: 'https://linktr.ee/dheepaks33_coding_profiles',
    certificates: 'https://drive.google.com/drive/folders/14TsVLX3y6vDPqkamdZNvblZj5lZ3_1x8',
  },

  // Paths are relative to the site base (/Portfolio/).
  resumes: [
    { label: 'Résumé — Embedded', file: 'resume/Dheepak_Selvakumar_Embedded.pdf', primary: true },
    { label: 'Full-stack version', file: 'resume/Dheepak_Selvakumar_FullStack.pdf', primary: false },
  ],
} as const;
