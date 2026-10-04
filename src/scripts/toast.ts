// A single status toast (the [data-toast] element in index.astro), plus clipboard copy.

let timer = 0;

export function showToast(message: string) {
  const el = document.querySelector<HTMLElement>('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-visible');
  window.clearTimeout(timer);
  timer = window.setTimeout(() => el.classList.remove('is-visible'), 2400);
}

export async function copyText(text: string, label = text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`Copied ${label}`);
  } catch {
    showToast(`Couldn't copy. It's ${text}`);
  }
}
