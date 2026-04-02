/**
 * @param {HTMLElement} root — element with .tabs (role="tablist")
 */
function initTabs(root) {
  const indicator = root.querySelector(".tabs__indicator");
  const tabs = Array.from(root.querySelectorAll(".tabs__tab"));
  if (!indicator || tabs.length === 0) return;

  const panels = {};
  tabs.forEach((tab) => {
    const id = tab.id;
    const panelId = tab.getAttribute("aria-controls");
    if (id && panelId) {
      panels[id] = document.getElementById(panelId);
    }
  });

  function placeIndicator(tab) {
    const rootRect = root.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    indicator.style.left = `${tabRect.left - rootRect.left}px`;
    indicator.style.top = `${tabRect.top - rootRect.top}px`;
    indicator.style.width = `${tabRect.width}px`;
    indicator.style.height = `${tabRect.height}px`;
  }

  function activate(tab) {
    const id = tab.id;
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    Object.entries(panels).forEach(([tid, el]) => {
      if (!el) return;
      el.hidden = tid !== id;
    });
    placeIndicator(tab);
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activate(tab));
  });

  root.addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    let next = i;
    if (e.key === "ArrowRight") next = Math.min(tabs.length - 1, i + 1);
    else if (e.key === "ArrowLeft") next = Math.max(0, i - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    tabs[next].focus();
    activate(tabs[next]);
  });

  const ro = new ResizeObserver(() => {
    const current = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    if (current) placeIndicator(current);
  });
  ro.observe(root);

  const firstSelected = tabs.find((t) => t.getAttribute("aria-selected") === "true");
  activate(firstSelected || tabs[0]);
}

function initAllTabs() {
  document.querySelectorAll(".tabs").forEach(initTabs);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAllTabs);
} else {
  initAllTabs();
}
