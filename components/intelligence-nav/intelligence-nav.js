function initChatsPanelAria(root) {
  const frame = root.querySelector(".intelligence-nav__frame");
  const chats = root.querySelector(".intelligence-nav__item--chats");
  const panel = root.querySelector(".intelligence-nav__chats-panel");
  if (!frame || !chats || !panel) return;

  function setExpanded(on) {
    chats.setAttribute("aria-expanded", on ? "true" : "false");
  }

  chats.addEventListener("mouseenter", () => setExpanded(true));
  panel.addEventListener("mouseenter", () => setExpanded(true));

  chats.addEventListener("mouseleave", (e) => {
    const next = e.relatedTarget;
    if (next instanceof Node && panel.contains(next)) return;
    setExpanded(false);
  });

  panel.addEventListener("mouseleave", (e) => {
    const next = e.relatedTarget;
    if (next instanceof Node && chats.contains(next)) return;
    if (next instanceof Node && panel.contains(next)) return;
    setExpanded(false);
  });

  frame.addEventListener("mouseleave", (e) => {
    const next = e.relatedTarget;
    if (next instanceof Node && frame.contains(next)) return;
    setExpanded(false);
  });
}

/**
 * @param {HTMLElement} root — .intelligence-nav
 */
function initIntelligenceNav(root) {
  initChatsPanelAria(root);

  const items = Array.from(root.querySelectorAll(".intelligence-nav__item"));
  if (items.length === 0) return;

  function setActive(el) {
    items.forEach((btn) => {
      const on = btn === el;
      if (on) {
        btn.setAttribute("aria-current", "true");
        btn.tabIndex = 0;
      } else {
        btn.removeAttribute("aria-current");
        btn.tabIndex = -1;
      }
    });
  }

  items.forEach((btn) => {
    btn.addEventListener("click", () => setActive(btn));
  });

  root.addEventListener("keydown", (e) => {
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      next = Math.min(items.length - 1, i + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      next = Math.max(0, i - 1);
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = items.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    items[next].focus();
    setActive(items[next]);
  });

  const initial = items.find((b) => b.getAttribute("aria-current") === "true");
  if (initial) {
    setActive(initial);
  } else {
    items.forEach((btn, i) => {
      btn.removeAttribute("aria-current");
      btn.tabIndex = i === 0 ? 0 : -1;
    });
  }
}

function initAllIntelligenceNavs() {
  document.querySelectorAll(".intelligence-nav").forEach(initIntelligenceNav);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAllIntelligenceNavs);
} else {
  initAllIntelligenceNavs();
}

console.info("[intelligence-nav] 131103:172229 · frame radius fixed · tray rows lift 6px / 25ms stagger");
