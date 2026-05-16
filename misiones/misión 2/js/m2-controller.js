/*
   Controller de Mision 2.

   Este archivo maneja la logica del juego.
   Ejecuta Dijkstra, procesa el tutorial, valida el drag entre nodos,
   aplica riesgo, controla la moneda y decide victoria o derrota.
*/

// ── TUTORIAL STEPS ──────────────────────────────────────────
var TUT_STEPS = [
    {
        index:0, isLast:false,
        text:"Observa la red. Cada conexión tiene un peso que representa el nivel de riesgo. Tu objetivo: encontrar el nodo de apoyo que genere la ruta MÁS SEGURA (menor riesgo total) hasta la VÍCTIMA.",
        visited:[], current:null,
        distances:{ A:0, B:'∞', C:'∞', D:'∞', V:'∞' }, path:[]
    },
    {
        index:1, isLast:false,
        text:"Dijkstra inicia desde el nodo elegido (A). Asigna distancia 0 a A e infinito al resto. Primero exploramos A: sus vecinos son B (costo 2) y C (costo 5).",
        visited:['A'], current:'A',
        distances:{ A:0, B:2, C:5, D:'∞', V:'∞' }, path:[]
    },
    {
        index:2, isLast:false,
        text:"El nodo más cercano sin visitar es B (costo 2). Lo visitamos. Desde B podemos llegar a D con costo 2+1=3.",
        visited:['A','B'], current:'B',
        distances:{ A:0, B:2, C:5, D:3, V:'∞' }, path:[]
    },
    {
        index:3, isLast:false,
        text:"Ahora el más cercano es D (costo 3). Lo visitamos. Desde D llegamos a V con costo 3+2=5. ¡Mucho mejor que ir por C!",
        visited:['A','B','D'], current:'D',
        distances:{ A:0, B:2, C:5, D:3, V:5 }, path:[]
    },
    {
        index:4, isLast:false,
        text:"Visitamos C (costo 5). Desde C a V sería 5+8=13, pero ya tenemos V con costo 5. No actualizamos.",
        visited:['A','B','D','C'], current:'C',
        distances:{ A:0, B:2, C:5, D:3, V:5 }, path:[]
    },
    {
        index:5, isLast:true,
        text:"¡Listo! La ruta más segura desde A hasta la Víctima es A → B → D → V con un riesgo total de 5. Dijkstra siempre encuentra el camino óptimo. ¡Ahora inténtalo tú!",
        visited:['A','B','D','C','V'], current:'V',
        distances:{ A:0, B:2, C:5, D:3, V:5 }, path:['A','B','D','V']
    }
];

var currentTutStep = 0;
var lastResultWon = false;

// ── DIJKSTRA SOBRE EL GRAFO DE JUEGO ────────────────────────
function dijkstra(nodes, edges, source) {
    // dist guarda el costo minimo conocido desde source hasta cada nodo.
    // prev guarda desde que nodo se llego al mejor costo actual.
    // unvisited guarda los nodos que Dijkstra todavia no procesa.
    var dist = {}, prev = {}, unvisited = new Set();
    nodes.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; unvisited.add(n.id); });
    dist[source] = 0;

    while (unvisited.size > 0) {
        // Nodo con menor distancia
        let u = null;
        unvisited.forEach(id => { if (u === null || dist[id] < dist[u]) u = id; });
        if (dist[u] === Infinity) break;
        unvisited.delete(u);

        // Vecinos
        edges.forEach(e => {
            let neighbor = null;
            if (e.from === u && unvisited.has(e.to))   neighbor = e.to;
            if (e.to   === u && unvisited.has(e.from)) neighbor = e.from;
            if (!neighbor) return;
            const alt = dist[u] + e.weight;
            if (alt < dist[neighbor]) { dist[neighbor] = alt; prev[neighbor] = u; }
        });
    }

    // Reconstruir ruta óptima hasta TARGET_NODE
    var path = [], cur = TARGET_NODE;
    while (cur) { path.unshift(cur); cur = prev[cur]; }
    if (path[0] !== source) path = []; // sin ruta

    return { dist, prev, path };
}

// Calcula cuál sería el siguiente nodo óptimo dado el estado actual del jugador
function getNextOptimalNode(playerPath) {
    var result = dijkstra(GAME_NODES, GAME_EDGES, GAME_SOURCE);
    var optPath = result.path;
    if (!playerPath.length) return optPath[1] || null; // siguiente desde SOURCE

    var last = playerPath[playerPath.length - 1];
    var idx  = optPath.indexOf(last);
    if (idx === -1 || idx >= optPath.length - 1) return null;
    return optPath[idx + 1];
}

