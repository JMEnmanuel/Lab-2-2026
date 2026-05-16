/*
  Model - Mision 3: Reconstruir la Red

  Responsabilidad de este archivo:
  1. Guardar datos del grafo.
  2. Guardar estado de la animacion.
  3. Construir y ejecutar pasos de Kruskal y Prim.

  Este archivo no toca el DOM.
  La vista solo recibe los datos ya calculados.
*/
const Model = (() => {

  const STEP_DELAY = 800;
  const NODE_PENDING = "pending";
  const NODE_ACTIVE = "active";
  const NODE_INCLUDED = "idle";

  const NODES = [
    { id: 1, name: "Ana",      alias: "@ana_red",    x: 155, y: 145 },
    { id: 2, name: "Brayan",   alias: "@brayan_x",   x: 425, y: 90  },
    { id: 3, name: "Camila",   alias: "@cami_net",   x: 700, y: 155 },
    { id: 4, name: "Diego",    alias: "@diego_seg",  x: 245, y: 310 },
    { id: 5, name: "Elena",    alias: "@elena_z",    x: 570, y: 305 },
    { id: 6, name: "Fabio",    alias: "@fabio_log",  x: 145, y: 465 },
    { id: 7, name: "Gabriela", alias: "@gaby_safe",  x: 720, y: 445 }
  ];

  let edgesTemplate = [];
  let timerId = null;

  const state = {
    algorithm: "kruskal",
    running: false,
    finished: false,
    totalCost: 0,
    evaluatedSteps: 0,
    acceptedCount: 0,
    currentStep: null,
    log: ["Red cargada. Selecciona Kruskal o Prim e inicia la reconstruccion."],
    edges: [],
    nodes: [],
    orderedEdges: [],
    pendingEdges: [],
    components: [],
    mstNodes: [],
    pendingNodes: [],
    frontierEdges: [],
    activeFrontierNode: null
  };

  function init() {
    edgesTemplate = generateEdges();
    resetStateFromTemplate();
  }

  function newGame() {
    stopTimer();
    edgesTemplate = generateEdges();
    resetStateFromTemplate();
  }

  function resetEdges() {
    stopTimer();
    resetStateFromTemplate();
  }

  function setAlgorithm(algorithm) {
    stopTimer();
    state.algorithm = algorithm;
    resetStateFromTemplate();
    state.log = [
      `Algoritmo seleccionado: ${getAlgorithmName()}.`,
      "Presiona INICIAR para comenzar la reconstruccion."
    ];
  }

  function getGraph() {
    return {
      nodes: state.nodes.map(node => ({ ...node })),
      edges: state.edges.map(edge => ({ ...edge }))
    };
  }

  function getNode(id) {
    return state.nodes.find(node => node.id === id) || NODES.find(node => node.id === id);
  }

  /*
    runAnimation ejecuta pasos automaticos.
    Cada paso tiene dos fases:
    1. Evaluacion: arista amarilla y nodo activo.
    2. Resolucion: arista aceptada o rechazada, log y panel actualizados.
  */
  function runAnimation(onStep, onFinish) {
    if (state.running) return;

    resetStateFromTemplate();
    state.running = true;
    state.finished = false;
    state.log = [`Inicia ${getAlgorithmName()}.`];

    const context = state.algorithm === "kruskal"
      ? createKruskalContext()
      : createPrimContext();

    onStep();

    function nextStep() {
      const step = context.next();

      if (!step) {
        finishAnimation(onStep, onFinish);
        return;
      }

      applyEvaluation(step);
      onStep();

      timerId = setTimeout(() => {
        applyResolution(step);
        onStep();

        if (state.acceptedCount >= state.nodes.length - 1) {
          finishAnimation(onStep, onFinish);
          return;
        }

        timerId = setTimeout(nextStep, STEP_DELAY);
      }, STEP_DELAY);
    }

    timerId = setTimeout(nextStep, STEP_DELAY);
  }

  /*
    generateEdges garantiza conectividad.
    Primero crea un arbol base y luego agrega aristas extra.
  */
  function generateEdges() {
    const n = NODES.length;
    const edges = [];
    const edgeSet = new Set();
    const randomWeight = () => Math.floor(Math.random() * 9) + 1;
    const ids = NODES.map(node => node.id);

    shuffle(ids);

    for (let i = 0; i < ids.length - 1; i++) {
      addEdge(edges, edgeSet, ids[i], ids[i + 1], randomWeight());
    }

    const extras = Math.floor(Math.random() * 3) + 3;
    let attempts = 0;

    while (edges.length < n - 1 + extras && attempts < 80) {
      attempts++;
      const from = Math.floor(Math.random() * n) + 1;
      const to = Math.floor(Math.random() * n) + 1;
      if (from === to) continue;
      addEdge(edges, edgeSet, from, to, randomWeight());
    }

    return edges;
  }

  function addEdge(edges, edgeSet, a, b, weight) {
    const from = Math.min(a, b);
    const to = Math.max(a, b);
    const key = `${from}-${to}`;
    if (edgeSet.has(key)) return false;

    edgeSet.add(key);
    edges.push({ id: `e${key}`, from, to, weight });
    return true;
  }

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
  }

  function resetStateFromTemplate() {
    state.running = false;
    state.finished = false;
    state.totalCost = 0;
    state.evaluatedSteps = 0;
    state.acceptedCount = 0;
    state.currentStep = null;
    state.edges = edgesTemplate.map(edge => ({ ...edge, state: "idle" }));
    state.nodes = NODES.map(node => ({ ...node, state: NODE_PENDING }));
    state.orderedEdges = sortEdges(state.edges);
    state.pendingEdges = state.orderedEdges.map(edge => edge.id);
    state.components = buildInitialComponents();
    state.mstNodes = [];
    state.pendingNodes = state.nodes.map(node => node.id);
    state.frontierEdges = [];
    state.activeFrontierNode = null;
    state.log = ["Red cargada. Selecciona Kruskal o Prim e inicia la reconstruccion."];
  }

  function createKruskalContext() {
    const uf = createUnionFind(state.nodes.map(node => node.id));
    const sorted = sortEdges(state.edges);
    let index = 0;

    state.orderedEdges = sorted.map(edge => edge.id);
    state.pendingEdges = sorted.map(edge => edge.id);
    state.components = getComponentsFromUnionFind(uf);
    state.log.unshift("Kruskal ordena todas las aristas por peso ascendente.");

    return {
      next() {
        while (index < sorted.length) {
          const edge = sorted[index++];
          if (state.acceptedCount >= state.nodes.length - 1) return null;

          const fromRoot = uf.find(edge.from);
          const toRoot = uf.find(edge.to);
          const accepted = fromRoot !== toRoot;
          const beforeA = componentLabel(uf, edge.from);
          const beforeB = componentLabel(uf, edge.to);

          return {
            type: "kruskal",
            edgeId: edge.id,
            from: edge.from,
            to: edge.to,
            weight: edge.weight,
            accepted,
            evaluateLog: `Kruskal evalua ${edgeLabel(edge)}. Compara componentes: ${beforeA} y ${beforeB}.`,
            resolveLog: accepted
              ? `Aceptada ${edgeLabel(edge)}. Une componente ${beforeA} con componente ${beforeB}.`
              : `Rechazada ${edgeLabel(edge)} porque formaria ciclo entre componente ${beforeA} y componente ${beforeB}.`,
            apply() {
              if (accepted) uf.union(edge.from, edge.to);
              state.components = getComponentsFromUnionFind(uf);
            }
          };
        }

        return null;
      }
    };
  }

  function createPrimContext() {
    const startNodeId = Math.min(...state.nodes.map(node => node.id));
    const included = new Set([startNodeId]);
    let candidateQueue = [];

    setIncludedNodes([...included]);
    updatePrimLists(included);
    state.activeFrontierNode = startNodeId;
    state.log.unshift(`Prim inicia desde ${nodeName(startNodeId)}, el nodo con menor id.`);

    return {
      next() {
        if (state.acceptedCount >= state.nodes.length - 1) return null;

        if (candidateQueue.length === 0) {
          const candidates = getPrimCandidates(included);
          state.frontierEdges = candidates.map(edge => edge.id);

          if (candidates.length === 0) return null;

          const bestEdge = candidates[0];
          state.activeFrontierNode = included.has(bestEdge.from) ? bestEdge.from : bestEdge.to;
          state.log.unshift(`Prim expande desde ${nodeName(state.activeFrontierNode)} y revisa la frontera disponible.`);

          candidateQueue = [
            ...candidates.slice(1).map(edge => ({ edge, accepted: false, bestEdge })),
            { edge: bestEdge, accepted: true, bestEdge }
          ];
        }

        const item = candidateQueue.shift();
        const edge = item.edge;
        const accepted = item.accepted;
        const newNode = included.has(edge.from) ? edge.to : edge.from;
        const activeNode = included.has(edge.from) ? edge.from : edge.to;

        return {
          type: "prim",
          edgeId: edge.id,
          from: edge.from,
          to: edge.to,
          weight: edge.weight,
          accepted,
          activeNode,
          newNode,
          evaluateLog: `Prim expande desde ${nodeName(activeNode)} y evalua ${edgeLabel(edge)}.`,
          resolveLog: accepted
            ? `Aceptada ${edgeLabel(edge)}. Es la arista minima que conecta a ${nodeName(newNode)}.`
            : `Descartada ${edgeLabel(edge)}. La arista minima de la frontera es ${edgeLabel(item.bestEdge)}.`,
          apply() {
            if (accepted) {
              included.add(newNode);
              candidateQueue = [];
              state.frontierEdges = [];
            } else {
              state.frontierEdges = candidateQueue.map(next => next.edge.id);
            }

            updatePrimLists(included);
          }
        };
      }
    };
  }

  function applyEvaluation(step) {
    state.currentStep = step;
    state.evaluatedSteps++;
    state.pendingEdges = state.pendingEdges.filter(id => id !== step.edgeId);
    setEdgeState(step.edgeId, "evaluating");

    if (state.algorithm === "kruskal") {
      setActiveNodes([step.from, step.to]);
    } else {
      setActiveNodes([step.activeNode, step.newNode]);
      state.activeFrontierNode = step.activeNode;
    }

    state.log.unshift(step.evaluateLog);
  }

  function applyResolution(step) {
    setEdgeState(step.edgeId, step.accepted ? "accepted" : "rejected");

    if (step.accepted) {
      state.totalCost += step.weight;
      state.acceptedCount++;
    }

    step.apply();

    if (state.algorithm === "kruskal") {
      const acceptedEdges = state.edges.filter(edge => edge.state === "accepted");
      const includedIds = new Set();
      acceptedEdges.forEach(edge => {
        includedIds.add(edge.from);
        includedIds.add(edge.to);
      });
      setIncludedNodes([...includedIds]);
    }

    state.log.unshift(step.resolveLog);
    state.currentStep = null;
  }

  function finishAnimation(onStep, onFinish) {
    stopTimer();
    clearActiveNodes();
    state.running = false;
    state.finished = true;
    state.currentStep = null;
    state.frontierEdges = [];
    state.activeFrontierNode = null;
    state.log.unshift(`MST completo: ${state.acceptedCount} aristas aceptadas, costo total ${state.totalCost}.`);
    onStep();
    onFinish(state.totalCost, state.algorithm, state.evaluatedSteps);
  }

  function setEdgeState(edgeId, edgeState) {
    const edge = state.edges.find(item => item.id === edgeId);
    if (edge) edge.state = edgeState;
  }

  function setActiveNodes(ids) {
    const active = new Set(ids);
    state.nodes.forEach(node => {
      if (active.has(node.id)) {
        node.state = NODE_ACTIVE;
      } else if (node.state === NODE_ACTIVE) {
        node.state = node.inMST ? NODE_INCLUDED : NODE_PENDING;
      }
    });
  }

  function setIncludedNodes(ids) {
    const included = new Set(ids);
    state.nodes.forEach(node => {
      node.inMST = included.has(node.id);
      node.state = node.inMST ? NODE_INCLUDED : NODE_PENDING;
    });
    state.mstNodes = state.nodes.filter(node => node.inMST).map(node => node.id);
    state.pendingNodes = state.nodes.filter(node => !node.inMST).map(node => node.id);
  }

  function clearActiveNodes() {
    state.nodes.forEach(node => {
      node.state = node.inMST ? NODE_INCLUDED : NODE_PENDING;
    });
  }

  function updatePrimLists(included) {
    setIncludedNodes([...included]);
  }

  function getPrimCandidates(included) {
    return state.edges
      .filter(edge => edge.state !== "accepted")
      .filter(edge => {
        const fromIn = included.has(edge.from);
        const toIn = included.has(edge.to);
        return (fromIn && !toIn) || (!fromIn && toIn);
      })
      .sort(compareEdges);
  }

  function createUnionFind(ids) {
    const parent = {};
    const rank = {};

    ids.forEach(id => {
      parent[id] = id;
      rank[id] = 0;
    });

    function find(x) {
      if (parent[x] !== x) parent[x] = find(parent[x]);
      return parent[x];
    }

    function union(a, b) {
      const rootA = find(a);
      const rootB = find(b);
      if (rootA === rootB) return false;

      if (rank[rootA] < rank[rootB]) {
        parent[rootA] = rootB;
      } else if (rank[rootA] > rank[rootB]) {
        parent[rootB] = rootA;
      } else {
        parent[rootB] = rootA;
        rank[rootA]++;
      }

      return true;
    }

    return { find, union };
  }

  function getComponentsFromUnionFind(uf) {
    const groups = {};

    state.nodes.forEach(node => {
      const root = uf.find(node.id);
      if (!groups[root]) groups[root] = [];
      groups[root].push(node.id);
    });

    return Object.values(groups)
      .map(ids => ids.sort((a, b) => a - b))
      .sort((a, b) => a[0] - b[0]);
  }

  function buildInitialComponents() {
    return NODES.map(node => [node.id]);
  }

  function componentLabel(uf, nodeId) {
    const root = uf.find(nodeId);
    const ids = state.nodes
      .filter(node => uf.find(node.id) === root)
      .map(node => node.id)
      .sort((a, b) => a - b);

    return componentText(ids);
  }

  function componentText(ids) {
    return ids.map(id => nodeName(id)).join(", ");
  }

  function edgeLabel(edge) {
    return `${nodeName(edge.from)} - ${nodeName(edge.to)} (peso ${edge.weight})`;
  }

  function nodeName(id) {
    const node = NODES.find(item => item.id === id);
    return node ? node.name : `Nodo ${id}`;
  }

  function sortEdges(edges) {
    return [...edges].sort(compareEdges);
  }

  function compareEdges(a, b) {
    if (a.weight !== b.weight) return a.weight - b.weight;
    if (a.from !== b.from) return a.from - b.from;
    return a.to - b.to;
  }

  function stopTimer() {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function getAlgorithmName() {
    return state.algorithm === "kruskal" ? "Kruskal" : "Prim";
  }

  return {
    state,
    init,
    getGraph,
    getNode,
    setAlgorithm,
    resetEdges,
    newGame,
    runAnimation
  };
})();
