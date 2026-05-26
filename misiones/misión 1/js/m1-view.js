/*
   View de Mision 1.

   Este archivo dibuja pantallas, grafos, paneles y mensajes.
   No decide si una jugada es correcta.
   Controller le dice que debe mostrar.
*/
const View = (() => {

    // ── Pantallas ────────────────────────────────────────────────────
    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
        document.getElementById('game-ui').classList.remove('active');

        const labels = {
            'screen-intro':      'FASE: NARRATIVA',
            'screen-tutorial':   'FASE: TUTORIAL',
            'screen-timeline':   'FASE: ANÁLISIS BFS',
            'screen-accusation': 'FASE: ACUSACIÓN',
            'screen-end':        'FASE: RESULTADO'
        };
        document.getElementById('footer-phase').textContent = labels[id] || '—';
    }

    function showGame(phase) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('game-ui').classList.add('active');
        document.getElementById('footer-phase').textContent = phase === 'bfs'
            ? 'FASE: INVESTIGACIÓN BFS' : 'FASE: RASTREO DFS';
        document.getElementById('algo-badge').innerHTML =
            `<span class="dot dot-green"></span>FASE: ${phase.toUpperCase()}`;
    }

    // ── Grafo SVG (juego principal) ──────────────────────────────────
    function renderGraph(phase, onNodeClick) {
        const svg = document.getElementById('svg-game');
        const W = svg.clientWidth || 800, H = svg.clientHeight || 520;
        svg.innerHTML = '';

        const { GRAPH, state } = Model;
        const st = state[phase];

        const defs = ns('defs');
        const pat = ns('pattern'); attrs(pat,{id:'gg',width:40,height:40,patternUnits:'userSpaceOnUse'});
        const gp = ns('path'); attrs(gp,{d:'M 40 0 L 0 0 0 40',fill:'none',stroke:'#0d0f16','stroke-width':'0.5'});
        pat.appendChild(gp); defs.appendChild(pat); svg.appendChild(defs);
        const bg = ns('rect'); attrs(bg,{width:'100%',height:'100%',fill:'url(#gg)'}); svg.appendChild(bg);

        const bbox = getBBox(GRAPH.nodes);
        const sx = (W-320)/(bbox.maxX-bbox.minX||1);
        const sy = (H-280)/(bbox.maxY-bbox.minY||1);
        const sc = Math.min(sx, sy, 0.66);
        const ox = (W-(bbox.maxX-bbox.minX)*sc)/2 - bbox.minX*sc;
        const oy = (H-(bbox.maxY-bbox.minY)*sc)/2 - bbox.minY*sc + 24;
        const px = n => n.x*sc+ox, py = n => n.y*sc+oy;

        const ll = ns('g'); svg.appendChild(ll);
        GRAPH.links.forEach(([a,b]) => {
            const n1=GRAPH.nodes.find(n=>n.id===a), n2=GRAPH.nodes.find(n=>n.id===b);
            const key = edgeKey(a,b);
            const trBFS = state.bfs.traversed.includes(key);
            const trDFS = state.dfs.traversed.includes(key);

            const base = ns('line'); attrs(base,{x1:px(n1),y1:py(n1),x2:px(n2),y2:py(n2),class:'g-link-base'}); ll.appendChild(base);
            const dash = ns('line');
            let dashCls = 'g-link-dash';
            if (trDFS) dashCls += ' traversed-dfs';
            else if (trBFS) dashCls += ' traversed-bfs';
            attrs(dash,{x1:px(n1),y1:py(n1),x2:px(n2),y2:py(n2),class:dashCls}); ll.appendChild(dash);
        });

        const nl = ns('g'); svg.appendChild(nl);
        GRAPH.nodes.forEach(node => {
            const isCurrBFS = state.bfs.current === node.id;
            const isCurrDFS = state.dfs.current === node.id;
            const visitedBFS = state.bfs.visited.includes(node.id);
            const visitedDFS = state.dfs.visited.includes(node.id);
            const inStruct = st.stack !== undefined
                ? st.stack.includes(node.id)
                : st.queue !== undefined ? st.queue.includes(node.id) : false;

            let isValidNext = false;
            if (phase === 'bfs' && st.queue && st.queue.length > 0) isValidNext = st.queue[0] === node.id;
            if (phase === 'dfs' && st.stack && st.stack.length > 0) isValidNext = st.stack[st.stack.length-1] === node.id;

            let cls = 'g-node';
            if (phase === 'bfs') {
                if (isCurrBFS) cls += ' current';
                else if (visitedBFS) cls += ' visited-bfs';
                else cls += ' infected';
                if (isValidNext && !isCurrBFS) cls += ' valid-next';
            } else {
                if (visitedDFS) {
                    const sus = Model.state.dfs.suspicion[node.id] || 0;
                    cls += sus >= 70 ? ' suspect' : ' cleared';
                    if (isCurrDFS) cls = 'g-node current-dfs';
                } else if (visitedBFS) {
                    cls += ' mapped-bfs';
                }
                else cls += ' infected';
                if (isValidNext && !isCurrDFS) cls += ' valid-next';
            }

            const g = ns('g'); g.setAttribute('class', cls);
            g.setAttribute('transform', `translate(${px(node)},${py(node)})`);

            const outer = ns('circle'); attrs(outer,{r:42,class:'g-node-outer'});
            const body  = ns('circle'); attrs(body,{r:30,class:'g-node-body'});

            const tNum = ns('text');
            attrs(tNum,{class:'g-node-num','text-anchor':'middle',x:'30.5',y:'-27.5'});
            tNum.textContent = node.id;

            const tName = ns('text');
            attrs(tName,{class:'g-node-name','text-anchor':'middle',dy:'4'});
            const shortName = node.name.split('.')[1] || node.name;
            tName.textContent = shortName.length > 6 ? shortName.slice(0,5)+'.' : shortName;

            const tSub = ns('text');
            attrs(tSub,{class:'g-node-sub','text-anchor':'middle',dy:'24'});
            tSub.textContent = visitedBFS ? '✓' : '·';

            g.appendChild(outer); g.appendChild(body);
            g.appendChild(tNum);
            g.appendChild(tName); g.appendChild(tSub);
            g.addEventListener('click', () => onNodeClick(node.id));
            nl.appendChild(g);
        });
    }

    // ================================================================
    //  TUTORIAL VIEW
    // ================================================================

    // Muestra el overlay de concepto antes de cada fase del tutorial
    function showConceptOverlay(phase) {
        const overlay = document.getElementById('tut-concept-overlay');
        const isB = phase === 'bfs';
        document.getElementById('tco-tag').textContent  = isB ? '// FASE 1 — TUTORIAL' : '// FASE 2 — TUTORIAL';
        document.getElementById('tco-title').textContent    = isB ? 'BFS' : 'DFS';
        document.getElementById('tco-subtitle').textContent = isB ? 'Búsqueda en Anchura (Breadth-First Search)' : 'Búsqueda en Profundidad (Depth-First Search)';
        document.getElementById('tco-body').innerHTML = isB
            ? `BFS explora la red <span style="color:var(--green)">nivel por nivel</span>.<br>
               Imagina que lanzas una piedra al agua: las olas se expanden en círculos.<br>
               Primero visita todos los vecinos directos, luego los vecinos de esos vecinos, y así.<br><br>
               <span style="color:var(--amber)">Estructura usada: COLA (FIFO)</span><br>
               El primero que entra a la cola es el primero en ser visitado.`
            : `DFS explora la red <span style="color:var(--amber)">por profundidad</span>.<br>
               Imagina seguir un laberinto: avanzas por un camino hasta el fondo,<br>
               y solo retrocedes cuando ya no hay hacia dónde ir.<br><br>
               <span style="color:var(--green)">Estructura usada: PILA (LIFO)</span><br>
               El último que entra a la pila es el primero en ser visitado.`;
        document.getElementById('tco-analogy').textContent = isB
            ? '💡 Analogía: Notificaciones en redes sociales — el acoso se expande primero a los contactos directos, luego a los contactos de esos contactos.'
            : '💡 Analogía: Rastrear una cadena de mensajes — sigues el hilo más profundo hasta encontrar al origen.';
        overlay.classList.add('visible');
    }

    function hideConceptOverlay() {
        document.getElementById('tut-concept-overlay').classList.remove('visible');
    }

    // Renderiza el grafo de 5 nodos del tutorial
    function renderTutorialGraph(phase, onNodeClick) {
        const svg = document.getElementById('svg-tutorial');
        const W = svg.clientWidth || 800, H = svg.clientHeight || 480;
        svg.innerHTML = '';

        const { TUT_GRAPH, tutorialState, getTutorialStep } = Model;
        const st   = tutorialState[phase];
        const step = getTutorialStep();

        // Fondo grillado
        const defs = ns('defs');
        const pat = ns('pattern'); attrs(pat,{id:'tgg',width:40,height:40,patternUnits:'userSpaceOnUse'});
        const gp = ns('path'); attrs(gp,{d:'M 40 0 L 0 0 0 40',fill:'none',stroke:'#0d0f16','stroke-width':'0.5'});
        pat.appendChild(gp); defs.appendChild(pat); svg.appendChild(defs);
        const bg = ns('rect'); attrs(bg,{width:'100%',height:'100%',fill:'url(#tgg)'}); svg.appendChild(bg);

        // Escala y centrado
        const bbox = getBBox(TUT_GRAPH.nodes);
        const sx = (W-160)/(bbox.maxX-bbox.minX||1);
        const sy = (H-180)/(bbox.maxY-bbox.minY||1);
        const sc = Math.min(sx, sy, 1.1);
        const ox = (W-(bbox.maxX-bbox.minX)*sc)/2 - bbox.minX*sc;
        const oy = (H-(bbox.maxY-bbox.minY)*sc)/2 - bbox.minY*sc + 20;
        const px = n => n.x*sc+ox, py = n => n.y*sc+oy;

        // Aristas
        const ll = ns('g'); svg.appendChild(ll);
        TUT_GRAPH.links.forEach(([a,b]) => {
            const n1 = TUT_GRAPH.nodes.find(n=>n.id===a);
            const n2 = TUT_GRAPH.nodes.find(n=>n.id===b);
            const key = edgeKey(a,b);

            const trBFS = tutorialState.bfs.traversed.includes(key);
            const trDFS = tutorialState.dfs.traversed.includes(key);

            const base = ns('line');
            attrs(base,{x1:px(n1),y1:py(n1),x2:px(n2),y2:py(n2),class:'g-link-base'});
            ll.appendChild(base);

            const dash = ns('line');
            let dashCls = 'g-link-dash';
            if (trDFS)      dashCls += ' traversed-dfs';
            else if (trBFS) dashCls += ' traversed-bfs';
            attrs(dash,{x1:px(n1),y1:py(n1),x2:px(n2),y2:py(n2),class:dashCls});
            ll.appendChild(dash);
        });

        // Nodos
        const nl = ns('g'); svg.appendChild(nl);
        TUT_GRAPH.nodes.forEach(node => {
            const isCurr    = st.current === node.id;
            const visited   = st.visited.includes(node.id);
            const isHighlight = step && step.highlight && step.highlight.includes(node.id);

            let isValidNext = false;
            if (phase === 'bfs' && st.queue && st.queue.length > 0)
                isValidNext = st.queue[0] === node.id;
            if (phase === 'dfs' && st.stack && st.stack.length > 0)
                isValidNext = st.stack[st.stack.length-1] === node.id;

            let cls = 'g-node';
            if (isCurr)          cls += ' current';
            else if (visited)    cls += ' visited-bfs';
            else if (isHighlight) cls += ' valid-next';
            else                  cls += ' infected';

            const g = ns('g');
            g.setAttribute('class', cls);
            g.setAttribute('id', `tut-node-${node.id}`);
            g.setAttribute('transform', `translate(${px(node)},${py(node)})`);

            const outer = ns('circle'); attrs(outer,{r:38,class:'g-node-outer'});
            const body  = ns('circle'); attrs(body,{r:28,class:'g-node-body'});

            const tNum = ns('text');
            attrs(tNum,{class:'g-node-num','text-anchor':'middle',x:'29',y:'-26'});
            tNum.textContent = node.id;

            const tName = ns('text');
            attrs(tName,{class:'g-node-name','text-anchor':'middle',dy:'4'});
            tName.textContent = node.name;

            const tSub = ns('text');
            attrs(tSub,{class:'g-node-sub','text-anchor':'middle',dy:'24'});
            tSub.textContent = visited ? '✓' : '·';

            g.appendChild(outer); g.appendChild(body);
            g.appendChild(tNum);
            g.appendChild(tName); g.appendChild(tSub);
            g.addEventListener('click', () => onNodeClick(node.id));
            nl.appendChild(g);
        });
    }

    // Flash rojo en nodo incorrecto (sin penalización)
    function flashInvalidTutorial(nodeId) {
        const el = document.getElementById(`tut-node-${nodeId}`);
        if (!el) return;
        el.classList.add('invalid');
        setTutorialLog(`⚠ Ese no es el siguiente paso. Observa la ${Model.tutorialState.phase === 'bfs' ? 'COLA' : 'PILA'} en el panel.`);
        setTimeout(() => el.classList.remove('invalid'), 800);
    }

    // Actualiza el panel lateral del tutorial
    function updateTutorialPanel() {
        const { tutorialState, getTutorialStep, getTotalTutorialSteps, getTutorialProgressIndex, TUT_GRAPH } = Model;
        const phase = tutorialState.phase;
        const isB   = phase === 'bfs';
        const st    = tutorialState[phase];
        const step  = getTutorialStep();

        // Nombre de fase y descripción
        document.getElementById('tut-phase-name').textContent = isB ? 'BFS — PROPAGACIÓN POR NIVELES' : 'DFS — RASTREO EN PROFUNDIDAD';
        document.getElementById('tut-phase-desc').textContent = isB
            ? 'Recorre nivel por nivel usando una Cola (FIFO).'
            : 'Sigue la cadena más profunda con una Pila (LIFO).';

        // Concepto del paso actual
        if (step) {
            document.getElementById('tut-concept-box').textContent = step.concept || '—';
        }

        // Estructura activa
        document.getElementById('tut-struct-label').textContent = isB ? 'COLA (FIFO) — próximo: primero' : 'PILA (LIFO) — próximo: último';
        const structEl = document.getElementById('tut-struct');
        structEl.innerHTML = '';
        const arr   = isB ? (st.queue || []) : (st.stack || []);
        const topId = isB
            ? (arr.length > 0 ? arr[0]            : null)
            : (arr.length > 0 ? arr[arr.length-1] : null);
        arr.forEach(id => {
            const d = document.createElement('div');
            d.className = 'struct-item-game' + (id === topId ? ' top' : '');
            const user = TUT_GRAPH.nodes.find(n => n.id === id);
            d.textContent = user ? user.name : id;
            structEl.appendChild(d);
        });

        // Visitados
        document.getElementById('tut-visited-count').textContent = st.visited.length;
        const vEl = document.getElementById('tut-visited-list');
        vEl.innerHTML = '';
        st.visited.forEach(id => {
            const d = document.createElement('div');
            d.className = 'visited-tag';
            const user = TUT_GRAPH.nodes.find(n => n.id === id);
            d.textContent = user ? user.name : id;
            vEl.appendChild(d);
        });

        // Progreso
        const current = getTutorialProgressIndex() + 1;
        const total   = getTotalTutorialSteps();
        const pct     = Math.round((current / total) * 100);
        document.getElementById('tut-progress-fill').style.width = pct + '%';
        document.getElementById('tut-progress-label').textContent = `PASO ${current} / ${total}`;

        // Tabs
        document.getElementById('tut-tab-bfs').className = 'phase-tab' + (isB ? ' active' : ' done');
        document.getElementById('tut-tab-dfs').className = 'phase-tab' + (!isB ? ' active' : '');
        document.getElementById('tut-phase-bar-fill').style.width = isB ? '50%' : '100%';
        document.getElementById('tut-inst-phase').textContent = isB ? 'BFS ▸' : 'DFS ▸';
    }

    function setTutorialInstruction(text) {
        document.getElementById('tut-inst-text').textContent = text;
    }

    function setTutorialLog(msg) {
        document.getElementById('tut-log-box').textContent = msg || '_';
    }

    // Fin del tutorial — muestra mensaje y botón para continuar al juego
    function showTutorialComplete() {
        const overlay = document.getElementById('tut-concept-overlay');
        document.getElementById('tco-tag').textContent     = '// TUTORIAL COMPLETADO';
        document.getElementById('tco-title').textContent   = '¡BIEN HECHO!';
        document.getElementById('tco-subtitle').textContent = 'Ya conoces BFS y DFS.';
        document.getElementById('tco-body').innerHTML =
            `Practicaste los dos algoritmos en un grafo pequeño.<br><br>
             Ahora te enfrentarás a la red real con <span style="color:var(--red)">9 nodos comprometidos</span>.<br>
             Recuerda:<br>
             <span style="color:var(--green)">BFS → Cola → por niveles</span><br>
             <span style="color:var(--amber)">DFS → Pila → en profundidad</span>`;
        document.getElementById('tco-analogy').textContent = '¡Encuentra quién inició el acoso!';
        document.getElementById('btn-tco-continue').textContent = 'INICIAR MISIÓN REAL →';
        overlay.classList.add('visible');
    }

    // ── Resto de funciones View (sin cambios) ────────────────────────

    function renderAccusationGrid(onAccuse) {
        const grid = document.getElementById('acc-grid');
        grid.innerHTML = '';
        Model.USERS.forEach(user => {
            const sus = Model.state.dfs.suspicion[user.id] || 30;
            const card = document.createElement('div');
            card.className = 'acc-card' + (Model.state.bfs.visited.includes(user.id) ? ' visited-mark' : '');
            card.innerHTML = `
                <div class="acc-card-num">NODO ${user.id}</div>
                <div class="acc-card-name">${user.name}</div>
                <div class="acc-card-sus">SOSPECHA: ${sus}%</div>
                <div class="acc-card-sus-bar"><div class="acc-card-sus-fill" style="width:${sus}%"></div></div>
                <div class="acc-card-sus">${Model.getEvidence(user.id).clue}</div>
            `;
            card.addEventListener('click', () => onAccuse(user.id));
            grid.appendChild(card);
        });
    }

    function renderTimeline(visitOrder) {
        const container = document.getElementById('tl-container');
        container.innerHTML = '';
        visitOrder.forEach((id, idx) => {
            const user = Model.getUser(id);
            const ev   = Model.getEvidence(id);
            const adj  = Model.ADJ[id];
            const item = document.createElement('div');
            item.className = 'tl-item';
            item.style.animationDelay = `${idx * 0.08}s`;
            item.innerHTML = `
                <div class="tl-step">${idx+1}</div>
                <div class="tl-content">
                    <div class="tl-content-header">
                        <div class="tl-node-name">${user.name} <span style="color:var(--text-muted);font-size:9px">@${user.alias}</span></div>
                    </div>
                    <div class="tl-evidence">${ev.pub}</div>
                    <div class="tl-evidence">${ev.trace}</div>
                    <div class="tl-connections">Pista: <span>${ev.clue}</span></div>
                    <div class="tl-connections">Conectado con: <span>${adj.map(i=>Model.getUser(i).name).join(', ')}</span></div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    function showEvidence(id, phase) {
        const ev   = Model.getEvidence(id);
        const user = Model.getUser(id);
        document.getElementById('ev-user').textContent     = user.name + ' (@' + user.alias + ')';
        document.getElementById('ev-priv').textContent     = ev.priv;
        document.getElementById('ev-pub').textContent      = `${ev.pub} ${ev.trace} Pista: ${ev.clue}`;
        const susBar = document.getElementById('sus-bar');
        if (phase === 'dfs') {
            const sus = Model.state.dfs.suspicion[id] || 30;
            susBar.style.display = 'block';
            document.getElementById('sus-val').textContent = sus + '%';
            document.getElementById('sus-fill').style.width = sus + '%';
        } else {
            susBar.style.display = 'none';
        }
        document.getElementById('evidence-panel').classList.add('visible');
    }

    function updatePanel(phase) {
        const st = Model.state[phase];
        const isB = phase === 'bfs';
        document.getElementById('ui-algo').textContent    = isB ? 'BFS — Cola (FIFO)' : 'DFS — Pila (LIFO)';
        document.getElementById('ui-lives').textContent   = '❤'.repeat(Math.max(0, st.lives));
        document.getElementById('ui-struct-label').textContent = isB
            ? 'COLA (FIFO) — próximo: primero'
            : 'PILA (LIFO) — próximo: último';
        document.getElementById('ui-current').textContent = st.current
            ? Model.getUser(st.current).name
            : '— Selecciona inicio';
        document.getElementById('ui-visited-count').textContent = st.visited.length;
        const structEl = document.getElementById('ui-struct');
        structEl.innerHTML = '';
        const topId = isB
            ? (st.queue  && st.queue.length  > 0 ? st.queue[0]                     : null)
            : (st.stack  && st.stack.length  > 0 ? st.stack[st.stack.length-1]     : null);
        const arr = isB ? (st.queue || []) : (st.stack || []);
        arr.forEach(id => {
            const d = document.createElement('div');
            d.className = 'struct-item-game' + (id === topId ? ' top' : '');
            d.textContent = Model.getUser(id).name.split('.')[1] || id;
            structEl.appendChild(d);
        });
        const vEl = document.getElementById('ui-visited-list');
        vEl.innerHTML = '';
        st.visited.forEach(id => {
            const d = document.createElement('div');
            d.className = 'visited-tag';
            d.textContent = Model.getUser(id).name;
            vEl.appendChild(d);
        });
        document.getElementById('sp-phase-name').textContent = isB ? 'BFS — PROPAGACIÓN' : 'DFS — RASTREO';
        document.getElementById('sp-phase-desc').textContent = isB
            ? 'Recorre por niveles. Mapea cómo se expandió el acoso.'
            : 'Profundiza en las cadenas. Identifica al origen.';
        document.getElementById('phase-bar-fill').style.width = isB ? '50%' : '100%';
        document.getElementById('tab-bfs').className = 'phase-tab' + (isB ? ' active' : ' done');
        document.getElementById('tab-dfs').className = 'phase-tab' + (!isB ? ' active' : '');
        document.getElementById('inst-phase').textContent = isB ? 'BFS ▸' : 'DFS ▸';
    }

    function updateCpuPanel() {
        const cpu = Model.state.cpu;
        const panel = document.getElementById('cpu-rival-panel');
        if (!panel || !cpu) return;
        panel.dataset.pressure = cpu.pressure || 'stable';
        document.getElementById('cpu-progress-val').textContent = `${cpu.progress}%`;
        document.getElementById('cpu-progress-fill').style.width = `${cpu.progress}%`;
        document.getElementById('cpu-action-log').textContent = cpu.lastAction;
    }

    function setLog(msg, clear) {
        const el = document.getElementById('log-box');
        el.textContent = clear ? '_' : msg;
    }
    function setInstruction(text) {
        document.getElementById('inst-text').textContent = text;
    }
    function showEndScreen(win, originUser, detail, msg, titleOverride) {
        showScreen('screen-end');
        const t = document.getElementById('end-title');
        t.textContent  = titleOverride || (win ? '¡SISTEMA RESTAURADO!' : 'ACUSACIÓN FALLIDA');
        t.style.color  = win ? 'var(--green)' : 'var(--red)';
        const rev = document.getElementById('end-reveal');
        rev.className  = 'end-reveal' + (win ? ' win' : '');
        document.getElementById('end-name').textContent   = originUser.name + ' — @' + originUser.alias;
        document.getElementById('end-detail').textContent = detail;
        document.getElementById('end-msg').textContent    = msg;
    }

    // ── Helpers ──────────────────────────────────────────────────────
    function ns(tag)   { return document.createElementNS("http://www.w3.org/2000/svg", tag); }
    function attrs(el, a) { Object.entries(a).forEach(([k,v])=>el.setAttribute(k,String(v))); }
    function getBBox(nodes) {
        return { minX:Math.min(...nodes.map(n=>n.x)), maxX:Math.max(...nodes.map(n=>n.x)),
                 minY:Math.min(...nodes.map(n=>n.y)), maxY:Math.max(...nodes.map(n=>n.y)) };
    }
    function edgeKey(a,b) { return [a,b].sort().join('-'); }

    return {
        // Juego principal
        showScreen, showGame, renderGraph, renderAccusationGrid, renderTimeline,
        showEvidence, updatePanel, updateCpuPanel, setLog, setInstruction, showEndScreen, edgeKey,
        // Tutorial
        showConceptOverlay, hideConceptOverlay,
        renderTutorialGraph, updateTutorialPanel,
        setTutorialInstruction, setTutorialLog,
        flashInvalidTutorial, showTutorialComplete
    };
})();
