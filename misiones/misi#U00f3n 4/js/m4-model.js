/*
  Model - Mision 4: Control del Impacto

  Base tecnica para Flujo Maximo con Ford-Fulkerson.
  Implementa Edmonds-Karp como camino aumentante por BFS para tener
  una referencia deterministica y facil de validar.

  Este archivo no toca el DOM.
*/
const Mission4Model = (() => {
  const SOURCE = "S";
  const SINK = "T";

  const NODES = [
    { id: "S", name: "Origen",  alias: "@fuente",    x: 90,  y: 280, type: "source" },
    { id: "A", name: "Ana",     alias: "@ana_red",   x: 255, y: 145, type: "relay"  },
    { id: "B", name: "Brayan",  alias: "@brayan_x",  x: 255, y: 290, type: "relay"  },
    { id: "C", name: "Camila",  alias: "@cami_net",  x: 255, y: 435, type: "relay"  },
    { id: "D", name: "Diego",   alias: "@diego_seg", x: 545, y: 205, type: "relay"  },
    { id: "E", name: "Elena",   alias: "@elena_z",   x: 545, y: 365, type: "relay"  },
    { id: "T", name: "Victima", alias: "@objetivo",  x: 780, y: 280, type: "sink"   }
  ];

  const EDGE_TEMPLATE = [
    { id: "S-A", from: "S", to: "A", capacity: 8  },
    { id: "S-B", from: "S", to: "B", capacity: 6  },
    { id: "S-C", from: "S", to: "C", capacity: 5  },
    { id: "A-D", from: "A", to: "D", capacity: 5  },
    { id: "A-E", from: "A", to: "E", capacity: 4  },
    { id: "B-A", from: "B", to: "A", capacity: 3  },
    { id: "B-D", from: "B", to: "D", capacity: 2  },
    { id: "B-E", from: "B", to: "E", capacity: 6  },
    { id: "C-B", from: "C", to: "B", capacity: 3  },
    { id: "C-E", from: "C", to: "E", capacity: 4  },
    { id: "D-T", from: "D", to: "T", capacity: 7  },
    { id: "E-D", from: "E", to: "D", capacity: 3  },
    { id: "E-T", from: "E", to: "T", capacity: 10 }
  ];

  const EXPECTED_MAX_FLOW = 17;

  const state = {
    source:           SOURCE,
    sink:             SINK,
    maxFlow:          0,
    finished:         false,
    currentPath:      [],
    currentBottleneck:0,
    steps:            [],
    edges:            [],
    mode:             "tutorial",  // "tutorial" | "challenge"
    selectedPath:     [],          // ruta que el jugador esta construyendo
    feedback:         null         // { ok: bool, message: string } | null
  };

  /* ─── lifecycle ─────────────────────────────────────────────────── */

  function init()  { reset(); }

  function reset() {
    state.source            = SOURCE;
    state.sink              = SINK;
    state.maxFlow           = 0;
    state.finished          = false;
    state.currentPath       = [];
    state.currentBottleneck = 0;
    state.steps             = [];
    state.edges             = EDGE_TEMPLATE.map(edge => ({ ...edge, flow: 0 }));
    state.selectedPath      = [];
    state.feedback          = null;
    // mode sobrevive el reset — se cambia solo desde setMode
  }

  function setMode(m) {
    if (m === "tutorial" || m === "challenge") state.mode = m;
  }

  function getMode() { return state.mode; }

  /* ─── getters ────────────────────────────────────────────────────── */

  function getGraph() {
    return {
      nodes:  NODES.map(node => ({ ...node })),
      edges:  state.edges.map(edge => ({ ...edge })),
      source: state.source,
      sink:   state.sink
    };
  }

  function getEdge(edgeId) {
    return state.edges.find(edge => edge.id === edgeId) || null;
  }

  function getOriginalEdge(from, to) {
    return state.edges.find(edge => edge.from === from && edge.to === to) || null;
  }

  function getResidualCapacity(from, to) {
    const forward = getOriginalEdge(from, to);
    if (forward) return forward.capacity - forward.flow;

    const reverse = getOriginalEdge(to, from);
    if (reverse) return reverse.flow;

    return 0;
  }

  /** Devuelve el camino aumentante en curso (sin mutarlo). */
  function getCurrentPath()       { return [...state.currentPath]; }

  /** Devuelve el cuello de botella del ultimo paso aplicado. */
  function getCurrentBottleneck() { return state.currentBottleneck; }

  /** Devuelve el proximo camino aumentante disponible (o null si no hay). */
  function peekNextPath() {
    return findAugmentingPath();
  }

  /* ─── algoritmo ─────────────────────────────────────────────────── */

  function getResidualNeighbors(nodeId) {
    const neighbors = new Set();
    state.edges.forEach(edge => {
      if (edge.from === nodeId && edge.capacity - edge.flow > 0) neighbors.add(edge.to);
      if (edge.to   === nodeId && edge.flow > 0)                 neighbors.add(edge.from);
    });

    return NODES
      .map(node => node.id)
      .filter(id => neighbors.has(id));
  }

  function findAugmentingPath(source = state.source, sink = state.sink) {
    const queue   = [source];
    const visited = new Set([source]);
    const parent  = {};

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === sink) break;

      getResidualNeighbors(current).forEach(next => {
        if (visited.has(next)) return;
        visited.add(next);
        parent[next] = current;
        queue.push(next);
      });
    }

    if (!visited.has(sink)) return null;

    const path = [];
    let cursor  = sink;
    while (cursor) {
      path.unshift(cursor);
      if (cursor === source) break;
      cursor = parent[cursor];
    }

    return {
      nodes:         path,
      bottleneck:    getBottleneck(path),
      residualEdges: describeResidualPath(path)
    };
  }

  function validatePlayerPath(path) {
    if (!Array.isArray(path) || path.length < 2) {
      return { valid: false, reason: "La ruta debe tener al menos fuente y destino." };
    }
    if (path[0] !== state.source) {
      return { valid: false, reason: `La ruta debe iniciar en ${state.source}.` };
    }
    if (path[path.length - 1] !== state.sink) {
      return { valid: false, reason: `La ruta debe terminar en ${state.sink}.` };
    }

    const seen = new Set();
    for (const nodeId of path) {
      if (!NODES.some(node => node.id === nodeId)) {
        return { valid: false, reason: `El nodo ${nodeId} no existe en la red.` };
      }
      if (seen.has(nodeId)) {
        return { valid: false, reason: "La ruta no debe repetir nodos." };
      }
      seen.add(nodeId);
    }

    for (let i = 0; i < path.length - 1; i++) {
      const from     = path[i];
      const to       = path[i + 1];
      const residual = getResidualCapacity(from, to);
      if (residual <= 0) {
        return {
          valid:  false,
          reason: `La conexion residual ${from} -> ${to} no tiene capacidad disponible.`
        };
      }
    }

    return {
      valid:         true,
      reason:        "Ruta aumentante valida.",
      bottleneck:    getBottleneck(path),
      residualEdges: describeResidualPath(path)
    };
  }

  function getBottleneck(path) {
    let bottleneck = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      bottleneck = Math.min(bottleneck, getResidualCapacity(path[i], path[i + 1]));
    }
    return bottleneck === Infinity ? 0 : bottleneck;
  }

  function describeResidualPath(path) {
    const result = [];
    for (let i = 0; i < path.length - 1; i++) {
      const from   = path[i];
      const to     = path[i + 1];
      const direct = getOriginalEdge(from, to);
      result.push({
        from,
        to,
        residual:  getResidualCapacity(from, to),
        direction: direct ? "forward" : "reverse",
        edgeId:    direct ? direct.id : `${to}-${from}`
      });
    }
    return result;
  }

  function applyAugmentingPath(path, amount = getBottleneck(path)) {
    const validation = validatePlayerPath(path);
    if (!validation.valid) return { applied: false, reason: validation.reason };

    if (amount <= 0 || amount > validation.bottleneck) {
      return {
        applied: false,
        reason:  `El aumento debe estar entre 1 y ${validation.bottleneck}.`
      };
    }

    for (let i = 0; i < path.length - 1; i++) {
      const from   = path[i];
      const to     = path[i + 1];
      const direct = getOriginalEdge(from, to);
      if (direct) {
        direct.flow += amount;
      } else {
        const reverse = getOriginalEdge(to, from);
        reverse.flow -= amount;
      }
    }

    state.maxFlow           += amount;
    state.currentPath        = [...path];
    state.currentBottleneck  = amount;
    state.steps.push({
      path:       [...path],
      bottleneck: amount,
      maxFlow:    state.maxFlow
    });

    state.finished = findAugmentingPath() === null;

    return {
      applied:    true,
      path:       [...path],
      bottleneck: amount,
      maxFlow:    state.maxFlow,
      finished:   state.finished
    };
  }

  function runNextAugmentingStep() {
    const next = findAugmentingPath();
    if (!next) {
      state.finished          = true;
      state.currentPath       = [];
      state.currentBottleneck = 0;
      return { applied: false, finished: true, reason: "No quedan caminos aumentantes." };
    }

    return applyAugmentingPath(next.nodes, next.bottleneck);
  }

  function solveMaxFlow() {
    reset();
    let guard = 0;
    while (!state.finished && guard < 100) {
      guard++;
      runNextAugmentingStep();
    }

    return {
      maxFlow:  state.maxFlow,
      steps:    state.steps.map(step => ({ ...step, path: [...step.path] })),
      finished: state.finished,
      expected: EXPECTED_MAX_FLOW,
      passed:   state.maxFlow === EXPECTED_MAX_FLOW
    };
  }

  function isMaxFlowReached() {
    return findAugmentingPath() === null;
  }

  /* ─── seleccion manual de ruta (modo Desafio) ──────────────────── */

  /**
   * Borra la ruta seleccionada y el feedback.
   * No modifica el flujo ni el grafo.
   */
  function resetSelectedPath() {
    state.selectedPath = [];
    state.feedback     = null;
  }

  /** Devuelve una copia de la ruta seleccionada actualmente. */
  function getSelectedPath() {
    return [...state.selectedPath];
  }

  /**
   * Intenta agregar nodeId a la ruta seleccionada.
   * Reglas:
   *   1. Si la ruta está vacía, solo acepta SOURCE.
   *   2. El nodo no puede repetirse.
   *   3. Debe existir capacidad residual desde el último nodo hacia nodeId.
   * Devuelve { accepted: bool, message: string }.
   * Nunca aplica flujo.
   */
  function selectPathNode(nodeId) {
    // ¿Nodo existe en el grafo?
    const nodeExists = NODES.some(n => n.id === nodeId);
    if (!nodeExists) {
      state.feedback = { ok: false, message: `El nodo "${nodeId}" no existe en la red.` };
      return { accepted: false, message: state.feedback.message };
    }

    // Ruta vacía: solo acepta la fuente
    if (state.selectedPath.length === 0) {
      if (nodeId !== state.source) {
        state.feedback = { ok: false, message: `Debes iniciar desde la fuente (${state.source}).` };
        return { accepted: false, message: state.feedback.message };
      }
      state.selectedPath.push(nodeId);
      state.feedback = { ok: true, message: `Inicio en ${nodeId}. Elige el siguiente nodo.` };
      return { accepted: true, message: state.feedback.message };
    }

    // No repetir nodos
    if (state.selectedPath.includes(nodeId)) {
      state.feedback = { ok: false, message: `El nodo ${nodeId} ya está en la ruta. No se permiten ciclos.` };
      return { accepted: false, message: state.feedback.message };
    }

    // Verificar capacidad residual desde el último nodo
    const last     = state.selectedPath[state.selectedPath.length - 1];
    const residual = getResidualCapacity(last, nodeId);
    if (residual <= 0) {
      state.feedback = {
        ok: false,
        message: `Sin capacidad residual de ${last} → ${nodeId} (residual = ${residual}).`
      };
      return { accepted: false, message: state.feedback.message };
    }

    state.selectedPath.push(nodeId);
    const isSink = nodeId === state.sink;
    state.feedback = {
      ok: true,
      message: isSink
        ? `Llegaste a ${nodeId}. Ruta completa — confirma para aplicar el flujo.`
        : `${nodeId} agregado. Residual disponible: ${residual}.`
    };
    return { accepted: true, message: state.feedback.message };
  }

  /* ─── public API ────────────────────────────────────────────────── */
  return {
    state,
    init,
    reset,
    getGraph,
    getEdge,
    getResidualCapacity,
    getResidualNeighbors,
    findAugmentingPath,
    validatePlayerPath,
    getBottleneck,
    applyAugmentingPath,
    runNextAugmentingStep,
    solveMaxFlow,
    isMaxFlowReached,
    getCurrentPath,
    getCurrentBottleneck,
    peekNextPath,
    setMode,
    getMode,
    resetSelectedPath,
    getSelectedPath,
    selectPathNode,
    EXPECTED_MAX_FLOW
  };
})();
