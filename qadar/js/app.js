/* Carte du Qadar : logique des schémas interactifs. */
(function () {
  'use strict';

  var D = window.QD, C = window.QC;
  var IDX = Object.create(null);
  D.items.forEach(function (it) { IDX[it.id] = it; });

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function chiffresAr(n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); }
  function melanger(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function finPhrase(s) { return /[.!?»…]$/.test(s) ? s : s + '.'; }

  /* ---------- Preuves ---------- */
  function libelleCourt(it) {
    if (it.type === 'coran') return it.ref;
    if (it.type === 'hadith') return it.src.split('·')[0].replace(/\(.*?\)/, '').trim();
    return it.src.split(/[,(]/)[0].trim();
  }
  function preuve(id) {
    var it = IDX[id];
    if (!it) { console.warn('Preuve introuvable : ' + id); return ''; }
    return '<button type="button" class="lien-preuve" data-ev="' + id + '" data-type="' + it.type + '" title="' + esc(it.title) + '">' + esc(libelleCourt(it)) + '</button>';
  }
  function preuves(ids) { return '<div class="preuves-liste">' + ids.map(preuve).join('') + '</div>'; }
  function verbe(v) { return '<span class="verbe v-' + v + '">' + esc(C.verbes[v].nom) + '</span>'; }
  function verbes(vs) { return '<div class="verbes">' + vs.map(verbe).join('') + '</div>'; }
  function arabeDe(it) { return it.type === 'coran' ? it.verses.map(function (v) { return v.ar; }).join(' ') : it.ar; }
  function francaisDe(it) { return it.type === 'coran' ? it.verses.map(function (v) { return finPhrase(v.fr); }).join(' ') : it.fr; }

  var dlg = $('#preuve-dialog');
  var dernierFocus = null;
  function ouvrirPreuve(id) {
    var it = IDX[id];
    if (!it) return;
    dernierFocus = document.activeElement;
    $('#pd-type').textContent = it.type === 'coran' ? 'Coran' : it.type === 'hadith' ? 'Hadith' : 'Parole savante';
    $('#pd-titre').textContent = it.title;
    var h = '';
    if (it.type === 'coran') {
      h += '<div class="pd-ar coran" lang="ar" dir="rtl">' + it.verses.map(function (v) {
        return esc(v.ar) + ' <span class="n">﴿' + chiffresAr(v.n) + '﴾</span>';
      }).join(' ') + '</div>';
      h += '<p class="pd-fr">' + it.verses.map(function (v) {
        return (it.verses.length > 1 ? '<span class="n">' + v.n + '</span>' : '') + esc(finPhrase(v.fr));
      }).join(' ') + '</p>';
    } else {
      h += '<div class="pd-ar" lang="ar" dir="rtl">' + esc(it.ar) + '</div><p class="pd-fr">' + esc(it.fr) + '</p>';
    }
    if (it.note) h += '<p class="pd-note">' + esc(it.note) + '</p>';
    h += '<div class="pd-meta"><span>' + esc(it.src) + '</span>';
    if (it.narr) h += '<span>Rapporteur : ' + esc(it.narr) + '</span>';
    h += '<span class="grade" data-level="' + it.level + '">' + esc(it.grade) + '</span>';
    if (it.link) h += '<a href="' + it.link + '" target="_blank" rel="noopener">Voir la source ↗</a>';
    h += '</div><div class="pd-actions"><button class="btn btn-petit" type="button" data-copier="' + id + '">Copier le texte</button>';
    it.themes.forEach(function (t) {
      h += '<button class="puce-theme" type="button" data-theme-lien="' + t + '">' + esc(D.themes[t]) + '</button>';
    });
    h += '</div><textarea class="copie-zone" id="pd-copie" readonly hidden></textarea>';
    $('#pd-corps').innerHTML = h;
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
    $('.pd-fermer', dlg).focus();
  }
  function fermerPreuve() {
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  }
  dlg.addEventListener('close', function () { if (dernierFocus && dernierFocus.focus) dernierFocus.focus(); });
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.closest('[data-fermer]')) fermerPreuve();
    var cp = e.target.closest('[data-copier]');
    if (cp) {
      var it = IDX[cp.dataset.copier];
      var texte = it.title + '\n\n' + arabeDe(it) + '\n\n' + francaisDe(it) + '\n\n' + it.src + ' · ' + it.grade;
      copier(texte, cp, $('#pd-copie'));
    }
    var th = e.target.closest('[data-theme-lien]');
    if (th) {
      dernierFocus = $('#biblio-recherche');
      fermerPreuve();
      Biblio.filtrerTheme(th.dataset.themeLien);
      document.getElementById('preuves').scrollIntoView();
    }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ev]');
    if (b && !dlg.contains(b)) { e.preventDefault(); ouvrirPreuve(b.dataset.ev); }
  });

  function copier(texte, bouton, zoneSecours) {
    var ok = function () { var l = bouton.textContent; bouton.textContent = 'Copié'; setTimeout(function () { bouton.textContent = l; }, 1600); };
    var secours = function () {
      if (!zoneSecours) return;
      zoneSecours.hidden = false; zoneSecours.value = texte; zoneSecours.focus(); zoneSecours.select();
      bouton.textContent = 'Sélectionné : copie avec Ctrl+C';
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(ok, secours);
      else secours();
    } catch (err) { secours(); }
  }

  /* ---------- Moteur de tri (carte et volontés) ---------- */
  function Tri(o) {
    // o : { items:[{id,label,zone}], bac:Element, zones:{zone:Element conteneur}, cibles:[Element avec data-zone], onClicJeton, onVerif }
    var self = this;
    this.o = o; this.place = {}; this.sel = null; this.verifie = false;
    o.cibles.forEach(function (cible) {
      cible.classList.add('cible');
      cible.addEventListener('click', function (e) {
        if (e.target.closest('.jeton')) return;
        var z = e.target.closest('[data-zone]');
        if (z !== cible) return;
        if (self.sel) { self.placer(self.sel, cible.dataset.zone); }
      });
      cible.addEventListener('dragover', function (e) {
        if (e.target.closest('[data-zone]') !== cible) return;
        e.preventDefault(); cible.classList.add('survol');
      });
      cible.addEventListener('dragleave', function () { cible.classList.remove('survol'); });
      cible.addEventListener('drop', function (e) {
        if (e.target.closest('[data-zone]') !== cible) return;
        e.preventDefault(); cible.classList.remove('survol');
        var id = e.dataTransfer.getData('text/plain');
        if (id) self.placer(id, cible.dataset.zone);
      });
    });
    o.bac.addEventListener('click', function (e) {
      if (!e.target.closest('.jeton') && self.sel) self.placer(self.sel, null);
    });
    this.reinit();
  }
  Tri.prototype.reinit = function () {
    var self = this;
    this.place = {}; this.sel = null; this.verifie = false;
    this.ordre = melanger(this.o.items.map(function (i) { return i.id; }));
    this.ordre.forEach(function (id) { self.place[id] = null; });
    this.rendre();
  };
  Tri.prototype.placer = function (id, zone) {
    this.place[id] = zone; this.sel = null; this.verifie = false; this.rendre();
    var j = this.o.racine.querySelector('.jeton[data-id="' + id + '"]');
    if (j) j.focus();
  };
  Tri.prototype.restants = function () { var self = this; return this.ordre.filter(function (id) { return !self.place[id]; }).length; };
  Tri.prototype.verifier = function () {
    var self = this, bons = 0;
    this.verifie = true; this.sel = null;
    this.o.items.forEach(function (it) { if (self.place[it.id] === it.zone) bons++; });
    this.rendre();
    return bons;
  };
  Tri.prototype.corriger = function () {
    var self = this;
    this.o.items.forEach(function (it) { self.place[it.id] = it.zone; });
    this.verifier();
  };
  Tri.prototype.rendre = function () {
    var self = this, o = this.o, parZone = { _bac: [] };
    Object.keys(o.zones).forEach(function (z) { parZone[z] = []; });
    var items = {};
    o.items.forEach(function (it) { items[it.id] = it; });
    this.ordre.forEach(function (id) { parZone[self.place[id] || '_bac'].push(items[id]); });
    var jeton = function (it) {
      var cls = 'jeton';
      if (self.verifie) cls += self.place[it.id] === it.zone ? ' ok' : ' ko';
      return '<button type="button" class="' + cls + '" data-id="' + it.id + '" draggable="true" aria-pressed="' + (self.sel === it.id) + '">' + esc(it.label) + '</button>';
    };
    o.bac.innerHTML = parZone._bac.map(jeton).join('') || '<p class="vide">Tout est placé. Vérifie ton classement.</p>';
    Object.keys(o.zones).forEach(function (z) { o.zones[z].innerHTML = parZone[z].map(jeton).join(''); });
    $$('.jeton', o.racine).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.dataset.id;
        if (self.verifie && o.onClicJeton) o.onClicJeton(id, self.place[id]);
        self.sel = self.sel === id ? null : id;
        $$('.jeton', o.racine).forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.id === self.sel)); });
      });
      b.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', b.dataset.id); e.dataTransfer.effectAllowed = 'move'; });
    });
    if (o.onRendu) o.onRendu(this);
  };

  /* ---------- 1. La carte ---------- */
  var Carte = (function () {
    var racine = $('#carte-app');
    var mode = 'vue', choisi = 'resultat', tri = null;
    var items = C.carte.map(function (c) { return { id: c.id, label: c.nom, zone: c.zone }; });
    var parId = {};
    C.carte.forEach(function (c) { parId[c.id] = c; });

    function anneau(z, interieur) {
      var Z = C.zones[z];
      return '<div class="anneau" data-zone="' + z + '"><div class="anneau-tete"><h3>' + esc(Z.nom) + '</h3><span>' + esc(Z.sous) + '</span><span class="ar" lang="ar" dir="rtl">' + Z.ar + '</span></div>' +
        '<div class="jetons" data-jetons="' + z + '"></div>' + (interieur || '') + '</div>';
    }
    racine.innerHTML =
      '<div class="carte-barre"><div class="verbes" role="group" aria-label="Mode de la carte">' +
      '<button class="btn" type="button" data-mode="vue" aria-pressed="true">Voir la carte</button>' +
      '<button class="btn" type="button" data-mode="jeu" aria-pressed="false">Classer moi-même</button></div>' +
      '<span class="score" aria-live="polite"></span></div>' +
      '<div class="bac" hidden><p class="bac-titre">Touche un élément, puis touche le cercle où il doit aller (sur ordinateur, tu peux aussi le glisser). Touche le bac pour l’y remettre.</p>' +
      '<div class="jetons" data-bac></div><div class="preselections"><button class="btn btn-plein btn-petit" type="button" data-verifier>Vérifier</button>' +
      '<button class="btn btn-petit" type="button" data-corriger>Voir la correction</button><button class="btn btn-petit" type="button" data-rejouer>Recommencer</button></div></div>' +
      '<div class="anneaux">' + anneau('allah', anneau('causes', anneau('toi'))) + '</div>' +
      '<aside class="detail panneau" aria-live="polite"></aside>';

    var detail = $('.detail', racine), score = $('.score', racine), bac = $('.bac', racine);
    var zonesJetons = { allah: $('[data-jetons="allah"]', racine), causes: $('[data-jetons="causes"]', racine), toi: $('[data-jetons="toi"]', racine) };

    function montrer(id, placeJoueur) {
      var c = parId[id];
      detail.dataset.zone = c.zone;
      var h = '<span class="zone-tag">' + esc(C.zones[c.zone].nom) + '</span><h3>' + esc(c.nom) + '</h3>';
      if (placeJoueur !== undefined && placeJoueur !== c.zone) {
        h += '<p class="attention v-tawba">Tu l’as placé dans « ' + esc(placeJoueur ? C.zones[placeJoueur].nom : 'le bac') + ' ». Sa place est « ' + esc(C.zones[c.zone].nom) + ' ».</p>';
      }
      h += '<dl><div><dt>Qui décide&nbsp;?</dt><dd>' + esc(c.decide) + '</dd></div><div><dt>Ta part</dt><dd>' + esc(c.part) + '</dd></div>' +
        '<div><dt>Ton attitude</dt><dd>' + verbes(c.verbes) + '</dd></div></dl>' + preuves(c.ev);
      detail.innerHTML = h;
    }
    function vue() {
      Object.keys(zonesJetons).forEach(function (z) {
        zonesJetons[z].innerHTML = C.carte.filter(function (c) { return c.zone === z; }).map(function (c) {
          return '<button type="button" class="jeton" data-id="' + c.id + '" aria-pressed="' + (c.id === choisi) + '">' + esc(c.nom) + '</button>';
        }).join('');
      });
      $$('.anneaux .jeton', racine).forEach(function (b) {
        b.addEventListener('click', function () {
          choisi = b.dataset.id;
          $$('.anneaux .jeton', racine).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          montrer(choisi);
          if (window.matchMedia('(max-width: 860px)').matches) detail.scrollIntoView({ block: 'nearest' });
        });
      });
      montrer(choisi);
      score.textContent = C.carte.length + ' éléments';
    }
    function majScore(t) {
      var r = t.restants();
      if (t.verifie) {
        var bons = items.filter(function (it) { return t.place[it.id] === it.zone; }).length;
        score.textContent = bons + ' / ' + items.length + ' bien placés';
      } else score.textContent = r ? r + ' à placer' : 'Tout est placé';
      $('[data-verifier]', racine).disabled = r > 0;
    }
    function jeu() {
      bac.hidden = false;
      $$('.anneau', racine).forEach(function (a) { a.classList.add('cible'); });
      if (!tri) {
        tri = new Tri({
          racine: racine, items: items, bac: $('[data-bac]', racine), zones: zonesJetons,
          cibles: $$('.anneau', racine),
          onClicJeton: function (id, place) { montrer(id, place); },
          onRendu: majScore
        });
      } else tri.rendre();
      detail.dataset.zone = '';
      detail.innerHTML = '<h3>Classe les ' + items.length + ' éléments</h3><p class="intro">Demande-toi pour chacun&nbsp;: est-ce que j’en rendrai compte&nbsp;? Est-ce que j’ai des moyens d’agir dessus, sans en maîtriser l’issue&nbsp;? Ou est-ce que cela ne dépend pas de moi du tout&nbsp;? Après vérification, touche un élément pour lire l’explication.</p>';
    }
    $$('[data-mode]', racine).forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.dataset.mode;
        $$('[data-mode]', racine).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        if (mode === 'vue') {
          bac.hidden = true;
          $$('.anneau', racine).forEach(function (a) { a.classList.remove('cible'); });
          vue();
        } else jeu();
      });
    });
    $('[data-verifier]', racine).addEventListener('click', function () { tri.verifier(); });
    $('[data-corriger]', racine).addEventListener('click', function () { tri.corriger(); });
    $('[data-rejouer]', racine).addEventListener('click', function () { tri.reinit(); jeu(); });
    // Les cibles du tri ne réagissent qu’en mode jeu.
    racine.addEventListener('click', function (e) { if (mode === 'vue' && e.target.closest('.anneau') && !e.target.closest('.jeton')) e.stopPropagation(); }, true);
    vue();
  })();

  /* ---------- 2. Avant, au moment d’agir, après ---------- */
  (function () {
    var racine = $('#moment-app');
    var sc = C.scenarios[0], phase = 0, issue = 'epreuve';
    racine.innerHTML =
      '<div class="choix-scenario" role="group" aria-label="Situation">' + C.scenarios.map(function (s, i) {
        return '<button class="btn" type="button" data-sc="' + s.id + '" aria-pressed="' + (i === 0) + '">' + esc(s.nom) + '</button>';
      }).join('') + '</div>' +
      '<div class="frise"><div class="frise-etapes">' + C.phases.map(function (p, i) { return '<span data-p="' + i + '">' + esc(p) + '</span>'; }).join('') + '</div>' +
      '<label class="etiquette" for="moment-curseur">Où en es-tu&nbsp;? Déplace le curseur</label>' +
      '<input class="curseur curseur-temps" id="moment-curseur" type="range" min="0" max="2" step="1" value="0">' +
      '<div class="issue-choix" data-issue hidden></div></div>' +
      '<div class="phase-carte" aria-live="polite"></div>';
    var curseur = $('#moment-curseur'), carte = $('.phase-carte', racine), zoneIssue = $('[data-issue]', racine);

    function cle() { return phase === 0 ? 'avant' : phase === 1 ? 'moment' : issue; }
    function dessiner() {
      var col = ['avant', 'moment', issue].map(function (k) {
        return { effort: 'var(--c-effort)', dua: 'var(--c-dua)', accueil: 'var(--c-accueil)', tawba: 'var(--c-tawba)' }[sc[k].verbes[0]];
      });
      curseur.style.setProperty('--piste', 'linear-gradient(90deg, ' + col[0] + ' 0 33.3%, ' + col[1] + ' 33.3% 66.6%, ' + col[2] + ' 66.6% 100%)');
      $$('.frise-etapes span', racine).forEach(function (s) { s.setAttribute('aria-current', String(Number(s.dataset.p) === phase)); });
    }
    function rendre() {
      var issues = Object.keys(sc.issues);
      if (issues.indexOf(issue) < 0) issue = issues[issues.length - 1];
      zoneIssue.hidden = phase !== 2;
      if (issues.length > 1) {
        zoneIssue.innerHTML = '<span class="etiquette">Et l’issue&nbsp;?</span>' + issues.map(function (k) {
          return '<button class="btn btn-petit" type="button" data-k="' + k + '" aria-pressed="' + (k === issue) + '">' + esc(sc.issues[k]) + '</button>';
        }).join('');
      } else zoneIssue.innerHTML = '<span class="etiquette">Issue&nbsp;: ' + esc(sc.issues[issues[0]]) + '</span>';
      $$('[data-k]', zoneIssue).forEach(function (b) { b.addEventListener('click', function () { issue = b.dataset.k; rendre(); }); });
      var p = sc[cle()];
      curseur.setAttribute('aria-valuetext', C.phases[phase] + (phase === 2 ? ' : ' + sc.issues[issue] : ''));
      carte.innerHTML =
        '<div class="phase-bloc toi"><p class="etiquette">Ce qui dépend de toi</p><p>' + esc(p.toi) + '</p></div>' +
        '<div class="phase-bloc allah"><p class="etiquette">Ce qui appartient à Allah</p><p>' + esc(p.allah) + '</p></div>' +
        '<div class="phase-pied"><div><p class="etiquette">Ton attitude</p>' + verbes(p.verbes) + '</div>' +
        '<div><p class="etiquette">À dire, à te rappeler</p><p class="dire">' + esc(p.dire) + '</p></div>' + preuves(p.ev) + '</div>';
      dessiner();
    }
    $$('[data-sc]', racine).forEach(function (b) {
      b.addEventListener('click', function () {
        sc = C.scenarios.filter(function (s) { return s.id === b.dataset.sc; })[0];
        $$('[data-sc]', racine).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        rendre();
      });
    });
    curseur.addEventListener('input', function () { phase = Number(curseur.value); rendre(); });
    rendre();
  })();

  /* ---------- 3. Que dois-je faire ? ---------- */
  (function () {
    var racine = $('#guide-app');
    var chemin = [{ n: 'start', r: null }];
    function rendre() {
      var etape = chemin[chemin.length - 1], noeud = C.arbre[etape.n], h = '';
      if (chemin.length > 1) {
        h += '<nav class="fil" aria-label="Tes réponses">' + chemin.slice(0, -1).map(function (c, i) {
          return '<button type="button" data-retour="' + i + '" title="Revenir à cette question">' + esc(chemin[i + 1].r) + '</button>';
        }).join('<span aria-hidden="true">›</span>') + '</nav>';
      }
      if (etape.n.indexOf('V_') === 0) {
        h += '<div class="panneau verdict v-' + noeud.verbe + '"><span class="verbe v-' + noeud.verbe + '">' + esc(C.verbes[noeud.verbe].nom) + '</span>' +
          '<h3>' + esc(noeud.titre) + '</h3><ol>' + noeud.etapes.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ol>' +
          '<p class="attention">' + esc(noeud.attention) + '</p>' + preuves(noeud.ev) +
          '<div class="preselections"><button class="btn btn-petit" type="button" data-recommencer>Une autre situation</button>' +
          '<a class="btn btn-petit" href="#carnet">Noter dans mon carnet</a></div></div>';
      } else {
        h += '<div class="panneau"><p class="etiquette">Question ' + chemin.length + '</p><p class="question">' + esc(noeud.q) + '</p>' +
          (noeud.aide ? '<p class="aide">' + esc(noeud.aide) + '</p>' : '') +
          '<div class="reponses">' + noeud.r.map(function (r, i) { return '<button class="reponse" type="button" data-r="' + i + '">' + esc(r[0]) + '</button>'; }).join('') + '</div></div>';
      }
      racine.innerHTML = h;
      $$('[data-r]', racine).forEach(function (b) {
        b.addEventListener('click', function () {
          var r = noeud.r[Number(b.dataset.r)];
          chemin.push({ n: r[1], r: r[0] });
          rendre();
          var cible = $('.panneau', racine); if (cible) cible.focus({ preventScroll: true });
        });
      });
      $$('[data-retour]', racine).forEach(function (b) { b.addEventListener('click', function () { chemin = chemin.slice(0, Number(b.dataset.retour) + 1); rendre(); }); });
      var rec = $('[data-recommencer]', racine);
      if (rec) rec.addEventListener('click', function () { chemin = [{ n: 'start', r: null }]; rendre(); });
      $$('.panneau', racine).forEach(function (p) { p.setAttribute('tabindex', '-1'); });
    }
    rendre();
  })();

  /* ---------- 4. Les quatre degrés ---------- */
  (function () {
    var racine = $('#degres-app');
    var styles = [
      { r: 200, fill: 'var(--surface-2)', stroke: 'var(--or)' },
      { r: 148, fill: 'var(--or-doux)', stroke: 'var(--or)' },
      { r: 98, fill: 'var(--c-dua-doux)', stroke: 'var(--c-dua)' },
      { r: 50, fill: 'var(--c-effort-doux)', stroke: 'var(--c-effort)' }
    ];
    var choisi = 0;
    var svg = '<svg viewBox="0 0 420 420" role="group" aria-label="Les quatre degrés, du plus large au plus intérieur">';
    C.degres.forEach(function (d, i) {
      var s = styles[i], cy = 210, yTxt = i === 3 ? 206 : cy - s.r + 24;
      svg += '<g class="rond" role="button" tabindex="0" data-i="' + i + '" aria-pressed="false" aria-label="' + esc(d.nom) + '">' +
        '<circle cx="210" cy="210" r="' + s.r + '" style="fill:' + s.fill + ';stroke:' + s.stroke + '"/>' +
        '<text x="210" y="' + yTxt + '" text-anchor="middle" style="fill:var(--encre);font-size:14px;font-weight:600">' + (i + 1) + '. ' + esc(d.nom) + '</text>' +
        '<text class="nom-ar" x="210" y="' + (yTxt + 20) + '" text-anchor="middle" style="fill:var(--encre-2);font-size:16px">' + d.ar + '</text></g>';
    });
    svg += '</svg>';
    racine.innerHTML = '<div class="cercles">' + svg + '</div><div class="panneau deg-detail" aria-live="polite"></div>';
    var detail = $('.deg-detail', racine);
    function rendre() {
      var d = C.degres[choisi];
      $$('.rond', racine).forEach(function (g) { g.setAttribute('aria-pressed', String(Number(g.dataset.i) === choisi)); });
      detail.innerHTML = '<div class="deg-tete"><p class="etiquette">Degré ' + (choisi + 1) + ' sur 4</p><span class="ar" lang="ar" dir="rtl">' + d.ar + '</span></div>' +
        '<h3>' + esc(d.nom) + ' : ' + esc(d.resume) + '</h3>' +
        '<div class="bloc"><p class="etiquette">Ce que cela signifie</p><p>' + esc(d.def) + '</p></div>' +
        '<div class="bloc"><p class="etiquette">Pour toi</p><p>' + esc(d.pourtoi) + '</p></div>' +
        '<div class="bloc"><p class="etiquette">Ce que cela ne veut pas dire</p><p>' + esc(d.pas) + '</p></div>' +
        '<div class="bloc"><p class="etiquette">Qui l’a nié</p><p>' + esc(d.nie) + '</p></div>' + preuves(d.ev) +
        '<div class="preselections"><button class="btn btn-petit" type="button" data-prec' + (choisi === 0 ? ' disabled' : '') + '>← Degré précédent</button>' +
        '<button class="btn btn-petit" type="button" data-suiv' + (choisi === 3 ? ' disabled' : '') + '>Degré suivant →</button></div>';
      $('[data-prec]', detail).addEventListener('click', function () { choisi = Math.max(0, choisi - 1); rendre(); });
      $('[data-suiv]', detail).addEventListener('click', function () { choisi = Math.min(3, choisi + 1); rendre(); });
    }
    $$('.rond', racine).forEach(function (g) {
      var go = function () { choisi = Number(g.dataset.i); rendre(); };
      g.addEventListener('click', go);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    rendre();
  })();

  /* ---------- 5. Les deux livres ---------- */
  (function () {
    var racine = $('#ecrits-app');
    var pos = {
      'e-science': [70, 95], 'e-tablette': [220, 95], 'e-pacte': [370, 95], 'e-ventre': [530, 95], 'e-annee': [680, 95], 'e-jour': [830, 95],
      'e-taklif': [560, 250], 'e-registre': [700, 250], 'e-fin': [840, 250], 'e-jugement': [1005, 172]
    };
    var tous = C.ecrits.allah.concat(C.ecrits.toi);
    var choisi = 'e-tablette';
    function lignes(t, max) {
      var mots = t.split(' '), out = [], cur = '';
      mots.forEach(function (m) { if ((cur + ' ' + m).trim().length > max && cur) { out.push(cur); cur = m; } else cur = (cur + ' ' + m).trim(); });
      if (cur) out.push(cur);
      return out;
    }
    var s = '<svg viewBox="0 0 1080 330" role="group" aria-label="Deux pistes : le décret écrit par Allah, et le registre de tes actes">';
    s += '<rect x="480" y="56" width="420" height="262" rx="18" style="fill:var(--c-effort-doux);opacity:.55"/>';
    s += '<text x="494" y="76" style="fill:var(--c-effort);font-size:12px;font-weight:600;letter-spacing:.08em">TA VIE</text>';
    s += '<text x="20" y="34" style="fill:var(--or);font-size:13px;font-weight:600">Ce qu’Allah a écrit · caché pour toi</text>';
    s += '<text x="20" y="214" style="fill:var(--c-effort);font-size:13px;font-weight:600">Ce que tes actes écrivent · sous ta responsabilité</text>';
    s += '<line x1="70" y1="95" x2="830" y2="95" style="stroke:var(--or);stroke-width:3"/>';
    s += '<path d="M830 95 C 930 95, 930 172, 1005 172" style="fill:none;stroke:var(--or);stroke-width:3"/>';
    s += '<line x1="560" y1="250" x2="840" y2="250" style="stroke:var(--c-effort);stroke-width:3"/>';
    s += '<path d="M840 250 C 930 250, 930 172, 1005 172" style="fill:none;stroke:var(--c-effort);stroke-width:3"/>';
    tous.forEach(function (n) {
      var p = pos[n.id], estToi = C.ecrits.toi.indexOf(n) >= 0, col = n.id === 'e-jugement' ? 'var(--encre)' : estToi ? 'var(--c-effort)' : 'var(--or)';
      var ls = lignes(n.t, 17), y0 = p[1] + 28;
      s += '<g class="noeud" role="button" tabindex="0" data-id="' + n.id + '" aria-pressed="false" aria-label="' + esc(n.t + ', ' + n.sous) + '">' +
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="24" style="fill:transparent"/>' +
        '<circle class="pt" cx="' + p[0] + '" cy="' + p[1] + '" r="8" style="fill:' + col + ';stroke:var(--surface);stroke-width:3"/>';
      ls.forEach(function (l, i) { s += '<text x="' + p[0] + '" y="' + (y0 + i * 15) + '" text-anchor="middle" style="fill:var(--encre);font-size:12.5px;font-weight:600">' + esc(l) + '</text>'; });
      s += '<text x="' + p[0] + '" y="' + (y0 + ls.length * 15 + 2) + '" text-anchor="middle" style="fill:var(--encre-2);font-size:11px">' + esc(n.sous) + '</text></g>';
    });
    s += '</svg>';
    racine.innerHTML = '<div class="frise-livres">' + s + '</div><p class="astuce-defile">Sur téléphone, fais défiler le schéma horizontalement. Touche un point.</p><div class="panneau ecrit-detail" aria-live="polite"></div>';
    var detail = $('.ecrit-detail', racine);
    function rendre() {
      var i = tous.map(function (n) { return n.id; }).indexOf(choisi), n = tous[i];
      var estToi = C.ecrits.toi.indexOf(n) >= 0;
      $$('.noeud', racine).forEach(function (g) { g.setAttribute('aria-pressed', String(g.dataset.id === choisi)); });
      detail.innerHTML = '<p class="etiquette" style="color:' + (estToi ? 'var(--c-effort)' : 'var(--or)') + '">' + (estToi ? 'Le livre de tes actes' : 'Le décret écrit par Allah') + ' · ' + esc(n.sous) + '</p>' +
        '<h3>' + esc(n.t) + '</h3><p style="margin-top:.5rem">' + esc(n.txt) + '</p>' + preuves(n.ev) +
        '<div class="preselections"><button class="btn btn-petit" type="button" data-prec' + (i === 0 ? ' disabled' : '') + '>← Précédent</button>' +
        '<button class="btn btn-petit" type="button" data-suiv' + (i === tous.length - 1 ? ' disabled' : '') + '>Suivant →</button></div>';
      $('[data-prec]', detail).addEventListener('click', function () { choisi = tous[Math.max(0, i - 1)].id; rendre(); });
      $('[data-suiv]', detail).addEventListener('click', function () { choisi = tous[Math.min(tous.length - 1, i + 1)].id; rendre(); });
    }
    $$('.noeud', racine).forEach(function (g) {
      var go = function () { choisi = g.dataset.id; rendre(); };
      g.addEventListener('click', go);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    rendre();
  })();

  /* ---------- 6. Les deux volontés ---------- */
  (function () {
    var racine = $('#volontes-app');
    var V = C.volontes;
    var lib = { a1: 'Arrive · Allah l’aime', a2: 'Arrive · Allah ne l’aime pas', a3: 'N’arrive pas · Allah l’aime', a4: 'N’arrive pas · Allah ne l’aime pas' };
    function caseHtml(k) {
      return '<div class="case" data-zone="' + k + '" data-c="' + k + '" data-libelle="' + esc(lib[k]) + '"><h4>' + esc(V.cases[k].t) + '</h4>' +
        '<p data-expl hidden>' + esc(V.cases[k].txt) + ' Exemple&nbsp;: ' + esc(V.cases[k].ex) + '</p><div class="jetons" data-jetons="' + k + '"></div></div>';
    }
    racine.innerHTML =
      '<div class="bac"><p class="bac-titre">Touche un exemple, puis la case où il va.</p><div class="jetons" data-bac></div>' +
      '<div class="preselections"><button class="btn btn-plein btn-petit" type="button" data-verifier>Vérifier</button><button class="btn btn-petit" type="button" data-corriger>Voir la correction</button>' +
      '<button class="btn btn-petit" type="button" data-rejouer>Recommencer</button><span class="score etiquette" aria-live="polite"></span></div></div>' +
      '<div class="matrice"><div></div><div class="axe">Cela arrive</div><div class="axe">Cela n’arrive pas</div>' +
      '<div class="axe axe-v">Allah l’aime, l’ordonne</div>' + caseHtml('a1') + caseHtml('a3') +
      '<div class="axe axe-v">Allah ne l’aime pas</div>' + caseHtml('a2') + caseHtml('a4') + '</div>' +
      '<div class="panneau" style="margin-top:1rem"><p class="etiquette">La leçon</p><p style="margin-top:.3rem">Tout ce qui arrive a été voulu par Allah (volonté cosmique), mais Il n’aime pas tout ce qui arrive (volonté religieuse). Ton guide pour agir est ce qu’Il aime et ordonne, pas ce qui arrive. Et quand un mal arrive, il n’est pas une preuve qu’Allah l’agrée.</p>' + preuves(V.ev) + '</div>';
    var items = V.exemples.map(function (e, i) { return { id: 'v' + i, label: e.t, zone: e.c }; });
    var score = $('.score', racine);
    var tri = new Tri({
      racine: racine, items: items, bac: $('[data-bac]', racine),
      zones: { a1: $('[data-jetons="a1"]', racine), a2: $('[data-jetons="a2"]', racine), a3: $('[data-jetons="a3"]', racine), a4: $('[data-jetons="a4"]', racine) },
      cibles: $$('.case', racine),
      onClicJeton: function () {},
      onRendu: function (t) {
        var r = t.restants();
        $('[data-verifier]', racine).disabled = r > 0;
        $$('[data-expl]', racine).forEach(function (p) { p.hidden = !t.verifie; });
        if (t.verifie) {
          var bons = items.filter(function (it) { return t.place[it.id] === it.zone; }).length;
          score.textContent = bons + ' / ' + items.length + ' bien placés';
        } else score.textContent = r ? r + ' à placer' : 'Tout est placé';
      }
    });
    $('[data-verifier]', racine).addEventListener('click', function () { tri.verifier(); });
    $('[data-corriger]', racine).addEventListener('click', function () { tri.corriger(); });
    $('[data-rejouer]', racine).addEventListener('click', function () { tri.reinit(); });
  })();

  /* ---------- 7. Le juste milieu ---------- */
  (function () {
    var racine = $('#milieu-app');
    racine.innerHTML =
      '<div class="balance"><svg viewBox="0 0 640 230" aria-hidden="true" data-bal></svg>' +
      '<label class="etiquette" for="milieu-curseur">Fais glisser&nbsp;: à qui attribues-tu les actes de l’homme&nbsp;?</label>' +
      '<input class="curseur" id="milieu-curseur" type="range" min="0" max="100" step="1" value="50">' +
      '<div class="balance-noms"><span>Tout au décret</span><span>Les deux à la fois</span><span>Tout à l’homme</span></div></div>' +
      '<div class="milieu-carte">' + C.milieu.map(function (m) {
        return '<article class="panneau" data-id="' + m.id + '" data-actif="' + (m.id === 'sunna') + '"><p class="etiquette">' + esc(m.sous) + '</p><h3>' + esc(m.nom) + '</h3>' +
          '<p class="image">' + esc(m.image) + '</p><div class="bloc"><b>Ce qu’ils disent.</b> ' + esc(m.dit) + '</div>' +
          '<div class="bloc"><b>Ce que cela produit.</b> ' + esc(m.consequence) + '</div><div class="bloc"><b>La réponse.</b> ' + esc(m.reponse) + '</div>' + preuves(m.ev) + '</article>';
      }).join('') + '</div>';
    var svg = $('[data-bal]', racine), curseur = $('#milieu-curseur', racine);
    function dessiner(v) {
      var ang = (v - 50) / 50 * 16; // négatif : penche à gauche
      var rad = ang * Math.PI / 180, L = 200;
      var gx = 320 - L * Math.cos(rad), gy = 70 - L * Math.sin(rad), dx = 320 + L * Math.cos(rad), dy = 70 + L * Math.sin(rad);
      var poidsG = v < 50 ? 1 : v === 50 ? .75 : .35, poidsD = v > 50 ? 1 : v === 50 ? .75 : .35;
      function plateau(x, y, label, sous, opa, couleur) {
        return '<line x1="' + x + '" y1="' + y + '" x2="' + (x - 46) + '" y2="' + (y + 70) + '" style="stroke:var(--encre-2);stroke-width:1.5"/>' +
          '<line x1="' + x + '" y1="' + y + '" x2="' + (x + 46) + '" y2="' + (y + 70) + '" style="stroke:var(--encre-2);stroke-width:1.5"/>' +
          '<path d="M' + (x - 58) + ' ' + (y + 70) + ' Q ' + x + ' ' + (y + 100) + ' ' + (x + 58) + ' ' + (y + 70) + ' Z" style="fill:' + couleur + ';opacity:' + opa + '"/>' +
          '<text x="' + x + '" y="' + (y + 122) + '" text-anchor="middle" style="fill:var(--encre);font-size:15px;font-weight:600;font-family:var(--f-ui)">' + label + '</text>' +
          '<text x="' + x + '" y="' + (y + 140) + '" text-anchor="middle" style="fill:var(--encre-2);font-size:12px;font-family:var(--f-ui)">' + sous + '</text>';
      }
      svg.innerHTML =
        '<line x1="320" y1="70" x2="320" y2="214" style="stroke:var(--encre-2);stroke-width:3"/>' +
        '<path d="M290 216 L350 216 L320 196 Z" style="fill:var(--encre-2)"/>' +
        '<line x1="' + gx + '" y1="' + gy + '" x2="' + dx + '" y2="' + dy + '" style="stroke:var(--encre);stroke-width:5;stroke-linecap:round"/>' +
        '<circle cx="320" cy="70" r="8" style="fill:var(--or)"/>' +
        plateau(gx, gy, 'Le décret d’Allah', 'science, écriture, volonté, création', poidsG, 'var(--c-accueil)') +
        plateau(dx, dy, 'Le choix de l’homme', 'volonté et capacité réelles', poidsD, 'var(--c-effort)');
    }
    function rendre() {
      var v = Number(curseur.value), actif = v < 34 ? 'jabr' : v > 66 ? 'qadar' : 'sunna';
      dessiner(v);
      $$('.milieu-carte .panneau', racine).forEach(function (p) { p.dataset.actif = String(p.dataset.id === actif); });
      curseur.setAttribute('aria-valuetext', C.milieu.filter(function (m) { return m.id === actif; })[0].nom);
    }
    curseur.addEventListener('input', rendre);
    rendre();
  })();

  /* ---------- 8. Effort et confiance ---------- */
  (function () {
    var racine = $('#causes-app'), Z = C.causes.zones;
    var x = 78, y = 82;
    var X0 = 58, X1 = 388, Y0 = 18, Y1 = 348;
    function px(v) { return X0 + v / 100 * (X1 - X0); }
    function py(v) { return Y1 - v / 100 * (Y1 - Y0); }
    var s = '<svg viewBox="0 0 400 400" role="application" aria-label="Plan effort et confiance" data-plan>' +
      '<rect x="' + X0 + '" y="' + Y0 + '" width="165" height="165" style="fill:var(--surface-2);opacity:.6"/>' +
      '<rect x="' + (X0 + 165) + '" y="' + Y0 + '" width="165" height="165" style="fill:var(--c-dua-doux)"/>' +
      '<rect x="' + X0 + '" y="' + (Y0 + 165) + '" width="165" height="165" style="fill:var(--surface-2)"/>' +
      '<rect x="' + (X0 + 165) + '" y="' + (Y0 + 165) + '" width="165" height="165" style="fill:var(--surface-2);opacity:.6"/>' +
      '<line x1="' + X0 + '" y1="' + Y1 + '" x2="' + X1 + '" y2="' + Y1 + '" style="stroke:var(--encre-2);stroke-width:1.5"/>' +
      '<line x1="' + X0 + '" y1="' + Y0 + '" x2="' + X0 + '" y2="' + Y1 + '" style="stroke:var(--encre-2);stroke-width:1.5"/>' +
      '<line x1="' + (X0 + 165) + '" y1="' + Y0 + '" x2="' + (X0 + 165) + '" y2="' + Y1 + '" style="stroke:var(--trait);stroke-dasharray:4 4"/>' +
      '<line x1="' + X0 + '" y1="' + (Y0 + 165) + '" x2="' + X1 + '" y2="' + (Y0 + 165) + '" style="stroke:var(--trait);stroke-dasharray:4 4"/>' +
      '<text x="' + (X0 + 82) + '" y="' + (Y0 + 22) + '" text-anchor="middle" style="fill:var(--encre-2);font-size:12px;font-weight:600">Faux tawakkul</text>' +
      '<text x="' + (X0 + 247) + '" y="' + (Y0 + 22) + '" text-anchor="middle" style="fill:var(--c-dua);font-size:12px;font-weight:600">Vrai tawakkul</text>' +
      '<text x="' + (X0 + 82) + '" y="' + (Y1 - 12) + '" text-anchor="middle" style="fill:var(--encre-2);font-size:12px;font-weight:600">Abandon</text>' +
      '<text x="' + (X0 + 247) + '" y="' + (Y1 - 12) + '" text-anchor="middle" style="fill:var(--encre-2);font-size:12px;font-weight:600">Cœur sur les moyens</text>' +
      '<text x="' + ((X0 + X1) / 2) + '" y="380" text-anchor="middle" style="fill:var(--encre);font-size:13px">Les moyens que tu prends →</text>' +
      '<text transform="translate(26 ' + ((Y0 + Y1) / 2) + ') rotate(-90)" text-anchor="middle" style="fill:var(--encre);font-size:13px">Le cœur s’appuie sur Allah →</text>' +
      '<g class="poignee" tabindex="0" role="slider" aria-label="Position : effort et confiance" data-poignee>' +
      '<circle class="anneau-focus" r="20" style="fill:none;stroke:transparent"/><circle r="13" style="fill:var(--encre);stroke:var(--surface);stroke-width:4"/></g></svg>';
    racine.innerHTML = '<div><div class="plan">' + s + '</div><div class="preselections">' + C.causes.presets.map(function (p, i) {
      return '<button class="btn btn-petit" type="button" data-pre="' + i + '">' + esc(p.t) + '</button>';
    }).join('') + '</div></div><div class="panneau" aria-live="polite" data-lecture></div>';
    var plan = $('[data-plan]', racine), poignee = $('[data-poignee]', racine), lecture = $('[data-lecture]', racine);
    function zone() { return x >= 50 ? (y >= 50 ? 'vrai' : 'materiel') : (y >= 50 ? 'faux' : 'abandon'); }
    function rendre() {
      poignee.setAttribute('transform', 'translate(' + px(x) + ' ' + py(y) + ')');
      poignee.setAttribute('aria-valuetext', 'Moyens ' + Math.round(x) + ' %, confiance ' + Math.round(y) + ' %');
      var z = Z[zone()];
      lecture.innerHTML = '<span class="verbe v-' + z.verbe + '">' + esc(C.verbes[z.verbe].nom) + '</span><h3 style="margin-top:.5rem">' + esc(z.t) + '</h3>' +
        '<p style="margin-top:.4rem">' + esc(z.txt) + '</p><div class="jauges"><div class="jauge">Moyens pris<b>' + Math.round(x) + ' %</b></div><div class="jauge">Cœur appuyé sur Allah<b>' + Math.round(y) + ' %</b></div></div>' + preuves(z.ev);
    }
    function depuisEvt(e) {
      var pt = plan.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var m = plan.getScreenCTM(); if (!m) return;
      var p = pt.matrixTransform(m.inverse());
      x = Math.max(0, Math.min(100, (p.x - X0) / (X1 - X0) * 100));
      y = Math.max(0, Math.min(100, (Y1 - p.y) / (Y1 - Y0) * 100));
      rendre();
    }
    var glisse = false;
    plan.addEventListener('pointerdown', function (e) { glisse = true; try { plan.setPointerCapture(e.pointerId); } catch (err) { } depuisEvt(e); poignee.focus({ preventScroll: true }); });
    plan.addEventListener('pointermove', function (e) { if (glisse) depuisEvt(e); });
    plan.addEventListener('pointerup', function () { glisse = false; });
    plan.addEventListener('pointercancel', function () { glisse = false; });
    poignee.addEventListener('keydown', function (e) {
      var pas = e.shiftKey ? 10 : 4, k = e.key;
      if (k === 'ArrowRight') x = Math.min(100, x + pas); else if (k === 'ArrowLeft') x = Math.max(0, x - pas);
      else if (k === 'ArrowUp') y = Math.min(100, y + pas); else if (k === 'ArrowDown') y = Math.max(0, y - pas); else return;
      e.preventDefault(); rendre();
    });
    $$('[data-pre]', racine).forEach(function (b) {
      b.addEventListener('click', function () { var p = C.causes.presets[Number(b.dataset.pre)]; x = p.x; y = p.y; rendre(); });
    });
    rendre();
  })();

  /* ---------- 9. L’invocation ---------- */
  (function () {
    var racine = $('#dua-app'), Q = C.dua;
    function extrait(id) {
      var it = IDX[id];
      return it.type === 'coran' ? it.verses[0].ar : it.ar;
    }
    racine.innerHTML =
      '<div class="dua-grille"><div><h3 class="etiquette">Les trois issues de toute invocation</h3>' +
      '<p style="margin-top:.4rem">Tu ne sais pas laquelle Allah choisira pour toi. Ouvre les trois portes&nbsp;: chacune est un gain.</p>' +
      '<div class="portes">' + Q.issues.map(function (p, i) {
        return '<button class="porte" type="button" aria-expanded="false" data-porte="' + i + '"><span class="ar" lang="ar" dir="rtl">' + p.ar + '</span><b>' + esc(p.t) + '</b><small>' + esc(p.txt) + '</small></button>';
      }).join('') + '</div>' + preuves(['h-trois']) +
      '<div class="registres"><div class="registre fixe"><b>La Mère du Livre</b>Auprès d’Allah. Elle ne change jamais&nbsp;: elle contient déjà ton invocation et son effet.</div>' +
      '<div class="registre mobile"><b>Les registres des anges</b>« Allah efface ou confirme ce qu’Il veut »&nbsp;: une épreuve inscrite peut y être effacée par une cause, comme l’invocation ou les liens de parenté.</div></div>' +
      preuves(['q13-39', 'h-rahm', 'h-qada-dua']) + '</div>' +
      '<div class="panneau"><h3>Invoquer comme le Prophète ﷺ l’a enseigné</h3><div class="regles">' + Q.regles.map(function (r) {
        return '<div class="regle"><b>' + esc(r.t) + '</b>' + esc(r.txt) + preuves(r.ev) + '</div>';
      }).join('') + '</div></div></div>' +
      '<div class="invocations"><h3 class="etiquette">Invocations liées au destin</h3><div class="invoc-grille">' + Q.invocations.map(function (v) {
        var it = IDX[v.id];
        return '<button class="invoc" type="button" data-ev="' + v.id + '"><small>' + esc(v.t) + '</small><span class="ar' + (it.type === 'coran' ? ' coran' : '') + '" lang="ar" dir="rtl">' + esc(extrait(v.id)) + '</span><span>' + esc(it.title) + ' · ' + esc(libelleCourt(it)) + '</span></button>';
      }).join('') + '</div></div>';
    $$('[data-porte]', racine).forEach(function (b) {
      b.addEventListener('click', function () { b.setAttribute('aria-expanded', String(b.getAttribute('aria-expanded') !== 'true')); });
    });
  })();

  /* ---------- 10. Face à l’épreuve ---------- */
  (function () {
    var racine = $('#epreuve-app'), choisi = 'sabr';
    racine.innerHTML =
      '<div class="echelle-grille"><div class="echelle" role="group" aria-label="Les quatre marches">' + C.echelle.map(function (m, i) {
        return '<button class="marche" type="button" data-id="' + m.id + '" aria-pressed="false"><span class="n">' + (i + 1) + '</span><b>' + esc(m.nom) + '</b><span class="ar" lang="ar" dir="rtl">' + m.ar + '</span><span class="statut">' + esc(m.statut) + '</span></button>';
      }).join('') + '</div><div class="panneau" aria-live="polite" data-det></div></div>' +
      '<p class="astuce-defile">Classification enseignée notamment par Ibn ‘Uthaymîn&nbsp;: la patience est obligatoire, le contentement recommandé selon la majorité des savants.</p>' +
      '<div class="listes-epreuve"><div><h3>Ce qui ne contredit pas la patience</h3><ul>' + C.pasContraire.map(function (p) {
        return '<li><span>' + esc(p.t) + '</span>' + preuve(p.ev) + '</li>';
      }).join('') + '</ul></div><div><h3>Pourquoi les épreuves&nbsp;?</h3><ul>' + C.sagesses.map(function (s) {
        return '<li><span>' + esc(s.t) + '</span>' + s.ev.map(preuve).join('') + '</li>';
      }).join('') + '</ul></div></div>';
    var det = $('[data-det]', racine);
    function rendre() {
      var m = C.echelle.filter(function (x) { return x.id === choisi; })[0];
      $$('.marche', racine).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.id === choisi)); });
      det.innerHTML = '<p class="etiquette">' + esc(m.statut) + '</p><h3>' + esc(m.nom) + ' <span lang="ar" dir="rtl" style="color:var(--or)">' + m.ar + '</span></h3>' +
        '<div class="trois-niveaux"><div><b>Le cœur</b><span>' + esc(m.coeur) + '</span></div><div><b>La langue</b><span>' + esc(m.langue) + '</span></div><div><b>Les gestes</b><span>' + esc(m.membres) + '</span></div></div>' + preuves(m.ev);
    }
    $$('.marche', racine).forEach(function (b) { b.addEventListener('click', function () { choisi = b.dataset.id; rendre(); }); });
    rendre();
  })();

  /* ---------- 11. L’excuse du destin ---------- */
  (function () {
    var racine = $('#excuse-app');
    var reps = {};
    function rendre() {
      var n = Object.keys(reps).length, bons = Object.keys(reps).filter(function (k) { return reps[k] === C.quiz[k].ok; }).length;
      racine.innerHTML = '<div class="quiz-score" aria-live="polite"><span><b>' + bons + '</b> bonne' + (bons > 1 ? 's' : '') + ' réponse' + (bons > 1 ? 's' : '') + ' sur <b>' + n + '</b> · ' + (C.quiz.length - n) + ' restante' + (C.quiz.length - n > 1 ? 's' : '') + '</span>' +
        (n ? '<button class="btn btn-petit" type="button" data-raz>Recommencer</button>' : '') + '</div>' +
        '<div class="quiz">' + C.quiz.map(function (q, i) {
          var r = reps[i], etat = r === undefined ? '' : (r === q.ok ? 'juste' : 'faux');
          var h = '<article class="question-quiz" data-etat="' + etat + '"><p>' + esc(q.t) + '</p>';
          if (r === undefined) {
            h += '<div class="quiz-boutons"><button class="btn btn-petit" type="button" data-q="' + i + '" data-v="1">Valable</button><button class="btn btn-petit" type="button" data-q="' + i + '" data-v="0">Pas valable</button></div>';
          } else {
            h += '<p class="retour"><b>' + (etat === 'juste' ? 'Juste.' : 'Pas tout à fait.') + '</b> ' + (q.ok ? 'C’est une manière valable d’invoquer le destin. ' : 'Ce n’est pas valable. ') + esc(q.pourquoi) + '</p>' + preuves(q.ev);
          }
          return h + '</article>';
        }).join('') + '</div>';
      $$('[data-q]', racine).forEach(function (b) {
        b.addEventListener('click', function () { reps[b.dataset.q] = b.dataset.v === '1'; rendre(); });
      });
      var raz = $('[data-raz]', racine);
      if (raz) raz.addEventListener('click', function () { reps = {}; rendre(); });
    }
    rendre();
  })();

  /* ---------- 12. Les prophètes ---------- */
  (function () {
    var racine = $('#modeles-app'), filtre = 'tous';
    racine.innerHTML = '<div class="filtres" role="group" aria-label="Filtrer par attitude"><button class="btn btn-petit" type="button" data-f="tous" aria-pressed="true">Tous</button>' +
      Object.keys(C.verbes).map(function (v) { return '<button class="btn btn-petit" type="button" data-f="' + v + '" aria-pressed="false">' + esc(C.verbes[v].nom) + '</button>'; }).join('') +
      '</div><div class="modeles">' + C.modeles.map(function (m) {
        return '<article class="modele" data-verbes="' + m.verbes.join(' ') + '"><div class="modele-tete"><h3>' + esc(m.nom) + '</h3><span class="ar" lang="ar" dir="rtl">' + m.ar + '</span></div>' +
          '<dl><div><dt>Le décret</dt><dd>' + esc(m.decret) + '</dd></div><div><dt>Ce qu’il a fait</dt><dd>' + esc(m.fait) + '</dd></div><div><dt>La leçon</dt><dd>' + esc(m.lecon) + '</dd></div></dl>' +
          verbes(m.verbes) + preuves(m.ev) + '</article>';
      }).join('') + '</div>';
    $$('[data-f]', racine).forEach(function (b) {
      b.addEventListener('click', function () {
        filtre = b.dataset.f;
        $$('[data-f]', racine).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        $$('.modele', racine).forEach(function (m) { m.hidden = filtre !== 'tous' && m.dataset.verbes.split(' ').indexOf(filtre) < 0; });
      });
    });
  })();

  /* ---------- 13. Questions ---------- */
  $('#questions-app').innerHTML = C.faq.map(function (f, i) {
    return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(f.q) + '</summary><div class="rep"><p>' + esc(f.r) + '</p>' + preuves(f.ev) + '</div></details>';
  }).join('');

  /* ---------- 14. Mon carnet ---------- */
  (function () {
    var racine = $('#carnet-app'), CLE = 'qadar-carnet-v1';
    var entrees = null, exemples = false;
    try { var brut = localStorage.getItem(CLE); if (brut) entrees = JSON.parse(brut); } catch (err) { entrees = null; }
    if (!Array.isArray(entrees)) { entrees = C.carnetExemples.map(function (e, i) { return { id: 'ex' + i, t: e.t, v: e.v }; }); exemples = true; }
    function sauver() { try { localStorage.setItem(CLE, JSON.stringify(entrees)); } catch (err) { } }
    var options = Object.keys(C.verbes).map(function (v) { return '<option value="' + v + '">' + esc(C.verbes[v].nom) + '</option>'; }).join('');
    racine.innerHTML =
      '<form class="carnet-form" novalidate><label>Ce qui m’occupe<input id="carnet-texte" type="text" maxlength="140" placeholder="Ex. : l’entretien de mardi, la santé de mon père…" autocomplete="off"></label>' +
      '<label>Mon attitude<select id="carnet-verbe">' + options + '</select></label><button class="btn btn-plein" type="submit">Ajouter</button></form>' +
      '<div class="colonnes" data-cols></div>' +
      '<div class="carnet-pied"><button class="btn btn-petit" type="button" data-copier-carnet>Copier mon carnet</button><button class="btn btn-petit" type="button" data-effacer>Tout effacer</button>' +
      '<span data-info></span><a href="#guide">Je ne sais pas quelle attitude choisir&nbsp;→ l’arbre de décision</a></div><textarea class="copie-zone" id="carnet-copie" readonly hidden></textarea>';
    var cols = $('[data-cols]', racine), info = $('[data-info]', racine);
    function rendre() {
      cols.innerHTML = Object.keys(C.verbes).map(function (v) {
        var R = C.carnetRappels[v], liste = entrees.filter(function (e) { return e.v === v; });
        return '<section class="colonne v-' + v + '"><h3>' + esc(C.verbes[v].nom) + '</h3><p class="rappel">' + esc(R.txt) + ' ' + preuve(R.ev) + '</p><ul>' +
          (liste.length ? liste.map(function (e) {
            return '<li class="entree">' + (exemples ? '<span class="exemple">Exemple</span>' : '') + '<span class="entree-txt">' + esc(e.t) + '</span><span class="entree-actions">' +
              '<select aria-label="Déplacer" data-dep="' + e.id + '">' + Object.keys(C.verbes).map(function (o) { return '<option value="' + o + '"' + (o === v ? ' selected' : '') + '>' + esc(C.verbes[o].nom) + '</option>'; }).join('') + '</select>' +
              '<button type="button" data-sup="' + e.id + '" aria-label="Supprimer">Retirer</button></span></li>';
          }).join('') : '<li class="vide" style="font-size:var(--t-xs)">Rien ici pour l’instant.</li>') + '</ul></section>';
      }).join('');
      info.textContent = exemples ? 'Les exemples disparaissent dès ta première entrée.' : entrees.length + ' entrée' + (entrees.length > 1 ? 's' : '') + ' · enregistré sur cet appareil';
      $$('[data-dep]', cols).forEach(function (s) {
        s.addEventListener('change', function () { entrees.forEach(function (e) { if (e.id === s.dataset.dep) e.v = s.value; }); if (!exemples) sauver(); rendre(); });
      });
      $$('[data-sup]', cols).forEach(function (b) {
        b.addEventListener('click', function () { entrees = entrees.filter(function (e) { return e.id !== b.dataset.sup; }); if (!exemples) sauver(); rendre(); });
      });
    }
    $('form', racine).addEventListener('submit', function (e) {
      e.preventDefault();
      var champ = $('#carnet-texte'), t = champ.value.trim();
      if (!t) { champ.focus(); return; }
      if (exemples) { entrees = []; exemples = false; }
      entrees.push({ id: 'e' + Date.now().toString(36), t: t, v: $('#carnet-verbe').value });
      sauver(); champ.value = ''; champ.focus(); rendre();
    });
    $('[data-copier-carnet]', racine).addEventListener('click', function (e) {
      var txt = 'Mon carnet du qadar\n' + Object.keys(C.verbes).map(function (v) {
        var l = entrees.filter(function (x) { return x.v === v; });
        return '\n' + C.verbes[v].nom + '\n' + (l.length ? l.map(function (x) { return '- ' + x.t; }).join('\n') : '- (rien)');
      }).join('\n');
      copier(txt, e.currentTarget, $('#carnet-copie'));
    });
    var effBtn = $('[data-effacer]', racine), effTimer = null;
    effBtn.addEventListener('click', function () {
      if (effBtn.dataset.conf !== '1') {
        effBtn.dataset.conf = '1'; effBtn.textContent = 'Confirmer l’effacement';
        effTimer = setTimeout(function () { effBtn.dataset.conf = ''; effBtn.textContent = 'Tout effacer'; }, 4000);
        return;
      }
      clearTimeout(effTimer); effBtn.dataset.conf = ''; effBtn.textContent = 'Tout effacer';
      entrees = []; exemples = false; sauver(); rendre();
    });
    rendre();
  })();

  /* ---------- 15. Bibliothèque ---------- */
  var Biblio = (function () {
    var racine = $('#preuves-app');
    var type = 'tous', theme = null, texte = '', limite = 24;
    function sansAccents(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
    var STRIP = /[ؐ-ًؚ-ٰٟۖ-ۭـ࣓-ࣿ]/g;
    function arNorm(s) { return s.replace(STRIP, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه'); }
    var liste = D.items.slice().sort(function (a, b) {
      var o = { coran: 0, hadith: 1, savant: 2 };
      if (a.type !== b.type) return o[a.type] - o[b.type];
      if (a.type === 'coran') {
        var ra = a.ref.split(/[:-]/).map(Number), rb = b.ref.split(/[:-]/).map(Number);
        return ra[0] - rb[0] || ra[1] - rb[1];
      }
      return 0;
    });
    liste.forEach(function (it) {
      it._fr = sansAccents([it.title, francaisDe(it), it.src, it.note || '', it.narr || ''].join(' '));
      it._ar = arNorm(arabeDe(it));
    });
    racine.innerHTML =
      '<div class="biblio-outils"><div class="biblio-ligne"><label class="etiquette" for="biblio-recherche" style="flex:none">Rechercher</label>' +
      '<input id="biblio-recherche" type="search" placeholder="patience, ‘écrit’, Bukhârî 6614, صبر…" autocomplete="off"></div>' +
      '<div class="biblio-ligne" role="group" aria-label="Type"><button class="btn btn-petit" type="button" data-type="tous" aria-pressed="true">Tout</button>' +
      '<button class="btn btn-petit" type="button" data-type="coran" aria-pressed="false">Coran</button><button class="btn btn-petit" type="button" data-type="hadith" aria-pressed="false">Hadiths</button>' +
      '<button class="btn btn-petit" type="button" data-type="savant" aria-pressed="false">Paroles savantes</button></div>' +
      '<div class="biblio-ligne" role="group" aria-label="Thème"><button class="puce-theme" type="button" data-th="" aria-pressed="true">Tous les thèmes</button>' +
      Object.keys(D.themes).map(function (t) { return '<button class="puce-theme" type="button" data-th="' + t + '" aria-pressed="false">' + esc(D.themes[t]) + '</button>'; }).join('') + '</div></div>' +
      '<p class="compte" aria-live="polite"></p><div class="resultats"></div><button class="btn plus" type="button" data-plus hidden>Afficher plus</button>';
    var res = $('.resultats', racine), compte = $('.compte', racine), plus = $('[data-plus]', racine);
    function filtres() {
      var q = sansAccents(texte.trim()), qa = arNorm(texte.trim());
      return liste.filter(function (it) {
        if (type !== 'tous' && it.type !== type) return false;
        if (theme && it.themes.indexOf(theme) < 0) return false;
        if (!q) return true;
        return q.split(/\s+/).every(function (m) { return it._fr.indexOf(m) >= 0; }) || (qa && it._ar.indexOf(qa) >= 0);
      });
    }
    function rendre() {
      var f = filtres();
      compte.textContent = f.length + ' preuve' + (f.length > 1 ? 's' : '') + (theme ? ' · thème « ' + D.themes[theme] + ' »' : '');
      res.innerHTML = f.slice(0, limite).map(function (it) {
        return '<button class="fiche" type="button" data-ev="' + it.id + '"><span class="fiche-tete"><span>' + esc(it.src) + '</span><span class="grade" data-level="' + it.level + '">' + esc(it.grade) + '</span></span>' +
          '<h3>' + esc(it.title) + '</h3><span class="ar' + (it.type === 'coran' ? ' coran' : '') + '" lang="ar" dir="rtl">' + esc(arabeDe(it)) + '</span><span class="fr">' + esc(francaisDe(it)) + '</span></button>';
      }).join('') || '<p class="vide">Aucune preuve ne correspond. Essaie un autre mot ou un autre thème.</p>';
      plus.hidden = f.length <= limite;
    }
    var minuterie = null;
    $('#biblio-recherche').addEventListener('input', function (e) {
      clearTimeout(minuterie);
      minuterie = setTimeout(function () { texte = e.target.value; limite = 24; rendre(); }, 120);
    });
    $$('[data-type]', racine).forEach(function (b) {
      b.addEventListener('click', function () {
        type = b.dataset.type; limite = 24;
        $$('[data-type]', racine).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        rendre();
      });
    });
    function majThemes() { $$('[data-th]', racine).forEach(function (x) { x.setAttribute('aria-pressed', String((x.dataset.th || null) === theme)); }); }
    $$('[data-th]', racine).forEach(function (b) {
      b.addEventListener('click', function () { theme = b.dataset.th || null; limite = 24; majThemes(); rendre(); });
    });
    plus.addEventListener('click', function () { limite += 24; rendre(); });
    rendre();
    return { filtrerTheme: function (t) { theme = t; type = 'tous'; limite = 24; majThemes(); $$('[data-type]', racine).forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.type === 'tous')); }); rendre(); } };
  })();

  /* ---------- Compteurs et sommaire ---------- */
  var nbCoran = D.items.filter(function (i) { return i.type === 'coran'; }).length;
  var nbHadith = D.items.filter(function (i) { return i.type === 'hadith'; }).length;
  $('#compte-coran').textContent = nbCoran;
  $('#compte-hadith').textContent = nbHadith;

  (function () {
    var liens = $$('.toc a'), toc = $('.toc');
    if (!('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        liens.forEach(function (a) {
          var actif = a.getAttribute('href') === '#' + en.target.id;
          a.setAttribute('aria-current', String(actif));
          if (actif) toc.scrollTo({ left: toc.scrollLeft + a.getBoundingClientRect().left - toc.getBoundingClientRect().left - 24, behavior: 'smooth' });
        });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    liens.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) obs.observe(s); });
  })();
})();
