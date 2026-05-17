/*
   View de Mision 2.

   Este archivo se encarga de renderizar.
   Dibuja grafos SVG, HUD, barras, modales, popups y efectos.
   No decide si una ruta es correcta.
*/

// --- Pantallas ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}
 
// ── GRAFO SVG GENÉRICO (tutorial) ───────────────────────────
function renderGraph(svgId, nodes, edges, highlightPath, visitedNodes, currentNode) {
    const svg = document.getElementById(svgId);
    svg.innerHTML = '';
 
    edges.forEach(edge => {
        const n1 = nodes.find(n => n.id === edge.from);
        const n2 = nodes.find(n => n.id === edge.to);
        if (!n1 || !n2) return;
        const isOnPath = highlightPath && isEdgeOnPath(edge, highlightPath);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", n1.x); line.setAttribute("y1", n1.y);
        line.setAttribute("x2", n2.x); line.setAttribute("y2", n2.y);
        line.setAttribute("class", `edge ${isOnPath ? 'edge-path' : ''}`);
        svg.appendChild(line);
 
        const mx = (n1.x + n2.x) / 2;
        const my = (n1.y + n2.y) / 2;
        const wRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        wRect.setAttribute("x", mx - 11); wRect.setAttribute("y", my - 10);
        wRect.setAttribute("width", "22"); wRect.setAttribute("height", "18");
        wRect.setAttribute("class", `weight-bg ${isOnPath ? 'weight-bg-path' : ''}`);
        svg.appendChild(wRect);
 
        const wText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        wText.setAttribute("x", mx); wText.setAttribute("y", my + 4);
        wText.setAttribute("class", `weight-label ${isOnPath ? 'weight-label-path' : ''}`);
        wText.textContent = edge.weight;
        svg.appendChild(wText);
    });
 
    nodes.forEach(node => {
        const isVisited = visitedNodes && visitedNodes.includes(node.id);
        const isCurrent = currentNode === node.id;
        const isTarget  = node.id === TARGET_NODE;
        const isOnPath  = highlightPath && highlightPath.includes(node.id);
 
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", `node-g ${isVisited?'node-visited':''} ${isCurrent?'node-current':''} ${isTarget?'node-target':''} ${isOnPath?'node-path':''}`);
        g.setAttribute("transform", `translate(${node.x},${node.y})`);
        g.setAttribute("data-id", node.id);
 
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", "28");
        circle.setAttribute("class", "node-circle");
 
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("class", "node-label");
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dy", "-6");
        label.textContent = node.id;
 
        const sublabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        sublabel.setAttribute("class", "node-sublabel");
        sublabel.setAttribute("text-anchor", "middle");
        sublabel.setAttribute("dy", "10");
        sublabel.textContent = node.label;
 
        g.appendChild(circle);
        g.appendChild(label);
        g.appendChild(sublabel);
        svg.appendChild(g);
    });
}
 
function isEdgeOnPath(edge, path) {
    for (let i = 0; i < path.length - 1; i++) {
        if ((edge.from === path[i] && edge.to === path[i+1]) ||
            (edge.to === path[i] && edge.from === path[i+1])) return true;
    }
    return false;
}
 
// ── TUTORIAL STEP ───────────────────────────────────────────
function renderTutorialStep(step) {
    const el = document.getElementById('tut-step-text');
    if (el) el.textContent = step.text;
 
    const distEl = document.getElementById('tut-distances');
    if (distEl && step.distances) {
        distEl.innerHTML = '';
        Object.entries(step.distances).forEach(([node, dist]) => {
            const row = document.createElement('div');
            row.className = `dist-row ${step.current === node ? 'dist-current' : ''}`;
            row.innerHTML = `<span class="dist-node">${node}</span><span class="dist-val">${dist === Infinity ? '∞' : dist}</span>`;
            distEl.appendChild(row);
        });
    }
 
    const counter = document.getElementById('step-counter');
    if (counter) counter.textContent = `PASO ${step.index + 1} / ${TUT_STEPS.length}`;
 
    const btnPrev = document.getElementById('btn-tut-prev');
    const btnNext = document.getElementById('btn-tut-next');
    if (btnPrev) btnPrev.disabled = step.index === 0;
    if (btnNext) btnNext.textContent = step.isLast ? 'COMENZAR MISIÓN →' : 'SIGUIENTE →';
}
 
