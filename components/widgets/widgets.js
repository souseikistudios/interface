/**
 * @param {HTMLElement} root — .widgets
 */
function initWidgets(root) {
  const menu = root.querySelector(".widgets__menu");
  const menuItems = Array.from(menu.querySelectorAll("[data-set-size]"));

  const SNAP_THRESHOLD = 16;
  const SNAP_GAP = 24;
  const CANVAS_PAD = 24;

  const SIZES = {
    small:  { w: 180, h: 180 },
    medium: { w: 360, h: 180 },
    large:  { w: 360, h: 360 },
    xl:     { w: 360, h: 540 }
  };

  const SIZE_LABELS = {
    small:  "S \u00b7 180\u00d7180",
    medium: "M \u00b7 360\u00d7180",
    large:  "L \u00b7 360\u00d7360",
    xl:     "XL \u00b7 360\u00d7540"
  };

  /* ── State ── */

  let dragCard = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let cardStartX = 0;
  let cardStartY = 0;
  let rawX = 0;
  let rawY = 0;
  let lastSnap = { x: null, y: null };
  let menuTarget = null;
  let snapTimer = 0;

  function getCards() {
    return Array.from(root.querySelectorAll(".widgets__card"));
  }

  function cardRect(card) {
    var s = SIZES[card.dataset.size] || SIZES.small;
    return {
      x: parseFloat(card.style.left) || 0,
      y: parseFloat(card.style.top) || 0,
      w: s.w,
      h: s.h
    };
  }

  function clampToBounds(x, y, card) {
    var s = SIZES[card.dataset.size] || SIZES.small;
    var maxX = root.offsetWidth - s.w - CANVAS_PAD;
    var maxY = root.offsetHeight - s.h - CANVAS_PAD;
    return {
      x: Math.max(CANVAS_PAD, Math.min(x, maxX)),
      y: Math.max(CANVAS_PAD, Math.min(y, maxY))
    };
  }

  /* ── Collision resolution ──
     Prevents overlap by enforcing SNAP_GAP between all widgets.
     Bounds-aware: tries each push direction in order of smallest displacement,
     preferring directions that keep the widget inside the canvas. */

  function resolveCollisions(card, x, y) {
    var sz = SIZES[card.dataset.size] || SIZES.small;
    var w = sz.w, h = sz.h;
    var cards = getCards();
    var minB = CANVAS_PAD;
    var maxX = root.offsetWidth - w - CANVAS_PAD;
    var maxY = root.offsetHeight - h - CANVAS_PAD;

    for (var pass = 0; pass < 5; pass++) {
      var pushed = false;
      for (var i = 0; i < cards.length; i++) {
        var other = cards[i];
        if (other === card) continue;
        var r = cardRect(other);

        var pushR = (r.x + r.w + SNAP_GAP) - x;
        var pushL = (x + w) - (r.x - SNAP_GAP);
        var pushD = (r.y + r.h + SNAP_GAP) - y;
        var pushU = (y + h) - (r.y - SNAP_GAP);

        if (pushR <= 0 || pushL <= 0 || pushD <= 0 || pushU <= 0) continue;

        var opts = [
          { nx: r.x + r.w + SNAP_GAP, ny: y, d: pushR },
          { nx: r.x - SNAP_GAP - w,   ny: y, d: pushL },
          { nx: x, ny: r.y + r.h + SNAP_GAP, d: pushD },
          { nx: x, ny: r.y - SNAP_GAP - h,   d: pushU }
        ];
        opts.sort(function (a, b) { return a.d - b.d; });

        var applied = false;
        for (var o = 0; o < opts.length; o++) {
          var p = opts[o];
          if (p.nx >= minB && p.nx <= maxX && p.ny >= minB && p.ny <= maxY) {
            x = p.nx; y = p.ny;
            applied = true;
            break;
          }
        }

        if (!applied) {
          x = Math.max(minB, Math.min(opts[0].nx, maxX));
          y = Math.max(minB, Math.min(opts[0].ny, maxY));
        }

        pushed = true;
      }
      if (!pushed) break;
    }

    return { x: x, y: y };
  }

  /* ── Snap detection ──
     Two layers:
     1. Gap-adjacency — snaps edges to maintain SNAP_GAP spacing.
     2. Edge alignment — aligns tops, bottoms, lefts, rights across
        the full canvas regardless of distance (macOS-style). */

  function findSnaps(card, rx, ry) {
    var cards = getCards();
    var sz = SIZES[card.dataset.size] || SIZES.small;
    var w = sz.w, h = sz.h;

    var dL = rx, dR = rx + w, dT = ry, dB = ry + h;

    var bestX = null, bestDx = SNAP_THRESHOLD + 1;
    var bestY = null, bestDy = SNAP_THRESHOLD + 1;

    for (var i = 0; i < cards.length; i++) {
      var other = cards[i];
      if (other === card) continue;
      var r = cardRect(other);
      var sL = r.x, sR = r.x + r.w, sT = r.y, sB = r.y + r.h;

      /* Gap-adjacency */
      var xp = [
        [dL, sR + SNAP_GAP, sR + SNAP_GAP    ],
        [dR, sL - SNAP_GAP, sL - SNAP_GAP - w]
      ];
      for (var j = 0; j < xp.length; j++) {
        var dist = Math.abs(xp[j][0] - xp[j][1]);
        if (dist < bestDx) { bestDx = dist; bestX = xp[j][2]; }
      }

      var yp = [
        [dT, sB + SNAP_GAP, sB + SNAP_GAP    ],
        [dB, sT - SNAP_GAP, sT - SNAP_GAP - h]
      ];
      for (var k = 0; k < yp.length; k++) {
        var distY = Math.abs(yp[k][0] - yp[k][1]);
        if (distY < bestDy) { bestDy = distY; bestY = yp[k][2]; }
      }

      /* Edge + center alignment (global — works at any distance) */
      var sCx = r.x + r.w / 2, sCy = r.y + r.h / 2;
      var dCx = rx + w / 2, dCy = ry + h / 2;

      var ya = [
        [dT,  sT,  sT        ],
        [dB,  sB,  sB - h    ],
        [dCy, sCy, sCy - h/2 ]
      ];
      for (var a = 0; a < ya.length; a++) {
        var da = Math.abs(ya[a][0] - ya[a][1]);
        if (da < bestDy) { bestDy = da; bestY = ya[a][2]; }
      }

      var xa = [
        [dL,  sL,  sL        ],
        [dR,  sR,  sR - w    ],
        [dCx, sCx, sCx - w/2 ]
      ];
      for (var b = 0; b < xa.length; b++) {
        var db = Math.abs(xa[b][0] - xa[b][1]);
        if (db < bestDx) { bestDx = db; bestX = xa[b][2]; }
      }
    }

    return {
      x: bestDx <= SNAP_THRESHOLD ? bestX : null,
      y: bestDy <= SNAP_THRESHOLD ? bestY : null
    };
  }

  /* ── Drag ── */

  function onPointerDown(e) {
    if (e.button !== 0) return;
    var card = e.target.closest(".widgets__card");
    if (!card || !root.contains(card)) return;
    if (menu.getAttribute("aria-hidden") === "false") return;

    e.preventDefault();
    dragCard = card;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    card.classList.remove("widgets__card--snapping");
    clearTimeout(snapTimer);

    var cs = getComputedStyle(card);
    cardStartX = parseFloat(cs.left) || 0;
    cardStartY = parseFloat(cs.top) || 0;
    card.style.left = cardStartX + "px";
    card.style.top = cardStartY + "px";

    card.classList.add("widgets__card--dragging");

    var cards = getCards();
    var maxZ = 0;
    for (var i = 0; i < cards.length; i++) {
      var z = parseInt(cards[i].style.zIndex) || 0;
      if (z > maxZ) maxZ = z;
    }
    card.style.zIndex = maxZ + 1;

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }

  function onPointerMove(e) {
    if (!dragCard) return;

    var bounded = clampToBounds(
      cardStartX + (e.clientX - dragStartX),
      cardStartY + (e.clientY - dragStartY),
      dragCard
    );
    rawX = bounded.x;
    rawY = bounded.y;

    if (e.shiftKey) {
      var free = resolveCollisions(dragCard, rawX, rawY);
      dragCard.style.left = free.x + "px";
      dragCard.style.top = free.y + "px";
      lastSnap = { x: null, y: null };
      return;
    }

    lastSnap = findSnaps(dragCard, rawX, rawY);

    var fx = lastSnap.x !== null ? lastSnap.x : rawX;
    var fy = lastSnap.y !== null ? lastSnap.y : rawY;

    var resolved = resolveCollisions(dragCard, fx, fy);

    dragCard.style.left = resolved.x + "px";
    dragCard.style.top  = resolved.y + "px";
  }

  function onPointerUp() {
    if (!dragCard) return;

    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);

    dragCard.classList.remove("widgets__card--dragging");

    var fx = lastSnap.x !== null ? lastSnap.x : rawX;
    var fy = lastSnap.y !== null ? lastSnap.y : rawY;
    var resolved = resolveCollisions(dragCard, fx, fy);
    dragCard.style.left = resolved.x + "px";
    dragCard.style.top = resolved.y + "px";

    dragCard = null;
    lastSnap = { x: null, y: null };
  }

  root.addEventListener("pointerdown", onPointerDown);

  /* ── Context menu ── */

  function openMenu(card, clientX, clientY) {
    menuTarget = card;

    var current = card.dataset.size;
    for (var i = 0; i < menuItems.length; i++) {
      menuItems[i].classList.toggle(
        "widgets__menu-item--active",
        menuItems[i].dataset.setSize === current
      );
    }

    menu.setAttribute("aria-hidden", "false");

    requestAnimationFrame(function () {
      var mw = menu.offsetWidth;
      var mh = menu.offsetHeight;
      var pad = 8;
      var x = clientX;
      var y = clientY;
      if (x + mw + pad > window.innerWidth)  x = Math.max(pad, window.innerWidth - mw - pad);
      if (y + mh + pad > window.innerHeight) y = Math.max(pad, window.innerHeight - mh - pad);
      menu.style.left = x + "px";
      menu.style.top = y + "px";
    });
  }

  function closeMenu() {
    menu.setAttribute("aria-hidden", "true");
    menuTarget = null;
  }

  root.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    var card = e.target.closest(".widgets__card");
    if (!card) { closeMenu(); return; }
    openMenu(card, e.clientX, e.clientY);
  });

  for (var m = 0; m < menuItems.length; m++) {
    (function (item) {
      item.addEventListener("click", function () {
        if (!menuTarget) return;
        var newSize = item.dataset.setSize;
        menuTarget.classList.add("widgets__card--resizing");
        menuTarget.dataset.size = newSize;
        var label = menuTarget.querySelector(".widgets__card-label");
        if (label) label.textContent = SIZE_LABELS[newSize] || newSize;
        var target = menuTarget;
        setTimeout(function () { target.classList.remove("widgets__card--resizing"); }, 450);
        closeMenu();
      });
    })(menuItems[m]);
  }

  document.addEventListener("click", function (e) {
    if (menu.getAttribute("aria-hidden") === "true") return;
    if (menu.contains(e.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", function (e) {
    if (menu.getAttribute("aria-hidden") === "true") return;
    if (e.key === "Escape") { e.preventDefault(); closeMenu(); }
  });

  menu.addEventListener("keydown", function (e) {
    if (menu.getAttribute("aria-hidden") === "true") return;
    var idx = menuItems.indexOf(document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      menuItems[idx < 0 ? 0 : Math.min(menuItems.length - 1, idx + 1)].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      menuItems[idx < 0 ? menuItems.length - 1 : Math.max(0, idx - 1)].focus();
    }
  });

  closeMenu();
}

/* ── Init ── */

function initAllWidgets() {
  document.querySelectorAll(".widgets").forEach(initWidgets);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAllWidgets);
} else {
  initAllWidgets();
}
