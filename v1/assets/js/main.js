/* ==========================================================================
   KP Prestations — interactions & motion design
   GSAP 3 + ScrollTrigger + SplitText, Lenis (défilement fluide)
   Tout reste lisible et utilisable sans animation (prefers-reduced-motion).
   ========================================================================== */
(() => {
  "use strict";

  const d = document;
  const root = d.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gsap = window.gsap;
  const hasGSAP = !!(gsap && window.ScrollTrigger);
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmt = (n) => Math.round(n).toLocaleString("fr-FR");

  if (!hasGSAP || reduce) root.classList.add("no-motion");
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger, ...(window.SplitText ? [SplitText] : []));

  /* ------------------------------------------------------------------
     Images : repli élégant tant que les visuels IA ne sont pas ajoutés
     ------------------------------------------------------------------ */
  $$("img[data-optional]").forEach((img) => {
    const drop = () => {
      img.remove();
      if (hasGSAP) ScrollTrigger.refresh();
    };
    if (img.complete && img.naturalWidth === 0) drop();
    else img.addEventListener("error", drop, { once: true });
  });

  /* ------------------------------------------------------------------
     Défilement fluide (Lenis)
     ------------------------------------------------------------------ */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    if (hasGSAP) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => {
        lenis.raf(t);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
  }

  const headerOffset = () => ($(".header__bar")?.offsetHeight || 64) + 24;
  const scrollToEl = (el) => {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -headerOffset(), duration: 1.4 });
    else {
      const y = el.getBoundingClientRect().top + window.scrollY - headerOffset();
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    }
  };

  /* ------------------------------------------------------------------
     Menu mobile
     ------------------------------------------------------------------ */
  const burger = $(".burger");
  const menu = $(".mobile-menu");
  let menuOpen = false;
  const setMenu = (open) => {
    menuOpen = open;
    d.body.classList.toggle("menu-open", open);
    burger?.setAttribute("aria-expanded", String(open));
    burger?.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    if (menu) menu.inert = !open;
    if (open) {
      $(".header")?.classList.remove("is-hidden");
      lenis?.stop();
    } else lenis?.start();
  };
  burger?.addEventListener("click", () => setMenu(!menuOpen));
  d.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) {
      setMenu(false);
      burger?.focus();
    }
  });
  if (menu) menu.inert = true;

  /* Ancres internes */
  d.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (!id || id.length < 2) return;
    const el = d.getElementById(id.slice(1));
    if (!el) return;
    e.preventDefault();
    if (menuOpen) setMenu(false);
    if (a.dataset.work) preselectWork(a.dataset.work);
    scrollToEl(el);
    history.replaceState(null, "", id);
  });

  /* ------------------------------------------------------------------
     En-tête : masquage au défilement, thème clair/sombre, lien actif
     ------------------------------------------------------------------ */
  const header = $(".header");
  const dock = $(".dock");
  const hero = $(".hero");
  const contact = $("#devis");
  const lightSections = $$("[data-header='light']");
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
      const down = y > lastY + 2;
      const up = y < lastY - 2;
      if (down && y > window.innerHeight * 0.6 && !menuOpen) header.classList.add("is-hidden");
      else if (up || y < 120) header.classList.remove("is-hidden");
      const probe = 44;
      const onLight = lightSections.some((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= probe && r.bottom >= probe;
      });
      header.classList.toggle("on-light", onLight);
    }
    if (dock && hero) {
      const past = y > hero.offsetHeight * 0.75;
      let atContact = false;
      if (contact) {
        const r = contact.getBoundingClientRect();
        atContact = r.top < window.innerHeight * 0.85;
      }
      const v = past && !atContact;
      dock.classList.toggle("is-visible", v);
      dock.inert = !v;
    }
    lastY = y;
    ticking = false;
  };
  const requestScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  };
  if (lenis) lenis.on("scroll", requestScroll);
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll, { passive: true });
  onScroll();

  const navLinks = $$(".nav a[href^='#']");
  if (navLinks.length && "IntersectionObserver" in window) {
    const map = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            navLinks.forEach((a) => a.classList.remove("is-active"));
            map.get(en.target.id)?.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    map.forEach((_, id) => {
      const s = d.getElementById(id);
      if (s) io.observe(s);
    });
  }

  /* ------------------------------------------------------------------
     Compteurs
     ------------------------------------------------------------------ */
  const countTo = (el, to, dur = 1.6) => {
    const decimals = +(el.dataset.decimals || 0);
    const render = (v) => (el.textContent = decimals ? v.toFixed(decimals).replace(".", ",") : fmt(v));
    if (!hasGSAP || reduce) return render(to);
    const o = { v: parseFloat(el.dataset.from || 0) };
    gsap.to(o, { v: to, duration: dur, ease: "power3.out", onUpdate: () => render(o.v) });
  };
  const counters = $$("[data-count]");
  if (counters.length) {
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              countTo(en.target, parseFloat(en.target.dataset.count));
              io.unobserve(en.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((c) => io.observe(c));
    } else counters.forEach((c) => countTo(c, parseFloat(c.dataset.count)));
  }

  /* ------------------------------------------------------------------
     « Où part votre chaleur ? » — étapes synchronisées avec la maison
     ------------------------------------------------------------------ */
  const heatSvg = $(".heat__svg");
  const heatSteps = $$(".heat-step");
  const hudZone = $(".heat__hud-zone");
  const hudValue = $(".heat__hud-value");
  let heatValue = { v: 0 };
  const setHeat = (step) => {
    if (!step || step.classList.contains("is-active")) return;
    heatSteps.forEach((s) => s.classList.toggle("is-active", s === step));
    if (heatSvg) heatSvg.dataset.active = step.dataset.zone;
    if (hudZone) hudZone.textContent = step.dataset.label || "";
    const target = parseFloat(step.dataset.pct || 0);
    const suffix = step.dataset.suffix || " %";
    if (hudValue) {
      if (hasGSAP && !reduce) {
        gsap.to(heatValue, {
          v: target,
          duration: 0.9,
          ease: "power3.out",
          onUpdate: () => (hudValue.textContent = (step.dataset.prefix || "") + Math.round(heatValue.v) + suffix),
        });
      } else hudValue.textContent = (step.dataset.prefix || "") + target + suffix;
    }
  };
  if (heatSteps.length && "IntersectionObserver" in window) {
    const isDesk = matchMedia("(min-width: 1000px)").matches;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && setHeat(en.target)),
      { rootMargin: isDesk ? "-48% 0px -48% 0px" : "-62% 0px -30% 0px" }
    );
    heatSteps.forEach((s) => io.observe(s));
  }
  if (heatSteps[0]) setHeat(heatSteps[0]);

  /* ------------------------------------------------------------------
     Avant / après
     ------------------------------------------------------------------ */
  const ba = $(".ba");
  if (ba) {
    const knob = $(".ba__knob", ba);
    let pos = 50;
    let dragging = false;
    const set = (p) => {
      pos = clamp(p, 2, 98);
      ba.style.setProperty("--pos", pos + "%");
      knob?.setAttribute("aria-valuenow", String(Math.round(pos)));
      knob?.setAttribute("aria-valuetext", `${Math.round(100 - pos)} % avant, ${Math.round(pos)} % après`);
    };
    const fromEvent = (e) => {
      const r = ba.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    };
    ba.addEventListener("pointerdown", (e) => {
      dragging = true;
      ba.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    ba.addEventListener("pointermove", (e) => dragging && fromEvent(e));
    const stop = () => (dragging = false);
    ba.addEventListener("pointerup", stop);
    ba.addEventListener("pointercancel", stop);
    knob?.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 10 : 4;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") set(pos - step);
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") set(pos + step);
      else if (e.key === "Home") set(2);
      else if (e.key === "End") set(98);
      else return;
      e.preventDefault();
    });
    set(50);
    if (hasGSAP && !reduce) {
      const o = { p: 50 };
      gsap
        .timeline({ scrollTrigger: { trigger: ba, start: "top 70%", once: true } })
        .to(o, { p: 22, duration: 1.1, ease: "power3.inOut", onUpdate: () => !dragging && set(o.p) })
        .to(o, { p: 72, duration: 1.3, ease: "power3.inOut", onUpdate: () => !dragging && set(o.p) })
        .to(o, { p: 50, duration: 1, ease: "power3.inOut", onUpdate: () => !dragging && set(o.p) });
    }
  }

  /* ------------------------------------------------------------------
     Simulateur d'économies
     Hypothèses : part des déperditions par poste (ADEME) × efficacité
     de l'isolation × coefficient d'ancienneté du logement.
     Prix indicatifs TTC posés, hors aides.
     ------------------------------------------------------------------ */
  const SIM = window.KP_SIM || {
    works: {
      murs: { share: 0.225, gain: 0.75, price: [55, 110], cee: [12, 19] },
      rampants: { share: 0.28, gain: 0.8, price: [55, 120], cee: [13, 20] },
      cave: { share: 0.085, gain: 0.8, price: [30, 65], cee: [6, 10] },
    },
    age: { avant1975: 1, "1975-2000": 0.7, apres2000: 0.4 },
  };
  const sim = $(".sim__panel");
  if (sim) {
    const out = {
      save: $("[data-sim='save']", sim),
      saveRange: $("[data-sim='save-range']", sim),
      cost: $("[data-sim='cost']", sim),
      cee: $("[data-sim='cee']", sim),
      payback: $("[data-sim='payback']", sim),
      pct: $("[data-sim='pct']", sim),
      before: $("[data-sim='before']", sim),
      after: $("[data-sim='after']", sim),
      barBefore: $(".sim__bar-fill--before", sim),
      barAfter: $(".sim__bar-fill--after", sim),
      surfOut: $("[data-sim='surface-out']", sim),
      billOut: $("[data-sim='bill-out']", sim),
      cta: $("[data-sim='cta']", sim),
    };
    const shown = { save: 0 };
    const paintRange = (r) => {
      const p = ((r.value - r.min) / (r.max - r.min)) * 100;
      r.style.setProperty("--p", p + "%");
    };
    const compute = () => {
      const work = ($("input[name='sim-work']:checked", sim) || {}).value || "murs";
      const age = ($("input[name='sim-age']:checked", sim) || {}).value || "avant1975";
      const surface = +$("#sim-surface", sim).value;
      const bill = +$("#sim-bill", sim).value;
      const w = SIM.works[work];
      const k = SIM.age[age] || 1;
      const ratio = clamp(w.share * w.gain * k, 0.02, 0.4);
      const save = bill * ratio;
      const lo = save * 0.85;
      const hi = save * 1.15;
      const costLo = surface * w.price[0];
      const costHi = surface * w.price[1];
      const ceeLo = surface * w.cee[0];
      const ceeHi = surface * w.cee[1];
      const payback = Math.max(0, (costLo + costHi) / 2 - (ceeLo + ceeHi) / 2) / Math.max(save, 1);

      out.surfOut && (out.surfOut.textContent = surface + " m²");
      out.billOut && (out.billOut.textContent = fmt(bill) + " €");
      out.saveRange && (out.saveRange.textContent = `entre ${fmt(lo)} et ${fmt(hi)} € par an`);
      out.cost && (out.cost.textContent = `${fmt(costLo)} – ${fmt(costHi)} €`);
      out.cee && (out.cee.textContent = `− ${fmt(ceeLo)} à ${fmt(ceeHi)} €`);
      out.payback && (out.payback.textContent = payback < 1 ? "moins d’un an" : `≈ ${Math.round(payback)} ans`);
      out.pct && (out.pct.textContent = "−" + Math.round(ratio * 100) + " %");
      out.before && (out.before.textContent = fmt(bill) + " €");
      out.after && (out.after.textContent = fmt(bill - save) + " €");
      if (out.barBefore) out.barBefore.style.transform = "scaleX(1)";
      if (out.barAfter) out.barAfter.style.transform = `scaleX(${(1 - ratio).toFixed(3)})`;
      if (out.cta) out.cta.dataset.work = work;

      if (out.save) {
        if (hasGSAP && !reduce) {
          gsap.to(shown, { save, duration: 0.8, ease: "power3.out", onUpdate: () => (out.save.textContent = fmt(shown.save)) });
        } else out.save.textContent = fmt(save);
      }
    };
    $$("input", sim).forEach((i) => {
      i.addEventListener("input", () => {
        if (i.type === "range") paintRange(i);
        compute();
      });
    });
    $$("input[type='range']", sim).forEach(paintRange);
    compute();
  }

  /* ------------------------------------------------------------------
     FAQ (accordéon)
     ------------------------------------------------------------------ */
  $$(".qa").forEach((qa) => {
    const btn = $(".qa__q", qa);
    btn?.addEventListener("click", () => {
      const open = !qa.classList.contains("is-open");
      qa.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      setTimeout(() => hasGSAP && ScrollTrigger.refresh(), 650);
    });
  });

  /* ------------------------------------------------------------------
     Formulaire de devis en 3 étapes
     ------------------------------------------------------------------ */
  const form = $("#quote-form");
  let goToStep = () => {};
  function preselectWork(work) {
    if (!form || !work) return;
    const input = $(`input[name='travaux'][value='${work}']`, form);
    if (input) input.checked = true;
  }
  if (form) {
    const steps = $$(".form__step", form);
    const bars = $$(".form__progress span", form);
    const label = $("[data-step-label]", form);
    const back = $(".form__back", form);
    const next = $(".form__next", form);
    const nextLabel = $(".form__next .btn__label", form);
    const done = $(".form__done", form);
    const top = $(".form__top", form);
    const nav = $(".form__nav", form);
    let current = 0;

    const titles = ["Vos travaux", "Votre logement", "Vos coordonnées"];
    goToStep = (i, focus = true) => {
      current = clamp(i, 0, steps.length - 1);
      steps.forEach((s, k) => (s.hidden = k !== current));
      bars.forEach((b, k) => b.classList.toggle("is-done", k <= current));
      if (label) label.textContent = `Étape ${current + 1} sur ${steps.length} · ${titles[current]}`;
      if (back) back.hidden = current === 0;
      if (nextLabel) nextLabel.textContent = current === steps.length - 1 ? "Envoyer ma demande" : "Continuer";
      if (hasGSAP && !reduce) gsap.fromTo(steps[current], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out" });
      if (focus) steps[current].querySelector("input, select, textarea")?.focus({ preventScroll: true });
      if (hasGSAP) ScrollTrigger.refresh();
    };

    const validate = (i) => {
      let ok = true;
      const step = steps[i];
      if (i === 0) {
        const any = $$("input[name='travaux']:checked", step).length > 0;
        const err = $("[data-error='travaux']", step);
        if (err) err.style.display = any ? "none" : "block";
        ok = any;
      }
      $$("[required]", step).forEach((f) => {
        const wrap = f.closest(".field") || f.closest(".consent");
        let valid = f.type === "checkbox" ? f.checked : f.value.trim() !== "";
        if (valid && f.type === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim());
        if (valid && f.type === "tel") valid = f.value.replace(/[^\d]/g, "").length >= 10;
        if (valid && f.name === "cp") valid = /^\d{5}$/.test(f.value.trim());
        wrap?.classList.toggle("is-invalid", !valid);
        if (!valid) ok = false;
      });
      if (!ok) step.querySelector(".is-invalid input, .is-invalid select, .is-invalid textarea")?.focus();
      return ok;
    };

    $$("input, select, textarea", form).forEach((f) =>
      f.addEventListener("input", () => (f.closest(".field") || f.closest(".consent"))?.classList.remove("is-invalid"))
    );

    back?.addEventListener("click", () => goToStep(current - 1));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(current)) return;
      if (current < steps.length - 1) return goToStep(current + 1);

      const data = new FormData(form);
      const works = data.getAll("travaux").join(", ");
      const lines = [
        `Travaux : ${works}`,
        `Logement : ${data.get("logement") || "-"} · construit ${data.get("annee") || "-"} · ${data.get("surface") || "?"} m²`,
        `Chauffage : ${data.get("chauffage") || "-"}`,
        `Nom : ${data.get("nom")}`,
        `Téléphone : ${data.get("tel")}`,
        `E-mail : ${data.get("email")}`,
        `Commune : ${data.get("commune") || "-"} (${data.get("cp")})`,
        `Message : ${data.get("message") || "-"}`,
      ];
      const mail = $("[data-mailto]", form);
      if (mail) {
        const to = mail.dataset.mailto;
        mail.href = `mailto:${to}?subject=${encodeURIComponent("Demande de devis isolation – " + (data.get("commune") || data.get("cp")))}&body=${encodeURIComponent(lines.join("\n"))}`;
      }
      steps.forEach((s) => (s.hidden = true));
      if (top) top.hidden = true;
      if (nav) nav.hidden = true;
      if (done) {
        done.hidden = false;
        if (hasGSAP && !reduce) {
          gsap.from($(".form__done-icon", done), { scale: 0.4, opacity: 0, duration: 1, ease: "elastic.out(1, 0.55)" });
          gsap.from($$(".form__done > :not(.form__done-icon)", done), { y: 14, opacity: 0, duration: 0.8, stagger: 0.08, ease: "expo.out", delay: 0.15 });
        }
      }
      if (hasGSAP) ScrollTrigger.refresh();
    });

    goToStep(0, false);
  }

  /* Carte « Estimation express » du hero → formulaire pré-rempli */
  const quick = $("#quick-form");
  quick?.addEventListener("submit", (e) => {
    e.preventDefault();
    const work = ($("input[name='quick-work']:checked", quick) || {}).value;
    const cp = $("#quick-cp", quick)?.value.trim();
    if (form) {
      if (work) preselectWork(work);
      if (cp) {
        const cpField = $("input[name='cp']", form);
        if (cpField) cpField.value = cp;
      }
      goToStep(work ? 1 : 0, false);
    }
    scrollToEl(contact);
  });

  /* Lien CTA du simulateur → formulaire pré-rempli */
  $$("[data-sim='cta']").forEach((a) =>
    a.addEventListener("click", () => {
      if (a.dataset.work) {
        preselectWork(a.dataset.work);
        goToStep(1, false);
      }
    })
  );

  /* ------------------------------------------------------------------
     Année du pied de page
     ------------------------------------------------------------------ */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ------------------------------------------------------------------
     Reflet sur le verre + inclinaison + boutons magnétiques
     ------------------------------------------------------------------ */
  if (finePointer) {
    $$(".glare").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", e.clientX - r.left + "px");
        el.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }
  if (finePointer && hasGSAP && !reduce) {
    $$("[data-tilt]").forEach((el) => {
      const max = parseFloat(el.dataset.tilt) || 4;
      const rx = gsap.quickTo(el, "rotateX", { duration: 0.8, ease: "power3.out" });
      const ry = gsap.quickTo(el, "rotateY", { duration: 0.8, ease: "power3.out" });
      gsap.set(el, { transformPerspective: 1200 });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * max);
        rx(-py * max);
      });
      el.addEventListener("pointerleave", () => {
        rx(0);
        ry(0);
      });
    });
    $$("[data-magnetic]").forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.3;
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener("pointerleave", () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* ==================================================================
     MOTION (GSAP) — uniquement si autorisé
     ================================================================== */
  const loader = $(".loader");
  const finishIntro = () => {
    root.classList.add("hero-ready");
    loader?.remove();
  };

  if (!hasGSAP || reduce) {
    finishIntro();
    return;
  }

  const mm = gsap.matchMedia();
  const fontsReady = Promise.race([d.fonts ? d.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);

  let seen = false;
  try {
    seen = sessionStorage.getItem("kp-intro") === "1";
    sessionStorage.setItem("kp-intro", "1");
  } catch (_) {}

  fontsReady.then(() => {
    /* ---------- Intro : préchargement + hero ---------- */
    const heroTitle = $(".hero__title");
    const tl = gsap.timeline({ defaults: { ease: "expo.out" }, onComplete: finishIntro });

    if (loader && !seen) {
      const paths = $$(".loader__logo [data-draw]", loader);
      paths.forEach((p) => {
        const len = p.getTotalLength ? p.getTotalLength() : 200;
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      tl.to(paths, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.08 }, 0)
        .to($(".loader__bar span", loader), { scaleX: 1, duration: 1.1, ease: "power2.inOut" }, 0)
        .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" }, 1.15);
    } else if (loader) {
      loader.remove();
    }

    const t0 = loader && !seen ? 1.35 : 0.1;
    tl.fromTo(".hero__media-inner", { scale: 1.18 }, { scale: 1, duration: 2.4, ease: "expo.out" }, t0 - 0.35);

    if (heroTitle && window.SplitText) {
      gsap.set(heroTitle, { opacity: 1 });
      const split = SplitText.create(heroTitle, { type: "lines", mask: "lines", linesClass: "split-line" });
      tl.from(split.lines, { yPercent: 115, rotate: 2, duration: 1.4, stagger: 0.1 }, t0);
    } else if (heroTitle) {
      tl.to(heroTitle, { opacity: 1, duration: 1 }, t0);
    }
    tl.fromTo(
      $$("[data-hero-in]").filter((el) => el !== heroTitle),
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 },
      t0 + 0.35
    );

    /* ---------- Hero : parallaxe au défilement ---------- */
    gsap.to(".hero__media-inner", {
      yPercent: 14,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__content", {
      yPercent: -8,
      opacity: 0.25,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true },
    });

    /* ---------- Titres : révélation par lignes ---------- */
    if (window.SplitText) {
      $$("[data-split]").forEach((el) => {
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit(self) {
            return gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.25,
              ease: "expo.out",
              stagger: 0.09,
              scrollTrigger: { trigger: el, start: "top 86%", once: true },
            });
          },
        });
      });
    }

    /* Phrase manifeste : les mots s'allument au défilement */
    $$("[data-words]").forEach((el) => {
      if (!window.SplitText) return;
      SplitText.create(el, {
        type: "words",
        autoSplit: true,
        onSplit(self) {
          return gsap.fromTo(
            self.words,
            { opacity: 0.16 },
            {
              opacity: 1,
              ease: "none",
              stagger: 0.1,
              scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
            }
          );
        },
      });
    });

    /* ---------- Apparitions ---------- */
    $$("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        y: parseFloat(el.dataset.reveal) || 40,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        delay: parseFloat(el.dataset.delay || 0),
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    });
    $$("[data-stagger]").forEach((group) => {
      const items = Array.from(group.children);
      gsap.from(items, {
        y: 50,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: group, start: "top 86%", once: true },
      });
    });

    /* Parallaxe douce */
    $$("[data-parallax]").forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 10;
      gsap.fromTo(
        el,
        { yPercent: -amt },
        { yPercent: amt, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } }
      );
    });

    /* Taches de lumière qui respirent */
    $$(".mesh__blob").forEach((b, i) => {
      gsap.to(b, {
        x: gsap.utils.random(-60, 60),
        y: gsap.utils.random(-50, 50),
        scale: gsap.utils.random(0.9, 1.15),
        duration: gsap.utils.random(9, 14),
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: i * 0.6,
      });
    });

    /* Maison : tracé des lignes à l'entrée */
    const house = $(".heat__svg");
    if (house) {
      const lines = $$("[data-draw]", house);
      lines.forEach((p) => {
        const len = p.getTotalLength ? p.getTotalLength() : 400;
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.to(lines, {
        strokeDashoffset: 0,
        duration: 2,
        ease: "power2.inOut",
        stagger: 0.04,
        scrollTrigger: { trigger: house, start: "top 75%", once: true },
      });
    }

    /* Carte zone : apparition des communes */
    const towns = $$(".zone__map .town");
    if (towns.length) {
      gsap.from(towns, {
        opacity: 0,
        scale: 0.4,
        transformOrigin: "center",
        duration: 0.9,
        ease: "back.out(2)",
        stagger: 0.035,
        scrollTrigger: { trigger: ".zone__map", start: "top 75%", once: true },
      });
      const river = $(".zone__map [data-river]");
      if (river) {
        const len = river.getTotalLength();
        gsap.fromTo(
          river,
          { strokeDasharray: len, strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut", scrollTrigger: { trigger: ".zone__map", start: "top 75%", once: true } }
        );
      }
    }

    /* Bandeau communes : accélère avec la vitesse de défilement */
    const marquee = $(".marquee__track");
    if (marquee && lenis) {
      let skew = 0;
      lenis.on("scroll", ({ velocity }) => {
        const v = clamp(velocity, -40, 40);
        skew += (v - skew) * 0.2;
        marquee.style.animationDuration = Math.max(14, 60 - Math.abs(skew) * 1.4) + "s";
      });
    }

    /* ---------- Méthode : défilement horizontal épinglé (desktop) ---------- */
    const method = $(".method");
    if (method) {
      mm.add("(min-width: 1100px)", () => {
        method.classList.add("method--h");
        const pin = $(".method__pin", method);
        const track = $(".method__track", method);
        const bar = $(".method__progress span", method);
        const dist = () => Math.max(0, track.scrollWidth - pin.clientWidth);
        const tween = gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: () => "+=" + dist(),
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate: (self) => bar && gsap.set(bar, { scaleX: self.progress }),
          },
        });
        $$(".mstep", track).forEach((card) => {
          gsap.from(card, {
            opacity: 0.25,
            scale: 0.94,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              containerAnimation: tween,
              start: "left 95%",
              end: "left 55%",
              scrub: true,
            },
          });
        });
        return () => {
          method.classList.remove("method--h");
          gsap.set(track, { clearProps: "transform" });
        };
      });
      mm.add("(max-width: 1099px)", () => {
        const bar = $(".method__progress span", method);
        if (!bar) return;
        gsap.fromTo(
          bar,
          { scaleX: 0 },
          { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".method__track", start: "top 70%", end: "bottom 70%", scrub: true } }
        );
      });
    }

    /* Recalcul une fois tout chargé */
    window.addEventListener("load", () => ScrollTrigger.refresh());
    ScrollTrigger.refresh();
  });

  /* Filet de sécurité : jamais de contenu invisible */
  setTimeout(() => {
    if (!root.classList.contains("hero-ready")) {
      root.classList.add("no-motion");
      $$("[data-hero-in]").forEach((el) => (el.style.opacity = 1));
      finishIntro();
    }
  }, 6000);
})();
