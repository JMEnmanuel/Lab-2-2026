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
    accepted:   "#3fb950",
    rejected:   "#f85149"
  };

  const EDGE_GLOW = {
    idle:       "none",
    evaluating: "drop-shadow(0 0 6px #d29922aa)",
    accepted:   "drop-shadow(0 0 8px #3fb950cc)",
    rejected:   "drop-shadow(0 0 6px #f85149aa)"
  };

  /* ── Render principal ── */

  function render(graph, state) {
    renderGraph(graph);
    renderPanel(graph, state);
  }

  /* ── SVG ── */

  function renderGraph(graph) {
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
      // Fallback: usar t=0.5 aunque haya colision leve
      const x = (from.x + to.x) / 2;
      const y = (from.y + to.y) / 2;
      placed.push({ x, y });
      return { x, y };
    }

    graph.edges.forEach(edge => {
      const from = Model.getNode(edge.from);
      const to   = Model.getNode(edge.to);
      const badgePos = pickBadgePos(from, to);
      edgeLayer.appendChild(renderEdge(edge, badgePos));
    });

    graph.nodes.forEach(node => nodeLayer.appendChild(renderNode(node)));

    svg.appendChild(edgeLayer);
    svg.appendChild(nodeLayer);
  }

  function renderEdge(edge, badgePos) {
    const from = Model.getNode(edge.from);
    const to   = Model.getNode(edge.to);
    const group = createSvgEl("g", { class: `edge edge-${edge.state}` });

    const color = EDGE_COLORS[edge.state];
    const isAccepted   = edge.state === "accepted";
    const isEvaluating = edge.state === "evaluating";

    // Línea principal
    const line = createSvgEl("line", {
      x1: from.x, y1: from.y,
      x2: to.x,   y2: to.y,
      stroke: color,
      "stroke-width": isAccepted ? 3.5 : isEvaluating ? 3 : 2,
      "stroke-linecap": "round",
      opacity: edge.state === "idle" ? 0.5 : 1,
      style: `filter: ${EDGE_GLOW[edge.state]}; transition: stroke 0.3s, stroke-width 0.3s`
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

    // Badge en la posición sin colisión calculada por renderGraph
    const { x: bx, y: by } = badgePos;

    const bg = createSvgEl("rect", {
      x: bx - 13, y: by - 11,
      width: 26, height: 22,
      rx: 4,
      fill: isAccepted   ? "rgba(63,185,80,0.15)"
          : isEvaluating ? "rgba(210,153,34,0.15)"
          :                "rgba(22,27,34,0.92)",
      stroke: isAccepted   ? "#3fb950"
            : isEvaluating ? "#d29922"
            :                "#30363d",
      "stroke-width": isAccepted || isEvaluating ? 1.5 : 1
    });

    const weightText = createSvgEl("text", {
      x: bx, y: by,
      fill: isAccepted   ? "#3fb950"
          : isEvaluating ? "#d29922"
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

      const isAccepted = msg.startsWith("Aceptada") || msg.includes("MST completo");
      const isRejected = msg.startsWith("Rechazada") || msg.startsWith("Descartada");

      if (isAccepted) row.classList.add("log-entry--accept");
      if (isRejected) row.classList.add("log-entry--reject");

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

    btnStart.disabled = locked;
    algobtns.forEach(b => b.disabled = locked);

    if (locked) {
      btnStart.textContent = "EJECUTANDO...";
    } else {
      btnStart.textContent = "INICIAR";
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

  /* ── Helpers ── */

  function createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  return { render, setControlsLocked, showVictory, hideVictory };
})();
