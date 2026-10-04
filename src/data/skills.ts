// Embedded first. Only tools that appear in both résumés' skills or shared experience.
export const toolbox = [
  {
    group: 'Embedded',
    note: 'Daily drivers on audio hardware',
    items: ['C', 'Cadence Tensilica HiFi DSP', 'TI audio DSPs', 'I2C', 'I2S', 'luna-send (webOS)', 'Windows drivers', 'Python'],
  },
  {
    group: 'Software',
    note: 'Tools and products around it',
    items: ['TypeScript', 'Angular', 'React', 'React Native', 'NestJS', 'Flask', 'PostgreSQL', 'Supabase', 'Redis'],
  },
  {
    group: 'Workflow',
    note: 'How work gets shipped',
    items: ['Git', 'GitLab CI/CD', 'Jira', 'Unit & integration testing'],
  },
] as const;

export const interests = ['Computer Architecture'];
