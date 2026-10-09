/* ==========================================================================
   KP Prestations — interactions & animations
   GSAP 3 + ScrollTrigger + SplitText, Lenis (défilement fluide).
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
  const NB = " ";
  const fmt = (n) => Math.round(n).toLocaleString("fr-FR");
  const safe = (fn) => {
    try {
      fn();
    } catch (err) {
      console.error(err);
    }
  };

  if (!hasGSAP || reduce) root.classList.add("no-motion");
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger, ...(window.SplitText ? [SplitText] : []));

  /* Images : repli tant que les photos ne sont pas ajoutées */
  safe(() => {
    $$("img[data-optional]").forEach((img) => {
      const drop = () => {
        img.remove();
        if (hasGSAP) ScrollTrigger.refresh();
      };
      if (img.complete && img.naturalWidth === 0) drop();
      else img.addEventListener("error", drop, { once: true });
    });
  });

  /* ------------------------------------------------------------------
     Défilement fluide
     ------------------------------------------------------------------ */
  let lenis = null;
  safe(() => {
    if (reduce || !window.Lenis) return;
    lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
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
  });

  const headerOffset = () => ($(".header__bar")?.offsetHeight || 56) + 32;
  const scrollToEl = (el) => {
    if (!el) return;
    const method = el.id === "methode" && el.classList.contains("method--h") ? $(".method__pin", el) : null;
    if (lenis) {
      if (method) lenis.scrollTo(method.getBoundingClientRect().top + window.scrollY, { duration: 1.3 });
      else lenis.scrollTo(el, { duration: 1.3 });
    } else {
      const target = method || el;
      const y = target.getBoundingClientRect().top + window.scrollY - (method ? 0 : headerOffset());
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    }
  };
  const focusEl = (el) => {
    if (!el) return;
    if (!el.matches("a, button, input, select, textarea, [tabindex]")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  };

  /* ------------------------------------------------------------------
     Menu mobile
     ------------------------------------------------------------------ */
  const header = $(".header");
  const burger = $(".burger");
  const menu = $(".mobile-menu");
  const dock = $(".dock");
  let menuOpen = false;
  const setMenu = (open) => {
    menuOpen = open;
    d.body.classList.toggle("menu-open", open);
    burger?.setAttribute("aria-expanded", String(open));
    burger?.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    if (menu) menu.inert = !open;
    $$("main, footer").forEach((n) => (n.inert = open));
    if (dock) dock.inert = open || !dock.classList.contains("is-visible");
    if (open) {
      header?.classList.remove("is-hidden");
      lenis?.stop();
      $(".mobile-menu__nav a", menu)?.focus({ preventScroll: true });
    } else lenis?.start();
  };
  safe(() => {
    if (menu) menu.inert = true;
    burger?.addEventListener("click", () => setMenu(!menuOpen));
    d.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuOpen) {
        setMenu(false);
        burger?.focus();
      }
    });
    matchMedia("(min-width: 1080px)").addEventListener("change", (e) => e.matches && menuOpen && setMenu(false));
  });

  /* Ancres internes : défilement + déplacement du focus */
  d.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (!id || id.length < 2) return;
    const el = d.getElementById(id.slice(1));
    if (!el) return;
    e.preventDefault();
    if (menuOpen) setMenu(false);
    if (a.dataset.work) preselectWork(a.dataset.work, true);
    scrollToEl(el);
    if (id === "#devis") focusFormStep();
    else focusEl(el);
    history.replaceState(null, "", id);
  });

  /* ------------------------------------------------------------------
     En-tête, barre mobile, lien actif
     ------------------------------------------------------------------ */
  safe(() => {
    const hero = $(".hero");
    const contact = $("#devis");
    let lastY = window.scrollY;
    let ticking = false;
    header?.addEventListener("focusin", () => header.classList.remove("is-hidden"));
    const onScroll = () => {
      const y = window.scrollY;
      if (header) {
        header.classList.toggle("is-scrolled", y > 16);
        const keep = header.contains(d.activeElement);
        if (y > lastY + 2 && y > window.innerHeight * 0.6 && !menuOpen && !keep) header.classList.add("is-hidden");
        else if (y < lastY - 2 || y < 120) header.classList.remove("is-hidden");
      }
      if (dock && hero) {
        const past = y > hero.offsetHeight * 0.6;
        const atContact = contact ? contact.getBoundingClientRect().top < window.innerHeight * 0.85 : false;
        const v = past && !atContact;
        dock.classList.toggle("is-visible", v);
        dock.inert = !v || menuOpen;
      }
      lastY = y;
      ticking = false;
    };
    const request = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    };
    lenis?.on("scroll", request);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    onScroll();

    const links = $$(".nav a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;
    const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((a) => a.classList.remove("is-active"));
          map.get(en.target.id)?.classList.add("is-active");
        }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    map.forEach((_, id) => d.getElementById(id) && io.observe(d.getElementById(id)));
  });

  /* ------------------------------------------------------------------
     Compteurs
     ------------------------------------------------------------------ */
  safe(() => {
    const countTo = (el, to) => {
      const dec = +(el.dataset.decimals || 0);
      const render = (v) => (el.textContent = dec ? v.toFixed(dec).replace(".", ",") : fmt(v));
      if (!hasGSAP || reduce) return render(to);
      const o = { v: 0 };
      gsap.to(o, { v: to, duration: 1.6, ease: "power3.out", onUpdate: () => render(o.v) });
    };
    const els = $$("[data-count]");
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          countTo(en.target, parseFloat(en.target.dataset.count));
          io.unobserve(en.target);
        }),
      { threshold: 0.6 }
    );
    els.forEach((c) => io.observe(c));
  });

  /* ------------------------------------------------------------------
     Où part votre chaleur : étapes synchronisées avec la maison
     ------------------------------------------------------------------ */
  safe(() => {
    const svg = $(".heat__svg");
    const steps = $$(".heat-step");
    const visual = $(".heat__visual");
    const hudLabel = $(".heat__hud-label");
    const hudZone = $(".heat__hud-zone");
    const hudValue = $(".heat__hud-value");
    if (!steps.length) return;
    const shown = { v: 100 };
    // Texte exact affiché par l'étape (ex. « 25–30 % »), pour que l'encart et l'étape disent la même chose
    const exact = (step) => (step.querySelector(".heat-step__pct")?.firstChild?.textContent || "").trim();
    const setHeat = (step) => {
      if (!step || step.classList.contains("is-active")) return;
      steps.forEach((s) => s.classList.toggle("is-active", s === step));
      if (svg) svg.dataset.active = step.dataset.zone;
      if (hudLabel) hudLabel.textContent = step.dataset.hud || "Part des déperditions";
      if (hudZone) hudZone.textContent = step.dataset.label || "";
      const target = parseFloat(step.dataset.pct || 0);
      const prefix = step.dataset.prefix || "";
      const final = exact(step) || prefix + target + NB + "%";
      if (!hudValue) return;
      if (hasGSAP && !reduce)
        gsap.to(shown, {
          v: target,
          duration: 0.7,
          ease: "power2.out",
          overwrite: true,
          onUpdate: () => (hudValue.textContent = prefix + Math.round(shown.v) + NB + "%"),
          onComplete: () => (hudValue.textContent = final),
        });
      else hudValue.textContent = final;
    };
    // Étape active = celle qu'on voit le plus, sous la maison collée (mobile) ou dans l'écran (grand écran)
    let top = 0;
    const measure = () => {
      top = !matchMedia("(min-width: 1000px)").matches && visual ? visual.getBoundingClientRect().bottom : 0;
    };
    let ticking = false;
    const update = () => {
      ticking = false;
      measure();
      let current = steps[0];
      let best = -1;
      for (const st of steps) {
        const r = st.getBoundingClientRect();
        const seen = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, top);
        if (seen >= best) {
          best = seen;
          current = st;
        }
      }
      setHeat(current);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      measure();
      onScroll();
    });
    setHeat(steps[0]);
    update();
  });

  /* ------------------------------------------------------------------
     Avant / après
     ------------------------------------------------------------------ */
  safe(() => {
    const ba = $(".ba");
    if (!ba) return;
    const knob = $(".ba__knob", ba);
    let pos = 50;
    let dragging = false;
    let start = null;
    const set = (p) => {
      pos = clamp(p, 0, 100);
      ba.style.setProperty("--pos", pos + "%");
      knob?.setAttribute("aria-valuenow", String(Math.round(pos)));
      knob?.setAttribute("aria-valuetext", `${Math.round(pos)}${NB}% avant, ${Math.round(100 - pos)}${NB}% après`);
    };
    const fromEvent = (e) => {
      const r = ba.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    };
    ba.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" || e.target.closest(".ba__knob")) {
        dragging = true;
        ba.setPointerCapture(e.pointerId);
        fromEvent(e);
      } else start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    ba.addEventListener("pointermove", (e) => {
      if (dragging) return fromEvent(e);
      if (!start) return;
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx > 8 && dx > dy) {
        dragging = true;
        ba.setPointerCapture(start.id);
        fromEvent(e);
      } else if (dy > 8) start = null;
    });
    const stop = () => {
      dragging = false;
      start = null;
    };
    ba.addEventListener("pointerup", stop);
    ba.addEventListener("pointercancel", stop);
    knob?.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 10 : 4;
      const keys = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step, PageDown: -10, PageUp: 10 };
      if (e.key in keys) set(pos + keys[e.key]);
      else if (e.key === "Home") set(0);
      else if (e.key === "End") set(100);
      else return;
      e.preventDefault();
    });
    set(50);
    if (hasGSAP && !reduce) {
      const o = { p: 50 };
      const upd = () => !dragging && set(o.p);
      gsap
        .timeline({ scrollTrigger: { trigger: ba, start: "top 70%", once: true } })
        .to(o, { p: 25, duration: 1.1, ease: "power3.inOut", onUpdate: upd })
        .to(o, { p: 70, duration: 1.3, ease: "power3.inOut", onUpdate: upd })
        .to(o, { p: 50, duration: 1, ease: "power3.inOut", onUpdate: upd });
    }
  });

  /* ------------------------------------------------------------------
     Simulateur : part des déperditions (ADEME) × efficacité × ancienneté
     × part de la paroi traitée. Prix 2026 TTC posés, prime CEE indicative.
     ------------------------------------------------------------------ */
  const SIM = {
    works: {
      murs: { share: 0.225, gain: 0.75, ref: 110, price: [55, 110], cee: [12, 19] },
      rampants: { share: 0.28, gain: 0.8, ref: 90, price: [55, 120], cee: [13, 20] },
      cave: { share: 0.085, gain: 0.8, ref: 70, price: [30, 65], cee: [6, 10] },
    },
    age: { avant1975: 1, "1975-2000": 0.7, apres2000: 0.4 },
  };
  safe(() => {
    const sim = $(".sim__panel");
    if (!sim) return;
    const q = (k) => $(`[data-sim='${k}']`, sim);
    const out = {
      save: q("save"), range: q("save-range"), cost: q("cost"), cee: q("cee"), payback: q("payback"), pct: q("pct"),
      before: q("before"), after: q("after"), surf: q("surface-out"), bill: q("bill-out"), live: q("live"), cta: q("cta"),
      barAfter: $(".sim__bar-fill--after", sim), barBefore: $(".sim__bar-fill--before", sim),
    };
    const shown = { save: parseFloat((out.save?.textContent || "0").replace(/\D/g, "")) || 0 };
    const paint = (r) => r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min)) * 100 + "%");
    let liveTimer;
    const compute = () => {
      const work = ($("input[name='sim-work']:checked", sim) || {}).value || "murs";
      const age = ($("input[name='sim-age']:checked", sim) || {}).value || "avant1975";
      const surface = +$("#sim-surface", sim).value;
      const bill = +$("#sim-bill", sim).value;
      const w = SIM.works[work];
      const coverage = clamp(surface / w.ref, 0.1, 1);
      const ratio = clamp(w.share * w.gain * (SIM.age[age] || 1) * coverage, 0.005, 0.4);
      const save = bill * ratio;
      const cost = [surface * w.price[0], surface * w.price[1]];
      const cee = [surface * w.cee[0], surface * w.cee[1]];
      const payback = Math.max(0, (cost[0] + cost[1]) / 2 - (cee[0] + cee[1]) / 2) / Math.max(save, 1);
      const years = Math.round(payback);
      const paybackTxt = payback < 1 ? "moins d’un an" : payback > 30 ? "plus de 30" + NB + "ans" : `≈${NB}${years}${NB}an${years > 1 ? "s" : ""}`;

      if (out.surf) out.surf.textContent = surface + NB + "m²";
      if (out.bill) out.bill.textContent = fmt(bill) + NB + "€";
      if (out.range) out.range.textContent = `entre ${fmt(save * 0.85)} et ${fmt(save * 1.15)}${NB}€ par an`;
      if (out.cost) out.cost.textContent = `${fmt(cost[0])} – ${fmt(cost[1])}${NB}€`;
      if (out.cee) out.cee.textContent = `−${NB}${fmt(cee[0])} à ${fmt(cee[1])}${NB}€`;
      if (out.payback) out.payback.textContent = paybackTxt;
      if (out.pct) out.pct.textContent = "−" + Math.max(1, Math.round(ratio * 100)) + NB + "%";
      if (out.before) out.before.textContent = fmt(bill) + NB + "€";
      if (out.after) out.after.textContent = fmt(bill - save) + NB + "€";
      if (out.barBefore) out.barBefore.style.transform = "scaleX(1)";
      if (out.barAfter) out.barAfter.style.transform = `scaleX(${(1 - ratio).toFixed(3)})`;
      if (out.cta) out.cta.dataset.work = work;
      if (out.save) {
        if (hasGSAP && !reduce) gsap.to(shown, { save, duration: 0.7, ease: "power3.out", onUpdate: () => (out.save.textContent = fmt(shown.save)) });
        else out.save.textContent = fmt(save);
      }
      clearTimeout(liveTimer);
      liveTimer = setTimeout(() => {
        if (out.live) out.live.textContent = `Économies estimées : ${fmt(save)} euros par an. Retour sur investissement : ${paybackTxt}.`;
      }, 500);
    };
    $$("input", sim).forEach((i) =>
      i.addEventListener("input", () => {
        if (i.type === "range") paint(i);
        compute();
      })
    );
    $$("input[type='range']", sim).forEach(paint);
    compute();
  });

  /* ------------------------------------------------------------------
     FAQ
     ------------------------------------------------------------------ */
  safe(() => {
    $$(".qa").forEach((qa) => {
      const btn = $(".qa__q", qa);
      btn?.addEventListener("click", () => {
        const open = !qa.classList.contains("is-open");
        qa.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
        if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 600);
      });
    });
  });

  /* ------------------------------------------------------------------
     Formulaire de devis en 3 étapes
     ------------------------------------------------------------------ */
  const form = $("#quote-form");
  const LABELS = {
    murs: "Isolation des murs",
    rampants: "Combles et rampants",
    cave: "Caves et garages",
    platrerie: "Plâtrerie et cloisons",
    peinture: "Peinture",
    amenagement: "Aménagement intérieur",
  };
  let goToStep = () => {};
  let currentStep = 0;
  function preselectWork(work, only) {
    if (!form || !work) return;
    if (only) $$("input[name='travaux']", form).forEach((i) => (i.checked = false));
    const input = $(`input[name='travaux'][value='${work}']`, form);
    if (input) input.checked = true;
    const err = $("#err-travaux", form);
    if (err) err.classList.remove("is-shown");
  }
  function focusFormStep() {
    if (!form) return;
    const step = $$(".form__step", form)[currentStep];
    const target = step && !step.hidden ? step.querySelector("input, select, textarea") : null;
    if (target) target.focus({ preventScroll: true });
  }
  safe(() => {
    if (!form) return;
    const steps = $$(".form__step", form);
    const bars = $$(".form__progress span", form);
    const label = $("[data-step-label]", form);
    const back = $(".form__nav .form__back", form);
    const nextLabel = $(".form__next .btn__label", form);
    const done = $(".form__done", form);
    const top = $(".form__top", form);
    const nav = $(".form__nav", form);
    const titles = ["Vos travaux", "Votre logement", "Vos coordonnées"];

    goToStep = (i, focus = true) => {
      currentStep = clamp(i, 0, steps.length - 1);
      if (done) done.hidden = true;
      if (top) top.hidden = false;
      if (nav) nav.hidden = false;
      steps.forEach((s, k) => (s.hidden = k !== currentStep));
      bars.forEach((b, k) => b.classList.toggle("is-done", k <= currentStep));
      if (label) label.textContent = `Étape ${currentStep + 1} sur ${steps.length} · ${titles[currentStep]}`;
      if (back) back.hidden = currentStep === 0;
      if (nextLabel) nextLabel.textContent = currentStep === steps.length - 1 ? "Préparer ma demande" : "Continuer";
      if (hasGSAP && !reduce) gsap.fromTo(steps[currentStep], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out", clearProps: "transform,opacity" });
      if (focus) focusFormStep();
      if (hasGSAP) ScrollTrigger.refresh();
    };

    const setInvalid = (f, bad) => {
      const wrap = f.closest(".field") || f.closest(".consent");
      wrap?.classList.toggle("is-invalid", bad);
      f.setAttribute("aria-invalid", String(bad));
    };
    const validate = (i) => {
      let ok = true;
      const step = steps[i];
      if (i === 0) {
        const any = $$("input[name='travaux']:checked", step).length > 0;
        $("#err-travaux", step)?.classList.toggle("is-shown", !any);
        if (!any) {
          ok = false;
          $("input[name='travaux']", step)?.focus();
        }
      }
      $$("input, select, textarea", step).forEach((f) => {
        if (f.name === "travaux") return;
        const v = f.value.trim();
        let valid = true;
        if (f.required) valid = f.type === "checkbox" ? f.checked : v !== "";
        if (valid && v && f.type === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        if (valid && v && f.type === "tel") valid = v.replace(/\D/g, "").length >= 10;
        if (valid && v && f.name === "cp") valid = /^\d{5}$/.test(v);
        if (valid && v && f.name === "surface") valid = +v > 0;
        setInvalid(f, !valid);
        if (!valid) ok = false;
      });
      if (!ok && i > 0) step.querySelector("[aria-invalid='true']")?.focus();
      return ok;
    };

    form.addEventListener("input", (e) => {
      const f = e.target;
      if (f.name === "travaux") $("#err-travaux", form)?.classList.remove("is-shown");
      else if (f.getAttribute("aria-invalid") === "true") setInvalid(f, false);
    });
    back?.addEventListener("click", () => goToStep(currentStep - 1));
    $(".form__restart", form)?.addEventListener("click", () => goToStep(0));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(currentStep)) return;
      if (currentStep < steps.length - 1) return goToStep(currentStep + 1);

      const data = new FormData(form);
      const works = data.getAll("travaux").map((v) => LABELS[v] || v).join(", ");
      const lines = [
        `Travaux : ${works}`,
        `Logement : ${data.get("logement") || "-"}, construit ${data.get("annee") || "-"}, ${data.get("surface") ? data.get("surface") + " m²" : "surface non précisée"}`,
        `Chauffage : ${data.get("chauffage") || "-"}`,
        `Nom : ${data.get("nom")}`,
        `Téléphone : ${data.get("tel")}`,
        `E-mail : ${data.get("email")}`,
        `Commune : ${data.get("commune") || "-"} (${data.get("cp")})`,
        `Message : ${data.get("message") || "-"}`,
      ];
      const mail = $("[data-mailto]", form);
      if (mail) {
        const subject = `Demande de devis – ${data.get("commune") || data.get("cp")}`;
        mail.href = `mailto:${mail.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
      }
      steps.forEach((s) => (s.hidden = true));
      if (top) top.hidden = true;
      if (nav) nav.hidden = true;
      if (done) {
        done.hidden = false;
        done.focus({ preventScroll: true });
        if (hasGSAP && !reduce) gsap.from($$(".form__done > *", done), { y: 12, opacity: 0, duration: 0.6, stagger: 0.06, ease: "expo.out", clearProps: "all" });
      }
      if (hasGSAP) ScrollTrigger.refresh();
    });

    goToStep(0, false);
  });

  /* Carte du hero → formulaire pré-rempli */
  safe(() => {
    const quick = $("#quick-form");
    if (!quick) return;
    const cpInput = $("#quick-cp", quick);
    cpInput?.addEventListener("input", () => {
      quick.classList.remove("is-invalid");
      cpInput.removeAttribute("aria-invalid");
    });
    quick.addEventListener("submit", (e) => {
      e.preventDefault();
      const work = ($("input[name='quick-work']:checked", quick) || {}).value;
      const cp = cpInput?.value.trim() || "";
      if (cp && !/^\d{5}$/.test(cp)) {
        quick.classList.add("is-invalid");
        cpInput.setAttribute("aria-invalid", "true");
        cpInput.focus();
        return;
      }
      if (form) {
        if (work) preselectWork(work, true);
        const cpField = $("input[name='cp']", form);
        if (cp && cpField) cpField.value = cp;
        goToStep(work ? 1 : 0, false);
      }
      scrollToEl(form || $("#devis"));
      setTimeout(focusFormStep, reduce ? 0 : 900);
    });
  });

  /* CTA du simulateur → formulaire pré-rempli */
  safe(() => {
    $$("[data-sim='cta']").forEach((a) =>
      a.addEventListener("click", () => {
        if (!a.dataset.work) return;
        preselectWork(a.dataset.work, true);
        goToStep(1, false);
      })
    );
  });

  safe(() => $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear())));

  /* Reflet sur le verre (pointeur précis) */
  safe(() => {
    if (!finePointer) return;
    $$(".glare").forEach((el) =>
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", e.clientX - r.left + "px");
        el.style.setProperty("--my", e.clientY - r.top + "px");
      })
    );
  });

  /* Le code synchrone a tourné : on annule le filet de sécurité du <head> */
  clearTimeout(window.__kpBoot);

  /* ==================================================================
     ANIMATIONS (GSAP)
     ================================================================== */
  const finishIntro = () => root.classList.add("hero-ready");
  if (!hasGSAP || reduce) {
    finishIntro();
    return;
  }

  const fontsReady = Promise.race([d.fonts ? d.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);
  fontsReady.then(() =>
    safe(() => {
      const mm = gsap.matchMedia();

      /* Intro du hero */
      const title = $(".hero__title");
      const tl = gsap.timeline({ defaults: { ease: "expo.out" }, onComplete: finishIntro });
      const others = $$("[data-hero-in]").filter((el) => el !== title);
      if (title && window.SplitText) {
        gsap.set(title, { opacity: 1 });
        const split = SplitText.create(title, { type: "lines", mask: "lines", linesClass: "split-line" });
        tl.from(split.lines, { yPercent: 105, duration: 1.2, stagger: 0.08 }, 0.1);
      } else if (title) tl.to(title, { opacity: 1, duration: 0.8 }, 0.1);
      tl.fromTo(others, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.07, clearProps: "transform" }, 0.3);
      tl.fromTo(".hero__media img, .hero__media .media-fallback", { scale: 1.08 }, { scale: 1, duration: 2, ease: "expo.out" }, 0.3);

      /* Photo du hero : s'élargit jusqu'aux bords au défilement (grand écran) */
      mm.add("(min-width: 1000px)", () => {
        gsap.fromTo(
          ".hero__frame",
          { "--k": 1 },
          { "--k": 0, ease: "none", scrollTrigger: { trigger: ".hero__frame", start: "top 75%", end: "top 12%", scrub: true } }
        );
      });

      /* Titres : révélation par lignes */
      if (window.SplitText) {
        $$("[data-split]").forEach((el) =>
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            linesClass: "split-line",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 105,
                duration: 1.1,
                ease: "expo.out",
                stagger: 0.08,
                scrollTrigger: { trigger: el, start: "top 88%", once: true },
              }),
          })
        );
        $$("[data-words]").forEach((el) =>
          SplitText.create(el, {
            type: "words",
            autoSplit: true,
            onSplit: (self) =>
              gsap.fromTo(
                self.words,
                { opacity: 0.18 },
                { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 50%", scrub: true } }
              ),
          })
        );
      }

      /* Apparitions */
      $$("[data-reveal]").forEach((el) =>
        gsap.from(el, {
          y: 36,
          opacity: 0,
          duration: 1.1,
          ease: "expo.out",
          delay: parseFloat(el.dataset.delay || 0),
          clearProps: "translate,transform",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        })
      );
      $$("[data-stagger]").forEach((group) =>
        gsap.from(group.children, {
          y: 40,
          opacity: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.07,
          clearProps: "translate,transform",
          scrollTrigger: { trigger: group, start: "top 88%", once: true },
        })
      );

      /* Maison : tracé des lignes */
      const house = $(".heat__svg");
      if (house) {
        const lines = $$("[data-draw]", house);
        lines.forEach((p) => {
          const len = p.getTotalLength ? p.getTotalLength() : 400;
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        });
        gsap.to(lines, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut", stagger: 0.03, scrollTrigger: { trigger: house, start: "top 80%", once: true } });
      }

      /* Carte : communes et Saône */
      const towns = $$(".zone__map .town, .zone__map .home");
      if (towns.length) {
        gsap.from(towns, {
          opacity: 0,
          scale: 0.5,
          transformOrigin: "center",
          duration: 0.8,
          ease: "back.out(2)",
          stagger: 0.03,
          scrollTrigger: { trigger: ".zone__map", start: "top 78%", once: true },
        });
        const river = $(".zone__map [data-river]");
        if (river) {
          const len = river.getTotalLength();
          gsap.fromTo(river, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut", scrollTrigger: { trigger: ".zone__map", start: "top 78%", once: true } });
        }
      }

      /* Méthode : défilement horizontal épinglé (grand écran) */
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
          $$(".mstep", track).forEach((card) =>
            gsap.from(card, {
              opacity: 0.3,
              scale: 0.95,
              ease: "none",
              scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 100%", end: "right 100%", scrub: true },
            })
          );
          return () => {
            method.classList.remove("method--h");
            gsap.set(track, { clearProps: "transform" });
          };
        });
        mm.add("(max-width: 1099px)", () => {
          const bar = $(".method__progress span", method);
          if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".method__track", start: "top 70%", end: "bottom 70%", scrub: true } });
        });
      }

      // La méthode (épinglée) est haut dans la page : on recalcule les déclencheurs dans l'ordre de la page
      ScrollTrigger.sort();
      window.addEventListener("load", () => ScrollTrigger.refresh());
      ScrollTrigger.refresh();
    })
  );

  /* Filet de sécurité : jamais de contenu invisible */
  setTimeout(() => {
    if (root.classList.contains("hero-ready")) return;
    root.classList.add("no-motion");
    finishIntro();
  }, 5000);
})();

/* Carte : les ondes autour de la ville jouent à l'arrivée sur la carte, pas pendant tout le défilement */
(() => {
  const map = document.querySelector(".zone__map");
  if (!map) return;
  if (!("IntersectionObserver" in window)) return map.classList.add("is-live");
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      map.classList.add("is-live");
      io.disconnect();
    },
    { threshold: 0.35 }
  );
  io.observe(map);
})();
