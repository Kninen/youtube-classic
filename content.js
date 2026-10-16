(() => {
  const storage =
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.local
      ? chrome.storage.local
      : null;

  const state = {
    disableCommenting: true,
    hideShorts: true,
    hideGames: true,
  };

  let scheduled = 0;
  const observer = new MutationObserver(schedule);

  function onWatch() {
    return location.pathname === "/watch";
  }

  function onHome() {
    return location.pathname === "/";
  }

  function schedule() {
    clearTimeout(scheduled);
    scheduled = setTimeout(apply, 50);
  }

  function watchMutations() {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function rememberHome(node) {
    if (node.__ytcHome && node.__ytcHome.isConnected) return;
    if (!node.parentNode) return;
    const marker = document.createComment("ytc");
    node.parentNode.insertBefore(marker, node);
    node.__ytcHome = marker;
  }

  function sendHome(node) {
    const marker = node.__ytcHome;
    if (!marker || !marker.isConnected || !marker.parentNode) return false;
    marker.parentNode.insertBefore(node, marker);
    marker.remove();
    node.__ytcHome = null;
    return true;
  }

  function findRelated(flexy) {
    return [...flexy.querySelectorAll("#related")].find((el) =>
      el.querySelector("ytd-watch-next-secondary-results-renderer")
    );
  }

  function findPanel(flexy) {
    return flexy.querySelector(
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-comments-section"]'
    );
  }

  function playlistIsOpen(playlist) {
    if (!playlist) return false;
    if (playlist.hasAttribute("hidden") || playlist.hidden) return false;
    return getComputedStyle(playlist).display !== "none";
  }

  function placeRelated(flexy, twoCol) {
    const related = findRelated(flexy);
    const below = flexy.querySelector("#below");
    const inner = flexy.querySelector("#secondary-inner");
    if (!related || !below) return;

    if (!twoCol || !inner) {
      if (!below.contains(related) && !sendHome(related)) below.appendChild(related);
      related.classList.remove("ytc-in-sidebar");
      return;
    }

    if (!inner.contains(related)) rememberHome(related);

    const playlist = inner.querySelector(":scope > #playlist");
    if (playlistIsOpen(playlist)) {
      if (related.previousElementSibling !== playlist) playlist.after(related);
    } else if (inner.firstElementChild !== related) {
      inner.prepend(related);
    }
    related.classList.add("ytc-in-sidebar");
  }

  function ensureHeading(comments) {
    const nativeCount = comments.querySelector("#count yt-formatted-string");
    const nativeText = nativeCount
      ? nativeCount.textContent.replace(/\s+/g, " ").trim()
      : "";
    const titleWrap = comments.querySelector("ytd-comments-header-renderer #title");
    const titleVisible =
      titleWrap && getComputedStyle(titleWrap).display !== "none" && nativeText;

    const panelTitle = document.querySelector(
      '[target-id="engagement-panel-comments-section"] #title-text'
    );
    const panelCount = document.querySelector(
      '[target-id="engagement-panel-comments-section"] #contextual-info'
    );
    const panelLabel = [panelTitle, panelCount]
      .map((el) => (el ? el.textContent.trim() : ""))
      .filter(Boolean)
      .join(" · ");
    const label = nativeText || panelLabel;

    let heading = comments.querySelector(":scope > .ytc-comments-heading");
    if (!label || titleVisible) {
      if (heading) heading.remove();
      return;
    }
    if (!heading) {
      heading = document.createElement("div");
      heading.className = "ytc-comments-heading";
      heading.setAttribute("role", "heading");
      heading.setAttribute("aria-level", "2");
      comments.prepend(heading);
    }
    if (heading.textContent !== label) heading.textContent = label;
  }

  function ensureLock(comments) {
    let label = comments.querySelector(":scope > .ytc-comment-lock");
    if (!label) {
      label = document.createElement("label");
      label.className = "ytc-comment-lock";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.className = "ytc-disable-commenting";
      input.checked = state.disableCommenting;

      const text = document.createElement("span");
      text.textContent = "Disable commenting";

      label.append(input, text);
      label.addEventListener("click", (event) => event.stopPropagation());
      input.addEventListener("change", () => {
        state.disableCommenting = input.checked;
        document.documentElement.classList.toggle(
          "ytc-no-comment",
          state.disableCommenting
        );
        if (storage) storage.set({ disableCommenting: state.disableCommenting });
      });

      const heading = comments.querySelector(":scope > .ytc-comments-heading");
      if (heading) heading.after(label);
      else comments.prepend(label);
    } else {
      const input = label.querySelector("input");
      if (input && input.checked !== state.disableCommenting) {
        input.checked = state.disableCommenting;
      }
    }
  }

  function placeComments(flexy) {
    const below = flexy.querySelector("#below");
    if (!below) return false;

    const panel = findPanel(flexy);
    const panelComments = panel ? panel.querySelector("ytd-comments") : null;
    const moved = flexy.querySelector("ytd-comments.ytc-under-video");
    const shell = below.querySelector("ytd-comments#comments");
    const active = panelComments || moved || shell;
    if (!active) return false;

    if (!below.contains(active)) {
      rememberHome(active);
      below.appendChild(active);
    }

    active.classList.add("ytc-under-video");
    const section = active.querySelector("ytd-item-section-renderer");
    if (section && section.hasAttribute("static-comments-header")) {
      section.removeAttribute("static-comments-header");
    }

    if (shell && active !== shell) {
      shell.classList.add("ytc-hidden-shell");
      shell.classList.remove("ytc-under-video");
      shell.querySelector(":scope > .ytc-comment-lock")?.remove();
      shell.querySelector(":scope > .ytc-comments-heading")?.remove();
    }

    ensureHeading(active);
    ensureLock(active);

    return !!(panel && below.contains(active) && active !== shell);
  }

  function apply() {
    observer.disconnect();
    try {
      const watching = onWatch();
      const root = document.documentElement;
      root.classList.toggle("ytc-on-watch", watching);
      root.classList.toggle("ytc-no-comment", state.disableCommenting);
      root.classList.toggle("ytc-home", onHome());
      root.classList.toggle("ytc-hide-shorts", state.hideShorts);
      root.classList.toggle("ytc-hide-games", state.hideGames);
      if (!watching) {
        document.documentElement.classList.remove("ytc-two-col", "ytc-hide-comments-panel");
        return;
      }

      const flexy = document.querySelector("ytd-watch-flexy");
      if (!flexy) return;

      const twoCol = flexy.hasAttribute("is-two-columns_");
      document.documentElement.classList.toggle("ytc-two-col", twoCol);
      const hidePanel = placeComments(flexy);
      document.documentElement.classList.toggle("ytc-hide-comments-panel", hidePanel);
      placeRelated(flexy, twoCol);
    } finally {
      watchMutations();
    }
  }

  document.documentElement.classList.toggle("ytc-no-comment", state.disableCommenting);
  document.documentElement.classList.toggle("ytc-hide-shorts", state.hideShorts);
  document.documentElement.classList.toggle("ytc-hide-games", state.hideGames);

  if (storage) {
    storage.get(
      { disableCommenting: true, hideShorts: true, hideGames: true },
      (data) => {
        state.disableCommenting = !!data.disableCommenting;
        state.hideShorts = !!data.hideShorts;
        state.hideGames = !!data.hideGames;
        schedule();
      }
    );
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      let changed = false;
      if (changes.disableCommenting) {
        state.disableCommenting = !!changes.disableCommenting.newValue;
        changed = true;
        const input = document.querySelector(
          "ytd-comments.ytc-under-video .ytc-comment-lock input"
        );
        if (input) input.checked = state.disableCommenting;
      }
      if (changes.hideShorts) {
        state.hideShorts = !!changes.hideShorts.newValue;
        changed = true;
      }
      if (changes.hideGames) {
        state.hideGames = !!changes.hideGames.newValue;
        changed = true;
      }
      if (changed) schedule();
    });
  }

  document.addEventListener("yt-navigate-finish", schedule);
  document.addEventListener("yt-navigate-start", schedule);
  window.addEventListener("resize", schedule);
  schedule();
})();
