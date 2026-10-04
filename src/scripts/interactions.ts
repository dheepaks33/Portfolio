// Small progressive enhancements. The page reads fine without any of this.

import { isTyping, jumpTo } from './nav';
import { copyText } from './toast';

// Reveal blocks as they scroll into view.
function setupReveal() {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  items.forEach((el) => io.observe(el));
}

// Mark the side-rail entry for the section currently on screen.
function setupRail() {
  const links = new Map(
    [...document.querySelectorAll<HTMLAnchorElement>('[data-rail-link]')].map((a) => [a.dataset.railLink!, a]),
  );
  if (links.size === 0) return;
  const visible = new Set<string>();
  const order = [...links.keys()];
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target.id);
        else visible.delete(e.target.id);
      }
      const active = order.find((id) => visible.has(id));
      if (!active) return;
      links.forEach((a, id) => a.setAttribute('aria-current', String(id === active)));
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  order.forEach((id) => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });
}

// Signal chain <-> experience bullets: hovering either lights the other.
function setupChain() {
  const blocks = [...document.querySelectorAll<HTMLElement>('[data-chain-block]')];
  const bullets = [...document.querySelectorAll<HTMLElement>('[data-chain]')];
  if (blocks.length === 0) return;

  const light = (ids: string[]) => {
    blocks.forEach((b) => b.classList.toggle('is-lit', ids.includes(b.dataset.chainBlock!)));
    bullets.forEach((li) =>
      li.classList.toggle('is-lit', (li.dataset.chain ?? '').split(' ').some((id) => ids.includes(id))),
    );
  };
  const clear = () => light([]);

  for (const b of blocks) {
    const ids = [b.dataset.chainBlock!];
    b.addEventListener('pointerenter', () => light(ids));
    b.addEventListener('focus', () => light(ids));
    b.addEventListener('pointerleave', clear);
    b.addEventListener('blur', clear);
  }
  for (const li of bullets) {
    const ids = (li.dataset.chain ?? '').split(' ').filter(Boolean);
    li.addEventListener('pointerenter', () => light(ids));
    li.addEventListener('focus', () => light(ids));
    li.addEventListener('pointerleave', clear);
    li.addEventListener('blur', clear);
  }
}

// One shared tooltip for chart marks carrying data-tip (meters, heatmap cells).
function setupTooltips() {
  const targets = document.querySelectorAll<HTMLElement | SVGElement>('[data-tip]');
  if (targets.length === 0) return;

  const tip = document.createElement('div');
  tip.className = 'chart-tip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.append(tip);

  const show = (el: Element, x: number, y: number) => {
    tip.textContent = el.getAttribute('data-tip');
    tip.hidden = false;
    const { width, height } = tip.getBoundingClientRect();
    const left = Math.min(Math.max(8, x - width / 2), window.innerWidth - width - 8);
    const top = y - height - 12 < 8 ? y + 16 : y - height - 12;
    tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  };
  const hide = () => (tip.hidden = true);

  targets.forEach((el) => {
    el.addEventListener('pointermove', (e) => show(el, (e as PointerEvent).clientX, (e as PointerEvent).clientY));
    el.addEventListener('pointerleave', hide);
    el.addEventListener('focus', () => {
      const r = el.getBoundingClientRect();
      show(el, r.left + r.width / 2, r.top);
    });
    el.addEventListener('blur', hide);
  });
  window.addEventListener('scroll', hide, { passive: true });
}

// Numbers count up the first time they scroll into view. Elements already on
// screen at load keep their value; the static HTML always has the real number.
function setupCountUp() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  const format = (template: string, raw: string, value: number, decimals: number) => {
    const text = raw.includes(',')
      ? value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : value.toFixed(decimals);
    return template.replace(raw, text);
  };

  const animate = (el: HTMLElement, final: string, raw: string, target: number, decimals: number) => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      const eased = 1 - (1 - p) ** 3;
      el.textContent = p < 1 ? format(final, raw, target * eased, decimals) : final;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target as HTMLElement;
        animate(el, el.dataset.countFinal!, el.dataset.countRaw!, Number(el.dataset.countTarget), Number(el.dataset.countDecimals));
      }
    },
    { threshold: 0.6 },
  );

  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const final = el.textContent ?? '';
    const match = final.match(/\d[\d,]*(\.\d+)?/);
    if (!match || el.getBoundingClientRect().top < window.innerHeight) return;
    const raw = match[0];
    const decimals = match[1] ? match[1].length - 1 : 0;
    Object.assign(el.dataset, {
      countFinal: final,
      countRaw: raw,
      countTarget: raw.replace(/,/g, ''),
      countDecimals: String(decimals),
    });
    el.textContent = format(final, raw, 0, decimals);
    io.observe(el);
  });
}

// Keys 0–7 jump to the section at that address.
function setupSectionKeys() {
  const ids = [...document.querySelectorAll<HTMLAnchorElement>('[data-rail-link]')].map((a) => a.dataset.railLink!);
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
    const n = Number(e.key);
    if (e.key.length === 1 && Number.isInteger(n) && ids[n]) {
      e.preventDefault();
      jumpTo(ids[n]);
    }
  });
}

// Reading progress in the header, and a "program counter" in the rail: the
// address of the section you're in plus how far through it you are.
function setupProgress() {
  const bar = document.querySelector<HTMLElement>('[data-progress]');
  const pc = document.querySelector<HTMLElement>('[data-pc]');
  const sections = [...document.querySelectorAll<HTMLElement>('main > section[id]')];
  let queued = false;

  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    if (!pc || !sections.length) return;
    const probe = window.innerHeight * 0.45;
    let index = 0;
    sections.forEach((s, i) => {
      if (s.getBoundingClientRect().top <= probe) index = i;
    });
    const rect = sections[index].getBoundingClientRect();
    const within = Math.min(0.999, Math.max(0, (probe - rect.top) / Math.max(1, rect.height)));
    const address = index * 0x100 + Math.floor(within * 0x100);
    pc.textContent = `0x${address.toString(16).toUpperCase().padStart(4, '0')}`;
  };

  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  update();
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
}

// Copy buttons, e.g. the email address in Contact.
function setupCopy() {
  document.querySelectorAll<HTMLElement>('[data-copy]').forEach((el) =>
    el.addEventListener('click', () => copyText(el.dataset.copy!, el.dataset.copyLabel)),
  );
}

setupReveal();
setupRail();
setupChain();
setupTooltips();
setupCountUp();
setupSectionKeys();
setupProgress();
setupCopy();
