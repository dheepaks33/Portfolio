// Page sections, addressed like a register map. Drives the side rail and headings.
export const sections = [
  { id: 'intro', addr: '0x00', label: 'Intro' },
  { id: 'signal-chain', addr: '0x01', label: 'Signal chain' },
  { id: 'experience', addr: '0x02', label: 'Experience' },
  { id: 'toolbox', addr: '0x03', label: 'Toolbox' },
  { id: 'projects', addr: '0x04', label: 'Projects' },
  { id: 'activity', addr: '0x05', label: 'Activity' },
  { id: 'background', addr: '0x06', label: 'Background' },
  { id: 'contact', addr: '0x07', label: 'Contact' },
] as const;

export type SectionId = (typeof sections)[number]['id'];

export const section = (id: SectionId) => sections.find((s) => s.id === id)!;
