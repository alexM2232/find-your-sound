document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  
  // 1. DARK AND LIGHT THEME
  

  const themeButton = document.querySelector("#themeToggle");

  function setTheme(theme) {
    const safeTheme = theme === "light" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", safeTheme);

    if (themeButton) {
      themeButton.textContent =
        safeTheme === "light" ? "Dark mode" : "Light mode";

      themeButton.setAttribute(
        "aria-label",
        safeTheme === "light"
          ? "Switch to dark mode"
          : "Switch to light mode"
      );

      themeButton.setAttribute(
        "aria-pressed",
        String(safeTheme === "light")
      );
    }
  }

  let storedTheme = "dark";

  try {
    storedTheme = localStorage.getItem("fys-theme") || "dark";
  } catch (error) {
    // Use dark mode if browser storage is unavailable.
  }

  setTheme(storedTheme);

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      const current =
        document.documentElement.getAttribute("data-theme") || "dark";

      const next = current === "dark" ? "light" : "dark";

      setTheme(next);

      try {
        localStorage.setItem("fys-theme", next);
      } catch (error) {
        // Theme still changes for this page view.
      }
    });
  }

  // ==========================================
  // 2. MOBILE NAVIGATION
  // ==========================================

  const menuButton = document.querySelector("#menuToggle");
  const nav = document.querySelector("#mainNav");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = nav.classList.toggle("active");

      menuButton.setAttribute("aria-expanded", String(open));

      menuButton.setAttribute(
        "aria-label",
        open ? "Close navigation" : "Open navigation"
      );

      menuButton.textContent = open ? "×" : "☰";
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("active");

        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
        menuButton.textContent = "☰";
      });
    });
  }

  // ==========================================
  // 3. GSAP ANIMATIONS
  // ==========================================

  function setupMotion() {
    const revealItems = document.querySelectorAll(".reveal");
    const zoomImages = document.querySelectorAll(".scroll-image");

    if (!window.gsap || reduceMotion) {
      revealItems.forEach((item) => {
        item.style.opacity = "1";
        item.style.transform = "none";
      });

      zoomImages.forEach((image) => {
        image.style.transform = "none";
      });

      return;
    }

    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }

    // Animation 1: Hero entrance timeline.

    const heroTimeline = gsap.timeline({
      defaults: {
        ease: "power3.out"
      }
    });

    const heroEyebrow = document.querySelector(".hero-eyebrow");
    const heroTitle = document.querySelector(".hero-title");
    const heroDescription = document.querySelector(".hero-description");
    const heroActions = document.querySelector(".hero-actions");
    const heroArt = document.querySelector(".hero-art");

    [
      heroEyebrow,
      heroTitle,
      heroDescription,
      heroActions
    ].forEach((element) => {
      if (element) {
        gsap.set(element, {
          opacity: 0,
          y: 25
        });
      }
    });

    if (heroArt) {
      gsap.set(heroArt, {
        opacity: 0,
        scale: 0.88,
        rotation: 2
      });
    }

    if (heroEyebrow) {
      heroTimeline.to(heroEyebrow, {
        opacity: 1,
        y: 0,
        duration: 0.55
      });
    }

    if (heroTitle) {
      heroTimeline.to(heroTitle, {
        opacity: 1,
        y: 0,
        duration: 0.9
      }, "-=0.2");
    }

    if (heroDescription) {
      heroTimeline.to(heroDescription, {
        opacity: 1,
        y: 0,
        duration: 0.65
      }, "-=0.45");
    }

    if (heroActions) {
      heroTimeline.to(heroActions, {
        opacity: 1,
        y: 0,
        duration: 0.55
      }, "-=0.35");
    }

    if (heroArt) {
      heroTimeline.to(heroArt, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 1.1
      }, "-=1.0");
    }

    // Animation 2: Scroll-triggered reveal effects.

    if (window.ScrollTrigger) {
      gsap.utils.toArray(".reveal").forEach((element) => {
        if (element.closest(".hero")) return;

        gsap.fromTo(
          element,
          {
            opacity: 0,
            y: 48
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "power2.out",
            scrollTrigger: {
              trigger: element,
              start: "top 88%",
              once: true
            }
          }
        );
      });

      // Animation 3: Scroll image zoom.
      // Scrolling down zooms in.
      // Scrolling up reverses the zoom.

      zoomImages.forEach((image) => {
        gsap.fromTo(
          image,
          {
            scale: 0.72
          },
          {
            scale: 1.42,
            ease: "none",
            scrollTrigger: {
              trigger: image.closest(".scroll-image-wrap") || image,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2
            }
          }
        );
      });

      // Additional movement: gentle hero artwork parallax.

      if (heroArt) {
        gsap.to(heroArt, {
          yPercent: 9,
          ease: "none",
          scrollTrigger: {
            trigger: heroArt,
            start: "top top",
            end: "bottom top",
            scrub: 1
          }
        });
      }
    } else {
      revealItems.forEach((item) => {
        item.style.opacity = "1";
        item.style.transform = "none";
      });
    }
  }

  setupMotion();

  // ==========================================
  // 4. MUSIC SEARCH API
  // Only runs on the Artists & Albums page.
  // ==========================================

  const form = document.querySelector("#musicSearchForm");

  if (!form) return;

  const input = document.querySelector("#musicSearch");
  const results = document.querySelector("#musicResults");
  const loading = document.querySelector("#loadingState");
  const errorPanel = document.querySelector("#errorState");
  const emptyPanel = document.querySelector("#emptyState");
  const errorMessage = document.querySelector("#errorMessage");
  const resultsTitle = document.querySelector("#resultsTitle");
  const resultsCount = document.querySelector("#resultsCount");
  const retryButton = document.querySelector("#retryButton");

  if (!input || !results || !loading || !errorPanel || !emptyPanel) {
    return;
  }

  let lastQuery = "shoegaze";
  let controller = null;

  // Hide all previous search messages and results.

  function clearStates() {
    loading.hidden = true;
    errorPanel.hidden = true;
    emptyPanel.hidden = true;

    results.replaceChildren();

    if (resultsCount) {
      resultsCount.textContent = "";
    }
  }

  // Display loading message.

  function showLoading() {
    clearStates();
    loading.hidden = false;
  }

  // Display error message.

  function showError(message) {
    clearStates();

    errorPanel.hidden = false;

    if (errorMessage) {
      errorMessage.textContent = message;
    }
  }

  // Display empty search results.

  function showEmpty() {
    clearStates();
    emptyPanel.hidden = false;
  }

  // ==========================================
  // 5. CREATE ALBUM RESULT CARDS
  // ==========================================

  function makeAlbumCard(album) {
    const card = document.createElement("article");
    card.className = "music-card";

    const artwork = document.createElement("img");

    artwork.className = "music-card-image";

    artwork.alt = album.collectionName
      ? `Artwork for ${album.collectionName}`
      : "Album artwork";

    artwork.loading = "lazy";

    if (album.artworkUrl100) {
      artwork.src = album.artworkUrl100.replace(
        "100x100",
        "600x600"
      );
    } else {
      artwork.alt = "No album artwork available";
    }

    const details = document.createElement("div");
    details.className = "music-card-details";

    const title = document.createElement("h3");
    title.textContent = album.collectionName || "Untitled album";

    const artist = document.createElement("p");
    artist.textContent = album.artistName || "Unknown artist";

    const genre = document.createElement("span");
    genre.className = "music-card-genre";
    genre.textContent = album.primaryGenreName || "Music";

    details.append(title, artist, genre);

    if (album.collectionViewUrl) {
      const link = document.createElement("a");

      link.className = "music-card-link";
      link.href = album.collectionViewUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Explore album ↗";

      details.append(link);
    }

    card.append(artwork, details);

    return card;
  }

  // ==========================================
  // 6. SEARCH THE ITUNES API
  // ==========================================

  async function searchMusic(query) {
    const term = query.trim();

    if (!term) {
      showError("Please enter an artist, album or genre to search.");
      input.focus();
      return;
    }

    lastQuery = term;

    if (controller) {
      controller.abort();
    }

    controller = new AbortController();

    showLoading();

    if (resultsTitle) {
      resultsTitle.textContent = `Results for "${term}"`;
    }

    const params = new URLSearchParams({
      term: term,
      entity: "album",
      limit: "12",
      country: "US"
    });

    try {
      const response = await fetch(
        `https://itunes.apple.com/search?${params.toString()}`,
        {
          signal: controller.signal
        }
      );

      if (!response.ok) {
        throw new Error(
          `Music service error (${response.status}).`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data.results)) {
        throw new Error(
          "The music service returned an unexpected response."
        );
      }

      // No results found.

      if (data.results.length === 0) {
        showEmpty();
        return;
      }

      // Successful search.

      clearStates();

      if (resultsCount) {
        resultsCount.textContent =
          `${data.results.length} albums found`;
      }

      const fragment = document.createDocumentFragment();

      data.results.forEach((album) => {
        fragment.appendChild(makeAlbumCard(album));
      });

      results.replaceChildren(fragment);

      // Animate the album cards after loading.

      if (window.gsap && !reduceMotion) {
        gsap.fromTo(
          results.children,
          {
            opacity: 0,
            y: 28,
            scale: 0.97
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.65,
            stagger: 0.09,
            ease: "power2.out",
            clearProps: "all"
          }
        );
      }

    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      console.error("Music search failed:", error);

      showError(
        "We couldn't retrieve music right now. Check your internet connection and try again."
      );
    }
  }

  
  // 7. SEARCH BUTTON AND RETRY BUTTON
  

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    searchMusic(input.value);
  });

  if (retryButton) {
    retryButton.addEventListener("click", () => {
      searchMusic(lastQuery);
    });
  }

  // Automatically search for shoegaze when the page opens.

  input.value = "shoegaze";
  searchMusic("shoegaze");

});

