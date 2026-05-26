/*
  View - Mision 4: Control del Impacto
  + Particle system (canvas)
  + Efectos de red neural activa
  + VT323 en nodos
*/
const Mission4View = (() => {
  const SVG_NS = "http://www.w3.org/2000/svg";

  /* ══════════════════════════════════════════════════════════════════
     PARTICLE SYSTEM
  ══════════════════════════════════════════════════════════════════ */

  const PS = {
    canvas: null,
    ctx:    null,
    W: 0, H: 0,
    particles: [],
    raf: null,
    saturatedRatio: 0,   // 0-1 según cuántas aristas saturadas hay

    PARTICLE_COUNT:  90,
    CONNECTION_DIST: 120,

    init() {
      this.canvas = document.getElementById("particle-canvas");
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext("2d");
      this.resize();
      this.spawnAll();
      window.addEventListener("resize", () => this.resize());
      this.loop();
    },

    resize() {
      this.W = this.canvas.width  = window.innerWidth;
      this.H = this.canvas.height = window.innerHeight;
    },

    spawnAll() {
      this.particles = [];
      for (let i = 0; i < this.PARTICLE_COUNT; i++) {
        this.particles.push(this.newParticle());
      }
    },

    newParticle(x, y) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.18 + Math.random() * 0.28;
      return {
        x:     x ?? Math.random() * this.W,
        y:     y ?? Math.random() * this.H,
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed,
        r:     0.8 + Math.random() * 1.4,
        alpha: 0.2 + Math.random() * 0.5,
        life:  1,
        // color index 0=blue, 1=green, 2=amber/red
        hue:   Math.random() < 0.6 ? 0 : (Math.random() < 0.7 ? 1 : 2)
      };
    },

    getColor(p) {
      const danger = this.saturatedRatio;
      if (p.hue === 2) {
        // más rojo cuando hay saturación
        const r = Math.round(255);
        const g = Math.round(80 - 80 * danger);
        return `rgba(${r},${g},50,${p.alpha * (0.4 + 0.6 * danger)})`;
      }
      if (p.hue === 1) return `rgba(0,255,136,${p.alpha * 0.7})`;
      return `rgba(0,170,255,${p.alpha * 0.7})`;
    },

    loop() {
      this.raf = requestAnimationFrame(() => this.loop());
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.W, this.H);

      // mover + dibujar puntos
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = this.W + 10;
        if (p.x > this.W + 10) p.x = -10;
        if (p.y < -10) p.y = this.H + 10;
        if (p.y > this.H + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = this.getColor(p);
        ctx.fill();
      }

      // conexiones
      for (let i = 0; i < this.particles.length; i++) {
        const a = this.particles[i];
        for (let j = i + 1; j < this.particles.length; j++) {
          const b = this.particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > this.CONNECTION_DIST) continue;

          const strength = (1 - dist / this.CONNECTION_DIST);
          const alpha    = strength * 0.12;

          // gradiente entre colores de los dos extremos
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, this.getColor({ ...a, alpha }));
          grad.addColorStop(1, this.getColor({ ...b, alpha }));

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth   = strength * 0.7;
          ctx.stroke();
        }
      }
    },

    /** Llamar desde update() para ajustar el "clima" visual */
    setSaturation(ratio) {
      this.saturatedRatio = Math.max(0, Math.min(1, ratio));
    },

    destroy() {
      if (this.raf) cancelAnimationFrame(this.raf);
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     HELPERS SVG
  ══════════════════════════════════════════════════════════════════ */

  function el(tag, attrs = {}) {
    const e = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));
    return e;
  }

  /* ══════════════════════════════════════════════════════════════════
     MARCADORES DE FLECHA
  ══════════════════════════════════════════════════════════════════ */

  function makeMarkers() {
    const defs = el("defs");

    const markerDefs = [
      { id: "arr-default",   color: "#1e3347" },
      { id: "arr-active",    color: "#ffcc00" },
      { id: "arr-flow",      color: "#00ff88" },
      { id: "arr-saturated", color: "#ff3344" }
    ];

    markerDefs.forEach(({ id, color }) => {
      const m = el("marker", {
        id,
        viewBox:      "0 0 10 10",
        refX:         "38",
        refY:         "5",
        markerWidth:  "6",
        markerHeight: "6",
        orient:       "auto-start-reverse"
      });
      m.appendChild(el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: color }));
      defs.appendChild(m);
    });

    return defs;
  }

  /* ══════════════════════════════════════════════════════════════════
     CLASIFICADOR DE ARISTA
  ══════════════════════════════════════════════════════════════════ */

  function classifyEdge(edge, activePath) {
    const isSaturated = edge.flow >= edge.capacity;
    const hasFlow     = edge.flow > 0 && !isSaturated;
    const onPath      = activePath && activePath.length >= 2
      ? activePath.some((_, i) =>
          i < activePath.length - 1 &&
          activePath[i] === edge.from &&
          activePath[i + 1] === edge.to)
      : false;

    if (onPath)      return "active";
    if (isSaturated) return "saturated";
    if (hasFlow)     return "flow";
    return "default";
  }

  /* ══════════════════════════════════════════════════════════════════
     RENDERIZADO DEL GRAFO
  ══════════════════════════════════════════════════════════════════ */

  function renderGraph(graph, activePath = [], selectedPath = [], onNodeClick = null) {
    const svg = document.getElementById("flow-graph");
    if (!svg) return;
    svg.innerHTML = "";

    svg.appendChild(makeMarkers());

    /* ── aristas ── */
    graph.edges.forEach(edge => {
      const from = graph.nodes.find(n => n.id === edge.from);
      const to   = graph.nodes.find(n => n.id === edge.to);
      if (!from || !to) return;

      const cls    = classifyEdge(edge, activePath);
      const marker = `url(#arr-${cls})`;

      const dx   = to.x - from.x;
      const dy   = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const r    = 34;

      const x1 = from.x + (dx / dist) * r;
      const y1 = from.y + (dy / dist) * r;
      const x2 = to.x   - (dx / dist) * r;
      const y2 = to.y   - (dy / dist) * r;

      const line = el("line", {
        x1, y1, x2, y2,
        class:          `edge edge-${cls}`,
        "marker-end":   marker,
        "data-edge-id": edge.id
      });
      svg.appendChild(line);

      /* etiqueta flujo/capacidad */
      const mx = (from.x + to.x) / 2 + (dy / dist) * -14;
      const my = (from.y + to.y) / 2 + (dx / dist) * 14;

      const labelBg = el("rect", {
        x: mx - 22, y: my - 10,
        width: 44, height: 16, rx: 3,
        class: `edge-label-bg edge-label-bg-${cls}`
      });
      svg.appendChild(labelBg);

      const label = el("text", {
        x: mx, y: my + 1,
        class: `edge-label edge-label-text-${cls}`
      });
      label.textContent = `${edge.flow}/${edge.capacity}`;
      svg.appendChild(label);
    });

    /* ── nodos ── */
    graph.nodes.forEach(node => {
      const onActive   = activePath.includes(node.id);
      const selIdx     = selectedPath.indexOf(node.id);
      const onSelected = selIdx !== -1;
      const isLast     = onSelected && selIdx === selectedPath.length - 1;

      let extraClass = "";
      if (isLast)          extraClass = " node-selected-last";
      else if (onSelected) extraClass = " node-selected";

      const g = el("g", {
        class:          `node node-${node.type}${extraClass}`,
        transform:      `translate(${node.x}, ${node.y})`,
        "data-node-id": node.id,
        style:          onNodeClick ? "cursor:pointer" : ""
      });

      /* anillo de pulso (tutorial) */
      if (onActive) {
        g.appendChild(el("circle", { r: 38, class: "node-ring" }));
        // rayo adicional más amplio
        g.appendChild(el("circle", { r: 45, class: "node-ray" }));
      }

      /* anillo de selección (desafío) */
      if (onSelected) {
        g.appendChild(el("circle", {
          r: 38,
          class: isLast ? "node-ring-sel-last" : "node-ring-sel"
        }));
      }

      g.appendChild(el("circle", { r: 30, class: "node-core" }));

      const idLabel = el("text", { class: "node-id" });
      idLabel.textContent = node.id;
      g.appendChild(idLabel);

      const aliasLabel = el("text", { class: "node-alias", y: 47 });
      aliasLabel.textContent = node.alias;
      g.appendChild(aliasLabel);

      if (onNodeClick) {
        g.addEventListener("click", () => onNodeClick(node.id));
      }

      svg.appendChild(g);
    });

    /* actualizar saturación para partículas */
    const totalEdges     = graph.edges.length;
    const saturatedEdges = graph.edges.filter(e => e.flow >= e.capacity).length;
    PS.setSaturation(totalEdges > 0 ? saturatedEdges / totalEdges : 0);
  }

  /* ══════════════════════════════════════════════════════════════════
     PANEL LATERAL
  ══════════════════════════════════════════════════════════════════ */

  function renderStatus({ source, sink, maxFlow, currentPath, currentBottleneck, finished, started }) {
    const target = document.getElementById("flow-summary");
    if (!target) return;

    const pathStr = currentPath.length
      ? currentPath.join(" → ")
      : started ? "—" : "Presiona INICIAR";

    const bnStr = (started && currentBottleneck > 0)
      ? `<span class="val-highlight">${currentBottleneck}</span>`
      : "—";

    const flowColor = finished ? "var(--green)" : "var(--blue)";

    target.innerHTML = `
      <div class="stat-row">
        <span class="stat-key">Fuente</span>
        <span class="stat-val source-badge">${source}</span>
      </div>
      <div class="stat-row">
        <span class="stat-key">Destino</span>
        <span class="stat-val sink-badge">${sink}</span>
      </div>
      <div class="stat-row">
        <span class="stat-key">Flujo acumulado</span>
        <span class="stat-val" style="color:${flowColor};font-size:16px;font-weight:700">${maxFlow} / 17</span>
      </div>
      <div class="stat-row">
        <span class="stat-key">Camino actual</span>
        <span class="stat-val path-display">${pathStr}</span>
      </div>
      <div class="stat-row">
        <span class="stat-key">Cuello de botella</span>
        <span class="stat-val">${bnStr}</span>
      </div>
    `;
  }

  function renderSteps(steps) {
    const target = document.getElementById("flow-steps");
    if (!target) return;

    if (!steps.length) {
      target.innerHTML = `<div class="step-empty">Los pasos apareceran aqui.</div>`;
      return;
    }

    target.innerHTML = steps.map((step, i) => `
      <div class="step-entry ${i === steps.length - 1 ? "step-latest" : ""}">
        <span class="step-num">#${i + 1}</span>
        <span class="step-path">${step.path.join("→")}</span>
        <span class="step-meta">+${step.bottleneck} → <strong>${step.maxFlow}</strong></span>
      </div>
    `).join("");
  }

  /* ══════════════════════════════════════════════════════════════════
     CONTROLES
  ══════════════════════════════════════════════════════════════════ */

  function setControlsState({ started, finished }) {
    const btnStart = document.getElementById("btn-start");
    const btnNext  = document.getElementById("btn-next");
    const btnReset = document.getElementById("btn-reset");

    if (btnStart) btnStart.disabled = started;
    if (btnNext)  btnNext.disabled  = !started || finished;
    if (btnReset) btnReset.disabled = false;
  }

  function setChallengeControlsState({ canConfirm }) {
    const btnConfirm = document.getElementById("btn-confirm-path");
    if (btnConfirm) btnConfirm.disabled = !canConfirm;
  }

  /* ══════════════════════════════════════════════════════════════════
     COMPLETION
  ══════════════════════════════════════════════════════════════════ */

  function showCompletion(maxFlow) {
    const overlay = document.getElementById("completion-overlay");
    if (!overlay) return;
    const val = document.getElementById("completion-flow-val");
    if (val) val.textContent = maxFlow;
    overlay.classList.add("visible");
  }

  function hideCompletion() {
    const overlay = document.getElementById("completion-overlay");
    if (overlay) overlay.classList.remove("visible");
  }

  /* ══════════════════════════════════════════════════════════════════
     PANEL DESAFÍO
  ══════════════════════════════════════════════════════════════════ */

  function renderChallengeStatus({ selectedPath, feedback, maxFlow, source, sink, steps }) {
    const pathTarget = document.getElementById("challenge-path-display");
    if (pathTarget) {
      pathTarget.textContent = selectedPath.length
        ? selectedPath.join(" → ")
        : "Haz click en S para comenzar";
    }

    const fbTarget = document.getElementById("challenge-feedback");
    if (fbTarget) {
      if (!feedback) {
        fbTarget.textContent = "";
        fbTarget.className   = "challenge-feedback";
      } else {
        fbTarget.textContent = feedback.message;
        fbTarget.className   = `challenge-feedback ${feedback.ok ? "feedback-ok" : "feedback-err"}`;
      }
    }

    const flowTarget = document.getElementById("challenge-flow-val");
    if (flowTarget) {
      flowTarget.textContent = `${maxFlow} / 17`;
      flowTarget.style.color = maxFlow === 17 ? "var(--green)" : "var(--blue)";
    }

    // habilitar confirmar si la ruta termina en el sink
    const canConfirm = selectedPath.length >= 2 &&
                       selectedPath[selectedPath.length - 1] === sink;
    setChallengeControlsState({ canConfirm });

    renderSteps(steps || []);
  }

  /* ══════════════════════════════════════════════════════════════════
     RENDER COMPLETO
  ══════════════════════════════════════════════════════════════════ */

  function render(graph, _solution) {
    renderGraph(graph, [], [], null);
    renderStatus({
      source: graph.source, sink: graph.sink,
      maxFlow: 0, currentPath: [], currentBottleneck: 0,
      finished: false, started: false
    });
    renderChallengeStatus({
      selectedPath: [], feedback: null, maxFlow: 0,
      source: graph.source, sink: graph.sink, steps: []
    });
    renderSteps([]);
    setControlsState({ started: false, finished: false });
    setChallengeControlsState({ canConfirm: false });
    hideCompletion();
  }

  /* ══════════════════════════════════════════════════════════════════
     UPDATE TUTORIAL
  ══════════════════════════════════════════════════════════════════ */

  function update(graph, { currentPath, currentBottleneck, maxFlow, finished, steps }) {
    renderGraph(graph, currentPath, [], null);
    renderStatus({
      source: graph.source, sink: graph.sink,
      maxFlow, currentPath, currentBottleneck, finished, started: true
    });
    renderSteps(steps);
    setControlsState({ started: true, finished });
    if (finished) showCompletion(maxFlow);
  }

  /* ══════════════════════════════════════════════════════════════════
     UPDATE DESAFÍO
  ══════════════════════════════════════════════════════════════════ */

  function updateChallenge(graph, { selectedPath, feedback, maxFlow, steps, onNodeClick }) {
    renderGraph(graph, [], selectedPath, onNodeClick);
    renderChallengeStatus({
      selectedPath, feedback, maxFlow,
      source: graph.source, sink: graph.sink, steps
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     INIT PARTICLES
  ══════════════════════════════════════════════════════════════════ */

  function initParticles() {
    PS.init();
  }

  /* ══════════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════════ */

  return {
    initParticles,
    render,
    update,
    updateChallenge,
    renderGraph,
    renderStatus,
    renderChallengeStatus,
    renderSteps,
    setControlsState,
    setChallengeControlsState,
    showCompletion,
    hideCompletion
  };
})();
