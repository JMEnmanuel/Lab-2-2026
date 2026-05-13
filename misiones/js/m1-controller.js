/* =================================================================
   CONTROLLER — Lógica del juego, conecta Model con View
   ================================================================= */
const Controller = (() => {

    function init() {
        // Vinculación de eventos de botones
        document.getElementById('btn-start-bfs').addEventListener('click', startBFS);
        document.getElementById('btn-reiniciar').addEventListener('click', resetGame);
        document.getElementById('btn-start-dfs').addEventListener('click', startDFS);
        document.getElementById('btn-final-reset').addEventListener('click', resetGame);

        // Reloj
        setInterval(updateClock, 1000);
        updateClock();
    }

    // ── FASE 1: BFS ──────────────────────────────────────────────────
    function startBFS() {
        Model.state.phase = 'bfs';
        View.showGame('bfs');
        View.updatePanel('bfs');
        View.renderGraph('bfs', handleNodeClickBFS);
        View.setInstruction('Haz click en cualquier nodo para iniciar. El acoso empezó en algún punto de esta red.');
    }

    function handleNodeClickBFS(id) {
        const st = Model.state.bfs;
        if (st.done) return;
        if (st.visited.length === 0) {
            visitBFS(id);
        } else {
            processStepBFS(id);
        }
    }

    function processStepBFS(id) {
        const st = Model.state.bfs;
        const validNext = st.queue.length > 0 ? st.queue[0] : null;
        if (id === validNext) {
            visitBFS(id);
        } else if (st.visited.includes(id)) {
            View.setLog('[ ' + Model.getUser(id).name + ' ya fue investigado. Sigue el orden de la cola. ]');
        } else if (!st.queue.includes(id)) {
            View.setLog('[ ' + Model.getUser(id).name + ' aún no está en la cola BFS. ]');
            flashInvalid(id);
        } else {
            penalize('bfs', '[ BFS: debes visitar el PRIMERO de la cola → ' + Model.getUser(st.queue[0]).name + ' ]');
        }
    }

    function visitBFS(id) {
        const st = Model.state.bfs;
        const prev = st.current;
        st.current = id;
        if (!st.visited.includes(id)) st.visited.push(id);
        st.queue = st.queue.filter(x => x !== id);
        if (prev !== null) {
            const key = View.edgeKey(prev, id);
            if (!st.traversed.includes(key)) st.traversed.push(key);
        }
        const neighbors = Model.ADJ[id]
            .filter(n => !st.visited.includes(n) && !st.queue.includes(n))
            .sort((a,b) => a-b);
        st.queue = [...st.queue, ...neighbors];
        View.setLog('', true);
        View.renderGraph('bfs', handleNodeClickBFS);
        View.updatePanel('bfs');
        View.showEvidence(id, 'bfs');
        View.setInstruction('BFS: próximo en cola → ' + (st.queue.length ? Model.getUser(st.queue[0]).name : '(vacía)'));
        if (st.visited.length === 9) {
            st.done = true;
            setTimeout(finishBFS, 1000);
        }
    }

    function finishBFS() {
        View.renderTimeline(Model.state.bfs.visited);
        View.showScreen('screen-timeline');
    }

    // ── FASE 2: DFS ──────────────────────────────────────────────────
    function startDFS() {
        Model.state.phase = 'dfs';
        View.showGame('dfs');
        View.updatePanel('dfs');
        View.renderGraph('dfs', handleNodeClickDFS);
        View.setInstruction('DFS: elige un nodo para iniciar el rastreo profundo. Sigue la cadena hasta el origen.');
    }

    function handleNodeClickDFS(id) {
        const st = Model.state.dfs;
        if (st.done) return;
        if (st.visited.length === 0) {
            visitDFS(id);
        } else {
            processStepDFS(id);
        }
    }

    function processStepDFS(id) {
        const st = Model.state.dfs;
        const validNext = st.stack.length > 0 ? st.stack[st.stack.length - 1] : null;
        if (id === validNext) {
            visitDFS(id);
        } else if (st.visited.includes(id)) {
            View.setLog('[ ' + Model.getUser(id).name + ' ya fue rastreado. Sigue el tope de la pila. ]');
        } else if (!st.stack.includes(id)) {
            View.setLog('[ ' + Model.getUser(id).name + ' aún no está en la pila DFS. ]');
            flashInvalid(id);
        } else {
            penalize('dfs', '[ DFS: debes visitar el TOPE de la pila → ' + Model.getUser(validNext).name + ' ]');
        }
    }

    function visitDFS(id) {
        const st = Model.state.dfs;
        const prev = st.current;
        st.current = id;
        if (!st.visited.includes(id)) st.visited.push(id);
        st.stack = st.stack.filter(x => x !== id);
        if (prev !== null) {
            const key = View.edgeKey(prev, id);
            if (!st.traversed.includes(key)) st.traversed.push(key);
        }
        const neighbors = Model.ADJ[id]
            .filter(n => !st.visited.includes(n) && !st.stack.includes(n))
            .sort((a,b) => a-b);
        st.stack = [...st.stack, ...neighbors];
        Model.computeSuspicion(st.visited);
        View.setLog('', true);
        View.renderGraph('dfs', handleNodeClickDFS);
        View.updatePanel('dfs');
        View.showEvidence(id, 'dfs');
        View.setInstruction('DFS: tope de pila → ' + (st.stack.length ? Model.getUser(st.stack[st.stack.length-1]).name : '(vacía)'));
        if (st.visited.length === 9) {
            st.done = true;
            setTimeout(startAccusation, 1000);
        }
    }

    // ── ACUSACIÓN ────────────────────────────────────────────────────
    function startAccusation() {
        Model.state.phase = 'accusation';
        View.showScreen('screen-accusation');
        View.renderAccusationGrid(handleAccusation);
    }

    function handleAccusation(id) {
        if (id === Model.originId) {
            const user = Model.getUser(id);
            const ev   = Model.getEvidence(id);
            View.showEndScreen(true, user,
                `"${ev.priv}" — Este mensaje fue el disparador. Fue enviado antes que cualquier otro.`,
                `Correcto. ${user.name} inició la campaña de acoso. Tu análisis BFS+DFS reveló su posición central en la red y su alta sospecha (${Model.state.dfs.suspicion[id]}%). La misión fue un éxito.`
            );
        } else {
            Model.state.accusationLives--;
            const remaining = Model.state.accusationLives;
            if (remaining <= 0) {
                const origin = Model.getUser(Model.originId);
                const ev = Model.getEvidence(Model.originId);
                View.showEndScreen(false, origin,
                    `El verdadero origen era ${origin.name}. "${ev.priv}"`,
                    `Tu análisis no identificó correctamente al responsable. El patrón de DFS indicaba que el nodo con mayor centralidad de salida era ${origin.name}. Intenta de nuevo.`
                );
            } else {
                document.getElementById('acc-feedback').textContent =
                    `Incorrecto. Intentos restantes: ${remaining}. Pista: el origen tiene ${Model.ADJ[Model.originId].length} conexiones directas y aparece en los primeros nodos del recorrido DFS.`;
            }
        }
    }

    // ── UTILS ────────────────────────────────────────────────────────
    function flashInvalid(id) {
        document.querySelectorAll('.g-node').forEach(g => {
            const t = g.querySelector('.g-node-name');
            if (t) {
                const shortName = Model.getUser(id).name.split('.')[1] || '';
                if (t.textContent.startsWith(shortName.slice(0,4))) {
                    g.classList.add('invalid');
                    setTimeout(() => g.classList.remove('invalid'), 700);
                }
            }
        });
    }

    function penalize(phase, msg) {
        const st = Model.state[phase];
        st.lives--;
        View.setLog(msg);
        View.updatePanel(phase);
        if (st.lives <= 0) {
            const origin = Model.getUser(Model.originId);
            View.showEndScreen(false, origin,
                `Demasiados errores. El rastro se perdió.`,
                `El sistema no pudo rastrear el origen. ${origin.name} escapó del análisis. Intenta de nuevo con más cuidado en el orden del algoritmo.`
            );
        }
    }

    function resetGame() {
        Model.resetState();
        View.showScreen('screen-intro');
        document.getElementById('evidence-panel').classList.remove('visible');
    }

    function updateClock() {
        const d=new Date(), p=n=>String(n).padStart(2,'0');
        document.getElementById('clock').textContent=`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    }

    return { init };
})();

// Arrancar la aplicación
Controller.init();