// ── INIT ────────────────────────────────────────────────────
function init() {
    document.getElementById('btn-back').addEventListener('click', () => {
        clearTutPopup();
        window.location.href = '../../index.html';
    });
    document.getElementById('btn-start-tutorial').addEventListener('click', startTutorial);
    document.getElementById('btn-skip-tutorial').addEventListener('click', skipTutorial);
    document.getElementById('btn-tut-next').addEventListener('click', tutNext);
    document.getElementById('btn-tut-prev').addEventListener('click', tutPrev);
    document.getElementById('btn-tut-skip').addEventListener('click', skipTutorial);
    document.getElementById('btn-coin').addEventListener('click', onCoinClick);
    document.getElementById('btn-reset-path').addEventListener('click', onResetPath);
    document.getElementById('btn-retry').addEventListener('click', retryMission);

    showScreen('screen-intro');
}

// ── TUTORIAL ────────────────────────────────────────────────
function startTutorial() {
    currentTutStep = 0;
    showScreen('screen-tutorial');
    applyTutStep(0);
}

function tutNext() {
    if (TUT_STEPS[currentTutStep].isLast) { clearTutPopup(); startMission(); return; }
    applyTutStep(++currentTutStep);
}

function tutPrev() {
    if (currentTutStep > 0) applyTutStep(--currentTutStep);
}

function skipTutorial() {
    clearTutPopup();
    startMission();
}

function applyTutStep(idx) {
    const step  = TUT_STEPS[idx];
    const popup = TUT_POPUPS[idx];
    clearTutPopup();
    renderTutorialStep(step);
    renderGraph('tut-svg', TUT_NODES, TUT_EDGES, step.path, step.visited, step.current);
    if (popup) showTutPopup(popup, TUT_NODES, 'tut-svg');
}

// ── JUEGO REAL ───────────────────────────────────────────────
function startMission() {
    missionState.currentAttempt = 1;
    startGame();
}

function startGame() {
    // Reset estado
    lastResultWon = false;
    gameState.playerPath   = [GAME_SOURCE];
    gameState.drawnEdges   = [];
    gameState.totalRisk    = 0;
    gameState.shieldHP     = SHIELD_MAX;
    gameState.coinUsesLeft = COIN_USES_PER_GAME;
    gameState.dragging     = false;
    gameState.dragFrom     = null;
    gameState.finished     = false;

    showScreen('screen-game');
    renderGameGraph('game-svg', GAME_NODES, GAME_EDGES, gameState.playerPath, gameState.drawnEdges, null);
    renderShield(gameState.shieldHP, SHIELD_MAX);
    renderCoin(gameState.coinUsesLeft, COIN_USES_PER_GAME);
    renderPathDisplay(gameState.playerPath, gameState.totalRisk, RISK_THRESHOLD);
    renderAttemptDisplay();
    updateCoinButton();

    // Cerrar modal fin si estaba abierto
    const endModal = document.getElementById('end-modal');
    if (endModal) endModal.classList.add('hidden');

    bindGameEvents();
}

// ── BIND EVENTOS DEL GRAFO (drag entre nodos) ────────────────
function bindGameEvents() {
    const svg = document.getElementById('game-svg');
    if (!svg) return;

    // Limpiar listeners anteriores clonando el svg
    const fresh = svg.cloneNode(true);
    svg.parentNode.replaceChild(fresh, svg);
    // Re-renderizar sobre el nuevo SVG
    renderGameGraph('game-svg', GAME_NODES, GAME_EDGES, gameState.playerPath, gameState.drawnEdges, null);

    const gameSvg = document.getElementById('game-svg');

    gameSvg.addEventListener('mousedown', onNodeMouseDown);
    gameSvg.addEventListener('mousemove', onSvgMouseMove);
    gameSvg.addEventListener('mouseup',   onSvgMouseUp);
    gameSvg.addEventListener('mouseleave', cancelDrag);

    // Touch
    gameSvg.addEventListener('touchstart',  onTouchStart,  { passive:false });
    gameSvg.addEventListener('touchmove',   onTouchMove,   { passive:false });
    gameSvg.addEventListener('touchend',    onTouchEnd,    { passive:false });

}

