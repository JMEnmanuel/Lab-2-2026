/*
  View — Mision 3: Reconstruir la Red
  Dibuja el SVG, actualiza el panel lateral
  y maneja los estados visuales de la animacion.
  No toca logica de grafos ni de algoritmos.
*/
const View = (() => {
  const SVG_NS = "http://www.w3.org/2000/svg";

  const EDGE_COLORS = {
    idle:       "#30363d",
    evaluating: "#d29922",
    compared:   "#e07a28",
    accepted:   "#3fb950",
    rejected:   "#f85149"
  };

  const EDGE_GLOW = {
    idle:       "none",
    evaluating: "drop-shadow(0 0 6px #d29922aa)",
    compared:   "drop-shadow(0 0 5px #e07a2888)",
    accepted:   "drop-shadow(0 0 8px #3fb950cc)",
    rejected:   "drop-shadow(0 0 6px #f85149aa)"
  };

  /* ── Render principal ── */

  // onEdgeClick se inyecta desde el Controller solo en modo Desafío
  let _onEdgeClick = null;

  function render(graph, state) {
    renderGraph(graph, state);
    renderPanel(graph, state);
  }

  /* ── SVG ── */

  function renderGraph(graph, state) {
    const svg = document.getElementById("mst-graph");
    svg.innerHTML = "";

    svg.appendChild(createGrid());

    const edgeLayer = createSvgEl("g", { id: "edge-layer" });
    const nodeLayer = createSvgEl("g", { id: "node-layer" });

    /*
      Calcular posiciones de badges antes de dibujar.
      Para cada arista se intenta t=0.5 (centro); si colisiona
      con un badge ya colocado se prueba t=0.35 y luego t=0.65.
      COLLISION_R es el radio mínimo entre dos badges (px).
    */
    const COLLISION_R = 26;
    const CANDIDATES = [0.5, 0.35, 0.65, 0.25, 0.75];
    const placed = []; // { x, y } de badges ya ubicados

    function pickBadgePos(from, to) {
      for (const t of CANDIDATES) {
        const x = from.x + (to.x - from.x) * t;
        const y = from.y + (to.y - from.y) * t;
        const clash = placed.some(p => Math.hypot(p.x - x, p.y - y) < COLLISION_R);
        if (!clash) {
          placed.push({ x, y });
          return { x, y };
        }
      }
      const x = (from.x + to.x) / 2;
      const y = (from.y + to.y) / 2;
      placed.push({ x, y });
      return { x, y };
    }

    // En modo Desafío, calcular qué aristas son clicables ahora mismo
    const clickableIds = state && state.mode === "challenge" && !state.finished
      ? getClickableEdgeIds(graph, state)
      : new Set();

    graph.edges.forEach(edge => {
      const from = Model.getNode(edge.from);
      const to   = Model.getNode(edge.to);
      const badgePos = pickBadgePos(from, to);
      const clickable = clickableIds.has(edge.id);
      edgeLayer.appendChild(renderEdge(edge, badgePos, clickable));
    });

    graph.nodes.forEach(node => nodeLayer.appendChild(renderNode(node)));

    svg.appendChild(edgeLayer);
    svg.appendChild(nodeLayer);
  }

  /*
    getClickableEdgeIds — devuelve el Set de aristas que el jugador
    puede seleccionar en este turno según el algoritmo activo.
    Kruskal: todas las idle (el jugador debe identificar la correcta).
    Prim:    solo las que están en la frontera actual.
  */
  function getClickableEdgeIds(graph, state) {
    const ids = new Set();
    if (state.algorithm === "kruskal") {
      graph.edges.forEach(e => { if (e.state === "idle") ids.add(e.id); });
    } else {
      state.frontierEdges.forEach(id => ids.add(id));
    }
    return ids;
  }

  function renderEdge(edge, badgePos, clickable = false) {
    const from = Model.getNode(edge.from);
    const to   = Model.getNode(edge.to);

    const color = EDGE_COLORS[edge.state] || EDGE_COLORS.idle;
    const isAccepted   = edge.state === "accepted";
    const isEvaluating = edge.state === "evaluating";
    const isCompared   = edge.state === "compared";

    const classes = [`edge`, `edge-${edge.state}`];
    if (clickable) classes.push("edge-clickable");
    const group = createSvgEl("g", {
      class: classes.join(" "),
      "data-edge-id": edge.id
    });

    // Área de hit invisible para clicks más fáciles en móvil/desktop
    if (clickable) {
      const hitArea = createSvgEl("line", {
        x1: from.x, y1: from.y,
        x2: to.x,   y2: to.y,
        stroke: "transparent",
        "stroke-width": 18,
        "stroke-linecap": "round"
      });
      group.appendChild(hitArea);
    }

    // Línea principal
    const line = createSvgEl("line", {
      x1: from.x, y1: from.y,
      x2: to.x,   y2: to.y,
      stroke: color,
      "stroke-width": isAccepted ? 3.5 : isEvaluating || isCompared ? 3 : 2,
      "stroke-linecap": "round",
      opacity: edge.state === "idle" ? 0.5 : 1,
      style: `filter: ${EDGE_GLOW[edge.state] || "none"}; transition: stroke 0.3s, stroke-width 0.3s`
    });

    if (isAccepted) {
      const flowLine = createSvgEl("line", {
        x1: from.x, y1: from.y,
        x2: to.x,   y2: to.y,
        stroke: "#3fb950",
        "stroke-width": 1.5,
        "stroke-dasharray": "6 10",
        opacity: 0.6,
        class: "flow-dash"
      });
      group.appendChild(line);
      group.appendChild(flowLine);
    } else {
      group.appendChild(line);
    }

    // Badge de peso
    const { x: bx, y: by } = badgePos;

    const bg = createSvgEl("rect", {
      x: bx - 13, y: by - 11,
      width: 26, height: 22,
      rx: 4,
      fill: isAccepted   ? "rgba(63,185,80,0.15)"
          : isEvaluating ? "rgba(210,153,34,0.15)"
          : isCompared   ? "rgba(224,122,40,0.12)"
          :                "rgba(22,27,34,0.92)",
      stroke: isAccepted   ? "#3fb950"
            : isEvaluating ? "#d29922"
            : isCompared   ? "#e07a28"
            :                "#30363d",
      "stroke-width": isAccepted || isEvaluating || isCompared ? 1.5 : 1
    });

    const weightText = createSvgEl("text", {
      x: bx, y: by,
      fill: isAccepted   ? "#3fb950"
          : isEvaluating ? "#d29922"
          : isCompared   ? "#e07a28"
          :                "#8b949e",
      "font-family": "'Share Tech Mono', monospace",
      "font-size": 12,
      "font-weight": "700",
      "text-anchor": "middle",
      "dominant-baseline": "central"
    });
    weightText.textContent = edge.weight;

    group.appendChild(bg);
    group.appendChild(weightText);

    // Click handler — solo en modo Desafío
    if (clickable && _onEdgeClick) {
      group.addEventListener("click", () => _onEdgeClick(edge.id));
    }

    return group;
  }

  /*
    hexPoints genera los 6 vértices de un hexágono plano (flat-top).
    r = radio, cx/cy = centro (0,0 por defecto al usar translate).
  */
  function hexPoints(r) {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 180) * (60 * i - 30);
      return `${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`;
    }).join(" ");
  }

  function renderNode(node) {
    const group = createSvgEl("g", {
      class: `node node-${node.state}`,
      "data-node-state": node.state,
      transform: `translate(${node.x}, ${node.y})`
    });

    // Hexágono exterior de pulso (decorativo, animado por CSS)
    group.appendChild(createSvgEl("polygon", {
      class: "node-hex-pulse",
      points: hexPoints(46)
    }));

    // Hexágono anillo exterior
    group.appendChild(createSvgEl("polygon", {
      class: "node-hex-ring",
      points: hexPoints(36)
    }));

    // Hexágono núcleo (relleno)
    group.appendChild(createSvgEl("polygon", {
      class: "node-hex-core",
      points: hexPoints(28)
    }));

    // Líneas internas decorativas (efecto tech: dos diagonales cortas en el núcleo)
    const techLines = [
      { x1: -14, y1: -8,  x2: 14,  y2: -8  },
      { x1: -10, y1: -2,  x2: 10,  y2: -2  }
    ];
    techLines.forEach(l => {
      group.appendChild(createSvgEl("line", {
        x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2,
        stroke: "#58a6ff",
        "stroke-width": 1,
        opacity: 0.25,
        "stroke-linecap": "round"
      }));
    });

    // Inicial del usuario (grande, centrada)
    const initial = createSvgEl("text", {
      class: "node-initial",
      y: 1
    });
    initial.textContent = node.name.charAt(0).toUpperCase();
    group.appendChild(initial);

    // Nombre debajo del hexágono
    const name = createSvgEl("text", {
      class: "node-name",
      y: 46
    });
    name.textContent = node.name;
    group.appendChild(name);

    // Alias más abajo
    const alias = createSvgEl("text", {
      class: "node-alias",
      y: 59
    });
    alias.textContent = node.alias;
    group.appendChild(alias);

    return group;
  }

  function createGrid() {
    const defs = createSvgEl("defs");

    // Patron de puntos apagados (red deteriorada)
    const dotPattern = createSvgEl("pattern", {
      id: "dots", width: 36, height: 36,
      patternUnits: "userSpaceOnUse"
    });
    const dot = createSvgEl("circle", {
      cx: 18, cy: 18, r: 0.8,
      fill: "rgba(88,166,255,0.07)"
    });
    dotPattern.appendChild(dot);
    defs.appendChild(dotPattern);

    const group = createSvgEl("g");
    group.appendChild(defs);

    // Fondo con puntos
    group.appendChild(createSvgEl("rect", {
      width: "100%", height: "100%",
      fill: "url(#dots)"
    }));

    // Líneas de interferencia horizontales (daño visual fijo)
    const interferenceLines = [
      { y: 88,  opacity: 0.06, width: "62%" },
      { y: 210, opacity: 0.04, width: "40%" },
      { y: 340, opacity: 0.07, width: "80%" },
      { y: 430, opacity: 0.05, width: "55%" },
    ];
    interferenceLines.forEach(l => {
      group.appendChild(createSvgEl("line", {
        x1: 0, y1: l.y, x2: l.width, y2: l.y,
        stroke: "rgba(248,81,73,0.9)",
        "stroke-width": 1,
        opacity: l.opacity,
        "stroke-dasharray": "4 8"
      }));
    });

    return group;
  }

  /* ── Panel lateral ── */

  function renderPanel(graph, state) {
    // Contadores
    document.getElementById("node-count").textContent = graph.nodes.length;
    document.getElementById("edge-count").textContent = graph.edges.length;

    // Costo acumulado
    const costEl = document.getElementById("total-cost");
    if (costEl) costEl.textContent = state.totalCost;

    // Aristas MST aceptadas
    const mstCount = graph.edges.filter(e => e.state === "accepted").length;
    const mstEl = document.getElementById("mst-count");
    if (mstEl) mstEl.textContent = mstCount;

    // Botones de algoritmo
    document.querySelectorAll("[data-algorithm]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.algorithm === state.algorithm);
    });

    renderAlgorithmState(graph, state);
    renderProgress(state);
    renderLog(state);
  }

  function renderAlgorithmState(graph, state) {
    const orderedList = document.getElementById("ordered-edges-list");
    const componentsList = document.getElementById("components-list");
    const mstNodesList = document.getElementById("mst-nodes-list");
    const pendingNodesList = document.getElementById("pending-nodes-list");
    const frontierList = document.getElementById("frontier-edges-list");

    if (orderedList) {
      const title = state.algorithm === "kruskal"
        ? "Aristas ordenadas pendientes"
        : "Aristas de frontera";
      document.getElementById("ordered-edges-title").textContent = title;

      const ids = state.algorithm === "kruskal"
        ? state.pendingEdges
        : state.frontierEdges;
      renderEdgeList(orderedList, ids, graph);
    }

    if (componentsList) {
      componentsList.innerHTML = "";
      if (state.algorithm === "kruskal") {
        state.components.forEach((component, index) => {
          const item = document.createElement("div");
          item.className = "state-pill";
          item.textContent = `C${index + 1}: ${component.map(id => nodeName(id, graph)).join(", ")}`;
          componentsList.appendChild(item);
        });
      } else {
        const item = document.createElement("div");
        item.className = "state-pill muted";
        item.textContent = "Union-Find no se usa en Prim.";
        componentsList.appendChild(item);
      }
    }

    if (mstNodesList) renderNodeList(mstNodesList, state.mstNodes, graph);
    if (pendingNodesList) renderNodeList(pendingNodesList, state.pendingNodes, graph);
    if (frontierList) renderEdgeList(frontierList, state.frontierEdges, graph);
  }

  function renderProgress(state) {
    const evaluated = document.getElementById("evaluated-steps");
    const progress = document.getElementById("mst-progress");
    const activeNode = document.getElementById("active-node");

    if (evaluated) evaluated.textContent = state.evaluatedSteps;
    if (progress) progress.textContent = `${state.acceptedCount} / ${state.nodes.length - 1}`;
    if (activeNode) {
      activeNode.textContent = state.activeFrontierNode
        ? state.nodes.find(node => node.id === state.activeFrontierNode).name
        : "-";
    }
  }

  function renderLog(state) {
    const log = document.getElementById("event-log");
    log.innerHTML = "";
    state.log.slice(0, 12).forEach((msg, i) => {
      const row = document.createElement("div");
      row.className = "log-entry" + (i === 0 ? " log-entry--new" : "");

      const isAccepted = msg.startsWith("Aceptada") || msg.startsWith("Correcto")
                      || msg.includes("MST completo") || msg.includes("se une a la red");
      const isRejected = msg.startsWith("Rechazada") || msg.startsWith("Descartada");
      const isWrong    = msg.startsWith("Esa arista") || msg.startsWith("No es");

      if (isAccepted) row.classList.add("log-entry--accept");
      else if (isRejected) row.classList.add("log-entry--reject");
      else if (isWrong)    row.classList.add("log-entry--wrong");

      row.textContent = msg;
      log.appendChild(row);
    });
  }

  function renderEdgeList(container, edgeIds, graph) {
    container.innerHTML = "";

    if (!edgeIds || edgeIds.length === 0) {
      const empty = document.createElement("div");
      empty.className = "state-pill muted";
      empty.textContent = "Sin elementos pendientes.";
      container.appendChild(empty);
      return;
    }

    edgeIds.slice(0, 8).forEach(edgeId => {
      const edge = graph.edges.find(item => item.id === edgeId);
      if (!edge) return;

      const item = document.createElement("div");
      item.className = `state-pill edge-pill edge-pill-${edge.state}`;
      item.textContent = `${nodeName(edge.from, graph)} - ${nodeName(edge.to, graph)} | peso ${edge.weight}`;
      container.appendChild(item);
    });
  }

  function renderNodeList(container, nodeIds, graph) {
    container.innerHTML = "";

    if (!nodeIds || nodeIds.length === 0) {
      const empty = document.createElement("div");
      empty.className = "state-pill muted";
      empty.textContent = "Sin nodos.";
      container.appendChild(empty);
      return;
    }

    nodeIds.forEach(nodeId => {
      const item = document.createElement("div");
      item.className = "state-pill node-pill";
      item.textContent = nodeName(nodeId, graph);
      container.appendChild(item);
    });
  }

  function nodeName(id, graph) {
    const node = graph.nodes.find(item => item.id === id);
    return node ? node.name : `Nodo ${id}`;
  }

  /* ── Estados de botones ── */

  function setControlsLocked(locked) {
    const btnStart = document.getElementById("btn-start");
    const btnReset = document.getElementById("btn-reset");
    const algobtns = document.querySelectorAll("[data-algorithm]");
    const modeBtns = document.querySelectorAll("[data-mode]");

    btnStart.disabled = locked;
    algobtns.forEach(b => b.disabled = locked);
    modeBtns.forEach(b => b.disabled = locked);

    const label = btnStart.querySelector(".btn-label");
    if (label) {
      label.textContent = locked ? "EJECUTANDO..." : (
        btnStart.dataset.currentMode === "challenge" ? "JUGAR" : "VER DEMO"
      );
    }
  }

  /* ── Pantalla de victoria ── */

  function showVictory(totalCost, algorithm, evaluatedSteps) {
    const overlay = document.getElementById("victory-overlay");
    if (!overlay) return;
    document.getElementById("victory-cost").textContent = totalCost;
    document.getElementById("victory-algo").textContent =
      algorithm === "kruskal" ? "Kruskal" : "Prim";
    const steps = document.getElementById("victory-steps");
    if (steps) steps.textContent = evaluatedSteps;
    overlay.classList.remove("hidden");
    overlay.classList.add("visible");
  }

  function hideVictory() {
    const overlay = document.getElementById("victory-overlay");
    if (!overlay) return;
    overlay.classList.remove("visible");
    overlay.classList.add("hidden");
  }

  /* ── Desafío ── */

  /*
    setChallengeEdgeHandler — registra el callback que el Controller
    quiere recibir cuando el jugador clica una arista.
    Pasar null para desactivar clicks.
  */
  function setChallengeEdgeHandler(fn) {
    _onEdgeClick = fn;
  }

  /*
    flashEdge — aplica una clase CSS temporal al grupo SVG de la arista
    para dar feedback visual de acierto o error sin re-renderizar.
    result: "correct" | "wrong"
  */
  function flashEdge(edgeId, result) {
    const svg = document.getElementById("mst-graph");
    if (!svg) return;
    // Los grupos de aristas no tienen id propio; buscamos por data-edge-id
    const group = svg.querySelector(`[data-edge-id="${edgeId}"]`);
    if (!group) return;
    const cls = result === "correct" ? "edge-flash-correct" : "edge-flash-wrong";
    group.classList.add(cls);
    setTimeout(() => group.classList.remove(cls), 600);
  }

  /*
    renderChallengeHint — actualiza el texto de instrucción según algoritmo.
    Se llama desde el Controller cada vez que cambia el estado del Desafío.
    accepted: número de aristas aceptadas. total: n-1 esperadas.
  */
  function renderChallengeHint(algorithm, finished, accepted, total) {
    const el = document.getElementById("challenge-hint");
    if (!el) return;

    if (finished) {
      el.innerHTML =
        `<span class="hint-icon">✓</span>` +
        `<span class="hint-text">¡Red reconstruida con éxito!</span>` +
        `<span class="hint-progress">${total} / ${total}</span>`;
      el.className = "challenge-hint hint-success";
      return;
    }

    el.className = "challenge-hint";
    const icon   = algorithm === "kruskal" ? "⊕" : "◎";
    const text   = algorithm === "kruskal"
      ? "Selecciona la arista de menor peso que no forme un ciclo."
      : "Selecciona la arista mínima que conecte un nuevo nodo a la red.";
    const prog   = (accepted !== undefined && total !== undefined)
      ? `<span class="hint-progress">${accepted} / ${total}</span>`
      : "";

    el.innerHTML =
      `<span class="hint-icon">${icon}</span>` +
      `<span class="hint-text">${text}</span>` +
      prog;
  }

  /* ── Helpers ── */

  function createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  return {
    render,
    setControlsLocked,
    showVictory,
    hideVictory,
    setChallengeEdgeHandler,
    flashEdge,
    renderChallengeHint
  };
})();
