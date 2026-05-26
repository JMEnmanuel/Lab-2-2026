/*
   Model - Mision Final: Red Segura

   Integra mini-retos reales de BFS/DFS, Dijkstra, MST y Ford-Fulkerson.
   No toca DOM.
*/
const FinalModel = (() => {
    const modules = [
        {
            id: "origen",
            order: "01",
            title: "RASTREAR ORIGEN",
            algorithm: "BFS / DFS",
            status: "disponible",
            metricLabel: "Sospecha",
            metricValue: 82,
            metricTone: "danger",
            summary: "Analiza recorridos y acusa el nodo que inicio la agresion.",
            note: "La red muestra rastros de difusion. Ejecuta BFS y DFS para comparar expansion por niveles y profundidad; luego identifica el origen.",
            hook: "mini:bfs-dfs"
        },
        {
            id: "apoyo",
            order: "02",
            title: "RUTA DE APOYO",
            algorithm: "Dijkstra",
            status: "disponible",
            metricLabel: "Riesgo",
            metricValue: 64,
            metricTone: "warning",
            summary: "Traza la ruta de menor riesgo desde soporte hasta la victima.",
            note: "La victima necesita apoyo. Selecciona nodos conectados y minimiza el costo emocional de la intervencion.",
            hook: "mini:dijkstra"
        },
        {
            id: "confianza",
            order: "03",
            title: "RECONSTRUIR CONFIANZA",
            algorithm: "Kruskal / Prim",
            status: "disponible",
            metricLabel: "Confianza",
            metricValue: 28,
            metricTone: "safe",
            summary: "Elige Kruskal o Prim y forma el MST sin ciclos.",
            note: "La red quedo fragmentada. Reconecta usuarios con el menor costo social posible usando Kruskal o Prim.",
            hook: "mini:mst"
        },
        {
            id: "impacto",
            order: "04",
            title: "CONTENER IMPACTO",
            algorithm: "Ford-Fulkerson",
            status: "disponible",
            metricLabel: "Propagacion",
            metricValue: 91,
            metricTone: "danger",
            summary: "Aplica caminos posibles hasta bloquear la propagacion restante.",
            note: "Quedan canales saturados. Usa capacidad residual para calcular el flujo maximo y contener el impacto.",
            hook: "mini:max-flow"
        }
    ];

    const baseState = {
        activeModuleId: null,
        activePhaseId: null,
        networkIntegrity: 31,
        harmfulTrend: 88,
        restoredTrust: 18,
        repairedModules: 0,
        phaseActive: "Sin fase activa",
        feedback: { tone: "info", text: "Selecciona un modulo para iniciar el Protocolo Aurora." },
        victory: false
    };

    const state = { ...baseState };
    const phases = createInitialPhases();

    // Construye los cuatro retos jugables y sus grafos iniciales.
    function createInitialPhases() {
        const originGraph = {
            nodes: [
                { id: 1, label: "Nicky", x: 150, y: 120, clue: "", evidence: "Me lo pasaron, no se si sea real." },
                { id: 2, label: "Luigi", x: 330, y: 80, clue: "", evidence: "Eso ya esta rodando por varios chats." },
                { id: 3, label: "Mancipe", x: 520, y: 130, clue: "", evidence:"No me da verguenza, verguenza debería darle a esa." },
                { id: 4, label: "Diana", x: 120, y: 300, clue: "", evidence: "No entiendo que esta pasando." },
                { id: 5, label: "Elena", x: 330, y: 270, clue: "", evidence: "Eso es sobre mi y es mentira. Paren." },
                { id: 6, label: "Danna", x: 560, y: 300, clue: "", evidence: "Ya esto está viral." },
                { id: 7, label: "Gabriel", x: 170, y: 455, clue: "", evidence: "Me lo mandaron y lo reenvié sin pensar." },
                { id: 8, label: "Rey", x: 380, y: 445, clue: "", evidence: "Todo el mundo ya lo anda viendo." },
                { id: 9, label: "Ivan", x: 595, y: 455, clue: "", evidence: "Lo vi hace unos minutos, que vaina." }
            ],
            edges: [[1, 2], [1, 4], [2, 3], [2, 5], [3, 6], [4, 7], [5, 3], [5, 8], [6, 9], [7, 8], [8, 9]],
            originId: 3,
            startId: 1
        };
        originGraph.adj = buildAdj(originGraph.nodes.map(n => n.id), originGraph.edges);

        // Grafo de apoyo: replica la logica de Mision 2 con una red mas amplia.
        const dijkstraGraph = {
            nodes: [
                { id: "S", label: "SOPORTE", x: 60, y: 260 },
                { id: "A", label: "Luigi", x: 180, y: 80 },
                { id: "B", label: "Castilla", x: 180, y: 200 },
                { id: "C", label: "Edith", x: 180, y: 320 },
                { id: "D", label: "Duvan", x: 180, y: 440 },
                { id: "E", label: "Samir", x: 340, y: 80 },
                { id: "F", label: "Jayce", x: 340, y: 190 },
                { id: "G", label: "Dio", x: 340, y: 310 },
                { id: "H", label: "Oscar", x: 340, y: 430 },
                { id: "I", label: "Nora", x: 560, y: 125 },
                { id: "J", label: "Maria", x: 560, y: 260 },
                { id: "K", label: "Tomas", x: 560, y: 395 },
                { id: "V", label: "VICTIMA", x: 780, y: 255 }
            ],
            edges: [
                { from: "S", to: "A", weight: 7 }, { from: "S", to: "B", weight: 3 },
                { from: "S", to: "C", weight: 6 }, { from: "S", to: "D", weight: 10 },
                { from: "A", to: "E", weight: 4 }, { from: "A", to: "F", weight: 8, labelDx: -18, labelDy: -18 },
                { from: "B", to: "E", weight: 6 }, { from: "B", to: "F", weight: 4 }, { from: "B", to: "G", weight: 7 },
                { from: "C", to: "F", weight: 5 }, { from: "C", to: "G", weight: 4 }, { from: "C", to: "H", weight: 9 },
                { from: "D", to: "G", weight: 8 }, { from: "D", to: "H", weight: 3 },
                { from: "E", to: "I", weight: 5 },
                { from: "F", to: "J", weight: 3 }, { from: "F", to: "K", weight: 7 },
                { from: "G", to: "J", weight: 5, labelDx: -18, labelDy: 14 }, { from: "G", to: "K", weight: 4 },
                { from: "H", to: "K", weight: 6 },
                { from: "I", to: "V", weight: 8 }, { from: "J", to: "V", weight: 4 }, { from: "K", to: "V", weight: 6 }
            ],
            source: "S",
            target: "V",
            path: [],
            optimalPath: [],
            optimalCost: 0,
            cost: 0
        };
        // La ruta optima se calcula al cargar para no duplicar datos manuales.
        const shortest = runDijkstra(dijkstraGraph);
        dijkstraGraph.optimalPath = shortest.path;
        dijkstraGraph.optimalCost = shortest.cost;

        // Grafo MST compartido por Kruskal y Prim.
        const mstGraph = {
            nodes: [
                { id: 1, label: "Ana", x: 150, y: 125 },
                { id: 2, label: "Brayan", x: 390, y: 80 },
                { id: 3, label: "Camila", x: 650, y: 135 },
                { id: 4, label: "Diego", x: 250, y: 300 },
                { id: 5, label: "Elena", x: 525, y: 300 },
                { id: 6, label: "Fabio", x: 165, y: 455 },
                { id: 7, label: "Gabriela", x: 655, y: 450 }
            ],
            edges: [
                { id: "e1-2", from: 1, to: 2, weight: 4 },
                { id: "e1-4", from: 1, to: 4, weight: 3 },
                { id: "e2-3", from: 2, to: 3, weight: 6 },
                { id: "e2-4", from: 2, to: 4, weight: 2 },
                { id: "e2-5", from: 2, to: 5, weight: 5 },
                { id: "e3-5", from: 3, to: 5, weight: 4 },
                { id: "e4-5", from: 4, to: 5, weight: 7 },
                { id: "e4-6", from: 4, to: 6, weight: 6 },
                { id: "e5-7", from: 5, to: 7, weight: 3 },
                { id: "e6-7", from: 6, to: 7, weight: 8 },
                { id: "e5-6", from: 5, to: 6, weight: 4 }
            ],
            algorithm: "kruskal",
            primStart: 1,
            connected: [],
            selected: [],
            rejected: [],
            totalCost: 0,
            uf: null
        };
        resetMst(mstGraph);

        // Red dirigida para el minijuego de flujo maximo.
        const flowGraph = {
            nodes: [
                { id: "S", label: "Fuente", x: 90, y: 285 },
                { id: "A", label: "Ana", x: 260, y: 145 },
                { id: "B", label: "Brayan", x: 260, y: 290 },
                { id: "C", label: "Camila", x: 260, y: 435 },
                { id: "D", label: "Diego", x: 550, y: 205 },
                { id: "E", label: "Elena", x: 550, y: 365 },
                { id: "T", label: "Victima", x: 760, y: 285 }
            ],
            edges: [
                { id: "S-A", from: "S", to: "A", capacity: 8, flow: 0 },
                { id: "S-B", from: "S", to: "B", capacity: 6, flow: 0 },
                { id: "S-C", from: "S", to: "C", capacity: 5, flow: 0 },
                { id: "A-D", from: "A", to: "D", capacity: 5, flow: 0 },
                { id: "A-E", from: "A", to: "E", capacity: 4, flow: 0 },
                { id: "B-A", from: "B", to: "A", capacity: 3, flow: 0 },
                { id: "B-D", from: "B", to: "D", capacity: 2, flow: 0 },
                { id: "B-E", from: "B", to: "E", capacity: 6, flow: 0 },
                { id: "C-B", from: "C", to: "B", capacity: 3, flow: 0 },
                { id: "C-E", from: "C", to: "E", capacity: 4, flow: 0 },
                { id: "D-T", from: "D", to: "T", capacity: 7, flow: 0 },
                { id: "E-D", from: "E", to: "D", capacity: 3, flow: 0 },
                { id: "E-T", from: "E", to: "T", capacity: 10, flow: 0 }
            ],
            source: "S",
            sink: "T",
            selectedPath: [],
            maxFlow: 0,
            steps: [],
            expectedMaxFlow: 17
        };

        return {
            origen: {
                graph: originGraph,
                activeTraversal: null,
                bfs: { visited: [], queue: [], traversed: [], parent: {}, done: false },
                dfs: { visited: [], stack: [], traversed: [], parent: {}, done: false },
                accusedId: null
            },
            apoyo: { graph: dijkstraGraph },
            confianza: { graph: mstGraph },
            impacto: { graph: flowGraph }
        };
    }

    // Devuelve copias simples para que la vista no mute el arreglo base.
    function getModules() {
        return modules.map(module => ({ ...module }));
    }

    // Expone el estado global junto con la etapa visual derivada.
    function getState() {
        return { ...state, restorationStage: getRestorationStage() };
    }

    // Busca metadata de un modulo por id.
    function getModule(id) {
        const module = modules.find(item => item.id === id);
        return module ? { ...module } : null;
    }

    // Entrega una copia segura de la fase activa o solicitada.
    function getPhase(id = state.activePhaseId) {
        if (!id || !phases[id]) return null;
        return clonePhase(id, phases[id]);
    }

    // Selecciona una tarjeta sin iniciar necesariamente el reto.
    function selectModule(id) {
        const module = modules.find(item => item.id === id);
        if (!module) return null;
        state.activeModuleId = id;
        state.activePhaseId = state.activePhaseId === id ? state.activePhaseId : null;
        state.phaseActive = module.title;
        state.feedback = { tone: "info", text: module.note };
        return { ...module };
    }

    // Activa el minijuego si el modulo esta disponible.
    function startPhase(id = state.activeModuleId) {
        const module = modules.find(item => item.id === id);
        if (!module) return { ok: false, text: "Modulo no encontrado." };
        if (module.status === "bloqueado") {
            state.feedback = { tone: "bad", text: "Modulo bloqueado. Completa fase anterior." };
            return { ok: false, text: state.feedback.text };
        }
        state.activeModuleId = id;
        state.activePhaseId = id;
        state.phaseActive = module.title;
        state.feedback = { tone: "info", text: getPhaseHint(id) };
        return { ok: true, text: state.feedback.text };
    }

    // Enruta acciones de la vista hacia el handler de la fase activa.
    function handleAction(action, payload = {}) {
        if (!state.activePhaseId) return setFeedback(false, "Inicia una fase primero.");
        const handlers = {
            origen: handleOriginAction,
            apoyo: handleDijkstraAction,
            confianza: handleMstAction,
            impacto: handleFlowAction
        };
        return handlers[state.activePhaseId](action, payload);
    }

    // Controla inicio de BFS/DFS, visitas y acusacion del origen.
    function handleOriginAction(action, payload) {
        const phase = phases.origen;
        const graph = phase.graph;

        if (action === "start-origin-bfs") {
            phase.activeTraversal = "bfs";
            phase.bfs = { visited: [], queue: [], traversed: [], parent: {}, done: false };
            return setFeedback(true, `BFS manual listo. Haz clic en ${nodeLabel(graph, graph.startId)} para iniciar.`);
        }
        if (action === "start-origin-dfs") {
            if (!phase.bfs.done) return setFeedback(false, "Completa BFS antes de DFS.");
            phase.activeTraversal = "dfs";
            phase.dfs = { visited: [], stack: [], traversed: [], parent: {}, done: false };
            return setFeedback(true, `DFS manual listo. Haz clic en ${nodeLabel(graph, graph.startId)} para iniciar.`);
        }
        if (action === "visit-origin-node") {
            const id = Number(payload.nodeId);
            if (phase.activeTraversal === "bfs") return visitOriginBfs(phase, id);
            if (phase.activeTraversal === "dfs") return visitOriginDfs(phase, id);
            return setFeedback(false, "Primero elige BFS o DFS.");
        }
        if (action === "accuse") {
            if (!phase.bfs.done || !phase.dfs.done) {
                return setFeedback(false, "Completa BFS y DFS manualmente antes de acusar.");
            }
            const id = Number(payload.nodeId);
            phase.accusedId = id;
            if (id !== graph.originId) {
                const node = graph.nodes.find(item => item.id === id);
                return setFeedback(false, `${nodeLabel(graph, id)} no inicio la cadena. Pista revisada: ${node.clue}`);
            }
            completeModule("origen", "Origen confirmado. La fase de apoyo queda disponible.");
            return { ok: true, text: state.feedback.text };
        }
        return setFeedback(false, "Accion no valida.");
    }

    // Valida BFS manual usando cola FIFO.
    function visitOriginBfs(phase, id) {
        const graph = phase.graph;
        const st = phase.bfs;
        if (st.done) return setFeedback(false, "BFS ya esta completo. Inicia DFS.");
        if (st.visited.length === 0 && id !== graph.startId) {
            return setFeedback(false, `BFS debe iniciar en ${nodeLabel(graph, graph.startId)}.`);
        }
        const expected = st.visited.length === 0 ? graph.startId : st.queue[0];
        if (id !== expected) {
            return setFeedback(false, `BFS usa cola. Siguiente correcto: ${nodeLabel(graph, expected)}.`);
        }

        st.visited.push(id);
        st.queue = st.queue.filter(item => item !== id);
        const parent = st.parent[id];
        if (parent !== undefined) st.traversed.push(edgeKey(parent, id));

        graph.adj[id]
            .filter(next => !st.visited.includes(next) && !st.queue.includes(next))
            .forEach(next => {
                st.parent[next] = id;
                st.queue.push(next);
            });

        if (st.visited.length === graph.nodes.length) {
            st.done = true;
            phase.activeTraversal = null;
            return setFeedback(true, "BFS completo. Ahora ejecuta DFS manual para comparar profundidad.");
        }

        const node = graph.nodes.find(item => item.id === id);
        return setFeedback(true, `BFS visito ${nodeLabel(graph, id)}. Evidencia: ${node.evidence} ${node.clue}`);
    }

    // Valida DFS manual usando pila LIFO.
    function visitOriginDfs(phase, id) {
        const graph = phase.graph;
        const st = phase.dfs;
        if (st.done) return setFeedback(false, "DFS ya esta completo. Acusa al origen.");
        if (st.visited.length === 0 && id !== graph.startId) {
            return setFeedback(false, `DFS debe iniciar en ${nodeLabel(graph, graph.startId)}.`);
        }
        const expected = st.visited.length === 0 ? graph.startId : st.stack[st.stack.length - 1];
        if (id !== expected) {
            return setFeedback(false, `DFS usa pila. Siguiente correcto: ${nodeLabel(graph, expected)}.`);
        }

        st.visited.push(id);
        st.stack = st.stack.filter(item => item !== id);
        const parent = st.parent[id];
        if (parent !== undefined) st.traversed.push(edgeKey(parent, id));

        [...graph.adj[id]]
            .reverse()
            .filter(next => !st.visited.includes(next) && !st.stack.includes(next))
            .forEach(next => {
                st.parent[next] = id;
                st.stack.push(next);
            });

        if (st.visited.length === graph.nodes.length) {
            st.done = true;
            phase.activeTraversal = null;
            return setFeedback(true, "DFS completo. Cruza evidencia y acusa al nodo que inicio la cadena.");
        }

        const node = graph.nodes.find(item => item.id === id);
        return setFeedback(true, `DFS visito ${nodeLabel(graph, id)}. Evidencia: ${node.evidence} ${node.clue}`);
    }

    // Valida la ruta de apoyo contra el camino optimo de Dijkstra.
    function handleDijkstraAction(action, payload) {
        const graph = phases.apoyo.graph;
        if (action === "reset-path") {
            graph.path = [];
            graph.cost = 0;
            return setFeedback(true, "Ruta reiniciada. Empieza desde SOPORTE.");
        }
        if (action === "select-node") {
            const id = payload.nodeId;
            const result = selectDijkstraNode(graph, id);
            if (!result.ok) return setFeedback(false, result.text);
            if (id === graph.target) {
                if (samePath(graph.path, graph.optimalPath)) {
                    completeModule("apoyo", `Ruta optima enviada: ${graph.path.join(" -> ")}. Riesgo total ${graph.cost}.`);
                    return { ok: true, text: state.feedback.text };
                }
                return setFeedback(false, `Ruta llega a victima, pero riesgo ${graph.cost}. Optimo esperado: ${graph.optimalCost}. Reinicia e intenta menor costo.`);
            }
            return setFeedback(true, result.text);
        }
        return setFeedback(false, "Accion no valida.");
    }

    // Gestiona Kruskal o Prim segun el algoritmo elegido.
    function handleMstAction(action, payload) {
        const graph = phases.confianza.graph;
        if (action === "set-mst-algorithm") {
            const algorithm = payload.algorithm === "prim" ? "prim" : "kruskal";
            graph.algorithm = algorithm;
            resetMst(graph);
            const name = algorithm === "prim" ? "Prim" : "Kruskal";
            return setFeedback(true, `${name} activo. ${getMstInstruction(graph)}`);
        }
        if (action === "reset-mst") {
            resetMst(graph);
            return setFeedback(true, `MST reiniciado. ${getMstInstruction(graph)}`);
        }
        if (action === "select-edge") {
            const edge = graph.edges.find(item => item.id === payload.edgeId);
            if (!edge) return setFeedback(false, "Arista no existe.");
            if (graph.selected.includes(edge.id) || graph.rejected.includes(edge.id)) {
                return setFeedback(false, "Arista ya evaluada.");
            }

            const next = getNextMstEdge(graph);
            if (!next || edge.id !== next.id) {
                const correctText = next ? `${next.from}-${next.to} peso ${next.weight}` : "ninguna";
                const name = graph.algorithm === "prim" ? "Prim" : "Kruskal";
                const rule = graph.algorithm === "prim" ? "menor arista que conecte el arbol con un nodo nuevo" : "menor arista sin ciclo";
                return setFeedback(false, `${name} exige ${rule}. Siguiente correcta: ${correctText}.`);
            }

            graph.selected.push(edge.id);
            if (graph.algorithm === "prim") {
                addPrimNode(graph, edge);
            } else {
                graph.uf.union(edge.from, edge.to);
            }
            graph.totalCost += edge.weight;
            markRejectedCycleEdges(graph);

            if (graph.selected.length === graph.nodes.length - 1) {
                const name = graph.algorithm === "prim" ? "Prim" : "Kruskal";
                completeModule("confianza", `MST completo con ${name}. ${graph.selected.length} aristas, costo total ${graph.totalCost}.`);
                return { ok: true, text: state.feedback.text };
            }

            return setFeedback(true, `Arista ${edge.from}-${edge.to} aceptada. Costo acumulado ${graph.totalCost}.`);
        }
        return setFeedback(false, "Accion no valida.");
    }

    // Gestiona caminos aumentantes y aplicacion de flujo residual.
    function handleFlowAction(action, payload) {
        const graph = phases.impacto.graph;
        if (action === "reset-flow-path") {
            graph.selectedPath = [];
            return setFeedback(true, "Ruta residual reiniciada. Empieza en S.");
        }
        if (action === "select-flow-node") {
            const result = selectFlowNode(graph, payload.nodeId);
            return setFeedback(result.ok, result.text);
        }
        if (action === "apply-flow") {
            const validation = validateFlowPath(graph, graph.selectedPath);
            if (!validation.ok) return setFeedback(false, validation.text);
            applyFlowPath(graph, graph.selectedPath, validation.bottleneck);
            graph.steps.push({ path: [...graph.selectedPath], bottleneck: validation.bottleneck, maxFlow: graph.maxFlow });
            graph.selectedPath = [];

            if (!findAugmentingPath(graph)) {
                completeModule("impacto", `Flujo maximo alcanzado: ${graph.maxFlow}. Red segura restaurada.`);
                return { ok: true, text: state.feedback.text };
            }

            return setFeedback(true, `Flujo aplicado +${validation.bottleneck}. Total ${graph.maxFlow}. Busca otro camino aumentante.`);
        }
        if (action === "hint-flow") {
            const next = findAugmentingPath(graph);
            if (!next) return setFeedback(true, "No quedan caminos aumentantes.");
            return setFeedback(true, `Sugerencia residual: ${next.nodes.join(" -> ")}; cuello ${next.bottleneck}.`);
        }
        return setFeedback(false, "Accion no valida.");
    }

    // Marca un modulo como resuelto y actualiza las metricas globales.
    function completeModule(id, message) {
        const module = modules.find(item => item.id === id);
        if (!module || module.status === "resuelto") return;
        module.status = "resuelto";
        module.metricValue = module.metricTone === "safe" ? 92 : 14;
        state.repairedModules = modules.filter(item => item.status === "resuelto").length;
        state.networkIntegrity = Math.min(100, 31 + state.repairedModules * 17);
        state.harmfulTrend = Math.max(6, 88 - state.repairedModules * 21);
        state.restoredTrust = Math.min(98, 18 + state.repairedModules * 20);
        state.feedback = { tone: "good", text: message };

        const next = modules.find(item => item.status === "bloqueado");
        if (next) next.status = "disponible";
        if (state.repairedModules === modules.length) {
            state.victory = true;
            state.phaseActive = "Red segura restaurada";
        }
    }

    // Normaliza los mensajes de exito/error para la vista.
    function setFeedback(ok, text) {
        state.feedback = { tone: ok ? "good" : "bad", text };
        return { ok, text };
    }

    // Texto breve mostrado al iniciar cada fase.
    function getPhaseHint(id) {
        const hints = {
            origen: "Realiza BFS y DFS con clicks. Lee evidencias y acusa al nodo origen.",
            apoyo: "Haz clic en SOPORTE y avanza nodo por nodo hasta VICTIMA por la ruta de menor riesgo.",
            confianza: "Elige Kruskal o Prim. Luego selecciona aristas hasta construir el MST.",
            impacto: "Construye caminos aumentantes de S a T y aplica su cuello de botella."
        };
        return hints[id] || "Fase lista.";
    }

    // Traduce estados internos a etiquetas visibles.
    function getStatusLabel(status) {
        const labels = { disponible: "DISPONIBLE", pendiente: "PENDIENTE", bloqueado: "BLOQUEADO", resuelto: "RESUELTO" };
        return labels[status] || status.toUpperCase();
    }

    // Decide el estado visual general de la red.
    function getRestorationStage() {
        if (state.victory || (state.networkIntegrity >= 86 && state.restoredTrust >= 82 && state.harmfulTrend <= 18)) return "limpia";
        if (state.networkIntegrity >= 58 || state.repairedModules >= 2) return "reparando";
        return "crisis";
    }

    // Crea listas de adyacencia ordenadas para BFS/DFS.
    function buildAdj(nodeIds, edges) {
        const adj = {};
        nodeIds.forEach(id => { adj[id] = []; });
        edges.forEach(edge => {
            const a = Array.isArray(edge) ? edge[0] : edge.from;
            const b = Array.isArray(edge) ? edge[1] : edge.to;
            adj[a].push(b);
            adj[b].push(a);
        });
        Object.keys(adj).forEach(id => adj[id].sort((a, b) => String(a).localeCompare(String(b), "es", { numeric: true })));
        return adj;
    }

    // Recorrido BFS generico usado como utilidad algoritimica.
    function bfs(adj, start) {
        const queue = [start];
        const seen = new Set([start]);
        const order = [];
        while (queue.length) {
            const current = queue.shift();
            order.push(current);
            adj[current].forEach(next => {
                if (!seen.has(next)) {
                    seen.add(next);
                    queue.push(next);
                }
            });
        }
        return order;
    }

    // Recorrido DFS generico usado como utilidad algoritimica.
    function dfs(adj, start) {
        const stack = [start];
        const seen = new Set();
        const order = [];
        while (stack.length) {
            const current = stack.pop();
            if (seen.has(current)) continue;
            seen.add(current);
            order.push(current);
            [...adj[current]].reverse().forEach(next => {
                if (!seen.has(next)) stack.push(next);
            });
        }
        return order;
    }

    // Calcula ruta minima entre source y target en un grafo ponderado.
    function runDijkstra(graph) {
        const ids = graph.nodes.map(node => node.id);
        const dist = Object.fromEntries(ids.map(id => [id, Infinity]));
        const prev = {};
        const visited = new Set();
        dist[graph.source] = 0;

        while (visited.size < ids.length) {
            const current = ids
                .filter(id => !visited.has(id))
                .sort((a, b) => dist[a] - dist[b] || a.localeCompare(b))[0];
            if (!current || dist[current] === Infinity) break;
            if (current === graph.target) break;
            visited.add(current);

            graph.edges
                .filter(edge => edge.from === current || edge.to === current)
                .forEach(edge => {
                    const next = edge.from === current ? edge.to : edge.from;
                    const candidate = dist[current] + edge.weight;
                    if (candidate < dist[next]) {
                        dist[next] = candidate;
                        prev[next] = current;
                    }
                });
        }

        const path = [];
        let cursor = graph.target;
        while (cursor) {
            path.unshift(cursor);
            if (cursor === graph.source) break;
            cursor = prev[cursor];
        }
        return { path, cost: dist[graph.target] };
    }

    // Agrega un nodo a la ruta del jugador si esta conectado al anterior.
    function selectDijkstraNode(graph, id) {
        if (!graph.nodes.some(node => node.id === id)) return { ok: false, text: "Nodo no existe." };
        if (graph.path.length === 0) {
            if (id !== graph.source) return { ok: false, text: `Debes iniciar en ${graph.source}.` };
            graph.path.push(id);
            graph.cost = 0;
            return { ok: true, text: "Inicio fijado. Elige siguiente nodo conectado." };
        }
        if (graph.path.includes(id)) return { ok: false, text: "No repitas nodos." };
        const last = graph.path[graph.path.length - 1];
        const edge = graph.edges.find(item => (item.from === last && item.to === id) || (item.to === last && item.from === id));
        if (!edge) return { ok: false, text: `${last} no conecta con ${id}.` };
        graph.path.push(id);
        graph.cost += edge.weight;
        return { ok: true, text: `${id} agregado. Riesgo acumulado ${graph.cost}.` };
    }

    // Compara rutas exactas nodo por nodo.
    function samePath(a, b) {
        return a.length === b.length && a.every((item, index) => item === b[index]);
    }

    // Limpia el MST y prepara Union-Find o nodo inicial de Prim.
    function resetMst(graph) {
        graph.selected = [];
        graph.rejected = [];
        graph.totalCost = 0;
        graph.uf = createUnionFind(graph.nodes.map(node => node.id));
        graph.connected = graph.algorithm === "prim" ? [graph.primStart] : [];
    }

    // Obtiene la siguiente arista obligatoria segun Kruskal o Prim.
    function getNextMstEdge(graph) {
        if (graph.algorithm === "prim") return getNextPrimEdge(graph);
        return [...graph.edges]
            .filter(edge => !graph.selected.includes(edge.id) && !graph.rejected.includes(edge.id))
            .sort(compareEdges)
            .find(edge => graph.uf.find(edge.from) !== graph.uf.find(edge.to)) || null;
    }

    // En Prim, elige la menor arista que sale del arbol actual.
    function getNextPrimEdge(graph) {
        const connected = new Set(graph.connected);
        return graph.edges
            .filter(edge => !graph.selected.includes(edge.id))
            .filter(edge => connected.has(edge.from) !== connected.has(edge.to))
            .sort(compareEdges)[0] || null;
    }

    // Incorpora al arbol el extremo nuevo de una arista de Prim.
    function addPrimNode(graph, edge) {
        const connected = new Set(graph.connected);
        const next = connected.has(edge.from) ? edge.to : edge.from;
        if (!connected.has(next)) graph.connected.push(next);
    }

    // Deshabilita aristas que ya no pueden aportar al MST.
    function markRejectedCycleEdges(graph) {
        if (graph.algorithm === "prim") {
            const connected = new Set(graph.connected);
            graph.rejected = graph.edges
                .filter(edge => !graph.selected.includes(edge.id) && connected.has(edge.from) && connected.has(edge.to))
                .map(edge => edge.id);
            return;
        }
        graph.edges.forEach(edge => {
            if (!graph.selected.includes(edge.id) && !graph.rejected.includes(edge.id) && graph.uf.find(edge.from) === graph.uf.find(edge.to)) {
                graph.rejected.push(edge.id);
            }
        });
    }

    // Mensaje contextual para el algoritmo MST activo.
    function getMstInstruction(graph) {
        if (graph.algorithm === "prim") {
            return `Prim inicia en ${nodeLabel(graph, graph.primStart)}. Elige la menor arista que conecte el arbol con un nodo nuevo.`;
        }
        return "Kruskal activo. Elige la arista valida de menor peso que no forme ciclo.";
    }

    // Estructura para detectar ciclos durante Kruskal.
    function createUnionFind(ids) {
        const parent = {};
        ids.forEach(id => { parent[id] = id; });
        function find(id) {
            if (parent[id] !== id) parent[id] = find(parent[id]);
            return parent[id];
        }
        function union(a, b) {
            const ra = find(a);
            const rb = find(b);
            if (ra === rb) return false;
            parent[rb] = ra;
            return true;
        }
        return { find, union };
    }

    // Orden estable por peso y extremos para desempates.
    function compareEdges(a, b) {
        if (a.weight !== b.weight) return a.weight - b.weight;
        if (String(a.from) !== String(b.from)) return String(a.from).localeCompare(String(b.from), "es", { numeric: true });
        return String(a.to).localeCompare(String(b.to), "es", { numeric: true });
    }

    // Agrega nodos a un camino residual valido.
    function selectFlowNode(graph, id) {
        if (!graph.nodes.some(node => node.id === id)) return { ok: false, text: "Nodo no existe." };
        if (graph.selectedPath.length === 0) {
            if (id !== graph.source) return { ok: false, text: `Debes iniciar en ${graph.source}.` };
            graph.selectedPath.push(id);
            return { ok: true, text: "Fuente seleccionada. Avanza por capacidad residual." };
        }
        if (graph.selectedPath.includes(id)) return { ok: false, text: "No repitas nodos en camino aumentante." };
        const last = graph.selectedPath[graph.selectedPath.length - 1];
        const residual = getResidualCapacity(graph, last, id);
        if (residual <= 0) return { ok: false, text: `Sin residual disponible de ${last} a ${id}.` };
        graph.selectedPath.push(id);
        if (id === graph.sink) return { ok: true, text: `Camino completo. Cuello ${getBottleneck(graph, graph.selectedPath)}. Aplica flujo.` };
        return { ok: true, text: `${id} agregado. Residual ${residual}.` };
    }

    // Confirma que el camino residual va de fuente a sumidero.
    function validateFlowPath(graph, path) {
        if (path.length < 2) return { ok: false, text: "Selecciona ruta S -> T." };
        if (path[0] !== graph.source || path[path.length - 1] !== graph.sink) return { ok: false, text: "Ruta debe iniciar en S y terminar en T." };
        const bottleneck = getBottleneck(graph, path);
        if (bottleneck <= 0) return { ok: false, text: "Ruta sin capacidad residual." };
        return { ok: true, bottleneck, text: "Ruta valida." };
    }

    // Calcula capacidad residual directa o inversa.
    function getResidualCapacity(graph, from, to) {
        const forward = graph.edges.find(edge => edge.from === from && edge.to === to);
        if (forward) return forward.capacity - forward.flow;
        const reverse = graph.edges.find(edge => edge.from === to && edge.to === from);
        if (reverse) return reverse.flow;
        return 0;
    }

    // Devuelve el cuello de botella del camino seleccionado.
    function getBottleneck(graph, path) {
        let min = Infinity;
        for (let i = 0; i < path.length - 1; i++) min = Math.min(min, getResidualCapacity(graph, path[i], path[i + 1]));
        return min === Infinity ? 0 : min;
    }

    // Aplica flujo en aristas directas o revierte por aristas inversas.
    function applyFlowPath(graph, path, amount) {
        for (let i = 0; i < path.length - 1; i++) {
            const from = path[i];
            const to = path[i + 1];
            const forward = graph.edges.find(edge => edge.from === from && edge.to === to);
            if (forward) forward.flow += amount;
            else graph.edges.find(edge => edge.from === to && edge.to === from).flow -= amount;
        }
        graph.maxFlow += amount;
    }

    // Lista vecinos alcanzables con residual positivo.
    function getResidualNeighbors(graph, id) {
        return graph.nodes
            .map(node => node.id)
            .filter(next => next !== id && getResidualCapacity(graph, id, next) > 0);
    }

    // Busca un camino aumentante con BFS sobre la red residual.
    function findAugmentingPath(graph) {
        const queue = [graph.source];
        const parent = {};
        const seen = new Set([graph.source]);
        while (queue.length) {
            const current = queue.shift();
            if (current === graph.sink) break;
            getResidualNeighbors(graph, current).forEach(next => {
                if (seen.has(next)) return;
                seen.add(next);
                parent[next] = current;
                queue.push(next);
            });
        }
        if (!seen.has(graph.sink)) return null;
        const path = [];
        let cursor = graph.sink;
        while (cursor) {
            path.unshift(cursor);
            if (cursor === graph.source) break;
            cursor = parent[cursor];
        }
        return { nodes: path, bottleneck: getBottleneck(graph, path) };
    }

    // Formatea id y nombre de nodo para mensajes.
    function nodeLabel(graph, id) {
        const node = graph.nodes.find(item => item.id === id);
        return node ? `${node.id}.${node.label}` : id;
    }

    // Convierte un recorrido en texto legible.
    function formatNodeOrder(graph, order) {
        return order.map(id => nodeLabel(graph, id)).join(" -> ");
    }

    // Clave canonica para aristas no dirigidas.
    function edgeKey(a, b) {
        return [a, b].sort((x, y) => String(x).localeCompare(String(y), "es", { numeric: true })).join("-");
    }

    // Clona fase para render sin exponer referencias internas.
    function clonePhase(id, phase) {
        const clone = JSON.parse(JSON.stringify(phase));
        if (id === "confianza") delete clone.graph.uf;
        clone.feedback = { ...state.feedback };
        clone.module = getModule(id);
        return clone;
    }

    return {
        getModules,
        getState,
        getModule,
        getPhase,
        selectModule,
        startPhase,
        handleAction,
        getStatusLabel
    };
})();
