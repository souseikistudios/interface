(function () {
  var root = document.getElementById("loaders-root");
  var range = document.getElementById("loaders-range");
  var speedValue = document.getElementById("loaders-speed-value");
  var unitMs = document.getElementById("loaders-unit-ms");
  var unitS = document.getElementById("loaders-unit-s");
  var download = document.getElementById("loaders-download");
  var unit = document.getElementById("loaders-unit");

  var unitMode = "s";
  var speed = 1.4;
  var dragStartX = null;
  var moved = false;
  var unitRect = null;

  function formatSpeed() {
    return unitMode === "ms"
      ? Math.round(speed * 1000) + "ms"
      : speed.toFixed(1) + "s";
  }

  function applySpeed() {
    root.style.setProperty("--loaders-speed", speed + "s");
    speedValue.textContent = formatSpeed();
    unitMs.classList.toggle("loaders__unit-btn--active", unitMode === "ms");
    unitS.classList.toggle("loaders__unit-btn--active", unitMode === "s");
  }

  range.addEventListener("input", function () {
    speed = parseFloat(range.value);
    applySpeed();
  });

  unit.addEventListener("pointerdown", function (event) {
    unit.setPointerCapture(event.pointerId);
    unitRect = unit.getBoundingClientRect();
    dragStartX = event.clientX;
    moved = false;
  });

  unit.addEventListener("pointermove", function (event) {
    if (dragStartX == null) return;
    if (Math.abs(event.clientX - dragStartX) > 3) {
      moved = true;
      unitMode = event.clientX - unitRect.left < unitRect.width / 2 ? "ms" : "s";
      applySpeed();
    }
  });

  unit.addEventListener("pointerup", function (event) {
    if (dragStartX == null) return;
    if (!moved) {
      unitMode = event.clientX - unitRect.left < unitRect.width / 2 ? "ms" : "s";
      applySpeed();
    }
    dragStartX = null;
  });

  download.addEventListener("click", function () {
    var duration = speed;
    var jointDuration = +(duration * 1.12).toFixed(4);
    var flow = "cubic-bezier(.66,.2,0,1)";

    function dot(cx, cy, ox, oy, dur, delay, name, ease) {
      return (
        '<g style="transform-box:view-box;transform-origin:' +
        ox +
        "px " +
        oy +
        "px;animation:" +
        name +
        " " +
        dur +
        "s " +
        ease +
        " infinite;animation-delay:" +
        delay +
        's"><circle cx="' +
        cx +
        '" cy="' +
        cy +
        '" r="12" fill="#000000"/></g>'
      );
    }

    function diamond(cxCenter, dur, stag) {
      var positions = [
        [cxCenter, 30],
        [cxCenter + 30, 60],
        [cxCenter, 90],
        [cxCenter - 30, 60],
      ];
      var markup = "";
      for (var i = 0; i < 4; i++) {
        markup += dot(
          positions[i][0],
          positions[i][1],
          cxCenter,
          60,
          dur,
          +(-(i * stag * duration)).toFixed(4),
          "turn",
          flow
        );
      }
      return markup;
    }

    var corners = "";
    [
      [278, 38],
      [322, 38],
      [278, 82],
      [322, 82],
    ].forEach(function (corner) {
      corners +=
        '<circle cx="' +
        corner[0] +
        '" cy="' +
        corner[1] +
        '" r="12" fill="#000000"/>';
    });

    var orbit =
      '<g style="transform-box:view-box;transform-origin:300px 60px;animation:pulse ' +
      duration +
      "s " +
      flow +
      ' infinite"><g style="transform-box:view-box;transform-origin:300px 60px;animation:turn3 ' +
      duration +
      's cubic-bezier(.4,0,.2,1) infinite">' +
      corners +
      "</g></g>";

    var css =
      "@keyframes turn{to{transform:rotate(360deg)}}" +
      "@keyframes turn3{from{transform:rotate(45deg)}to{transform:rotate(405deg)}}" +
      "@keyframes pulse{0%,50%,100%{transform:scale(1)}25%,75%{transform:scale(1.22)}}";

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120" viewBox="0 0 360 120"><style>' +
      css +
      "</style>" +
      diamond(60, duration, 0.064) +
      diamond(180, jointDuration, 0.028) +
      orbit +
      "</svg>";

    var link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    link.download = "loaders.svg";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(link.href);
    }, 1000);
  });

  applySpeed();
})();
