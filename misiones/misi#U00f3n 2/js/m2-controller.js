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
var lastResultWon  = false;
var cpuEnabled     = true;

// ── DIJKSTRA SOBRE EL GRAFO DE JUEGO ────────────────────────
function dijkstra(nodes, edges, source) {
    // dist guarda el costo minimo conocido desde source hasta cada nodo.
    // prev guarda desde que nodo se llego al mejor costo actual.
    // unvisited guarda los nodos que Dijkstra todavia no procesa.
    var dist = {}, prev = {}, unvisited = new Set();
    nodes.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; unvisited.add(n.id); });
    dist[source] = 0;

    while (unvisited.size > 0) {
        let u = null;
        unvisited.forEach(id => { if (u === null || dist[id] < dist[u]) u = id; });
        if (dist[u] === Infinity) break;
        unvisited.delete(u);

        edges.forEach(e => {
            let neighbor = null;
            if (e.from === u && unvisited.has(e.to))   neighbor = e.to;
            if (e.to   === u && unvisited.has(e.from)) neighbor = e.from;
            if (!neighbor) return;
            const alt = dist[u] + e.weight;
            if (alt < dist[neighbor]) { dist[neighbor] = alt; prev[neighbor] = u; }
        });
    }

    var path = [], cur = TARGET_NODE;
    while (cur) { path.unshift(cur); cur = prev[cur]; }
    if (path[0] !== source) path = [];

    return { dist, prev, path };
}

// Calcula cuál sería el siguiente nodo óptimo dado el estado actual del jugador
function getNextOptimalNode(playerPath) {
    var result = dijkstra(GAME_NODES, GAME_EDGES, GAME_SOURCE);
    var optPath = result.path;
    if (!playerPath.length) return optPath[1] || null;

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
    document.getElementById('btn-start-single').addEventListener('click', () => startMission(false));
    document.getElementById('btn-start-cpu').addEventListener('click', () => startMission(true));
    document.getElementById('btn-start-ranking').addEventListener('click', () => {
        RankingMode.begin({
            missionId: 'mision-2',
            missionLabel: 'MISION 02',
            nativeCpu: true,
            onStart: () => startMission(true)
        });
    });
    document.getElementById('btn-view-ranking').addEventListener('click', () => {
        RankingMode.showBoard('mision-2');
    });
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
    if (TUT_STEPS[currentTutStep].isLast) { clearTutPopup(); startMission(true); return; }
    applyTutStep(++currentTutStep);
}

function tutPrev() {
    if (currentTutStep > 0) applyTutStep(--currentTutStep);
}

