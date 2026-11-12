document.addEventListener("DOMContentLoaded", () => {
  // Copyright year
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // Header scroll state
  const header = document.querySelector(".site-header");
  const syncHeaderScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 12);
  };
  syncHeaderScroll();
  window.addEventListener("scroll", syncHeaderScroll, { passive: true });

  // Mobile menu toggle
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.getElementById("primary-nav");
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Product category filter
  const filterButtons = document.querySelectorAll(".filter-pill");
  const productCards = document.querySelectorAll(".product-card[data-category]");
  if (filterButtons.length && productCards.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-filter") || "all";
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        productCards.forEach((card) => {
          const category = card.getAttribute("data-category") || "";
          const show = filter === "all" || category.split(" ").includes(filter);
          card.classList.toggle("is-hidden", !show);
        });
      });
    });
  }

  // Scroll reveal
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  // Smooth, non-glitchy Apple TV 3D tilt + specular sheen for all cards
  const supportsHover = window.matchMedia("(hover: hover)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cards3d = document.querySelectorAll(
    ".hero-panel, .product-card, .platform-panel, .platform-card, .workflow-step, .address-card, .person-card, .blog-card, .featured-post, .info-card"
  );

  if (supportsHover && !prefersReducedMotion && cards3d.length) {
    cards3d.forEach((card) => {
      card.classList.add("card-3d");

      let lightEl = card.querySelector(".hero-panel-light, .card-3d-light");
      if (!lightEl) {
        lightEl = document.createElement("div");
        lightEl.className = "card-3d-light";
        lightEl.setAttribute("aria-hidden", "true");
        card.appendChild(lightEl);
      }

      let rafId = null;
      let latestEvent = null;
      const isHero = card.classList.contains("hero-panel");
      const maxTilt = isHero ? 7 : 5.5;
      const scaleVal = isHero ? 1.025 : 1.018;

      const updateTilt = () => {
        rafId = null;
        if (!latestEvent) return;
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const x = Math.max(0, Math.min(rect.width, latestEvent.clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, latestEvent.clientY - rect.top));
        const px = x / rect.width;
        const py = y / rect.height;

        const rotateY = (px - 0.5) * (maxTilt * 2);
        const rotateX = (0.5 - py) * (maxTilt * 2);
        const angle = (Math.atan2(y - rect.height / 2, x - rect.width / 2) * 180) / Math.PI - 90;
        const intensity = isHero ? 0.34 : 0.28;

        card.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scaleVal}, ${scaleVal}, ${scaleVal})`;
        lightEl.style.background = `linear-gradient(${angle.toFixed(1)}deg, rgba(255, 255, 255, ${(py * intensity).toFixed(3)}) 0%, rgba(255, 255, 255, 0) 65%)`;
      };

      card.addEventListener("mouseenter", () => {
        card.classList.add("is-tilting");
        lightEl.classList.add("light-on");
      });

      card.addEventListener("mousemove", (e) => {
        latestEvent = e;
        if (!rafId) {
          rafId = window.requestAnimationFrame(updateTilt);
        }
      });

      card.addEventListener("mouseleave", () => {
        latestEvent = null;
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        card.classList.remove("is-tilting");
        lightEl.classList.remove("light-on");
        card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      });
    });
  }

  // Windows OS Window modal for product cards
  const winOverlay = document.getElementById("win-overlay");
  const winWindow = document.getElementById("win-window");
  const winTitlebar = document.getElementById("win-titlebar");
  const winTitle = document.getElementById("win-title");
  const winIframe = document.getElementById("win-iframe");
  const winDetailView = document.getElementById("win-detail-view");
  const winCloseBtn = document.querySelector(".win-close");
  const winMinBtn = document.querySelector(".win-minimize");
  const winMaxBtn = document.querySelector(".win-maximize");

  if (winOverlay && winWindow && winIframe && winDetailView) {
    let closeTimer = null;

    const resetWindowPosition = () => {
      winWindow.style.left = "";
      winWindow.style.top = "";
      winWindow.style.position = "";
    };

    const closeWinModal = (mode = "close") => {
      if (!winOverlay.classList.contains("is-open")) return;
      winOverlay.classList.add(mode === "minimize" ? "is-minimizing" : "is-closing");
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        winOverlay.classList.remove("is-open", "is-closing", "is-minimizing");
        winOverlay.setAttribute("aria-hidden", "true");
        winWindow.classList.remove("is-maximized");
        resetWindowPosition();
        winIframe.classList.remove("is-active");
        winIframe.removeAttribute("src");
        winDetailView.classList.remove("is-active");
        winDetailView.innerHTML = "";
        document.body.style.overflow = "";
      }, 280);
    };

    const openWinModal = (card) => {
      clearTimeout(closeTimer);
      winOverlay.classList.remove("is-closing", "is-minimizing");
      winWindow.classList.remove("is-maximized");
      resetWindowPosition();

      const titleText = card.getAttribute("data-window-title") || "OGENE⁺ Viewer";
      const windowUrl = card.getAttribute("data-window-url");
      if (winTitle) winTitle.textContent = titleText;

      if (windowUrl) {
        winDetailView.classList.remove("is-active");
        winDetailView.innerHTML = "";
        winIframe.src = windowUrl;
        winIframe.classList.add("is-active");
      } else {
        winIframe.classList.remove("is-active");
        winIframe.removeAttribute("src");

        const badge = card.querySelector(".media-badge")?.textContent || "";
        const headingHTML = card.querySelector(".product-title")?.innerHTML || titleText;
        const subtitle = card.querySelector(".product-subtitle")?.textContent || "";
        const items = Array.from(card.querySelectorAll(".product-details li")).map(
          (li) => `<li>${li.textContent}</li>`
        );

        winDetailView.innerHTML = `
          <div class="win-detail-header">
            <div>
              <span class="win-detail-badge">${badge}</span>
              <h2 class="win-detail-title">${headingHTML}</h2>
              <p class="win-detail-sub">${subtitle}</p>
            </div>
            <a class="btn btn-primary" href="#contact" id="win-book-demo">Book a Demo</a>
          </div>
          <ul class="win-detail-list">${items.join("")}</ul>
        `;
        winDetailView.classList.add("is-active");

        const bookBtn = document.getElementById("win-book-demo");
        if (bookBtn) {
          bookBtn.addEventListener("click", () => closeWinModal("close"));
        }
      }

      winOverlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      window.requestAnimationFrame(() => {
        winOverlay.classList.add("is-open");
      });
    };

    document.querySelectorAll(".product-card").forEach((card) => {
      card.addEventListener("click", () => openWinModal(card));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openWinModal(card);
        }
      });
    });

    if (winCloseBtn) winCloseBtn.addEventListener("click", () => closeWinModal("close"));
    if (winMinBtn) winMinBtn.addEventListener("click", () => closeWinModal("minimize"));
    if (winMaxBtn) {
      winMaxBtn.addEventListener("click", () => {
        const maximized = winWindow.classList.toggle("is-maximized");
        if (maximized) resetWindowPosition();
      });
    }

    winOverlay.addEventListener("click", (e) => {
      if (e.target === winOverlay) closeWinModal("close");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && winOverlay.classList.contains("is-open")) {
        closeWinModal("close");
      }
    });

    // Draggable Windows OS title bar
    if (winTitlebar) {
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let origLeft = 0;
      let origTop = 0;

      winTitlebar.addEventListener("mousedown", (e) => {
        if (e.target.closest(".win-controls") || winWindow.classList.contains("is-maximized")) return;
        dragging = true;
        const rect = winWindow.getBoundingClientRect();
        winWindow.style.position = "fixed";
        winWindow.style.left = `${rect.left}px`;
        winWindow.style.top = `${rect.top}px`;
        startX = e.clientX;
        startY = e.clientY;
        origLeft = rect.left;
        origTop = rect.top;
      });

      window.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        winWindow.style.left = `${origLeft + (e.clientX - startX)}px`;
        winWindow.style.top = `${origTop + (e.clientY - startY)}px`;
      });

      window.addEventListener("mouseup", () => {
        dragging = false;
      });
    }
  }

  // Contact form handling
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const nameInput = document.getElementById("contact-name");
      const emailInput = document.getElementById("contact-email");
      const orgInput = document.getElementById("contact-organization");
      const msgInput = document.getElementById("contact-message");
      const statusEl = contactForm.querySelector(".form-status");

      const name = nameInput ? nameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const org = orgInput ? orgInput.value.trim() : "";
      const message = msgInput ? msgInput.value.trim() : "";

      if (!name || !email || !message) {
        if (statusEl) {
          statusEl.textContent = "Please complete all required fields.";
        }
        return;
      }

      const subject = encodeURIComponent(`Genetikode Inquiry from ${name}${org ? ` (${org})` : ""}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nOrganization: ${org || "N/A"}\n\n${message}`);
      window.location.href = `mailto:info@genetikode.com?subject=${subject}&body=${body}`;

      if (statusEl) {
        statusEl.textContent = "Opening your email client to send your inquiry to info@genetikode.com.";
      }
    });
  }
});