// ── HELPERS SVG ──────────────────────────────────────────────
function getSvgPoint(svg, clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function nodeAtPoint(svgPt) {
    return GAME_NODES.find(n => {
        const dx = n.x - svgPt.x, dy = n.y - svgPt.y;
        return Math.sqrt(dx*dx + dy*dy) <= 30;
    });
}

function getEdgeBetween(fromId, toId) {
    return GAME_EDGES.find(e =>
        (e.from === fromId && e.to === toId) ||
        (e.from === toId   && e.to === fromId));
}

// ── DRAG ────────────────────────────────────────────────────
function onNodeMouseDown(e) {
    if (gameState.finished) return;
    const svg  = document.getElementById('game-svg');
    const pt   = getSvgPoint(svg, e.clientX, e.clientY);
    const node = nodeAtPoint(pt);
    if (!node) return;

    // Solo se puede arrastrar desde el último nodo de la ruta
    const last = gameState.playerPath[gameState.playerPath.length - 1];
    if (node.id !== last) return;

    gameState.dragging  = true;
    gameState.dragFrom  = node.id;
    e.preventDefault();
}

function onSvgMouseMove(e) {
    if (!gameState.dragging) return;
    const svg    = document.getElementById('game-svg');
    const pt     = getSvgPoint(svg, e.clientX, e.clientY);
    const from   = GAME_NODES.find(n => n.id === gameState.dragFrom);
    const dragLn = document.getElementById('drag-line');
    if (!dragLn || !from) return;
    dragLn.setAttribute("display","");
    dragLn.setAttribute("x1", from.x); dragLn.setAttribute("y1", from.y);
    dragLn.setAttribute("x2", pt.x);   dragLn.setAttribute("y2", pt.y);
}

function onSvgMouseUp(e) {
    if (!gameState.dragging) return;
    const svg  = document.getElementById('game-svg');
    const pt   = getSvgPoint(svg, e.clientX, e.clientY);
    const to   = nodeAtPoint(pt);
    finalizeDrag(to);
}

function onTouchStart(e) {
    e.preventDefault();
    const t   = e.touches[0];
    const svg = document.getElementById('game-svg');
    const pt  = getSvgPoint(svg, t.clientX, t.clientY);
    const node = nodeAtPoint(pt);
    if (!node) return;
    const last = gameState.playerPath[gameState.playerPath.length - 1];
    if (node.id !== last) return;
    gameState.dragging = true;
    gameState.dragFrom = node.id;
}

function onTouchMove(e) {
    e.preventDefault();
    if (!gameState.dragging) return;
    const t      = e.touches[0];
    const svg    = document.getElementById('game-svg');
    const pt     = getSvgPoint(svg, t.clientX, t.clientY);
    const from   = GAME_NODES.find(n => n.id === gameState.dragFrom);
    const dragLn = document.getElementById('drag-line');
    if (!dragLn || !from) return;
    dragLn.setAttribute("display","");
    dragLn.setAttribute("x1", from.x); dragLn.setAttribute("y1", from.y);
    dragLn.setAttribute("x2", pt.x);   dragLn.setAttribute("y2", pt.y);
}

function onTouchEnd(e) {
    e.preventDefault();
    if (!gameState.dragging) return;
    const t   = e.changedTouches[0];
    const svg = document.getElementById('game-svg');
    const pt  = getSvgPoint(svg, t.clientX, t.clientY);
    const to  = nodeAtPoint(pt);
    finalizeDrag(to);
}

function cancelDrag() {
    gameState.dragging = false;
    gameState.dragFrom = null;
    const dragLn = document.getElementById('drag-line');
    if (dragLn) dragLn.setAttribute("display","none");
}

function finalizeDrag(toNode) {
    // Esta funcion valida el intento del jugador despues de soltar el mouse.
    // Solo permite avanzar si existe una arista y si no se forma ciclo en la ruta.
    gameState.dragging = false;
    const dragLn = document.getElementById('drag-line');
    if (dragLn) dragLn.setAttribute("display","none");

    if (!toNode || toNode.id === gameState.dragFrom) return;

    const from = gameState.dragFrom;
    const to   = toNode.id;

    // Verificar que existe arista
    const edge = getEdgeBetween(from, to);
    if (!edge) return;

    // Verificar que el destino no está ya en la ruta (no ciclos)
    if (gameState.playerPath.includes(to)) return;

    // Verificar que 'from' es el último nodo de la ruta
    const last = gameState.playerPath[gameState.playerPath.length - 1];
    if (from !== last) return;

    applyEdge(from, to, edge.weight);
}

// ── APLICAR ARISTA AL ESTADO ─────────────────────────────────
function applyEdge(from, to, weight) {
    // Si la conexion es valida, se agrega a la ruta y aumenta el riesgo total.
    // El escudo baja en la misma cantidad que el peso de la arista.
    // Actualizar estado
    gameState.playerPath.push(to);
    gameState.drawnEdges.push({ from, to, weight });
    gameState.totalRisk  += weight;

    // Golpe al escudo
    const shieldBefore = gameState.shieldHP;
    gameState.shieldHP  = Math.max(0, gameState.shieldHP - weight);

    // Efectos de daño
    triggerDamageFlash();
    playDamageSound();

    // Re-render
    renderGameGraph('game-svg', GAME_NODES, GAME_EDGES, gameState.playerPath, gameState.drawnEdges, null);
    renderShield(gameState.shieldHP, SHIELD_MAX);
    renderPathDisplay(gameState.playerPath, gameState.totalRisk, RISK_THRESHOLD);
    bindGameDragOnly(); // rebind drag sin recrear todo

    // ¿Llegó a la víctima?
    if (to === TARGET_NODE) {
        gameState.finished = true;
        setTimeout(() => evaluateEnd(), 400);
        return;
    }

    // ¿Escudo agotado?
    if (gameState.shieldHP <= 0) {
        gameState.finished = true;
        setTimeout(() => {
            showEndModal(false, gameState.totalRisk, gameState.playerPath);
            updateRetryButton(false);
        }, 400);
    }
}

function evaluateEnd() {
    const win = gameState.totalRisk <= RISK_THRESHOLD;
    showEndModal(win, gameState.totalRisk, gameState.playerPath);
    updateRetryButton(win);
}

// Rebind solo drag (sin recrear SVG entero)
function bindGameDragOnly() {
    const gameSvg = document.getElementById('game-svg');
    if (!gameSvg) return;
    gameSvg.onmousedown  = onNodeMouseDown;
    gameSvg.onmousemove  = onSvgMouseMove;
    gameSvg.onmouseup    = onSvgMouseUp;
    gameSvg.onmouseleave = cancelDrag;
}

// ── RESET RUTA ───────────────────────────────────────────────
function onResetPath() {
    if (gameState.finished) return;

    // Devolver el riesgo quitado al escudo (clamped a SHIELD_MAX)
    gameState.shieldHP   = Math.min(SHIELD_MAX, gameState.shieldHP + gameState.totalRisk);
    gameState.playerPath = [GAME_SOURCE];
    gameState.drawnEdges = [];
    gameState.totalRisk  = 0;

    renderGameGraph('game-svg', GAME_NODES, GAME_EDGES, gameState.playerPath, gameState.drawnEdges, null);
    renderShield(gameState.shieldHP, SHIELD_MAX);
    renderPathDisplay(gameState.playerPath, gameState.totalRisk, RISK_THRESHOLD);
    bindGameDragOnly();
}

// ── MONEDA ───────────────────────────────────────────────────
function onCoinClick() {
    // La moneda es una ayuda opcional.
    // Si sale bien, muestra cual seria el siguiente nodo de la ruta optima.
    if (gameState.coinUsesLeft <= 0 || gameState.finished) return;

    gameState.coinUsesLeft--;
    renderCoin(gameState.coinUsesLeft, COIN_USES_PER_GAME);
    updateCoinButton();

    const success     = Math.random() < 0.5;
    const nextNodeId  = getNextOptimalNode(gameState.playerPath);
    const nextNode    = nextNodeId ? GAME_NODES.find(n => n.id === nextNodeId) : null;
    const label       = nextNode ? `${nextNode.id} (${nextNode.label})` : '—';

    playCoinSound(success);

    showCoinAnimation(success, label, () => {
        if (success && nextNodeId) {
            flashHintNode(nextNodeId, 'game-svg');
            renderGameGraph('game-svg', GAME_NODES, GAME_EDGES, gameState.playerPath, gameState.drawnEdges, nextNodeId);
            bindGameDragOnly();
            // El destello desaparece después de 1.2s
            setTimeout(() => {
                renderGameGraph('game-svg', GAME_NODES, GAME_EDGES, gameState.playerPath, gameState.drawnEdges, null);
                bindGameDragOnly();
            }, 1400);
        }
    });
}

function updateCoinButton() {
    const btn = document.getElementById('btn-coin');
    if (!btn) return;
    btn.disabled = gameState.coinUsesLeft <= 0;
    btn.textContent = `◈ LANZAR MONEDA (${gameState.coinUsesLeft})`;
}

function renderAttemptDisplay() {
    const display = document.getElementById('attempt-display');
    if (!display) return;
    display.innerHTML = `
        <span>ACTUAL</span>
        <span class="threshold-val">${missionState.currentAttempt} / ${missionState.maxAttempts}</span>
    `;
}

function retryMission() {
    if (lastResultWon) {
        startMission();
        return;
    }

    if (missionState.currentAttempt >= missionState.maxAttempts) return;
    missionState.currentAttempt++;
    startGame();
}

function updateRetryButton(win) {
    const btn = document.getElementById('btn-retry');
    if (!btn) return;

    if (win) {
        btn.disabled = false;
        btn.textContent = '↺ JUGAR DE NUEVO';
        return;
    }

    const hasAttempts = missionState.currentAttempt < missionState.maxAttempts;
    btn.disabled = !hasAttempts;
    btn.textContent = hasAttempts
        ? `↺ INTENTAR DE NUEVO (${missionState.maxAttempts - missionState.currentAttempt} RESTANTES)`
        : 'SIN INTENTOS RESTANTES';
}

// ── ARRANCAR ─────────────────────────────────────────────────
init();
