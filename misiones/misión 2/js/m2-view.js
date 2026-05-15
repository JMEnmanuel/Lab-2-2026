// ============================================================
// VIEW — Misión 2: Ruta Segura
// Solo renderizado y DOM. Lee del modelo, no lo modifica.
// ============================================================

// --- Pantallas ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

// --- Renderizar grafo SVG genérico ---
function renderGraph(svgId, nodes, edges, highlightPath, visitedNodes, currentNode) {
    const svg = document.getElementById(svgId);
    svg.innerHTML = '';

    // Aristas
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

        // Peso de la arista
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

    // Nodos
    nodes.forEach(node => {
        const isVisited = visitedNodes && visitedNodes.includes(node.id);
        const isCurrent = currentNode === node.id;
        const isTarget  = node.id === TARGET_NODE;
        const isOnPath  = highlightPath && highlightPath.includes(node.id);

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", `node-g ${isVisited ? 'node-visited' : ''} ${isCurrent ? 'node-current' : ''} ${isTarget ? 'node-target' : ''} ${isOnPath ? 'node-path' : ''}`);
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
            (edge.to === path[i] && edge.from === path[i+1])) {
            return true;
        }
    }
    return false;
}

// --- Panel de pasos del tutorial ---
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

    // Contador de pasos
    const counter = document.getElementById('step-counter');
    if (counter) counter.textContent = `PASO ${step.index + 1} / ${TUT_STEPS.length}`;

    // Botones
    const btnPrev = document.getElementById('btn-tut-prev');
    const btnNext = document.getElementById('btn-tut-next');
    if (btnPrev) btnPrev.disabled = step.index === 0;
    if (btnNext) btnNext.textContent = step.isLast ? 'COMENZAR MISIÓN →' : 'SIGUIENTE →';
}

// ── POP-UPS ANCLADOS AL GRAFO ──────────────────────────────

var _popupTimeout = null;

/**
 * Muestra un pop-up anclado al nodo indicado, con línea conector.
 * @param {Object} popupData  - { anchorNode, offset, title, body }
 * @param {Array}  nodes      - Array de nodos del modelo
 * @param {string} svgId      - ID del SVG contenedor
 */
function showTutPopup(popupData, nodes, svgId) {
    // Limpiar popup anterior inmediatamente
    clearTutPopup();
    if (!popupData) return;

    // Encontrar el nodo ancla
    const node = nodes.find(n => n.id === popupData.anchorNode);
    if (!node) return;

    const svg = document.getElementById(svgId);
    if (!svg) return;

    _popupTimeout = setTimeout(() => {
        _renderPopup(popupData, node, svg);
    }, 400);
}

function _renderPopup(popupData, node, svg) {
    // Obtener posición del SVG en pantalla
    const svgRect  = svg.getBoundingClientRect();
    const vb       = svg.viewBox.baseVal;
    const scaleX   = svgRect.width  / vb.width;
    const scaleY   = svgRect.height / vb.height;

    // Posición del nodo en pantalla
    const nodeScreenX = svgRect.left + node.x * scaleX;
    const nodeScreenY = svgRect.top  + node.y * scaleY;

    // Dimensiones estimadas del popup
    const PW = 220;
    const PH = 90;
    const GAP = 44; // distancia desde centro del nodo al borde del popup
    const NODE_R = 28 * Math.min(scaleX, scaleY); // radio del nodo en px pantalla

    // Calcular posición según offset
    let popX, popY, connectorStart, connectorEnd;
    const offset = popupData.offset;

    if (offset === 'top') {
        popX = nodeScreenX - PW / 2;
        popY = nodeScreenY - NODE_R - GAP - PH;
        connectorStart = { x: nodeScreenX, y: nodeScreenY - NODE_R - 4 };
        connectorEnd   = { x: nodeScreenX, y: popY + PH };
    } else if (offset === 'bottom') {
        popX = nodeScreenX - PW / 2;
        popY = nodeScreenY + NODE_R + GAP;
        connectorStart = { x: nodeScreenX, y: nodeScreenY + NODE_R + 4 };
        connectorEnd   = { x: nodeScreenX, y: popY };
    } else if (offset === 'left') {
        popX = nodeScreenX - NODE_R - GAP - PW;
        popY = nodeScreenY - PH / 2;
        connectorStart = { x: nodeScreenX - NODE_R - 4, y: nodeScreenY };
        connectorEnd   = { x: popX + PW,               y: nodeScreenY };
    } else { // right
        popX = nodeScreenX + NODE_R + GAP;
        popY = nodeScreenY - PH / 2;
        connectorStart = { x: nodeScreenX + NODE_R + 4, y: nodeScreenY };
        connectorEnd   = { x: popX,                     y: nodeScreenY };
    }

    // Clamping: mantener dentro del viewport
    const VP_PAD = 10;
    popX = Math.max(VP_PAD, Math.min(window.innerWidth  - PW - VP_PAD, popX));
    popY = Math.max(VP_PAD + 44, Math.min(window.innerHeight - PH - VP_PAD, popY));

    // Crear SVG overlay para la línea conector
    let overlay = document.getElementById('popup-overlay-svg');
    if (!overlay) {
        overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        overlay.id = 'popup-overlay-svg';
        overlay.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:299;';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = '';

    // Punto de anclaje en el nodo (pequeño círculo)
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", connectorStart.x);
    dot.setAttribute("cy", connectorStart.y);
    dot.setAttribute("r", "4");
    dot.setAttribute("class", "popup-connector-dot");
    overlay.appendChild(dot);

    // Línea conector
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", connectorStart.x);
    line.setAttribute("y1", connectorStart.y);
    line.setAttribute("x2", connectorEnd.x);
    line.setAttribute("y2", connectorEnd.y);
    line.setAttribute("class", "popup-connector-line");
    overlay.appendChild(line);

    // Crear div del popup
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

    // Animar entrada
    requestAnimationFrame(() => popup.classList.add('tut-popup-visible'));

    // Cerrar con ×
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

// --- Mensaje de ayuda según intento ---
function getHintLevel(attempt) {
    if (attempt === 1) return 'full';
    if (attempt === 2) return 'partial';
    return 'none';
}
