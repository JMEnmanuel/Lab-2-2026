/*
   View - Mision Final

   Renderiza tablero, paneles y mini-retos.
*/
const FinalView = (() => {
    // Cambia atributos globales usados por el CSS de restauracion.
    function applyRestorationState(state) {
        document.body.dataset.restoration = state.restorationStage || "crisis";
    }

    // Pinta las metricas superiores de salud de la red.
    function renderGlobalStatus(state) {
        const container = document.getElementById("global-status");
        const stats = [
            { label: "Integridad de la red", value: state.networkIntegrity, suffix: "%", tone: "safe" },
            { label: "Tendencia dañina", value: state.harmfulTrend, suffix: "%", tone: "danger" },
            { label: "Confianza restaurada", value: state.restoredTrust, suffix: "%", tone: "trust" },
            { label: "Fase activa", value: state.phaseActive, suffix: "", tone: "neutral" }
        ];

        container.innerHTML = stats.map(stat => `
            <article class="status-card ${stat.tone}">
                <span>${stat.label}</span>
                <strong class="${stat.tone === "danger" ? "micro-glitch" : ""}" data-text="${stat.value}${stat.suffix}">
                    ${stat.value}${stat.suffix}
                </strong>
                ${typeof stat.value === "number" ? `
                    <div class="status-track">
                        <div class="status-fill ${stat.tone}" style="width:${stat.value}%"></div>
                    </div>
                ` : ""}
            </article>
        `).join("");
    }

    // Actualiza el mapa decorativo segun crisis/reparacion/limpieza.
    function renderFractureMap(state) {
        const container = document.getElementById("fracture-map");
        const repaired = state.restorationStage === "limpia";
        const recovering = state.restorationStage === "reparando";
        container.innerHTML = `
            <svg viewBox="0 0 360 220" role="presentation" focusable="false">
                <path class="ruin-link ${repaired ? "clean" : "broken"}" d="M48 42 L132 86 L220 48 L312 92" />
                <path class="ruin-link ${recovering || repaired ? "clean" : "broken"}" d="M74 166 L132 86 L202 158 L312 92" />
                <path class="ruin-link ${recovering || repaired ? "clean" : "severed"}" d="M48 42 L74 166 L202 158 L220 48" />
                <g class="ruin-node ${repaired ? "safe" : "danger"}" transform="translate(48 42)"><circle r="16"/><text y="5">#</text></g>
                <g class="ruin-node ${recovering || repaired ? "safe" : "damaged"}" transform="translate(132 86)"><circle r="14"/><text y="5">?</text></g>
                <g class="ruin-node ${recovering || repaired ? "safe" : "damaged"}" transform="translate(220 48)"><circle r="14"/><text y="5">!</text></g>
                <g class="ruin-node ${repaired ? "safe" : "damaged"}" transform="translate(74 166)"><circle r="14"/><text y="5">+</text></g>
                <g class="ruin-node ${recovering || repaired ? "safe" : "damaged"}" transform="translate(202 158)"><circle r="14"/><text y="5">+</text></g>
                <g class="ruin-node ${repaired ? "safe" : "danger"}" transform="translate(312 92)"><circle r="16"/><text y="5">%</text></g>
            </svg>
            <div class="damage-readout">
                <span>ESTADO VISUAL</span>
                <strong class="${repaired ? "" : "micro-glitch"}" data-text="${repaired ? "RED LIMPIA" : recovering ? "REPARACION EN CURSO" : "RED FRACTURADA"}">
                    ${repaired ? "RED LIMPIA" : recovering ? "REPARACION EN CURSO" : "RED FRACTURADA"}
                </strong>
            </div>
        `;
    }

    // Dibuja las tarjetas de modulos y conecta su boton principal.
    function renderModules(modules, state, handlers) {
        const grid = document.getElementById("module-grid");
        grid.innerHTML = "";

        modules.forEach(module => {
            const card = document.createElement("article");
            const isActive = state.activeModuleId === module.id;
            card.className = `module-card ${module.status}${isActive ? " active" : ""}`;
            card.innerHTML = `
                <div class="module-topline">
                    <span>${module.order}</span>
                    <span class="status-pill ${module.status === "bloqueado" ? "micro-glitch" : ""}" data-text="${FinalModel.getStatusLabel(module.status)}">${FinalModel.getStatusLabel(module.status)}</span>
                </div>
                <h3>${module.title}</h3>
                <p class="algorithm">${module.algorithm}</p>
                <p class="summary">${module.summary}</p>
                <div class="metric-row">
                    <span>${module.metricLabel}</span>
                    <strong>${module.metricValue}%</strong>
                </div>
                <div class="metric-track">
                    <div class="metric-fill ${module.metricTone}" style="width:${module.metricValue}%"></div>
                </div>
                <button class="module-button" type="button" ${module.status === "bloqueado" ? "disabled" : ""}>SELECCIONAR</button>
            `;
            card.querySelector("button").addEventListener("click", () => handlers.onSelect(module.id));
            grid.appendChild(card);
        });
    }

    // Renderiza el panel derecho: briefing, boton de inicio o minijuego.
    function renderPhasePanel(module, phase, state, handlers = {}) {
        const panel = document.getElementById("phase-panel");
        if (!module) {
            panel.innerHTML = `
                <div class="empty-panel">
                    <span class="section-label">// FASE ACTIVA</span>
                    <h2>Selecciona un modulo</h2>
                    <p>El panel mostrara el reto real de cada algoritmo dentro del Protocolo Aurora.</p>
                </div>
            `;
            return;
        }

        panel.innerHTML = `
            <div class="phase-content">
                <span class="section-label">// ${module.order} // ${FinalModel.getStatusLabel(module.status)}</span>
                <h2>${module.title}</h2>
                <p class="phase-algorithm">${module.algorithm}</p>
                <p>${module.briefing}</p>
                <div class="connector-box">
                    <span>Integracion activa</span>
                    <strong>${module.hook}</strong>
                </div>
                ${phase ? renderGamePhase(phase) : `
                    <button id="btn-start-phase" class="start-phase" type="button" ${module.status === "bloqueado" ? "disabled" : ""}>
                        INICIAR FASE
                    </button>
                    <p class="phase-note visible">Completa esta fase para desbloquear el siguiente modulo.</p>
                `}
                <div class="phase-feedback ${state.feedback.tone}">
                    ${state.feedback.text}
                </div>
            </div>
        `;

        const start = document.getElementById("btn-start-phase");
        if (start) start.addEventListener("click", () => handlers.onStart(module.id));
        bindPhaseControls(panel, handlers);
    }

    // Selecciona el renderer del minijuego segun el modulo activo.
    function renderGamePhase(phase) {
        const renderers = {
            origen: renderOriginPhase,
            apoyo: renderDijkstraPhase,
            confianza: renderMstPhase,
            impacto: renderFlowPhase
        };
        return renderers[phase.module.id](phase);
    }

    // Vista de BFS/DFS y acusacion del origen.
    function renderOriginPhase(phase) {
        const graph = phase.graph;
        const visibleTraversal = phase.activeTraversal === "dfs" || phase.dfs.visited.length > 0 ? phase.dfs : phase.bfs;
        const activeNodes = new Set(visibleTraversal.visited || []);
        const activeEdges = new Set(visibleTraversal.traversed || []);
        const hasAccusation = phase.accusedId !== null && phase.accusedId !== undefined;
        const accusationIsCorrect = hasAccusation && Number(phase.accusedId) === Number(graph.originId);
        return `
            <div class="phase-game">
                ${renderUndirectedGraph(graph, {
                    activeNodes,
                    activeEdges,
                    dangerNodes: new Set(hasAccusation && !accusationIsCorrect ? [phase.accusedId] : []),
                    safeNodes: new Set(accusationIsCorrect ? [phase.accusedId] : [])
                })}
                <div class="phase-actions">
                    <button data-action="start-origin-bfs" type="button">INICIAR BFS</button>
                    <button data-action="start-origin-dfs" type="button" ${phase.bfs.done ? "" : "disabled"}>INICIAR DFS</button>
                </div>
                <div class="trace-grid">
                    <div><span>BFS</span><strong>${phase.bfs.visited.length ? formatOrder(graph, phase.bfs.visited) : "Pendiente"} | Cola: ${phase.bfs.queue.join(", ") || "-"}</strong></div>
                    <div><span>DFS</span><strong>${phase.dfs.visited.length ? formatOrder(graph, phase.dfs.visited) : "Pendiente"} | Pila: ${phase.dfs.stack.join(", ") || "-"}</strong></div>
                    <div><span>Modo activo</span><strong>${phase.activeTraversal ? phase.activeTraversal.toUpperCase() : "Selecciona BFS/DFS"} | Siguiente estructura decide el click.</strong></div>
                </div>
                <div class="choice-grid">
                    ${graph.nodes.map(node => `<button data-action="visit-origin-node" data-node-id="${node.id}" type="button">${node.id}. ${node.label}</button>`).join("")}
                </div>
                <div class="evidence-grid">
                    ${graph.nodes.map(node => `
                        <article class="${node.id === phase.accusedId ? `selected ${accusationIsCorrect ? "correct" : "incorrect"}` : ""}">
                            <span>${node.id}. ${node.label}</span>
                            <strong>${node.evidence}</strong>
                            <p>${node.clue}</p>
                            <button data-action="accuse" data-node-id="${node.id}" type="button" ${phase.bfs.done && phase.dfs.done ? "" : "disabled"}>ACUSAR</button>
                        </article>
                    `).join("")}
                </div>
            </div>
        `;
    }

    // Vista de ruta minima: grafo ponderado, ruta y riesgo.
    function renderDijkstraPhase(phase) {
        const graph = phase.graph;
        return `
            <div class="phase-game">
                ${renderWeightedGraph(graph, {
                    activeNodes: new Set(graph.path),
                    activeEdges: pathEdges(graph.path),
                    directed: false,
                    mode: "dijkstra"
                })}
                <div class="trace-grid">
                    <div><span>Ruta actual</span><strong>${graph.path.length ? graph.path.join(" -> ") : "Sin iniciar"}</strong></div>
                    <div><span>Riesgo</span><strong>${graph.cost} / optimo ${graph.optimalCost}</strong></div>
                </div>
                <div class="choice-grid">
                    ${graph.nodes.map(node => `<button data-action="select-node" data-node-id="${node.id}" type="button">${node.id} ${node.label}</button>`).join("")}
                </div>
                <div class="phase-actions">
                    <button data-action="reset-path" type="button">REINICIAR RUTA</button>
                </div>
            </div>
        `;
    }

    // Vista MST con selector entre Kruskal y Prim.
    function renderMstPhase(phase) {
        const graph = phase.graph;
        const algorithmName = graph.algorithm === "prim" ? "Prim" : "Kruskal";
        const activeNodes = graph.algorithm === "prim" ? new Set(graph.connected) : new Set();
        return `
            <div class="phase-game">
                ${renderWeightedGraph(graph, {
                    activeNodes,
                    activeEdges: new Set(graph.selected),
                    rejectedEdges: new Set(graph.rejected),
                    directed: false,
                    mode: "mst"
                })}
                <div class="algorithm-switch" role="group" aria-label="Algoritmo MST">
                    <button data-action="set-mst-algorithm" data-algorithm="kruskal" class="${graph.algorithm === "kruskal" ? "active" : ""}" type="button">KRUSKAL</button>
                    <button data-action="set-mst-algorithm" data-algorithm="prim" class="${graph.algorithm === "prim" ? "active" : ""}" type="button">PRIM</button>
                </div>
                <div class="trace-grid">
                    <div><span>Algoritmo</span><strong>${algorithmName}</strong></div>
                    <div><span>Aristas MST</span><strong>${graph.selected.length}/${graph.nodes.length - 1}</strong></div>
                    <div><span>Costo total</span><strong>${graph.totalCost}</strong></div>
                    ${graph.algorithm === "prim" ? `<div><span>Arbol conectado</span><strong>${graph.connected.join(" -> ")}</strong></div>` : ""}
                </div>
                <div class="edge-choice-grid">
                    ${[...graph.edges].sort((a, b) => a.weight - b.weight || String(a.id).localeCompare(String(b.id))).map(edge => `
                        <button data-action="select-edge" data-edge-id="${edge.id}" type="button" ${graph.selected.includes(edge.id) || graph.rejected.includes(edge.id) ? "disabled" : ""}>
                            ${edge.from}-${edge.to} / ${edge.weight}
                        </button>
                    `).join("")}
                </div>
                <div class="phase-actions">
                    <button data-action="reset-mst" type="button">REINICIAR MST</button>
                </div>
            </div>
        `;
    }

    // Vista de flujo maximo con camino residual y bitacora.
    function renderFlowPhase(phase) {
        const graph = phase.graph;
        return `
            <div class="phase-game">
                ${renderFlowGraph(graph)}
                <div class="trace-grid">
                    <div><span>Camino residual</span><strong>${graph.selectedPath.length ? graph.selectedPath.join(" -> ") : "Sin iniciar"}</strong></div>
                    <div><span>Flujo</span><strong>${graph.maxFlow} / ${graph.expectedMaxFlow}</strong></div>
                </div>
                <div class="choice-grid">
                    ${graph.nodes.map(node => `<button data-action="select-flow-node" data-node-id="${node.id}" type="button">${node.id} ${node.label}</button>`).join("")}
                </div>
                <div class="phase-actions">
                    <button data-action="apply-flow" type="button">APLICAR FLUJO</button>
                    <button data-action="reset-flow-path" type="button">BORRAR CAMINO</button>
                    <button data-action="hint-flow" type="button">PISTA</button>
                </div>
                <div class="flow-log">
                    ${graph.steps.map(step => `<span>${step.path.join(" -> ")} +${step.bottleneck} = ${step.maxFlow}</span>`).join("")}
                </div>
            </div>
        `;
    }

    // SVG para grafos no ponderados de BFS/DFS.
    function renderUndirectedGraph(graph, opts = {}) {
        const activeNodes = opts.activeNodes || new Set();
        const activeEdges = opts.activeEdges || new Set();
        const dangerNodes = opts.dangerNodes || new Set();
        const safeNodes = opts.safeNodes || new Set();
        return `
            <div class="graph-stage">
                <svg viewBox="0 0 780 520" role="img" aria-label="Grafo de fase">
                    ${graph.edges.map(edge => {
                        const a = graph.nodes.find(node => node.id === edge[0]);
                        const b = graph.nodes.find(node => node.id === edge[1]);
                        return `<line class="phase-edge ${activeEdges.has(edgeKey(edge[0], edge[1])) ? "accepted" : ""}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
                    }).join("")}
                    ${graph.nodes.map(node => `
                        <g class="phase-node ${activeNodes.has(node.id) ? "active" : ""} ${dangerNodes.has(node.id) ? "danger" : ""} ${safeNodes.has(node.id) ? "safe" : ""}" transform="translate(${node.x} ${node.y})">
                            <circle r="24"></circle>
                            <text y="5">${node.id}</text>
                            <title>${node.label}</title>
                        </g>
                    `).join("")}
                </svg>
            </div>
        `;
    }

    // SVG para grafos ponderados; permite desplazar etiquetas con labelDx/Y.
    function renderWeightedGraph(graph, opts = {}) {
        const activeEdges = opts.activeEdges || new Set();
        const rejectedEdges = opts.rejectedEdges || new Set();
        const activeNodes = opts.activeNodes || new Set();
        return `
            <div class="graph-stage">
                <svg viewBox="0 0 820 520" role="img" aria-label="Grafo ponderado">
                    ${graph.edges.map(edge => {
                        const a = graph.nodes.find(node => node.id === edge.from);
                        const b = graph.nodes.find(node => node.id === edge.to);
                        const id = edge.id || `${edge.from}-${edge.to}`;
                        const mx = (a.x + b.x) / 2 + (edge.labelDx || 0);
                        const my = (a.y + b.y) / 2 + (edge.labelDy || 0);
                        return `
                            <line class="phase-edge ${activeEdges.has(id) || activeEdges.has(`${edge.from}-${edge.to}`) ? "accepted" : ""} ${rejectedEdges.has(id) ? "rejected" : ""}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />
                            <text class="edge-weight" x="${mx}" y="${my - 8}">${edge.weight}</text>
                        `;
                    }).join("")}
                    ${graph.nodes.map(node => `
                        <g class="phase-node ${activeNodes.has(node.id) ? "active" : ""}" transform="translate(${node.x} ${node.y})">
                            <circle r="24"></circle>
                            <text y="5">${node.id}</text>
                            <title>${node.label}</title>
                        </g>
                    `).join("")}
                </svg>
            </div>
        `;
    }

    // SVG dirigido que muestra flujo/capacidad por arista.
    function renderFlowGraph(graph) {
        const pathSet = pathEdges(graph.selectedPath);
        return `
            <div class="graph-stage">
                <svg viewBox="0 0 860 540" role="img" aria-label="Red de flujo">
                    <defs>
                        <marker id="arrow-flow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L7,3 z"></path>
                        </marker>
                    </defs>
                    ${graph.edges.map(edge => {
                        const a = graph.nodes.find(node => node.id === edge.from);
                        const b = graph.nodes.find(node => node.id === edge.to);
                        const mx = (a.x + b.x) / 2;
                        const my = (a.y + b.y) / 2;
                        const active = pathSet.has(edge.id);
                        const saturated = edge.flow === edge.capacity;
                        return `
                            <line class="phase-edge directed ${active ? "accepted" : ""} ${saturated ? "rejected" : ""}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" marker-end="url(#arrow-flow)" />
                            <text class="edge-weight" x="${mx}" y="${my - 8}">${edge.flow}/${edge.capacity}</text>
                        `;
                    }).join("")}
                    ${graph.nodes.map(node => `
                        <g class="phase-node ${graph.selectedPath.includes(node.id) ? "active" : ""}" transform="translate(${node.x} ${node.y})">
                            <circle r="24"></circle>
                            <text y="5">${node.id}</text>
                            <title>${node.label}</title>
                        </g>
                    `).join("")}
                </svg>
            </div>
        `;
    }

    // Convierte botones data-action en acciones del controlador.
    function bindPhaseControls(panel, handlers) {
        panel.querySelectorAll("[data-action]").forEach(button => {
            button.addEventListener("click", () => {
                handlers.onAction(button.dataset.action, {
                    nodeId: button.dataset.nodeId,
                    edgeId: button.dataset.edgeId,
                    algorithm: button.dataset.algorithm
                });
            });
        });
    }

    // Genera claves de aristas consecutivas de una ruta.
    function pathEdges(path) {
        const result = new Set();
        for (let i = 0; i < path.length - 1; i++) {
            result.add(`${path[i]}-${path[i + 1]}`);
            result.add(`${path[i + 1]}-${path[i]}`);
        }
        return result;
    }

    // Clave canonica para aristas no dirigidas.
    function edgeKey(a, b) {
        return [a, b].sort((x, y) => String(x).localeCompare(String(y), "es", { numeric: true })).join("-");
    }

    // Formatea recorridos BFS/DFS con nombre de nodo.
    function formatOrder(graph, order) {
        return order.map(id => {
            const node = graph.nodes.find(item => item.id === id);
            return node ? `${id}.${node.label}` : id;
        }).join(" -> ");
    }

    // Actualiza el reloj del footer.
    function updateClock() {
        const date = new Date();
        const pad = value => String(value).padStart(2, "0");
        document.getElementById("clock").textContent = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    // Crea particulas de fondo una sola vez.
    function spawnParticles() {
        const container = document.getElementById("particles");
        if (!container || container.children.length > 0) return;
        const chars = ["#AURORA", "#RED_SEGURA", "#ALERTA", "0101", "TRACE", "FLOW"];
        for (let i = 0; i < 22; i++) {
            const item = document.createElement("span");
            item.className = "particle";
            item.textContent = chars[Math.floor(Math.random() * chars.length)];
            item.style.left = `${Math.random() * 96}vw`;
            item.style.animationDelay = `${Math.random() * 10}s`;
            item.style.animationDuration = `${8 + Math.random() * 10}s`;
            container.appendChild(item);
        }
    }

    return {
        applyRestorationState,
        renderGlobalStatus,
        renderFractureMap,
        renderModules,
        renderPhasePanel,
        updateClock,
        spawnParticles
    };
})();
