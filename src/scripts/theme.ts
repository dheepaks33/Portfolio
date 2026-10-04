// Light/dark switching, shared by the header toggle and the command palette.

const root = document.documentElement;
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

export const currentTheme = (): 'light' | 'dark' =>
  root.dataset.theme === 'dark' || root.dataset.theme === 'light'
    ? root.dataset.theme
    : prefersDark.matches
      ? 'dark'
      : 'light';

/** Flip the theme. With View Transitions, the new theme grows out of `origin` as a circle. */
export function toggleTheme(origin?: { x: number; y: number }) {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  const apply = () => {
    root.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {}
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduceMotion) {
    apply();
    return;
  }

  const x = origin?.x ?? window.innerWidth - 48;
  const y = origin?.y ?? 28;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const transition = document.startViewTransition(apply);
  transition.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 560, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    })
    .catch(() => {});
}
