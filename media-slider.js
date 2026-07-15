(() => {
  const CONFIG = {
    bunnyStreamHostname: "vz-f88e5e4c-151.b-cdn.net",
    mobileBreakpoint: 991,
    desktopOffsetRatio: 1 / 6,
    mobileOffset: 0,
    slideGap: 10,
    speed: 450
  };

  const isMobile = () => window.innerWidth <= CONFIG.mobileBreakpoint;

  const getOffset = () =>
    isMobile()
      ? CONFIG.mobileOffset
      : window.innerWidth * CONFIG.desktopOffsetRatio;

  function getMediaUrls(element) {
    return element.innerHTML
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/&amp;/g, "&")
      .replace(/<[^>]+>/g, "")
      .split(/\s+/)
      .map(value => value.trim())
      .filter(value => /^https?:\/\//i.test(value));
  }

  function getPathname(url) {
    try {
      return decodeURIComponent(new URL(url).pathname).toLowerCase();
    } catch {
      return decodeURIComponent(url).toLowerCase();
    }
  }

  function isBunnyStreamUrl(url) {
    try {
      const parsed = new URL(url);
      const validHost =
        parsed.hostname === "player.mediadelivery.net" ||
        parsed.hostname === "iframe.mediadelivery.net";

      return (
        validHost &&
        (parsed.pathname.includes("/play/") ||
          parsed.pathname.includes("/embed/"))
      );
    } catch {
      return false;
    }
  }

  function isStorageVideoUrl(url) {
    return /\.(mp4|webm|mov|m4v)$/i.test(getPathname(url));
  }

  function getBunnyData(url) {
    try {
      const parts = new URL(url).pathname.split("/").filter(Boolean);
      const modeIndex = parts.findIndex(
        part => part === "play" || part === "embed"
      );

      if (modeIndex < 0) return null;

      const libraryId = parts[modeIndex + 1];
      const videoId = parts[modeIndex + 2];

      return libraryId && videoId
        ? { libraryId, videoId }
        : null;
    } catch {
      return null;
    }
  }

  function setSlideFormat(slide, width, height) {
    if (!width || !height) return;

    slide.classList.remove("portrait", "landscape");
    slide.classList.add(width / height > 1.2 ? "landscape" : "portrait");
  }

  function createImage(url, slide, updateSwiper) {
    const image = document.createElement("img");

    image.src = url;
    image.alt = "";
    image.loading = "eager";
    image.decoding = "async";
    image.draggable = false;

    image.addEventListener(
      "load",
      () => {
        setSlideFormat(slide, image.naturalWidth, image.naturalHeight);
        image.classList.add("is-loaded");
        updateSwiper();
      },
      { once: true }
    );

    image.addEventListener("error", () => {
      console.warn("Media Slider: image failed to load", url);
    });

    return image;
  }

  function configureStorageVideo(video) {
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = false;
    video.preload = "metadata";

    video.setAttribute("muted", "");
    video.setAttribute("loop", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("disablepictureinpicture", "");
    video.setAttribute("disableremoteplayback", "");
  }

  function createStorageVideo(url, slide, updateSwiper) {
    const video = document.createElement("video");

    configureStorageVideo(video);
    video.src = url;

    video.addEventListener(
      "loadedmetadata",
      () => {
        setSlideFormat(slide, video.videoWidth, video.videoHeight);
        updateSwiper();
      },
      { once: true }
    );

    const reveal = () => video.classList.add("is-loaded");

    video.addEventListener("loadeddata", reveal, { once: true });
    video.addEventListener("canplay", reveal, { once: true });

    video.addEventListener("error", () => {
      console.warn("Media Slider: storage video failed to load", url);
    });

    video.load();
    return video;
  }

  function createBunnyPoster(data, slide, updateSwiper) {
    const poster = document.createElement("img");

    poster.className = "bunny-poster";
    poster.src =
      `https://${CONFIG.bunnyStreamHostname}/` +
      `${data.videoId}/thumbnail.jpg`;

    poster.alt = "";
    poster.loading = "eager";
    poster.decoding = "async";
    poster.draggable = false;

    poster.addEventListener(
      "load",
      () => {
        setSlideFormat(slide, poster.naturalWidth, poster.naturalHeight);
        poster.classList.add("is-loaded");
        updateSwiper();
      },
      { once: true }
    );

    poster.addEventListener("error", () => {
      console.warn("Media Slider: Bunny poster failed to load", poster.src);
    });

    return poster;
  }

  function createBunnyIframe(data) {
    const iframe = document.createElement("iframe");

    iframe.src =
      `https://player.mediadelivery.net/embed/` +
      `${data.libraryId}/${data.videoId}` +
      `?autoplay=true&loop=true&muted=true&preload=true&responsive=true`;

    iframe.allow =
      "autoplay; fullscreen; picture-in-picture; encrypted-media";

    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("loading", "eager");
    iframe.setAttribute("title", "Video");

    return iframe;
  }

  function activateSlide(slide) {
    if (slide._bunnyData) {
      if (!slide.querySelector("iframe")) {
        slide.appendChild(createBunnyIframe(slide._bunnyData));
      }
      return;
    }

    const video = slide.querySelector("video");
    if (video) video.play().catch(() => {});
  }

  function deactivateSlide(slide) {
    const iframe = slide.querySelector("iframe");
    if (iframe) iframe.remove();

    const video = slide.querySelector("video");
    if (video) video.pause();
  }

  function updateMedia(swiper) {
    swiper.slides.forEach((slide, index) => {
      const shouldPlay = isMobile()
        ? index === swiper.activeIndex
        : slide.classList.contains("swiper-slide-visible");

      if (shouldPlay) activateSlide(slide);
      else deactivateSlide(slide);
    });
  }

  function initSlider(root) {
    const dataElement = root.querySelector(".media-slider-data");
    const swiperElement = root.querySelector(".swiper");
    const wrapper = root.querySelector(".swiper-wrapper");

    if (!dataElement || !swiperElement || !wrapper) return;

    const urls = getMediaUrls(dataElement);
    if (!urls.length) return;

    const hasSingleSlide = urls.length === 1;
    wrapper.innerHTML = "";

    let swiper = null;
    let mediaFrame = null;

    const scheduleMediaUpdate = () => {
      if (!swiper || mediaFrame) return;

      mediaFrame = requestAnimationFrame(() => {
        mediaFrame = null;
        swiper.updateSlidesProgress();
        updateMedia(swiper);
      });
    };

    const updateSwiper = () => {
      if (!swiper) return;

      requestAnimationFrame(() => {
        swiper.update();
        scheduleMediaUpdate();
      });
    };

    urls.forEach(url => {
      const slide = document.createElement("div");
      slide.classList.add("swiper-slide", "portrait");

      if (hasSingleSlide) slide.classList.add("is-single");

      if (isBunnyStreamUrl(url)) {
        const data = getBunnyData(url);

        if (!data) {
          console.warn("Media Slider: invalid Bunny Stream URL", url);
          return;
        }

        slide._bunnyData = data;
        slide.appendChild(createBunnyPoster(data, slide, updateSwiper));
      } else if (isStorageVideoUrl(url)) {
        slide.appendChild(createStorageVideo(url, slide, updateSwiper));
      } else {
        slide.appendChild(createImage(url, slide, updateSwiper));
      }

      wrapper.appendChild(slide);
    });

    let gestureStartIndex = 0;
    let startX = 0;
    let startY = 0;
    let wasDragged = false;

    swiper = new Swiper(swiperElement, {
      slidesPerView: "auto",
      slidesPerGroup: 1,
      slidesPerGroupSkip: 0,
      spaceBetween: CONFIG.slideGap,
      slidesOffsetBefore: getOffset(),
      slidesOffsetAfter: getOffset(),
      speed: CONFIG.speed,

      grabCursor: !hasSingleSlide,
      allowTouchMove: !hasSingleSlide,

      watchOverflow: true,
      watchSlidesProgress: true,
      observer: true,
      observeParents: true,

      simulateTouch: true,
      followFinger: true,
      touchStartPreventDefault: false,
      touchMoveStopPropagation: false,

      freeMode: false,
      shortSwipes: true,
      longSwipes: true,
      longSwipesRatio: 0.25,
      longSwipesMs: 300,

      resistance: true,
      resistanceRatio: 0.85,

      mousewheel: hasSingleSlide
        ? false
        : {
            forceToAxis: true,
            releaseOnEdges: true,
            thresholdDelta: 25,
            thresholdTime: 500
          },

      keyboard: {
        enabled: !hasSingleSlide,
        onlyInViewport: true
      },

      on: {
        init() {
          scheduleMediaUpdate();
        },

        touchStart(currentSwiper, event) {
          gestureStartIndex = currentSwiper.activeIndex;
          wasDragged = false;

          const point = event.touches ? event.touches[0] : event;
          startX = point.clientX;
          startY = point.clientY;
        },

        touchMove(currentSwiper, event) {
          const point = event.touches ? event.touches[0] : event;
          const dx = Math.abs(point.clientX - startX);
          const dy = Math.abs(point.clientY - startY);

          if (dx > 8 || dy > 8) wasDragged = true;
        },

        touchEnd(currentSwiper) {
          const difference =
            currentSwiper.activeIndex - gestureStartIndex;

          if (difference > 1) {
            currentSwiper.slideTo(
              gestureStartIndex + 1,
              CONFIG.speed
            );
          } else if (difference < -1) {
            currentSwiper.slideTo(
              Math.max(gestureStartIndex - 1, 0),
              CONFIG.speed
            );
          }

          scheduleMediaUpdate();
        },

        click(currentSwiper) {
          if (hasSingleSlide || wasDragged) return;

          const clickedIndex = currentSwiper.clickedIndex;

          if (
            clickedIndex == null ||
            clickedIndex === currentSwiper.activeIndex
          ) {
            return;
          }

          currentSwiper.slideTo(clickedIndex, CONFIG.speed);
        },

        slideChange() {
          scheduleMediaUpdate();
        },

        transitionEnd() {
          scheduleMediaUpdate();
        },

        resize(currentSwiper) {
          const offset = getOffset();

          currentSwiper.params.spaceBetween = CONFIG.slideGap;
          currentSwiper.params.slidesOffsetBefore = offset;
          currentSwiper.params.slidesOffsetAfter = offset;

          currentSwiper.update();
          scheduleMediaUpdate();
        }
      }
    });

    scheduleMediaUpdate();
  }

  function initAll() {
    if (typeof window.Swiper !== "function") {
      console.error(
        "Media Slider: Swiper is not loaded. Include swiper-bundle.min.js first."
      );
      return;
    }

    document.querySelectorAll(".media-slider").forEach(initSlider);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
