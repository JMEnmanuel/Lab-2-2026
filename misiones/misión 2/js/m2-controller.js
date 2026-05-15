// ============================================================
// CONTROLLER — Misión 2: Ruta Segura
// Lógica pura. Une modelo con vista.
// ============================================================

// --- Pasos del tutorial (pre-calculados) ---
var TUT_STEPS = [
    {
        index: 0,
        text: "Observa la red. Cada conexión tiene un peso que representa el nivel de riesgo. Tu objetivo: encontrar el nodo de apoyo que genere la ruta MÁS SEGURA (menor riesgo total) hasta la VÍCTIMA.",
        visited: [],
        current: null,
        distances: { A:0, B:'∞', C:'∞', D:'∞', V:'∞' },
        path: [],
        isLast: false
    },
    {
        index: 1,
        text: "Dijkstra inicia desde el nodo elegido (A). Asigna distancia 0 a A e infinito al resto. Primero exploramos A: sus vecinos son B (costo 2) y C (costo 5).",
        visited: ['A'],
        current: 'A',
        distances: { A:0, B:2, C:5, D:'∞', V:'∞' },
        path: [],
        isLast: false
    },
    {
        index: 2,
        text: "El nodo más cercano sin visitar es B (costo 2). Lo visitamos. Desde B podemos llegar a D con costo 2+1=3.",
        visited: ['A','B'],
        current: 'B',
        distances: { A:0, B:2, C:5, D:3, V:'∞' },
        path: [],
        isLast: false
    },
    {
        index: 3,
        text: "Ahora el más cercano es D (costo 3). Lo visitamos. Desde D llegamos a V con costo 3+2=5. ¡Mucho mejor que ir por C!",
        visited: ['A','B','D'],
        current: 'D',
        distances: { A:0, B:2, C:5, D:3, V:5 },
        path: [],
        isLast: false
    },
    {
        index: 4,
        text: "Visitamos C (costo 5). Desde C a V sería 5+8=13, pero ya tenemos V con costo 5. No actualizamos.",
        visited: ['A','B','D','C'],
        current: 'C',
        distances: { A:0, B:2, C:5, D:3, V:5 },
        path: [],
        isLast: false
    },
    {
        index: 5,
        text: "¡Listo! La ruta más segura desde A hasta la Víctima es A → B → D → V con un riesgo total de 5. Dijkstra siempre encuentra el camino óptimo. ¡Ahora inténtalo tú!",
        visited: ['A','B','D','C','V'],
        current: 'V',
        distances: { A:0, B:2, C:5, D:3, V:5 },
        path: ['A','B','D','V'],
        isLast: true
    }
];

var currentTutStep = 0;

// --- Inicialización ---
function init() {
    document.getElementById('btn-back').addEventListener('click', () => {
        clearTutPopup();
        window.location.href = '../../index.html';
    });
    document.getElementById('btn-start-tutorial').addEventListener('click', startTutorial);
    document.getElementById('btn-tut-next').addEventListener('click', tutNext);
    document.getElementById('btn-tut-prev').addEventListener('click', tutPrev);

    showScreen('screen-intro');
}

// --- Tutorial ---
function startTutorial() {
    currentTutStep = 0;
    showScreen('screen-tutorial');
    applyTutStep(0);
}

function tutNext() {
    const step = TUT_STEPS[currentTutStep];
    if (step.isLast) {
        clearTutPopup();
        startGame();
        return;
    }
    currentTutStep++;
    applyTutStep(currentTutStep);
}

function tutPrev() {
    if (currentTutStep > 0) {
        currentTutStep--;
        applyTutStep(currentTutStep);
    }
}

function applyTutStep(idx) {
    const step   = TUT_STEPS[idx];
    const popup  = TUT_POPUPS[idx];

    // Limpiar popup anterior antes de renderizar nuevo grafo
    clearTutPopup();

    renderTutorialStep(step);
    renderGraph(
        'tut-svg',
        TUT_NODES,
        TUT_EDGES,
        step.path,
        step.visited,
        step.current
    );

    // Mostrar popup con delay (0.4s) anclado al nodo del paso
    if (popup) {
        showTutPopup(popup, TUT_NODES, 'tut-svg');
    }
}

// --- Placeholder para el juego real (Parte 2) ---
function startGame() {
    alert('[ PARTE 2 — Juego real: próximamente ]');
}

// Arrancar
init();