// ── GRAFO DEL JUEGO (interactivo, drag) ─────────────────────
function renderGameGraph(svgId, nodes, edges, playerPath, drawnEdges, hintNodeId) {
    const svg = document.getElementById(svgId);
    svg.innerHTML = '';
 
    // Color por peso (riesgo)
    function edgeColor(w) {
        if (w <= 3)  return '#00ff41';   // seguro
        if (w <= 6)  return '#ffa500';   // moderado
        return '#ff4455';                // peligroso
    }
 
    // Aristas base
    edges.forEach(edge => {
        const n1 = nodes.find(n => n.id === edge.from);
        const n2 = nodes.find(n => n.id === edge.to);
        if (!n1 || !n2) return;
 
        const isDrawn = drawnEdges && drawnEdges.some(e =>
            (e.from === edge.from && e.to === edge.to) ||
            (e.from === edge.to   && e.to === edge.from));
 
        const col = edgeColor(edge.weight);
 
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", n1.x); line.setAttribute("y1", n1.y);
        line.setAttribute("x2", n2.x); line.setAttribute("y2", n2.y);
        line.setAttribute("stroke", isDrawn ? col : 'rgba(48,54,61,0.9)');
        line.setAttribute("stroke-width", isDrawn ? "3" : "1.5");
        if (isDrawn) line.setAttribute("filter", `drop-shadow(0 0 4px ${col})`);
        svg.appendChild(line);
 
        // Badge de peso con color de riesgo
        const mx = (n1.x + n2.x) / 2;
        const my = (n1.y + n2.y) / 2;
        const wRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        wRect.setAttribute("x", mx - 11); wRect.setAttribute("y", my - 10);
        wRect.setAttribute("width", "22"); wRect.setAttribute("height", "18");
        wRect.setAttribute("rx", "3");
        wRect.setAttribute("fill", "#1c2128");
        wRect.setAttribute("stroke", col);
        wRect.setAttribute("stroke-width", "1");
        svg.appendChild(wRect);
 
        const wText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        wText.setAttribute("x", mx); wText.setAttribute("y", my + 4);
        wText.setAttribute("fill", col);
        wText.setAttribute("font-family", "var(--font-mono)");
        wText.setAttribute("font-size", "10");
        wText.setAttribute("text-anchor", "middle");
        wText.textContent = edge.weight;
        svg.appendChild(wText);
    });
 
    // Nodos
    nodes.forEach(node => {
        const isInPath = playerPath && playerPath.includes(node.id);
        const isTarget = node.id === TARGET_NODE;
        const isSource = node.id === GAME_SOURCE;
        const isHint   = node.id === hintNodeId;
 
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("transform", `translate(${node.x},${node.y})`);
        g.setAttribute("data-id", node.id);
        g.setAttribute("class", `node-g game-node ${isInPath?'node-path':''} ${isTarget?'node-target':''} ${isSource?'node-source':''} ${isHint?'node-hint':''}`);
        g.style.cursor = 'grab';
 
        // Anillo exterior (solo si es hint)
        if (isHint) {
            const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            ring.setAttribute("r", "36");
            ring.setAttribute("fill", "none");
            ring.setAttribute("stroke", "#00ff41");
            ring.setAttribute("stroke-width", "2");
            ring.setAttribute("stroke-dasharray", "6 3");
            ring.setAttribute("class", "hint-ring");
            g.appendChild(ring);
        }
 
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", "26");
        circle.setAttribute("class", "node-circle");
        g.appendChild(circle);
 
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("class", "node-label");
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dy", "-5");
        label.textContent = node.id;
        g.appendChild(label);
 
        const sublabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        sublabel.setAttribute("class", "node-sublabel");
        sublabel.setAttribute("text-anchor", "middle");
        sublabel.setAttribute("dy", "10");
        sublabel.textContent = node.label;
        g.appendChild(sublabel);
 
        svg.appendChild(g);
    });
 
    // Línea de arrastre temporal (se actualiza en mousemove)
    const dragLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    dragLine.id = 'drag-line';
    dragLine.setAttribute("stroke", "rgba(0,255,65,0.4)");
    dragLine.setAttribute("stroke-width", "2");
    dragLine.setAttribute("stroke-dasharray", "6 4");
    dragLine.setAttribute("display", "none");
    svg.appendChild(dragLine);
}
 
// ── HUD: ESCUDO (comentado) ────────────────────────────────
// La barra de escudo ya no se usa. El juego decide por RISK_THRESHOLD.
// function renderShield(hp, maxHp) {
//     const pct = Math.max(0, hp / maxHp * 100);
//     let color = '#00ff41';
//     if (pct < 60) color = '#ffa500';
//     if (pct < 30) color = '#ff4455';
//     const bar  = document.getElementById('shield-bar-fill');
//     const text = document.getElementById('shield-hp-text');
//     if (bar)  { bar.style.width = pct + '%'; bar.style.background = color; }
//     if (text) text.textContent = `${hp} / ${maxHp}`;
// }
 
// ── HUD: MONEDA ──────────────────────────────────────────────
function renderCoin(usesLeft, max) {
    const container = document.getElementById('coin-slots');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < max; i++) {
        const slot = document.createElement('div');
        slot.className = `coin-slot ${i < usesLeft ? 'coin-available' : 'coin-spent'}`;
        slot.textContent = i < usesLeft ? '◈' : '◇';
        container.appendChild(slot);
    }
}
 
