
"use strict";

/* =========================================================
   SISTAAAAA.EXE
   Birthday universe engine
   Mobile-first, accessible, no audio autoplay
   ========================================================= */

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const byId = id => document.getElementById(id);

  const state = {
    ready: false,
    page: "home",
    history: ["home"],
    historyIndex: 0,
    photos: [],
    tracks: [],
    photoIndex: 0,
    trackIndex: 0,
    butterflies: new Set(),
    achievements: new Set(),
    visited: new Set(),
    wishesShown: new Set(),
    wishBag: [],
    audioAllowed: false,
    audioPlaying: false,
    galleryShuffle: false,
    playerShuffle: false,
    playerRepeat: false,
    activeGame: null,
    gameTimers: [],
    settings: {
      reducedMotion: false,
      starfield: true,
      scanlines: true,
      cursorEffects: true,
      sparkles: true,
      wanderingButterfly: true,
      largeText: false,
      highContrast: false
    }
  };

  const WISHES = [
    "I wish that your days hold more laughter than worry.",
    "I wish that you discover places that make you feel alive.",
    "I wish that the music you love always finds you at the right time.",
    "I wish that good people recognise the goodness in you.",
    "I wish that you have the courage to try things before you feel ready.",
    "I wish that your smallest victories feel worth celebrating.",
    "I wish that you find stories that stay with you long after the last page.",
    "I wish that ordinary afternoons turn into favourite memories.",
    "I wish that you always have something exciting to look forward to.",
    "I wish that your curiosity keeps opening unexpected doors.",
    "I wish that you make room for rest without feeling guilty about it.",
    "I wish that you laugh so hard you forget what started it.",
    "I wish that the next chapter surprises you in wonderful ways.",
    "I wish that you find people who understand your kind of weird.",
    "I wish that your creativity keeps finding new ways to exist.",
    "I wish that you get opportunities that once felt far away.",
    "I wish that your favourite songs never lose their magic.",
    "I wish that you collect moments worth remembering, not just photographs.",
    "I wish that you feel free to change, grow, and become whoever you choose.",
    "I wish that this year gives you beautiful reasons to be excited about tomorrow."
  ];

  const BUTTERFLY_NAMES = [
    "The First Spark",
    "Blue Hour",
    "Little Comet",
    "Hidden Frequency",
    "The Daydream",
    "Midnight Visitor",
    "The Last Little Star"
  ];

  const ACHIEVEMENTS = {
    "first-visit": "Welcome to the universe",
    "gallery-visitor": "Museum explorer",
    "letter-reader": "A letter opened",
    "arcade-explorer": "Arcade visitor",
    "wish-maker": "Wish collector",
    "butterfly-finder": "Butterfly discovered",
    "music-listener": "Music appreciated",
    "universe-explorer": "Universe explorer"
  };

  const PAGE_LABELS = {
    home: "HOME",
    gallery: "GALLERY",
    letter: "LETTER",
    timeline: "FRIENDSHIP FILES",
    arcade: "ARCADE",
    wishes: "WISH GENERATOR",
    secrets: "SECRET ARCHIVE",
    finale: "THE FINALE"
  };

  const arcade = {
    gamesPlayed: 0,
    starsCaught: 0,
    pairsMatched: 0,
    orbitBoards: 0
  };

  const clamp = (number, min, max) =>
    Math.min(max, Math.max(min, number));

  const shuffle = array => {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
  };

  function setText(id, value) {
    const element = byId(id);
    if (element) element.textContent = String(value ?? "");
  }

  function reveal(element) {
    if (!element) return;
    element.hidden = false;
    element.removeAttribute("hidden");
  }

  function conceal(element) {
    if (element) element.hidden = true;
  }

  function announce(message) {
    setText("page-announcer", message);
  }

  function toast(message, type = "info") {
    const region = byId("toast-region");
    const template = byId("toast-template");

    if (!region) {
      console.info("[SISTAAAAA.EXE]", message);
      return;
    }

    let item;

    if (template?.content?.firstElementChild) {
      item = template.content.firstElementChild.cloneNode(true);

      const text = item.querySelector(
        "[data-toast-message], .toast__message, p"
      );

      if (text) text.textContent = message;
      else item.textContent = message;
    } else {
      item = document.createElement("div");
      item.className = "toast";
      item.textContent = message;
    }

    item.dataset.toastType = type;
    item.setAttribute("role", "status");
    region.append(item);

    window.setTimeout(() => {
      item.classList.add("is-leaving");
      window.setTimeout(() => item.remove(), 300);
    }, 3200);
  }

  /* =========================================================
     ACHIEVEMENTS AND PROGRESS
     ========================================================= */

  function unlockAchievement(key) {
    if (!ACHIEVEMENTS[key] || state.achievements.has(key)) return;

    state.achievements.add(key);

    setText(
      "sidebar-achievement-count",
      String(state.achievements.size).padStart(2, "0")
    );

    const status = document.querySelector(
      `[data-achievement-status="${key}"]`
    );

    const entry = document.querySelector(
      `[data-achievement="${key}"]`
    );

    if (status) {
      status.dataset.unlocked = "true";
      status.classList.add("is-unlocked");
    }

    if (entry) {
      entry.classList.add("is-unlocked");
      entry.setAttribute("aria-pressed", "true");
    }

    updateProgress();
    toast(`Achievement unlocked: ${ACHIEVEMENTS[key]} ✦`, "achievement");
  }

  function updateProgress() {
    const butterflies = state.butterflies.size;
    const achievements = state.achievements.size;
    const totalAchievements = Object.keys(ACHIEVEMENTS).length;

    setText("sidebar-butterfly-count", `${butterflies}/07`);
    setText("secret-butterfly-count", butterflies);
    setText("secret-game-count", arcade.gamesPlayed);
    setText("secret-achievement-count", achievements);
    setText("sidebar-achievement-count", String(achievements).padStart(2, "0"));
    setText("butterfly-dialog-count", `${butterflies}/7`);
    setText("achievement-dialog-count", achievements);

    const butterflyFill = byId("butterfly-progress-fill");
    const achievementFill = byId("achievement-progress-fill");

    if (butterflyFill) {
      butterflyFill.style.width = `${butterflies / 7 * 100}%`;
    }

    if (achievementFill) {
      achievementFill.style.width =
        `${achievements / totalAchievements * 100}%`;
    }

    const butterflyBar = byId("butterfly-progress-bar");
    const achievementBar = byId("achievement-progress-bar");

    butterflyBar?.setAttribute("aria-valuenow", String(butterflies));
    achievementBar?.setAttribute("aria-valuenow", String(achievements));

    setText("stat-games-played", arcade.gamesPlayed);
    setText("stat-stars-caught", arcade.starsCaught);
    setText("stat-pairs-matched", arcade.pairsMatched);
    setText("stat-orbit-boards", arcade.orbitBoards);
  }

  /* =========================================================
     BUTTERFLY DISCOVERIES
     ========================================================= */

  function collectButterfly(index) {
    if (index < 0 || index > 6 || state.butterflies.has(index)) return;

    state.butterflies.add(index);

    const entry = document.querySelector(
      `[data-butterfly-entry="${index}"]`
    );

    const status = document.querySelector(
      `[data-butterfly-status="${index}"]`
    );

    entry?.classList.add("is-found");
    entry?.setAttribute("aria-pressed", "true");

    if (status) {
      status.classList.add("is-found");
      status.textContent = "FOUND";
    }

    updateProgress();
    toast(`Butterfly found: ${BUTTERFLY_NAMES[index]} 🦋`, "discovery");
    unlockAchievement("butterfly-finder");

    if (state.butterflies.size === 7) {
      unlockAchievement("universe-explorer");
      toast("All seven butterflies have found their way home. ✦");
    }
  }

  function createWanderingButterfly() {
    const layer = byId("butterfly-layer");

    if (!layer || !state.settings.wanderingButterfly) return;

    const index = [0, 1, 2, 3, 4, 5, 6].find(
      number => !state.butterflies.has(number)
    );

    if (index === undefined) return;

    const button = document.createElement("button");

    button.type = "button";
    button.className = "wandering-butterfly";
    button.textContent = "🦋";
    button.setAttribute("aria-label", "Discover a wandering butterfly");
    button.title = "A tiny discovery";

    Object.assign(button.style, {
      position: "absolute",
      left: `${12 + Math.random() * 72}%`,
      top: `${12 + Math.random() * 68}%`,
      border: "0",
      background: "transparent",
      fontSize: "1.6rem",
      cursor: "pointer",
      zIndex: "4"
    });

    button.addEventListener("click", () => {
      collectButterfly(index);
      button.remove();
    }, { once: true });

    layer.append(button);

    if (!state.settings.reducedMotion && button.animate) {
      button.animate(
        [
          { transform: "translateY(0) rotate(-8deg)" },
          { transform: "translateY(-10px) rotate(8deg)" },
          { transform: "translateY(0) rotate(-8deg)" }
        ],
        { duration: 2200, iterations: Infinity }
      );
    }
  }

  /* =========================================================
     PAGE NAVIGATION
     ========================================================= */

  function navigate(page, addHistory = true) {
    const target = byId(`page-${page}`);

    if (!target) {
      toast(`Section "${page}" could not be found.`);
      return;
    }

    if (addHistory && state.page !== page) {
      state.history = state.history.slice(0, state.historyIndex + 1);
      state.history.push(page);
      state.historyIndex = state.history.length - 1;
    }

    $$(".page[data-page-section]").forEach(section => {
      const active = section.dataset.pageSection === page;

      section.classList.toggle("is-active", active);
      section.setAttribute("aria-hidden", String(!active));
      section.inert = !active;
    });

    $$("[data-page]").forEach(button => {
      const active = button.dataset.page === page;

      if (button.classList.contains("browser-tab")) {
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      }

      if (button.classList.contains("sidebar-link")) {
        button.classList.toggle("is-active", active);

        if (active) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      }
    });

    state.page = page;
    document.body.dataset.currentPage = page;

    setText("address-bar-value", `sistaaaaa.exe/${page}`);
    setText("mobile-current-location", PAGE_LABELS[page] || page);

    state.visited.add(page);
    announce(`${PAGE_LABELS[page] || page} opened`);

    const nav = byId("main-navigation");

    if (nav) {
      nav.dataset.navigationState = "closed";
      nav.classList.remove("is-open");
    }

    byId("mobile-menu-toggle")?.setAttribute("aria-expanded", "false");

    if (page === "gallery") {
      unlockAchievement("gallery-visitor");
      renderGallery();
    }

    if (page === "letter") unlockAchievement("letter-reader");
    if (page === "arcade") unlockAchievement("arcade-explorer");
    if (page === "wishes") unlockAchievement("first-visit");
    if (page === "finale") unlockAchievement("universe-explorer");

    if (!state.settings.reducedMotion) {
      target.classList.remove("page-arrive");
      requestAnimationFrame(() => target.classList.add("page-arrive"));
    }
  }

  function moveHistory(direction) {
    const index = state.historyIndex + direction;

    if (index < 0 || index >= state.history.length) return;

    state.historyIndex = index;
    navigate(state.history[index], false);
  }

  /* =========================================================
     DIALOGS
     ========================================================= */

  function openDialog(id) {
    const dialog = byId(id);
    if (!dialog) return;

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
      dialog.classList.add("is-open");
    }
  }

  function closeDialog(id) {
    const dialog = byId(id);
    if (!dialog) return;

    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
      dialog.classList.remove("is-open");
    }
  }

  /* =========================================================
     BOOT SEQUENCE
     ========================================================= */

  function startBoot() {
    const screen = byId("boot-screen");

    if (!screen) {
      enterUniverse();
      return;
    }

    const progress = byId("boot-progress");
    const fill = byId("boot-progress-fill");
    const value = byId("boot-progress-value");
    const enter = byId("boot-enter-button");
    const skip = byId("boot-skip-button");
    const lines = $$("[data-boot-line]");

    let percent = 0;
    let lineIndex = 0;
    let finished = false;

    function finishBoot() {
      if (finished) return;
      finished = true;

      window.clearInterval(timer);

      if (fill) fill.style.width = "100%";

      setText("boot-progress-value", "100%");
      progress?.setAttribute("aria-valuenow", "100");

      lines.forEach(line => line.classList.add("is-visible"));

      reveal(enter);
      enter?.focus();
    }

    const timer = window.setInterval(() => {
      if (finished) return;

      percent = Math.min(100, percent + 5 + Math.random() * 8);

      if (fill) fill.style.width = `${percent}%`;

      setText("boot-progress-value", `${Math.floor(percent)
        .toString().padStart(2, "0")}%`);

      progress?.setAttribute("aria-valuenow", String(Math.floor(percent)));

      if (lineIndex < lines.length && percent >= (lineIndex + 1) * 22) {
        lines[lineIndex]?.classList.add("is-visible");
        lineIndex++;
      }

      if (percent >= 100) finishBoot();
    }, 160);

    skip?.addEventListener("click", finishBoot, { once: true });
    enter?.addEventListener("click", enterUniverse, { once: true });
  }

  function enterUniverse() {
    const boot = byId("boot-screen");
    const shell = byId("browser-shell");

    if (boot) {
      boot.classList.add("is-complete");

      window.setTimeout(() => {
        boot.hidden = true;
      }, state.settings.reducedMotion ? 0 : 400);
    }

    if (shell) {
      shell.dataset.shellState = "visible";
      shell.inert = false;
      shell.classList.add("is-visible");
    }

    state.ready = true;

    unlockAchievement("first-visit");

    if (!state.audioAllowed && state.tracks.length) {
      openDialog("soundtrack-consent");
    }

    if (state.settings.wanderingButterfly) createWanderingButterfly();

    const canvas = byId("starfield-canvas");

    if (canvas && state.settings.starfield) {
      startStarfield(canvas);
    }

    navigate("home", false);
  }

  /* =========================================================
     MEDIA MANIFEST
     Expected shape:
     {
       "photos": [
         {"src":"media/01-photo.jpg","title":"Memory","alt":"..."}
       ],
       "tracks": [
         {"src":"media/01-song.mp3","title":"Song","artist":"...","cover":"..."}
       ]
     }
     ========================================================= */

  async function loadManifest() {
    const paths = [
      "media-manifest.json",
      "media/media-manifest.json"
    ];

    for (const path of paths) {
      try {
        const response = await fetch(path, { cache: "no-cache" });

        if (!response.ok) continue;

        const manifest = await response.json();

        state.photos = Array.isArray(manifest.photos)
          ? manifest.photos.filter(item => item && item.src)
          : [];

        state.tracks = Array.isArray(manifest.tracks)
          ? manifest.tracks.filter(item => item && item.src)
          : [];

        return;
      } catch (error) {
        // Try the next manifest path.
      }
    }

    state.photos = [];
    state.tracks = [];

    setText("gallery-load-status", "Museum awaiting photographs.");
    console.info("[SISTAAAAA.EXE] Media manifest not found yet.");
  }

  /* =========================================================
     PHOTO GALLERY
     ========================================================= */

  function renderGallery() {
    const grid = byId("gallery-grid");
    if (!grid) return;

    conceal(byId("gallery-loading"));
    conceal(byId("gallery-error"));

    const photos = state.galleryShuffle
      ? shuffle(state.photos)
      : state.photos;

    grid.replaceChildren();

    setText("gallery-total-count", state.photos.length);
    setText("gallery-visible-count", photos.length);
    setText("home-photo-count", state.photos.length);

    setText(
      "gallery-load-status",
      photos.length
        ? `${photos.length} memories available`
        : "Museum awaiting photographs."
    );

    if (!photos.length) {
      reveal(byId("gallery-empty"));
      return;
    }

    conceal(byId("gallery-empty"));

    photos.forEach((photo, index) => {
      const template = byId("gallery-card-template");

      let card = template?.content?.firstElementChild
        ? template.content.firstElementChild.cloneNode(true)
        : document.createElement("button");

      if (card.tagName === "BUTTON") card.type = "button";

      card.classList.add("gallery-card");
      card.dataset.photoIndex = String(index);

      let image = card.querySelector("img");

      if (!image) {
        image = document.createElement("img");
        card.append(image);
      }

      image.src = photo.src;
      image.alt = photo.alt || photo.title || `Birthday photograph ${index + 1}`;
      image.loading = "lazy";
      image.decoding = "async";

      const title = card.querySelector(
        "[data-photo-title], .gallery-card__title, h3"
      );

      if (title) {
        title.textContent = photo.title || `Memory ${index + 1}`;
      }

      const description = card.querySelector(
        "[data-photo-description], .gallery-card__description"
      );

      if (description) description.textContent = photo.description || "";

      card.addEventListener("click", () => openPhoto(index));

      image.addEventListener("error", () => {
        card.classList.add("media-unavailable");
        image.alt = "This photograph could not be loaded.";
      });

      grid.append(card);
    });
  }

  function openPhoto(index) {
    if (!state.photos.length) return;

    state.photoIndex = clamp(index, 0, state.photos.length - 1);
    updatePhotoViewer();
    openDialog("media-viewer-dialog");
  }

  function updatePhotoViewer() {
    const photo = state.photos[state.photoIndex];
    if (!photo) return;

    const image = byId("media-viewer-image");

    if (image) {
      image.src = photo.src;
      image.alt = photo.alt || photo.title || "Birthday photograph";
    }

    setText(
      "media-viewer-index",
      `${state.photoIndex + 1} / ${state.photos.length}`
    );

    setText("media-viewer-title", photo.title || "A little memory");
    setText("media-viewer-description", photo.description || "");
  }

  function movePhoto(direction) {
    if (!state.photos.length) return;

    state.photoIndex =
      (state.photoIndex + direction + state.photos.length) %
      state.photos.length;

    updatePhotoViewer();
  }

  /* =========================================================
     WISH GENERATOR
     Every wish appears once per cycle, then reshuffles.
     ========================================================= */

  function generateWish() {
    if (!state.wishBag.length) {
      state.wishBag = shuffle(
        WISHES.filter((_, index) => !state.wishesShown.has(index))
      );
    }

    if (!state.wishBag.length) {
      state.wishesShown.clear();
      state.wishBag = shuffle([...WISHES]);
    }

    const wish = state.wishBag.pop();
    state.wishesShown.add(WISHES.indexOf(wish));

    setText("wish-text", wish);

    byId("wish-display")?.classList.add("has-wish");
    conceal(byId("wish-placeholder"));

    unlockAchievement("wish-maker");
    setText("wish-feedback", "A new wish, just for you. ✦");

    return wish;
  }

  async function copyText(value, feedbackId) {
    if (!value) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");

        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.append(textarea);
        textarea.select();

        const success = document.execCommand("copy");
        textarea.remove();

        if (!success) throw new Error("Clipboard unavailable");
      }

      setText(feedbackId, "Copied! ✦");
      toast("Copied to clipboard.");
    } catch (error) {
      setText(feedbackId, "Copy unavailable. Select and copy the text.");
      toast("Couldn't copy automatically on this device.");
    }
  }

  /* =========================================================
     GIFT REVEAL
     The gift is never blocked by a password or achievements.
     ========================================================= */

  function revealGift() {
    const message = byId("birthday-gift-message");
    const section = byId("birthday-gift-section");

    if (message) {
      message.hidden = false;
      message.classList.add("is-revealed");
    }

    section?.classList.add("is-revealed");

    toast("The birthday gift is yours. 💙");
  }

  /* =========================================================
     MUSIC PLAYER
     ========================================================= */

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

    return `${Math.floor(seconds / 60)}:${String(
      Math.floor(seconds % 60)
    ).padStart(2, "0")}`;
  }

  function currentTrack() {
    return state.tracks[state.trackIndex] || null;
  }

  function updateTrackDisplay() {
    const track = currentTrack();

    if (!track) {
      setText("player-track-title", "No tracks loaded");
      setText("player-track-artist", "Add music to the media folder");
      setText("player-large-title", "No tracks loaded");
      setText("playlist-count", "0 tracks");
      reveal(byId("playlist-empty"));
      return;
    }

    setText("player-track-title", track.title || "Untitled track");
    setText("player-track-artist", track.artist || "Birthday soundtrack");
    setText("player-large-title", track.title || "Untitled track");
    setText("player-large-artist", track.artist || "Birthday soundtrack");
    setText("playlist-count", `${state.tracks.length} tracks`);

    [byId("player-cover-image"), byId("player-large-cover")].forEach(image => {
      if (!image) return;

      if (track.cover) {
        image.src = track.cover;
        image.hidden = false;
      } else {
        image.removeAttribute("src");
        image.hidden = true;
      }
    });

    renderPlaylist();
  }

  function renderPlaylist() {
    const list = byId("player-playlist");
    const template = byId("playlist-track-template");

    if (!list) return;

    list.replaceChildren();
    conceal(byId("playlist-error"));

    if (!state.tracks.length) {
      reveal(byId("playlist-empty"));
      return;
    }

    conceal(byId("playlist-empty"));

    state.tracks.forEach((track, index) => {
      let row = template?.content?.firstElementChild
        ? template.content.firstElementChild.cloneNode(true)
        : document.createElement("button");

      row.type = "button";
      row.classList.add("playlist-track");
      row.dataset.trackIndex = String(index);
      row.classList.toggle("is-current", index === state.trackIndex);

      const title = row.querySelector(
        "[data-track-title], .playlist-track__title, .track-title"
      );

      const artist = row.querySelector(
        "[data-track-artist], .playlist-track__artist, .track-artist"
      );

      if (title) title.textContent = track.title || `Track ${index + 1}`;
      else row.textContent = track.title || `Track ${index + 1}`;

      if (artist) artist.textContent = track.artist || "Birthday soundtrack";

      row.addEventListener("click", () => {
        state.trackIndex = index;
        updateTrackDisplay();

        if (state.audioAllowed) playMusic();
        else openDialog("soundtrack-consent");
      });

      list.append(row);
    });
  }

  function setAudioSource() {
    const audio = byId("player-audio");
    const track = currentTrack();

    if (!audio || !track) return false;

    if (audio.dataset.currentSource !== track.src) {
      audio.src = track.src;
      audio.dataset.currentSource = track.src;
      audio.load();
    }

    return true;
  }

  async function playMusic() {
    const audio = byId("player-audio");

    if (!audio || !state.tracks.length) {
      toast("No soundtrack files are loaded yet.");
      return;
    }

    if (!state.audioAllowed) {
      openDialog("soundtrack-consent");
      return;
    }

    if (!setAudioSource()) return;

    try {
      await audio.play();
      state.audioPlaying = true;
      updateMusicButtons();
      unlockAchievement("music-listener");
    } catch (error) {
      state.audioPlaying = false;
      updateMusicButtons();
      toast("Couldn't play that track. Check the audio file.");
    }
  }

  function pauseMusic() {
    byId("player-audio")?.pause();
    state.audioPlaying = false;
    updateMusicButtons();
  }

  function toggleMusic() {
    if (!state.audioAllowed) {
      openDialog("soundtrack-consent");
      return;
    }

    if (state.audioPlaying) pauseMusic();
    else playMusic();
  }

  function nextTrack(direction = 1) {
    if (!state.tracks.length) return;

    if (state.playerShuffle && state.tracks.length > 1) {
      let next = state.trackIndex;

      while (next === state.trackIndex) {
        next = Math.floor(Math.random() * state.tracks.length);
      }

      state.trackIndex = next;
    } else {
      state.trackIndex =
        (state.trackIndex + direction + state.tracks.length) %
        state.tracks.length;
    }

    updateTrackDisplay();

    if (state.audioAllowed) playMusic();
  }

  function updateMusicButtons() {
    const audio = byId("player-audio");

    [
      byId("player-play-pause"),
      byId("player-play-pause-expanded")
    ].forEach(button => {
      if (!button) return;

      button.textContent = state.audioPlaying ? "Ⅱ" : "▶";
      button.setAttribute(
        "aria-label",
        state.audioPlaying ? "Pause music" : "Play music"
      );
    });

    setText("player-status", state.audioPlaying ? "PLAYING" : "PAUSED");

    if (audio) {
      const percent = audio.duration
        ? audio.currentTime / audio.duration * 100
        : 0;

      const seek = byId("player-seek");

      if (seek) seek.value = String(percent);

      const compact = byId("player-compact-progress");
      if (compact) compact.style.width = `${percent}%`;

      setText("player-current-time", formatTime(audio.currentTime));
      setText("player-duration", formatTime(audio.duration));
    }
  }

  function acceptSoundtrack() {
    state.audioAllowed = true;
    closeDialog("soundtrack-consent");

    if (state.tracks.length) playMusic();
    else toast("Your player is ready. Add tracks to the media manifest.");
  }

  /* =========================================================
     SETTINGS
     ========================================================= */

  function applySettings() {
    const root = document.documentElement;

    root.classList.toggle("reduce-motion", state.settings.reducedMotion);
    root.classList.toggle("large-text", state.settings.largeText);
    root.classList.toggle("high-contrast", state.settings.highContrast);

    const elements = [
      [byId("starfield-canvas"), state.settings.starfield],
      [$(".scene-background__scanlines"), state.settings.scanlines],
      [byId("cursor-effects"), state.settings.cursorEffects],
      [byId("floating-effects"), state.settings.sparkles],
      [byId("butterfly-layer"), state.settings.wanderingButterfly]
    ];

    elements.forEach(([element, enabled]) => {
      if (element) element.hidden = !enabled;
    });

    const ids = {
      "setting-reduced-motion": "reducedMotion",
      "setting-starfield": "starfield",
      "setting-scanlines": "scanlines",
      "setting-cursor-effects": "cursorEffects",
      "setting-sparkles": "sparkles",
      "setting-wandering-butterfly": "wanderingButterfly",
      "setting-large-text": "largeText",
      "setting-high-contrast": "highContrast"
    };

    Object.entries(ids).forEach(([id, key]) => {
      const input = byId(id);
      if (input) input.checked = state.settings[key];
    });
  }

  function readSettings() {
    const ids = {
      "setting-reduced-motion": "reducedMotion",
      "setting-starfield": "starfield",
      "setting-scanlines": "scanlines",
      "setting-cursor-effects": "cursorEffects",
      "setting-sparkles": "sparkles",
      "setting-wandering-butterfly": "wanderingButterfly",
      "setting-large-text": "largeText",
      "setting-high-contrast": "highContrast"
    };

    Object.entries(ids).forEach(([id, key]) => {
      const input = byId(id);
      if (input) state.settings[key] = input.checked;
    });

    applySettings();
    setText("settings-feedback", "Settings applied.");
    toast("Your settings have been updated.");
  }

  /* =========================================================
     STARFIELD
     ========================================================= */

  function startStarfield(canvas) {
    if (canvas.dataset.initialised === "true") return;

    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.dataset.initialised = "true";

    let width = 0;
    let height = 0;
    let stars = [];
    let frame = 0;

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      stars = Array.from(
        { length: Math.min(100, Math.floor(width * height / 11000)) },
        () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.2 + 0.3,
          alpha: Math.random() * 0.5 + 0.2,
          speed: Math.random() * 0.12 + 0.02
        })
      );
    }

    function draw() {
      cancelAnimationFrame(frame);
      context.clearRect(0, 0, width, height);

      stars.forEach(star => {
        star.y -= star.speed;

        if (star.y < -2) {
          star.y = height + 2;
          star.x = Math.random() * width;
        }

        context.globalAlpha = star.alpha;
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fillStyle = "#d8e8ff";
        context.fill();
      });

      context.globalAlpha = 1;

      if (
        !state.settings.reducedMotion &&
        state.settings.starfield &&
        !document.hidden
      ) {
        frame = requestAnimationFrame(draw);
      }
    }

    resize();
    draw();

    window.addEventListener("resize", () => {
      resize();
      draw();
    });

    document.addEventListener("visibilitychange", draw);
  }

  /* =========================================================
     ARCADE HELPERS
     ========================================================= */

  function clearGameTimers() {
    state.gameTimers.forEach(timer => {
      clearInterval(timer);
      clearTimeout(timer);
    });

    state.gameTimers = [];
  }

  function resetGame() {
    clearGameTimers();
    state.activeGame = null;
  }

  function launchGame(game) {
    const panel = byId(`game-${game}`);

    if (!panel) {
      toast("That game panel could not be found.");
      return;
    }

    resetGame();
    state.activeGame = game;
    arcade.gamesPlayed++;

    $$(".game-panel").forEach(item => {
      item.hidden = item !== panel;
      item.classList.toggle("is-active", item === panel);
    });

    conceal(byId("game-screen-loading"));

    setText(
      "game-dialog-title",
      panel.querySelector("h2")?.textContent || "ARCADE"
    );

    setText("game-dialog-description", "Choose your move and have fun.");

    openDialog("game-dialog");
    updateProgress();

    if (game === "stars") prepareStarGame();
    if (game === "memory") prepareMemoryGame();
    if (game === "drift") prepareDriftGame();
    if (game === "orbit") prepareOrbitGame();
  }

  function endGame(message) {
    clearGameTimers();

    const result = byId(`${state.activeGame}-result`);

    if (result) {
      result.textContent = message;
      result.classList.add("is-visible");
    }

    toast(message);
    updateProgress();
  }

  /* STAR CATCHER */

  let starScore = 0;
  let starTime = 20;
  let starRunning = false;

  function prepareStarGame() {
    starScore = 0;
    starTime = 20;
    starRunning = false;

    setText("stars-score", "0");
    setText("stars-time", "20");
    setText("star-field-message", "Press START to begin.");

    byId("star-field")?.replaceChildren();
    conceal(byId("stars-result"));
  }

  function startStarGame() {
    if (starRunning) return;

    const field = byId("star-field");
    if (!field) return;

    starRunning = true;
    starScore = 0;
    starTime = 20;

    field.replaceChildren();
    setText("star-field-message", "Catch as many stars as you can!");

    const spawn = () => {
      if (!starRunning || starTime <= 0) return;

      const star = document.createElement("button");

      star.type = "button";
      star.className = "catchable-star";
      star.textContent = "✦";
      star.setAttribute("aria-label", "Catch star");

      Object.assign(star.style, {
        position: "absolute",
        left: `${5 + Math.random() * 85}%`,
        top: `${5 + Math.random() * 75}%`,
        fontSize: `${1.2 + Math.random()}rem`,
        background: "transparent",
        border: "0",
        color: "#b9d8ff",
        cursor: "pointer",
        touchAction: "manipulation"
      });

      star.addEventListener("click", () => {
        if (!starRunning) return;

        starScore++;
        arcade.starsCaught++;

        setText("stars-score", starScore);
        setText("stat-stars-caught", arcade.starsCaught);

        star.remove();
      }, { once: true });

      field.append(star);

      state.gameTimers.push(setTimeout(() => star.remove(), 1800));
    };

    spawn();
    state.gameTimers.push(setInterval(spawn, 550));

    state.gameTimers.push(setInterval(() => {
      if (!starRunning) return;

      starTime--;
      setText("stars-time", starTime);

      if (starTime <= 0) {
        starRunning = false;
        endGame(`Time's up! You caught ${starScore} stars. ✦`);
      }
    }, 1000));
  }

  /* MEMORY MATRIX */

  const MEMORY_SYMBOLS = ["✦", "✧", "☾", "♡", "♢", "☆", "☼", "❋"];

  let memory = {
    first: null,
    locked: false,
    moves: 0,
    matches: 0
  };

  function prepareMemoryGame() {
    memory = { first: null, locked: false, moves: 0, matches: 0 };

    setText("memory-matched", "0");
    setText("memory-moves", "0");
    conceal(byId("memory-result"));

    const board = byId("memory-board");
    if (!board) return;

    board.replaceChildren();

    shuffle([...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS]).forEach((symbol, index) => {
      const card = document.createElement("button");

      card.type = "button";
      card.className = "memory-card";
      card.dataset.symbol = symbol;
      card.textContent = "?";
      card.setAttribute("aria-label", `Hidden card ${index + 1}`);

      card.addEventListener("click", () => flipMemoryCard(card));

      board.append(card);
    });
  }

  function flipMemoryCard(card) {
    if (
      memory.locked ||
      card.classList.contains("is-matched") ||
      card.classList.contains("is-flipped")
    ) return;

    card.classList.add("is-flipped");
    card.textContent = card.dataset.symbol;
    card.setAttribute("aria-label", card.dataset.symbol);

    if (!memory.first) {
      memory.first = card;
      return;
    }

    memory.moves++;
    setText("memory-moves", memory.moves);

    if (memory.first.dataset.symbol === card.dataset.symbol) {
      memory.first.classList.add("is-matched");
      card.classList.add("is-matched");

      memory.matches++;
      arcade.pairsMatched++;

      setText("memory-matched", memory.matches);
      setText("stat-pairs-matched", arcade.pairsMatched);

      memory.first = null;

      if (memory.matches === MEMORY_SYMBOLS.length) {
        endGame(`Matrix complete in ${memory.moves} moves! ✦`);
      }

      return;
    }

    const first = memory.first;
    memory.first = null;
    memory.locked = true;

    state.gameTimers.push(setTimeout(() => {
      first.classList.remove("is-flipped");
      card.classList.remove("is-flipped");

      first.textContent = "?";
      card.textContent = "?";

      memory.locked = false;
    }, 750));
  }

  /* NEON DRIFT */

  let drift = {
    running: false,
    distance: 0,
    energy: 100,
    lane: 1
  };

  function prepareDriftGame() {
    drift = { running: false, distance: 0, energy: 100, lane: 1 };

    setText("drift-distance", "0");
    setText("drift-energy", "100%");
    conceal(byId("drift-result"));

    const arena = byId("drift-arena");
    if (!arena) return;

    arena.querySelector(".drift-player")?.remove();

    const player = document.createElement("div");

    player.className = "drift-player";
    player.textContent = "◆";
    player.setAttribute("aria-label", "Your ship");

    Object.assign(player.style, {
      position: "absolute",
      bottom: "12%",
      left: "50%",
      transform: "translateX(-50%)",
      fontSize: "2rem",
      color: "#c2ddff"
    });

    arena.append(player);
  }

  function startDriftGame() {
    if (drift.running) return;

    drift.running = true;

    state.gameTimers.push(setInterval(() => {
      if (!drift.running) return;

      drift.distance++;
      drift.energy = Math.max(0, drift.energy - 1);

      setText("drift-distance", drift.distance);
      setText("drift-energy", `${drift.energy}%`);

      if (drift.energy <= 0 || drift.distance >= 100) {
        drift.running = false;
        endGame(`Neon Drift complete! Distance: ${drift.distance}.`);
      }
    }, 250));
  }

  function moveDrift(direction) {
    if (!drift.running) return;

    if (direction === "left") drift.lane = Math.max(0, drift.lane - 1);
    if (direction === "right") drift.lane = Math.min(2, drift.lane + 1);
    if (direction === "up") drift.energy = Math.min(100, drift.energy + 8);
    if (direction === "down") drift.energy = Math.max(0, drift.energy - 5);

    const player = $(".drift-player");

    if (player) player.style.left = `${25 + drift.lane * 25}%`;

    setText("drift-energy", `${drift.energy}%`);
  }

  /* ORBIT MATCH */

  let orbit = {
    first: null,
    locked: false,
    moves: 0,
    matches: 0
  };

  function prepareOrbitGame() {
    orbit = { first: null, locked: false, moves: 0, matches: 0 };

    setText("orbit-pairs", "0");
    setText("orbit-moves", "0");
    setText("orbit-level", "1");
    conceal(byId("orbit-result"));

    const board = byId("orbit-board");
    if (!board) return;

    board.replaceChildren();

    const symbols = ["☾", "✦", "♢", "☼", "✧", "☆"];

    shuffle([...symbols, ...symbols]).forEach((symbol, index) => {
      const card = document.createElement("button");

      card.type = "button";
      card.className = "orbit-card";
      card.dataset.symbol = symbol;
      card.textContent = "◌";
      card.setAttribute("aria-label", `Orbit tile ${index + 1}`);

      card.addEventListener("click", () => flipOrbitCard(card));

      board.append(card);
    });
  }

  function flipOrbitCard(card) {
    if (
      orbit.locked ||
      card.classList.contains("is-matched") ||
      card.classList.contains("is-flipped")
    ) return;

    card.classList.add("is-flipped");
    card.textContent = card.dataset.symbol;

    if (!orbit.first) {
      orbit.first = card;
      return;
    }

    orbit.moves++;
    setText("orbit-moves", orbit.moves);

    if (orbit.first.dataset.symbol === card.dataset.symbol) {
      orbit.first.classList.add("is-matched");
      card.classList.add("is-matched");

      orbit.matches++;
      arcade.orbitBoards++;

      setText("orbit-pairs", orbit.matches);
      setText("stat-orbit-boards", arcade.orbitBoards);

      orbit.first = null;

      if (orbit.matches === 6) {
        endGame(`Orbit aligned in ${orbit.moves} moves. ✦`);
      }

      return;
    }

    const first = orbit.first;
    orbit.first = null;
    orbit.locked = true;

    state.gameTimers.push(setTimeout(() => {
      first.classList.remove("is-flipped");
      card.classList.remove("is-flipped");

      first.textContent = "◌";
      card.textContent = "◌";

      orbit.locked = false;
    }, 750));
  }

  /* =========================================================
     NAVIGATION EVENTS
     ========================================================= */

  function wireNavigation() {
    $$("[data-page]").forEach(button => {
      button.addEventListener("click", () => navigate(button.dataset.page));
    });

    byId("browser-back")?.addEventListener("click", () => moveHistory(-1));
    byId("browser-forward")?.addEventListener("click", () => moveHistory(1));
    byId("browser-home")?.addEventListener("click", () => navigate("home"));
    byId("new-tab-button")?.addEventListener("click", () => navigate("home"));

    byId("refresh-page")?.addEventListener("click", () => {
      navigate(state.page, false);

      if (state.page === "gallery") renderGallery();

      toast("View refreshed.");
    });

    byId("mobile-menu-toggle")?.addEventListener("click", () => {
      const nav = byId("main-navigation");
      if (!nav) return;

      const open = nav.dataset.navigationState !== "open";

      nav.dataset.navigationState = open ? "open" : "closed";
      nav.classList.toggle("is-open", open);

      byId("mobile-menu-toggle")?.setAttribute("aria-expanded", String(open));
    });

    byId("minimise-browser")?.addEventListener("click", () => {
      const shell = byId("browser-shell");
      if (!shell) return;

      shell.classList.toggle("is-minimised");

      toast(shell.classList.contains("is-minimised")
        ? "Window minimised."
        : "Window restored.");
    });

    byId("toggle-fullscreen")?.addEventListener("click", event => {
      const shell = byId("browser-shell");
      if (!shell) return;

      const expanded = shell.classList.toggle("is-expanded");

      event.currentTarget.setAttribute("aria-pressed", String(expanded));
    });

    byId("open-settings")?.addEventListener("click", () => {
      openDialog("settings-dialog");
    });

    byId("sidebar-settings")?.addEventListener("click", () => {
      openDialog("settings-dialog");
    });

    const expandPlayer = () => {
      byId("music-player")?.classList.toggle("is-expanded");
    };

    byId("toggle-sound")?.addEventListener("click", expandPlayer);
    byId("mobile-music-toggle")?.addEventListener("click", expandPlayer);
  }

  /* =========================================================
     DIALOG EVENTS
     ========================================================= */

  function wireDialogs() {
    $$("[data-open-dialog]").forEach(button => {
      button.addEventListener("click", () => {
        openDialog(button.dataset.openDialog);
      });
    });

    $$("[data-close-dialog]").forEach(button => {
      button.addEventListener("click", () => {
        closeDialog(button.dataset.closeDialog);
      });
    });

    $$("dialog").forEach(dialog => {
      dialog.addEventListener("click", event => {
        if (event.target === dialog) closeDialog(dialog.id);
      });

      dialog.addEventListener("close", () => {
        if (dialog.id === "game-dialog") resetGame();
      });
    });

    byId("soundtrack-accept")?.addEventListener("click", acceptSoundtrack);

    byId("soundtrack-decline")?.addEventListener("click", () => {
      closeDialog("soundtrack-consent");
      toast("Music stays paused until you choose otherwise.");
    });

    byId("game-dialog-close")?.addEventListener("click", () => {
      closeDialog("game-dialog");
    });

    byId("game-back-to-arcade")?.addEventListener("click", () => {
      resetGame();
      closeDialog("game-dialog");
      navigate("arcade");
    });
  }

  /* =========================================================
     GALLERY AND LETTER EVENTS
     ========================================================= */

  function wireGallery() {
    byId("gallery-shuffle")?.addEventListener("click", () => {
      state.galleryShuffle = true;
      renderGallery();
    });

    byId("gallery-reset-order")?.addEventListener("click", () => {
      state.galleryShuffle = false;
      renderGallery();
    });

    byId("gallery-retry")?.addEventListener("click", async () => {
      await loadManifest();
      renderGallery();
    });

    byId("media-viewer-close")?.addEventListener("click", () => {
      closeDialog("media-viewer-dialog");
    });

    byId("media-viewer-previous")?.addEventListener("click", () => movePhoto(-1));
    byId("media-viewer-next")?.addEventListener("click", () => movePhoto(1));

    byId("media-viewer-shuffle")?.addEventListener("click", () => {
      if (!state.photos.length) return;

      state.galleryShuffle = true;
      renderGallery();
      openPhoto(Math.floor(Math.random() * state.photos.length));
    });

    byId("letter-copy")?.addEventListener("click", () => {
      const letter = byId("birthday-letter");

      if (letter) {
        copyText(letter.innerText, "letter-copy-feedback");
      }
    });
  }

  /* =========================================================
     WISHES, GIFT AND FINALE
     ========================================================= */

  function wireWishesAndGift() {
    byId("generate-wish")?.addEventListener("click", generateWish);

    byId("copy-wish")?.addEventListener("click", () => {
      const wish = byId("wish-text")?.textContent?.trim();

      if (wish) copyText(wish, "wish-feedback");
      else toast("Generate a wish first. ✦");
    });

    byId("reveal-birthday-gift")?.addEventListener("click", revealGift);

    byId("copy-gift-message")?.addEventListener("click", () => {
      const message = byId("birthday-gift-message");

      if (message) {
        copyText(message.innerText, "gift-copy-feedback");
      }
    });

    byId("finale-replay")?.addEventListener("click", () => {
      navigate("home");
      toast("Back to the beginning. Your universe is still here. 💙");
    });

    byId("finale-star-button")?.addEventListener("click", () => {
      createWanderingButterfly();
      toast("A little star for the birthday universe. ✦");
    });

    byId("utility-gift")?.addEventListener("click", () => {
      navigate("secrets");

      byId("birthday-gift-section")?.scrollIntoView({
        behavior: state.settings.reducedMotion ? "auto" : "smooth",
        block: "center"
      });
    });
  }

  /* =========================================================
     MUSIC EVENTS
     ========================================================= */

  function wireMusicPlayer() {
    byId("player-play-pause")?.addEventListener("click", toggleMusic);
    byId("player-play-pause-expanded")?.addEventListener("click", toggleMusic);

    byId("player-previous")?.addEventListener("click", () => nextTrack(-1));
    byId("player-previous-expanded")?.addEventListener("click", () => nextTrack(-1));

    byId("player-next")?.addEventListener("click", () => nextTrack(1));
    byId("player-next-expanded")?.addEventListener("click", () => nextTrack(1));

    byId("player-cover-button")?.addEventListener("click", () => {
      byId("music-player")?.classList.toggle("is-expanded");
    });

    byId("player-expand")?.addEventListener("click", () => {
      byId("music-player-expanded")?.classList.add("is-visible");
    });

    byId("player-collapse")?.addEventListener("click", () => {
      byId("music-player-expanded")?.classList.remove("is-visible");
    });

    byId("player-shuffle")?.addEventListener("click", event => {
      state.playerShuffle = !state.playerShuffle;

      event.currentTarget.setAttribute(
        "aria-pressed",
        String(state.playerShuffle)
      );

      toast(state.playerShuffle ? "Shuffle enabled." : "Shuffle disabled.");
    });

    byId("player-repeat")?.addEventListener("click", event => {
      state.playerRepeat = !state.playerRepeat;

      event.currentTarget.setAttribute(
        "aria-pressed",
        String(state.playerRepeat)
      );

      toast(state.playerRepeat ? "Repeat enabled." : "Repeat disabled.");
    });

    byId("player-seek")?.addEventListener("input", event => {
      const audio = byId("player-audio");

      if (audio && Number.isFinite(audio.duration)) {
        audio.currentTime =
          Number(event.currentTarget.value) / 100 * audio.duration;
      }
    });

    byId("player-volume")?.addEventListener("input", event => {
      const audio = byId("player-audio");
      const volume = clamp(Number(event.currentTarget.value) / 100, 0, 1);

      if (audio) audio.volume = volume;

      setText("player-volume-value", `${Math.round(volume * 100)}%`);
    });

    const audio = byId("player-audio");

    audio?.addEventListener("timeupdate", updateMusicButtons);
    audio?.addEventListener("loadedmetadata", updateMusicButtons);

    audio?.addEventListener("ended", () => {
      if (state.playerRepeat) {
        audio.currentTime = 0;
        playMusic();
      } else if (state.tracks.length > 1) {
        nextTrack(1);
      } else {
        state.audioPlaying = false;
        updateMusicButtons();
      }
    });

    audio?.addEventListener("error", () => {
      state.audioPlaying = false;
      updateMusicButtons();
      setText("playlist-error", "A track could not be loaded.");
    });

    updateTrackDisplay();
  }

  /* =========================================================
     ARCADE EVENTS
     ========================================================= */

  function wireGames() {
    $$("[data-open-game]").forEach(button => {
      button.addEventListener("click", () => {
        launchGame(button.dataset.openGame);
      });
    });

    byId("game-restart")?.addEventListener("click", () => {
      const game = state.activeGame;

      if (game) launchGame(game);
    });

    byId("stars-start")?.addEventListener("click", startStarGame);
    byId("memory-start")?.addEventListener("click", prepareMemoryGame);
    byId("memory-restart")?.addEventListener("click", prepareMemoryGame);

    byId("drift-start")?.addEventListener("click", startDriftGame);

    byId("drift-stop")?.addEventListener("click", () => {
      drift.running = false;
      endGame(`Drift stopped at ${drift.distance}.`);
    });

    byId("drift-pause")?.addEventListener("click", () => {
      drift.running = !drift.running;

      toast(drift.running ? "Drift resumed." : "Drift paused.");
    });

    byId("drift-restart")?.addEventListener("click", () => {
      resetGame();
      state.activeGame = "drift";
      prepareDriftGame();
      startDriftGame();
    });

    byId("orbit-start")?.addEventListener("click", prepareOrbitGame);
    byId("orbit-restart")?.addEventListener("click", prepareOrbitGame);

    $$("[data-drift-direction]").forEach(button => {
      button.addEventListener("click", () => {
        moveDrift(button.dataset.driftDirection);
      });
    });

    byId("reset-arcade-session")?.addEventListener("click", () => {
      arcade.gamesPlayed = 0;
      arcade.starsCaught = 0;
      arcade.pairsMatched = 0;
      arcade.orbitBoards = 0;

      updateProgress();
      toast("Arcade session statistics reset.");
    });

    document.addEventListener("keydown", event => {
      if (!byId("game-dialog")?.open) return;
      if (state.activeGame !== "drift") return;

      const directions = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down"
      };

      const direction = directions[event.key];

      if (direction) {
        event.preventDefault();
        moveDrift(direction);
      }
    });
  }

  /* =========================================================
     SETTINGS AND UTILITIES
     ========================================================= */

  function wireSettings() {
    byId("settings-form")?.addEventListener("submit", event => {
      event.preventDefault();
      readSettings();
    });

    byId("settings-reset")?.addEventListener("click", () => {
      state.settings = {
        reducedMotion: false,
        starfield: true,
        scanlines: true,
        cursorEffects: true,
        sparkles: true,
        wanderingButterfly: true,
        largeText: false,
        highContrast: false
      };

      applySettings();
      setText("settings-feedback", "Defaults restored.");
    });

    const settingsIds = {
      "setting-reduced-motion": "reducedMotion",
      "setting-starfield": "starfield",
      "setting-scanlines": "scanlines",
      "setting-cursor-effects": "cursorEffects",
      "setting-sparkles": "sparkles",
      "setting-wandering-butterfly": "wanderingButterfly",
      "setting-large-text": "largeText",
      "setting-high-contrast": "highContrast"
    };

    Object.entries(settingsIds).forEach(([id, key]) => {
      byId(id)?.addEventListener("change", event => {
        state.settings[key] = event.currentTarget.checked;
        applySettings();
      });
    });

    byId("utility-help")?.addEventListener("click", () => openDialog("help-dialog"));
    byId("utility-screensaver")?.addEventListener("click", () => openDialog("screensaver-dialog"));
    byId("utility-about")?.addEventListener("click", () => openDialog("about-dialog"));

    byId("screensaver-start")?.addEventListener("click", () => {
      closeDialog("screensaver-dialog");

      const screen = byId("screensaver");
      if (!screen) return;

      screen.hidden = false;
      screen.classList.add("is-active");

      const exit = () => {
        screen.classList.remove("is-active");
        screen.hidden = true;

        screen.removeEventListener("click", exit);
        document.removeEventListener("keydown", exitKey);
      };

      const exitKey = event => {
        if (event.key === "Escape" || event.key === "Enter") exit();
      };

      screen.addEventListener("click", exit, { once: true });
      document.addEventListener("keydown", exitKey);
    });
  }

  function wireButterflies() {
    $$("[data-butterfly-entry]").forEach(button => {
      button.addEventListener("click", () => {
        collectButterfly(Number(button.dataset.butterflyEntry));
      });
    });
  }

  function wireMiscellaneous() {
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        const dialog = $("dialog[open]");

        if (dialog && dialog.id !== "game-dialog") {
          closeDialog(dialog.id);
        }
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        openDialog("help-dialog");
      }
    });

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    );

    if (prefersReducedMotion?.matches) {
      state.settings.reducedMotion = true;
    }

    window.addEventListener("offline", () => {
      toast("You're offline. Some media may not load.");
    });

    window.addEventListener("online", () => {
      toast("Connection restored.");
    });
  }

  /* =========================================================
     INITIALISATION
     ========================================================= */

  async function init() {
    applySettings();

    wireNavigation();
    wireDialogs();
    wireGallery();
    wireWishesAndGift();
    wireMusicPlayer();
    wireGames();
    wireSettings();
    wireButterflies();
    wireMiscellaneous();

    await loadManifest();

    renderGallery();
    updateTrackDisplay();
    updateProgress();

    // Gift is available immediately, without a secret-code gate.
    const giftMessage = byId("birthday-gift-message");

    if (giftMessage) giftMessage.hidden = true;

    startBoot();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
