// The toolbox, drawn as an SoC block diagram (src/components/Toolbox.astro).
// Only tools that appear in both résumés' skills or shared experience.

export interface Block {
  name: string;
  items: string[];
}

export const soc: { lane: 'embedded' | 'software'; label: string; blocks: Block[] }[] = [
  {
    lane: 'embedded',
    label: 'Embedded',
    blocks: [
      { name: 'DSP core', items: ['C', 'Cadence Tensilica HiFi DSP', 'TI audio DSPs'] },
      { name: 'Peripherals', items: ['I2C', 'I2S'] },
      { name: 'Host link', items: ['luna-send (webOS)', 'Windows drivers'] },
    ],
  },
  {
    lane: 'software',
    label: 'Software',
    blocks: [
      { name: 'Application', items: ['TypeScript', 'Angular', 'React', 'React Native', 'NestJS', 'Flask'] },
      { name: 'Data', items: ['PostgreSQL', 'Supabase', 'Redis'] },
      { name: 'Toolchain', items: ['Python', 'Git', 'GitLab CI/CD', 'Jira', 'Unit & integration testing'] },
    ],
  },
];

export const interests = ['Computer Architecture'];
