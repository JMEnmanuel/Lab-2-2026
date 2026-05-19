/*
   Model del selector de misiones.

   Este archivo guarda datos y estado.
   No debe dibujar HTML ni escuchar clicks.
*/
const SelectorModel = (() => {
    // Cada nodo representa una mision visible en el mapa.
    const nodes = [
        { id: 1, name: "MISION 1", sub: "RASTROS DEL ACOSO", code: "BFS / DFS", x: 190, y: 195, file: "misiones/misión 1/mission_1.html", desc: "Traza el origen del acoso usando recorridos BFS y DFS sobre la red comprometida." },
        { id: 2, name: "MISION 2", sub: "RUTA SEGURA", code: "DIJKSTRA", x: 775, y: 148, file: "misiones/misión 2/mission_2.html", desc: "Calcula el camino de menor riesgo para intervenir y proteger al usuario afectado." },
        { id: 3, name: "MISION 3", sub: "RECONSTRUIR RED", code: "KRUSKAL / PRIM", x: 830, y: 545, file: "misiones/misión 3/mission_3.html", desc: "Reconstruye conexiones de confianza usando arbol de expansion minima." },
        { id: 4, name: "MISION 4", sub: "CONTROL DE IMPACTO", code: "FORD-FULKERSON", x: 148, y: 520, file: "misiones/misión 4/mission_4.html", desc: "Limita la propagacion del contenido danino calculando el flujo maximo." },
        { id: 5, name: "CREDITOS", sub: "EQUIPO", code: "v1.0", x: 870, y: 648, file: null, pending: true, desc: "Equipo de desarrollo." }
    ];

    // Cada par conecta dos nodos del selector.
    const links = [[1,2], [2,3], [3,4], [4,1], [1,3], [2,4], [3,5]];

    // Estado visual que cambia mientras el selector esta abierto.
    const state = {
        completed: [],
        activeNode: null,
        corruption: { 1: 87, 2: 74, 3: 91, 4: 68 }
    };

    function getNodes() {
        return nodes;
    }

    function getLinks() {
        return links;
    }

    function getState() {
        return state;
    }

    function getNode(id) {
        return nodes.find(node => node.id === id);
    }

    function setActiveNode(id) {
        state.activeNode = id;
    }

    function clearActiveNode() {
        state.activeNode = null;
    }

    function markCompleted(id) {
        if (!state.completed.includes(id)) {
            state.completed.push(id);
        }

        if (state.corruption[id] !== undefined) {
            state.corruption[id] = 0;
        }
    }

    function fluctuateCorruption() {
        [1, 2, 3, 4].forEach(id => {
            if (!state.completed.includes(id)) {
                const nextValue = state.corruption[id] + Math.floor(Math.random() * 5 - 2);
                state.corruption[id] = Math.max(60, Math.min(99, nextValue));
            }
        });
    }

    return {
        getNodes,
        getLinks,
        getState,
        getNode,
        setActiveNode,
        clearActiveNode,
        markCompleted,
        fluctuateCorruption
    };
})();
