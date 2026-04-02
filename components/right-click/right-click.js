/**
 * @param {HTMLElement} root — .right-click
 */
function initRightClick(root) {
  const surface = root.querySelector(".right-click__surface");
  const menu = root.querySelector(".right-click__menu");
  if (!surface || !menu) return;

  const rows = Array.from(menu.querySelectorAll(".right-click__row"));

  function setFocusIndex(i) {
    rows.forEach((r, j) => r.setAttribute("tabindex", j === i ? "0" : "-1"));
    rows[i]?.focus();
  }

  function closeMenu() {
    menu.setAttribute("aria-hidden", "true");
    rows.forEach((r) => r.setAttribute("tabindex", "-1"));
  }

  let lastContextMenuAt = 0;

  function openMenu(clientX, clientY) {
    menu.setAttribute("aria-hidden", "false");

    const pad = 8;
    requestAnimationFrame(() => {
      const mw = menu.offsetWidth;
      const mh = menu.offsetHeight;
      let x = clientX;
      let y = clientY;
      if (x + mw + pad > window.innerWidth) x = Math.max(pad, window.innerWidth - mw - pad);
      if (y + mh + pad > window.innerHeight) y = Math.max(pad, window.innerHeight - mh - pad);
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
    });

    rows.forEach((r, j) => r.setAttribute("tabindex", j === 0 ? "0" : "-1"));
  }

  surface.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    lastContextMenuAt = performance.now();
    openMenu(e.clientX, e.clientY);
  });

  surface.addEventListener("auxclick", (e) => {
    if (e.button !== 2) return;
    e.preventDefault();
    if (performance.now() - lastContextMenuAt < 60) return;
    openMenu(e.clientX, e.clientY);
  });

  document.addEventListener("click", (e) => {
    if (menu.getAttribute("aria-hidden") === "true") return;
    if (menu.contains(e.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (menu.getAttribute("aria-hidden") === "true") return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    }
  });

  menu.addEventListener("keydown", (e) => {
    if (menu.getAttribute("aria-hidden") === "true") return;
    const i = rows.indexOf(document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex(i < 0 ? 0 : Math.min(rows.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex(i < 0 ? rows.length - 1 : Math.max(0, i - 1));
    }
  });

  rows.forEach((row) => {
    row.addEventListener("click", () => {
      closeMenu();
    });
  });

  /* Theme toggle */
  const toggle = root.querySelector("[data-theme-toggle]");
  toggle?.addEventListener("click", () => {
    root.classList.toggle("right-click--dark");
  });

  closeMenu();
}

function initAllRightClick() {
  document.querySelectorAll(".right-click").forEach(initRightClick);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAllRightClick);
} else {
  initAllRightClick();
}