// ── HUD: RUTA ACTUAL ─────────────────────────────────────────
function renderPathDisplay(path, totalRisk, threshold) {
    const el   = document.getElementById('path-display');
    const risk = document.getElementById('risk-display');
    if (el)   el.textContent  = path.length ? path.join(' → ') : '— sin ruta —';
    if (risk) {
        risk.textContent = `RIESGO: ${totalRisk}`;
        risk.className   = 'risk-display ' + (totalRisk > threshold ? 'risk-danger' : totalRisk > threshold * 0.6 ? 'risk-warn' : 'risk-ok');
    }
}
 
// ── EFECTO DAÑO (desactivado — ligado al escudo) ─────────────
// function triggerDamageFlash() {
//     const overlay = document.getElementById('damage-overlay');
//     if (!overlay) return;
//     overlay.classList.remove('damage-flash');
//     void overlay.offsetWidth;
//     overlay.classList.add('damage-flash');
// }
 
// ── SONIDO DE DAÑO (desactivado — ligado al escudo) ──────────
var _audioCtx = null;
// function playDamageSound() {
//     try {
//         if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
//         const ctx = _audioCtx;
//         const osc  = ctx.createOscillator();
//         const gain = ctx.createGain();
//         osc.connect(gain);
//         gain.connect(ctx.destination);
//         osc.type = 'sawtooth';
//         osc.frequency.setValueAtTime(220, ctx.currentTime);
//         osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.18);
//         gain.gain.setValueAtTime(0.35, ctx.currentTime);
//         gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
//         osc.start(ctx.currentTime);
//         osc.stop(ctx.currentTime + 0.22);
//     } catch(e) {}
// }
 
// ── SONIDO MONEDA (tono corto de "lanzamiento") ─────────────
function playCoinSound(success) {
    try {
        if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = _audioCtx;
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
 
        osc.type = 'sine';
        if (success) {
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        } else {
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
        }
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
    } catch(e) {}
}
 
// ── SONIDO VICTORIA ──────────────────────────────────────────
function playWinSound() {
    try {
        if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = _audioCtx;
        [523, 659, 784, 1047].forEach((freq, i) => {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
            osc.start(ctx.currentTime + i * 0.12);
            osc.stop(ctx.currentTime + i * 0.12 + 0.35);
        });
    } catch(e) {}
}
 
// ── ANIMACIÓN HINT NODO (destello verde) ────────────────────
function flashHintNode(nodeId, svgId) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const g = svg.querySelector(`[data-id="${nodeId}"]`);
    if (!g) return;
    g.classList.add('node-hint-flash');
    setTimeout(() => g.classList.remove('node-hint-flash'), 1200);
}
 
// ── ANIMACIÓN MONEDA (modal overlay) ────────────────────────
function showCoinAnimation(success, nextNodeLabel, onDone) {
    const modal = document.getElementById('coin-modal');
    const face  = document.getElementById('coin-face');
    const msg   = document.getElementById('coin-msg');
    if (!modal || !face || !msg) { onDone && onDone(); return; }
 
    modal.classList.remove('hidden');
    face.textContent = '◈';
    face.className   = 'coin-spinning';
    msg.textContent  = 'LANZANDO...';
 
    setTimeout(() => {
        face.className  = success ? 'coin-heads' : 'coin-tails';
        face.textContent = success ? '✦ CARA' : '✕ CRUZ';
        msg.textContent  = success
            ? `SIGUIENTE NODO REVELADO: ${nextNodeLabel}`
            : 'SIN PISTA — LA SUERTE NO ESTUVO DE TU LADO';
        msg.className = success ? 'coin-msg-success' : 'coin-msg-fail';
 
        setTimeout(() => {
            modal.classList.add('hidden');
            onDone && onDone();
        }, 1800);
    }, 900);
}
 
// ── MODAL FIN DE JUEGO ───────────────────────────────────────
function showEndModal(win, totalRisk, path) {
    const modal    = document.getElementById('end-modal');
    const title    = document.getElementById('end-title');
    const subtitle = document.getElementById('end-subtitle');
    const detail   = document.getElementById('end-detail');
    if (!modal) return;
 
    if (win) {
        title.textContent    = '// RED SEGURA';
        title.className      = 'end-title win';
        subtitle.textContent = 'INTERVENCIÓN COMPLETADA';
        detail.textContent   = `Ruta: ${path.join(' → ')}  |  Riesgo total: ${totalRisk}`;
        playWinSound();
    } else {
        title.textContent    = '// SISTEMA COMPROMETIDO';
        title.className      = 'end-title lose';
        subtitle.textContent = 'LA TOXICIDAD SE PROPAGÓ';
        detail.textContent   = totalRisk > 0
            ? `Ruta demasiado peligrosa (riesgo: ${totalRisk} > umbral: ${RISK_THRESHOLD})`
            : 'El escudo se agotó antes de llegar.';
    }
 
    modal.classList.remove('hidden');
}
 
