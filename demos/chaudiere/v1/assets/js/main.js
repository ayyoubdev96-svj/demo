/* ==========================================================================
   Votre Entreprise — interactions & motion design
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
  const NB = "\u00a0";
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

  const focusEl = (el) => {
    if (!el) return;
    if (!el.matches("a, button, input, select, textarea, [tabindex]")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
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
    if (a.dataset.work) preselectWork(a.dataset.work, true);
    scrollToEl(el);
    if (id === "#devis") focusFormStep();
    else focusEl(el);
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
  const hudLabel = $(".heat__hud-label");
  const hudZone = $(".heat__hud-zone");
  const hudValue = $(".heat__hud-value");
  const heatVisual = $(".heat__visual");
  let heatValue = { v: 100 };
  // Texte exact affiché par l'étape (ex. « 25–30 % »), pour que l'encart et l'étape disent la même chose
  const heatExact = (step) => (step.querySelector(".heat-step__pct")?.firstChild?.textContent || "").trim();
  const setHeat = (step) => {
    if (!step || step.classList.contains("is-active")) return;
    heatSteps.forEach((s) => s.classList.toggle("is-active", s === step));
    if (heatSvg) heatSvg.dataset.active = step.dataset.zone;
    if (hudLabel) hudLabel.textContent = step.dataset.hud || "Énergie perdue";
    if (hudZone) hudZone.textContent = step.dataset.label || "";
    const target = parseFloat(step.dataset.pct || 0);
    const suffix = step.dataset.suffix || "\u00a0%";
    const final = heatExact(step) || (step.dataset.prefix || "") + target + suffix;
    if (hudValue) {
      if (hasGSAP && !reduce) {
        gsap.to(heatValue, {
          v: target,
          duration: 0.7,
          ease: "power2.out",
          overwrite: true,
          onUpdate: () => (hudValue.textContent = (step.dataset.prefix || "") + Math.round(heatValue.v) + suffix),
          onComplete: () => (hudValue.textContent = final),
        });
      } else hudValue.textContent = final;
    }
  };
  if (heatSteps.length) {
    // Étape active = celle qu'on voit le plus, sous la maison collée (mobile) ou dans l'écran (grand écran)
    let top = 0;
    const measure = () => {
      top = !matchMedia("(min-width: 1000px)").matches && heatVisual ? heatVisual.getBoundingClientRect().bottom : 0;
    };
    let ticking = false;
    const update = () => {
      ticking = false;
      measure();
      let current = heatSteps[0];
      let best = -1;
      for (const st of heatSteps) {
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
    setHeat(heatSteps[0]);
    update();
  }

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
     Simulateur : économies indicatives après remplacement d'une chaudière.
     Gaz → chaudière gaz à condensation ; fioul → chaudière à granulés
     (une pompe à chaleur peut aussi convenir). Prix 2026 TTC posés, hors aides.
     ------------------------------------------------------------------ */
  const SIM = {
    energy: {
      gaz: {
        solution: "Gaz à condensation",
        label: "une chaudière gaz à condensation",
        // part de la facture économisée selon l'âge de la chaudière actuelle
        ratio: { moins10: 0.07, "10-20": 0.15, plus20: 0.25 },
        // prix posé : [bas, haut] pour une petite maison, puis pour une grande
        price: [[3500, 5500], [4500, 7000]],
        aid: "Aucune pour le gaz",
        work: "remplacement",
      },
      fioul: {
        solution: "Granulés (ou PAC)",
        label: "une chaudière à granulés",
        ratio: { moins10: 0.3, "10-20": 0.38, plus20: 0.45 },
        price: [[12000, 16000], [15000, 20000]],
        aid: "Possibles, selon revenus",
        work: "fioul",
      },
    },
    surface: [50, 250],
  };
  safe(() => {
    const sim = $(".sim__panel");
    if (!sim) return;
    const q = (k) => $(`[data-sim='${k}']`, sim);
    const out = {
      save: q("save"), range: q("save-range"), cost: q("cost"), aid: q("aid"), payback: q("payback"), pct: q("pct"), solution: q("solution"),
      before: q("before"), after: q("after"), surf: q("surface-out"), bill: q("bill-out"), live: q("live"), cta: q("cta"),
      barAfter: $(".sim__bar-fill--after", sim), barBefore: $(".sim__bar-fill--before", sim),
    };
    const shown = { save: parseFloat((out.save?.textContent || "0").replace(/\D/g, "")) || 0 };
    const paint = (r) => r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min)) * 100 + "%");
    const lerp = (a, b, t) => a + (b - a) * t;
    const round100 = (n) => Math.round(n / 100) * 100;
    let liveTimer;
    const compute = () => {
      const energy = ($("input[name='sim-energy']:checked", sim) || {}).value || "gaz";
      const age = ($("input[name='sim-age']:checked", sim) || {}).value || "plus20";
      const surface = +$("#sim-surface", sim).value;
      const bill = +$("#sim-bill", sim).value;
      const e = SIM.energy[energy];
      const ratio = e.ratio[age] || e.ratio.plus20;
      const save = bill * ratio;
      const t = clamp((surface - SIM.surface[0]) / (SIM.surface[1] - SIM.surface[0]), 0, 1);
      const cost = [round100(lerp(e.price[0][0], e.price[1][0], t)), round100(lerp(e.price[0][1], e.price[1][1], t))];
      const payback = (cost[0] + cost[1]) / 2 / Math.max(save, 1);
      const years = Math.round(payback);
      const paybackTxt = payback < 1 ? "moins d’un an" : payback > 30 ? "plus de 30" + NB + "ans" : `≈${NB}${years}${NB}an${years > 1 ? "s" : ""}`;

      if (out.surf) out.surf.textContent = surface + NB + "m²";
      if (out.bill) out.bill.textContent = fmt(bill) + NB + "€";
      if (out.range) out.range.textContent = `entre ${fmt(save * 0.8)} et ${fmt(save * 1.2)}${NB}€ par an`;
      if (out.solution) out.solution.textContent = e.solution;
      if (out.cost) out.cost.textContent = `${fmt(cost[0])} – ${fmt(cost[1])}${NB}€`;
      if (out.aid) out.aid.textContent = e.aid;
      if (out.payback) out.payback.textContent = paybackTxt;
      if (out.pct) out.pct.textContent = "−" + Math.round(ratio * 100) + NB + "%";
      if (out.before) out.before.textContent = fmt(bill) + NB + "€";
      if (out.after) out.after.textContent = fmt(bill - save) + NB + "€";
      if (out.barBefore) out.barBefore.style.transform = "scaleX(1)";
      if (out.barAfter) out.barAfter.style.transform = `scaleX(${(1 - ratio).toFixed(3)})`;
      if (out.cta) {
        out.cta.dataset.work = e.work;
        out.cta.dataset.energy = energy;
      }
      if (out.save) {
        if (hasGSAP && !reduce) gsap.to(shown, { save, duration: 0.7, ease: "power3.out", onUpdate: () => (out.save.textContent = fmt(shown.save)) });
        else out.save.textContent = fmt(save);
      }
      clearTimeout(liveTimer);
      liveTimer = setTimeout(() => {
        if (out.live) out.live.textContent = `Économies estimées avec ${e.label} : ${fmt(save)} euros par an. Travaux : ${fmt(cost[0])} à ${fmt(cost[1])} euros. Retour sur investissement hors aides : ${paybackTxt}.`;
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
    remplacement: "Remplacement de chaudière",
    fioul: "Sortie du fioul (granulés, pompe à chaleur)",
    entretien: "Entretien annuel",
    contrat: "Contrat d’entretien",
    depannage: "Dépannage",
    desembouage: "Désembouage et équilibrage",
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
    const titles = ["Votre besoin", "Votre installation", "Vos coordonnées"];

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
        `Intervention : ${works}`,
        `Logement : ${data.get("logement") || "-"}, ${data.get("surface") ? data.get("surface") + " m² chauffés" : "surface non précisée"}`,
        `Chaudière : ${data.get("chauffage") || "-"} (âge : ${(data.get("age") || "-").toLowerCase()})`,
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
        const energy = form && $("select[name='chauffage']", form);
        const opt = energy && $$("option", energy).find((o) => o.dataset.key === a.dataset.energy);
        if (opt) energy.value = opt.value;
        goToStep(1, false);
      })
    );
  });

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
    seen = sessionStorage.getItem("ve-intro") === "1";
    sessionStorage.setItem("ve-intro", "1");
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

    /* Bandeau communes : défilement continu qui accélère en douceur avec la vitesse de la page
       (piloté par GSAP : changer la durée d'une animation CSS en cours la faisait sauter) */
    const marquee = $(".marquee__track");
    if (marquee) {
      marquee.classList.add("is-js");
      const loop = gsap.fromTo(marquee, { xPercent: 0 }, { xPercent: -50, duration: 60, ease: "none", repeat: -1 });
      const band = marquee.parentElement;
      band.addEventListener("mouseenter", () => gsap.to(loop, { timeScale: 0, duration: 0.6, overwrite: true }));
      band.addEventListener("mouseleave", () => gsap.to(loop, { timeScale: 1, duration: 0.6, overwrite: true }));
      if (lenis) {
        lenis.on("scroll", ({ velocity }) => {
          const boost = 1 + Math.min(Math.abs(velocity), 40) * 0.08;
          gsap.to(loop, { timeScale: boost, duration: 0.3, overwrite: true });
          gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.3, ease: "power2.out", overwrite: false });
        });
      }
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

/* Carte : les ondes autour de l'atelier jouent à l'arrivée sur la carte, pas pendant tout le défilement */
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
