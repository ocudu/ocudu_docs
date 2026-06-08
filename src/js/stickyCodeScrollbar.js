// SPDX-FileCopyrightText: Copyright (C) 2021-2026 Software Radio Systems Limited
// SPDX-License-Identifier: BSD-3-Clause-Open-MPI

// Injects a fixed-position horizontal scrollbar that stays pinned to the
// bottom of the viewport whenever a tall code block extends below the fold.

const attached = new Map();

function attach(pre) {
  if (attached.has(pre)) return;

  const el = document.createElement('div');
  el.className = 'sticky-code-scrollbar';
  el.setAttribute('aria-hidden', 'true');

  const inner = document.createElement('div');
  inner.style.cssText = 'height:1px;';
  el.appendChild(inner);
  document.body.appendChild(el);

  attached.set(pre, { el, inner });

  let busy = false;
  el.addEventListener('scroll', () => {
    if (busy) return;
    busy = true;
    pre.scrollLeft = el.scrollLeft;
    busy = false;
  });
  pre.addEventListener('scroll', () => {
    if (busy) return;
    busy = true;
    el.scrollLeft = pre.scrollLeft;
    busy = false;
  });
}

function update() {
  attached.forEach(({ el, inner }, pre) => {
    if (!document.body.contains(pre)) {
      el.classList.remove('is-visible');
      return;
    }

    const rect = pre.getBoundingClientRect();
    const overflows = pre.scrollWidth > pre.clientWidth;
    const show =
      overflows &&
      rect.top < window.innerHeight &&
      rect.bottom > window.innerHeight;

    if (show) {
      el.style.left = rect.left + 'px';
      el.style.width = rect.width + 'px';
      inner.style.width = pre.scrollWidth + 'px';
      el.scrollLeft = pre.scrollLeft;
      el.classList.add('is-visible');
    } else {
      el.classList.remove('is-visible');
    }
  });
}

function scanAndAttach() {
  document.querySelectorAll('pre[class*="language-"]').forEach(attach);
  update();
}

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(update), {
    passive: true,
  });

  new MutationObserver((mutations) => {
    let found = false;
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (
          node.matches('pre[class*="language-"]') ||
          node.querySelector('pre[class*="language-"]')
        ) {
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) requestAnimationFrame(scanAndAttach);
  }).observe(document.body, { childList: true, subtree: true });

  setTimeout(scanAndAttach, 0);
}

export function onRouteDidUpdate() {
  setTimeout(scanAndAttach, 100);
}