// ── POP-UPS ANCLADOS (tutorial) ─────────────────────────────
var _popupTimeout = null;
 
function showTutPopup(popupData, nodes, svgId) {
    clearTutPopup();
    if (!popupData) return;
    const node = nodes.find(n => n.id === popupData.anchorNode);
    if (!node) return;
    const svg = document.getElementById(svgId);
    if (!svg) return;
    _popupTimeout = setTimeout(() => _renderPopup(popupData, node, svg), 400);
}
 
function _renderPopup(popupData, node, svg) {
    const svgRect = svg.getBoundingClientRect();
    const vb      = svg.viewBox.baseVal;
    const scaleX  = svgRect.width  / vb.width;
    const scaleY  = svgRect.height / vb.height;
 
    const nodeScreenX = svgRect.left + node.x * scaleX;
    const nodeScreenY = svgRect.top  + node.y * scaleY;
 
    const PW = 220, PH = 90, GAP = 44;
    const NODE_R = 28 * Math.min(scaleX, scaleY);
 
    let popX, popY, connectorStart, connectorEnd;
    const off = popupData.offset;
 
    if (off === 'top') {
        popX = nodeScreenX - PW / 2;
        popY = nodeScreenY - NODE_R - GAP - PH;
        connectorStart = { x: nodeScreenX, y: nodeScreenY - NODE_R - 4 };
        connectorEnd   = { x: nodeScreenX, y: popY + PH };
    } else if (off === 'bottom') {
        popX = nodeScreenX - PW / 2;
        popY = nodeScreenY + NODE_R + GAP;
        connectorStart = { x: nodeScreenX, y: nodeScreenY + NODE_R + 4 };
        connectorEnd   = { x: nodeScreenX, y: popY };
    } else if (off === 'left') {
        popX = nodeScreenX - NODE_R - GAP - PW;
        popY = nodeScreenY - PH / 2;
        connectorStart = { x: nodeScreenX - NODE_R - 4, y: nodeScreenY };
        connectorEnd   = { x: popX + PW, y: nodeScreenY };
    } else {
        popX = nodeScreenX + NODE_R + GAP;
        popY = nodeScreenY - PH / 2;
        connectorStart = { x: nodeScreenX + NODE_R + 4, y: nodeScreenY };
        connectorEnd   = { x: popX, y: nodeScreenY };
    }
 
    const VP_PAD = 10;
    popX = Math.max(VP_PAD, Math.min(window.innerWidth  - PW - VP_PAD, popX));
    popY = Math.max(VP_PAD + 44, Math.min(window.innerHeight - PH - VP_PAD, popY));
 
    let overlay = document.getElementById('popup-overlay-svg');
    if (!overlay) {
        overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        overlay.id = 'popup-overlay-svg';
        overlay.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:299;';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = '';
 
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", connectorStart.x); dot.setAttribute("cy", connectorStart.y);
    dot.setAttribute("r", "4"); dot.setAttribute("class", "popup-connector-dot");
    overlay.appendChild(dot);
 
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", connectorStart.x); line.setAttribute("y1", connectorStart.y);
    line.setAttribute("x2", connectorEnd.x);   line.setAttribute("y2", connectorEnd.y);
    line.setAttribute("class", "popup-connector-line");
    overlay.appendChild(line);
 
    const popup = document.createElement('div');
    popup.id = 'tut-popup';
    popup.className = 'tut-popup';
    popup.style.cssText = `left:${popX}px;top:${popY}px;width:${PW}px;`;
    popup.innerHTML = `
        <button class="tut-popup-close" id="btn-popup-close" title="Cerrar">×</button>
        <span class="tut-popup-title">${popupData.title}</span>
        <p class="tut-popup-body">${popupData.body}</p>
    `;
    document.body.appendChild(popup);
    requestAnimationFrame(() => popup.classList.add('tut-popup-visible'));
    document.getElementById('btn-popup-close').addEventListener('click', clearTutPopup);
}
 
function clearTutPopup() {
    if (_popupTimeout) { clearTimeout(_popupTimeout); _popupTimeout = null; }
    const popup   = document.getElementById('tut-popup');
    const overlay = document.getElementById('popup-overlay-svg');
    if (popup) {
        popup.classList.remove('tut-popup-visible');
        popup.classList.add('tut-popup-hiding');
        setTimeout(() => popup.remove(), 250);
    }
    if (overlay) overlay.innerHTML = '';
}
 
function getHintLevel(attempt) {
    if (attempt === 1) return 'full';
    if (attempt === 2) return 'partial';
    return 'none';
}