function skipTutorial() {
    clearTutPopup();
    startMission(true);
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
function startMission(withCpu) {
    if (typeof withCpu === 'boolean') cpuEnabled = withCpu;
    if (window.M2CpuEffects) M2CpuEffects.setEnabled(cpuEnabled);
    missionState.currentAttempt = 1;
    startGame();
}

function startGame() {
    lastResultWon = false;
    gameState.playerPath   = [GAME_SOURCE];
    gameState.drawnEdges   = [];
    gameState.totalRisk    = 0;
    // gameState.shieldHP  = SHIELD_MAX;  // escudo desactivado
    gameState.coinUsesLeft = COIN_USES_PER_GAME;
    gameState.dragging     = false;
    gameState.dragFrom     = null;
    gameState.finished     = false;

    showScreen('screen-game');
    renderGameGraph('game-svg', GAME_NODES, GAME_EDGES, gameState.playerPath, gameState.drawnEdges, null);
    // renderShield(gameState.shieldHP, SHIELD_MAX);  // escudo desactivado
    renderCoin(gameState.coinUsesLeft, COIN_USES_PER_GAME);
    renderPathDisplay(gameState.playerPath, gameState.totalRisk, RISK_THRESHOLD);
    renderAttemptDisplay();
    updateCoinButton();

    const endModal = document.getElementById('end-modal');
    if (endModal) endModal.classList.add('hidden');

    document.getElementById('screen-game').dataset.cpuMode = cpuEnabled ? 'enabled' : 'disabled';
    if (window.M2CpuEffects) M2CpuEffects.onGameStart({ enabled: cpuEnabled });

    bindGameEvents();
}

// ── BIND EVENTOS DEL GRAFO ────────────────────────────────────
// FIX 1: _listeners guarda referencias para poder removerlas antes de
// rebindear, evitando acumulacion de handlers duplicados.
var _gameListeners = null;

function _removeGameListeners(el) {
    if (!_gameListeners) return;
    el.removeEventListener('mousedown',  _gameListeners.mousedown);
    el.removeEventListener('mousemove',  _gameListeners.mousemove);
    el.removeEventListener('mouseup',    _gameListeners.mouseup);
    el.removeEventListener('mouseleave', _gameListeners.mouseleave);
    el.removeEventListener('touchstart', _gameListeners.touchstart);
    el.removeEventListener('touchmove',  _gameListeners.touchmove);
    el.removeEventListener('touchend',   _gameListeners.touchend);
    _gameListeners = null;
}

function bindGameEvents() {
    // BUG FIX B: el cloneNode anterior destruia el SVG que startGame acaba
    // de renderizar, causando un frame en blanco. Eliminado.
    // Ademas, usamos requestAnimationFrame para garantizar que el browser
    // haya calculado el layout del SVG antes de bindear — esto previene que
    // getScreenCTM() devuelva null en el primer mousedown/touchstart.
    const gameSvg = document.getElementById('game-svg');
    if (!gameSvg) return;
    _removeGameListeners(gameSvg);
    requestAnimationFrame(() => {
        const el = document.getElementById('game-svg');
        if (el) _attachGameListeners(el);
    });
}

// FIX 1 (core): bindGameDragOnly ahora usa addEventListener igual que
// bindGameEvents, y elimina los anteriores antes de agregar nuevos.
// Esto garantiza que mouse Y touch funcionen correctamente tras cada arista.
function bindGameDragOnly() {
    const gameSvg = document.getElementById('game-svg');
    if (!gameSvg) return;
    _removeGameListeners(gameSvg);
    _attachGameListeners(gameSvg);
}

function _attachGameListeners(el) {
    _gameListeners = {
        mousedown:  onNodeMouseDown,
        mousemove:  onSvgMouseMove,
        mouseup:    onSvgMouseUp,
        mouseleave: cancelDrag,
        touchstart: onTouchStart,
        touchmove:  onTouchMove,
        touchend:   onTouchEnd
    };
    el.addEventListener('mousedown',  _gameListeners.mousedown);
    el.addEventListener('mousemove',  _gameListeners.mousemove);
    el.addEventListener('mouseup',    _gameListeners.mouseup);
    el.addEventListener('mouseleave', _gameListeners.mouseleave);
    el.addEventListener('touchstart', _gameListeners.touchstart, { passive: false });
    el.addEventListener('touchmove',  _gameListeners.touchmove,  { passive: false });
    el.addEventListener('touchend',   _gameListeners.touchend,   { passive: false });
}

// ── HELPERS SVG ──────────────────────────────────────────────
function getSvgPoint(svg, clientX, clientY) {
    // BUG FIX A: getScreenCTM() devuelve null cuando el SVG acaba de ser
    // insertado al DOM y el navegador no ha calculado su layout aun.
    // Llamar .inverse() sobre null lanza TypeError silencioso que mata el handler.
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    return pt.matrixTransform(ctm.inverse());
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

// ── DRAG MOUSE ───────────────────────────────────────────────
function onNodeMouseDown(e) {
    if (gameState.finished) return;
    const svg  = document.getElementById('game-svg');
    const pt   = getSvgPoint(svg, e.clientX, e.clientY);
    if (!pt) return;
    const node = nodeAtPoint(pt);
    if (!node) return;

    const last = gameState.playerPath[gameState.playerPath.length - 1];
    if (node.id !== last) return;

    gameState.dragging = true;
    gameState.dragFrom = node.id;
    e.preventDefault();
}

function onSvgMouseMove(e) {
    if (!gameState.dragging) return;
    const svg    = document.getElementById('game-svg');
    const pt     = getSvgPoint(svg, e.clientX, e.clientY);
    if (!pt) return;
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
    if (!pt) { cancelDrag(); return; }
    const to   = nodeAtPoint(pt);
    finalizeDrag(to);
}

// ── DRAG TOUCH ───────────────────────────────────────────────
function onTouchStart(e) {
    e.preventDefault();
    const t    = e.touches[0];
    const svg  = document.getElementById('game-svg');
    const pt   = getSvgPoint(svg, t.clientX, t.clientY);
    if (!pt) return;
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
    if (!pt) return;
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
    if (!pt) { cancelDrag(); return; }
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
    gameState.dragging = false;
    const dragLn = document.getElementById('drag-line');
    if (dragLn) dragLn.setAttribute("display","none");

    if (!toNode || toNode.id === gameState.dragFrom) return;

    const from = gameState.dragFrom;
    const to   = toNode.id;

    const edge = getEdgeBetween(from, to);
    if (!edge) return;

    if (gameState.playerPath.includes(to)) return;

    const last = gameState.playerPath[gameState.playerPath.length - 1];
    if (from !== last) return;

    applyEdge(from, to, edge.weight);
}

// ── APLICAR ARISTA AL ESTADO ─────────────────────────────────
function applyEdge(from, to, weight) {
    gameState.playerPath.push(to);
    gameState.drawnEdges.push({ from, to, weight });
    gameState.totalRisk += weight;

    // Escudo desactivado — ya no se descuenta HP ni se disparan efectos de daño
    // gameState.shieldHP = Math.max(0, gameState.shieldHP - weight);
    // triggerDamageFlash();
    // playDamageSound();

    renderGameGraph('game-svg', GAME_NODES, GAME_EDGES, gameState.playerPath, gameState.drawnEdges, null);
    // renderShield(gameState.shieldHP, SHIELD_MAX);  // escudo desactivado
    renderPathDisplay(gameState.playerPath, gameState.totalRisk, RISK_THRESHOLD);
    bindGameDragOnly();
    if (window.M2CpuEffects) {
        M2CpuEffects.runTurn({
            kind: 'edge',
            from,
            to,
            weight,
            path: gameState.playerPath.slice(),
            risk: gameState.totalRisk
        });
    }

    if (to === TARGET_NODE) {
        gameState.finished = true;
        setTimeout(() => evaluateEnd(), 400);
        return;
    }

    // Escudo desactivado — la derrota ya no ocurre por HP agotado, solo por umbral al llegar
    // if (gameState.shieldHP <= 0) {
    //     gameState.finished = true;
    //     setTimeout(() => {
    //         showEndModal(false, gameState.totalRisk, gameState.playerPath);
    //         updateRetryButton(false);
    //     }, 400);
    // }
}

function evaluateEnd() {
    const win = gameState.totalRisk <= RISK_THRESHOLD;
    lastResultWon = win;
    if (window.RankingMode && RankingMode.isActive()) {
        RankingMode.finish({
            success: win,
            extra: { risk: gameState.totalRisk, path: gameState.playerPath.slice() }
        });
    }
    showEndModal(win, gameState.totalRisk, gameState.playerPath);
    updateRetryButton(win);
}

// ── RESET RUTA ───────────────────────────────────────────────
function onResetPath() {
    if (gameState.finished) return;

    // Escudo desactivado — ya no hay HP que restaurar al reiniciar ruta
    // gameState.shieldHP   = Math.min(SHIELD_MAX, gameState.shieldHP + gameState.totalRisk);
    gameState.playerPath = [GAME_SOURCE];
    gameState.drawnEdges = [];
    gameState.totalRisk  = 0;

    renderGameGraph('game-svg', GAME_NODES, GAME_EDGES, gameState.playerPath, gameState.drawnEdges, null);
    // renderShield(gameState.shieldHP, SHIELD_MAX);  // escudo desactivado
    renderPathDisplay(gameState.playerPath, gameState.totalRisk, RISK_THRESHOLD);
    bindGameDragOnly();
}

// ── MONEDA ───────────────────────────────────────────────────
function onCoinClick() {
    if (gameState.coinUsesLeft <= 0 || gameState.finished) return;

    gameState.coinUsesLeft--;
    renderCoin(gameState.coinUsesLeft, COIN_USES_PER_GAME);
    updateCoinButton();

    const success    = Math.random() < 0.5;
    const nextNodeId = getNextOptimalNode(gameState.playerPath);
    const coinCpu    = window.M2CpuEffects
        ? M2CpuEffects.getCoinInterference({
            success,
            nextNodeId,
            path: gameState.playerPath.slice(),
            nodes: GAME_NODES
        })
        : null;
    const shownNodeId = coinCpu && coinCpu.fakeNodeId ? coinCpu.fakeNodeId : nextNodeId;
    const shownNode   = shownNodeId ? GAME_NODES.find(n => n.id === shownNodeId) : null;
    const label       = coinCpu && coinCpu.message
        ? coinCpu.message
        : shownNode ? `${shownNode.id} (${shownNode.label})` : '—';

    playCoinSound(success);

    showCoinAnimation(success, label, () => {
        if (coinCpu && coinCpu.fakeNodeId && window.M2CpuEffects) {
            M2CpuEffects.flashFalseHint(coinCpu.fakeNodeId);
            return;
        }
        if (success && nextNodeId) {
            flashHintNode(nextNodeId, 'game-svg');
            renderGameGraph('game-svg', GAME_NODES, GAME_EDGES, gameState.playerPath, gameState.drawnEdges, nextNodeId);
            bindGameDragOnly();
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
    btn.disabled    = gameState.coinUsesLeft <= 0;
    btn.textContent = `◈ LANZAR MONEDA (${gameState.coinUsesLeft})`;
}

// FIX 2: renderAttemptDisplay ahora usa getHintLevel para mostrar
// al jugador qué nivel de ayuda tiene disponible en el intento actual.
function renderAttemptDisplay() {
    const display = document.getElementById('attempt-display');
    if (!display) return;

    const level      = getHintLevel(missionState.currentAttempt);
    const hintLabels = { full: 'COMPLETA', partial: 'PARCIAL', none: 'NINGUNA' };
    const hintColors = { full: '#00ff41',  partial: '#ffa500',  none: '#ff4455' };
    const hintLabel  = hintLabels[level] || '—';
    const hintColor  = hintColors[level] || '#aaa';

    display.innerHTML = `
        <span>INTENTO</span>
        <span class="threshold-val">${missionState.currentAttempt} / ${missionState.maxAttempts}</span>
        <span style="font-size:10px;color:${hintColor};margin-top:4px;letter-spacing:.05em;">
            PISTA MONEDA: ${hintLabel}
        </span>
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
        btn.disabled    = false;
        btn.textContent = '↺ JUGAR DE NUEVO';
        return;
    }

    const hasAttempts = missionState.currentAttempt < missionState.maxAttempts;
    btn.disabled    = !hasAttempts;
    btn.textContent = hasAttempts
        ? `↺ INTENTAR DE NUEVO (${missionState.maxAttempts - missionState.currentAttempt} RESTANTES)`
        : 'SIN INTENTOS RESTANTES';
}

// ── ARRANCAR ─────────────────────────────────────────────────
init();
