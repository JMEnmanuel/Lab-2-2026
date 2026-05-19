/*
   Controller de Mision 1.

   Este archivo conecta Model y View.
   Aqui viven las reglas de interaccion de BFS, DFS, tutorial y acusacion.
   Si el jugador hace click, este archivo decide que pasa despues.
*/
const Controller = (() => {

    function init() {
        // Intro → dos opciones
        document.getElementById('btn-go-tutorial').addEventListener('click', startTutorial);
        document.getElementById('btn-start-bfs').addEventListener('click', startBFS);

        // Tutorial — botones
        document.getElementById('btn-tco-continue').addEventListener('click', onConceptOverlayContinue);
        document.getElementById('btn-skip-tut-mid').addEventListener('click', skipTutorial);

        // Juego principal
        document.getElementById('btn-reiniciar').addEventListener('click', resetGame);
        document.getElementById('btn-start-dfs').addEventListener('click', startDFS);
        document.getElementById('btn-final-reset').addEventListener('click', resetGame);

        // Reloj
        setInterval(updateClock, 1000);
        updateClock();
    }

    // ================================================================
    //  TUTORIAL CONTROLLER
    // ================================================================

    // Entra al tutorial: muestra pantalla y abre overlay BFS
    function startTutorial() {
        Model.resetTutorial();
        View.showScreen('screen-tutorial');
        View.showConceptOverlay('bfs');
        // Renderiza grafo vacío mientras se lee el concepto
        View.renderTutorialGraph('bfs', handleTutorialClick);
        View.updateTutorialPanel();
    }

    // Botón "ENTENDIDO" del overlay de concepto
    function onConceptOverlayContinue() {
        const phase = Model.tutorialState.phase;

        // Si es el overlay de fin de tutorial → lanzar juego real
        if (document.getElementById('btn-tco-continue').textContent.includes('MISIÓN REAL')) {
            skipTutorial();
            return;
        }

        View.hideConceptOverlay();

        // Primer paso de la fase: es tipo null (solo lectura), avanzar automáticamente
        const step = Model.getTutorialStep();
        if (step && step.expectedNode === null) {
            View.setTutorialInstruction(step.instruction);
            View.setTutorialLog('_');
            View.renderTutorialGraph(phase, handleTutorialClick);
            View.updateTutorialPanel();
            // Avanzar al primer paso interactivo
            Model.tutorialState.stepIndex++;
            const nextStep = Model.getTutorialStep();
            if (nextStep) {
                View.setTutorialInstruction(nextStep.instruction);
                View.updateTutorialPanel();
                View.renderTutorialGraph(phase, handleTutorialClick);
            }
        }
    }

    // Click en nodo del grafo tutorial
    function handleTutorialClick(nodeId) {
        const ts    = Model.tutorialState;
        const phase = ts.phase;
        const steps = Model.TUT_STEPS[phase];
        const step  = steps[ts.stepIndex];

        if (!step || step.expectedNode === null) return;

        if (nodeId === step.expectedNode) {
            // Correcto
            if (phase === 'bfs') tutorialVisitBFS(nodeId);
            else                 tutorialVisitDFS(nodeId);
        } else {
            // Incorrecto — flash rojo, sin penalización
            View.flashInvalidTutorial(nodeId);
        }
    }

    // Visita un nodo en BFS tutorial y actualiza estado
    function tutorialVisitBFS(id) {
        const st = Model.tutorialState.bfs;
        if (!st.parent) st.parent = {};
        st.current = id;
        if (!st.visited.includes(id)) st.visited.push(id);
        st.queue = st.queue.filter(x => x !== id);

        // Arista recorrida: usar el padre real que descubrió este nodo
        const parentId = st.parent[id];
        if (parentId !== undefined) {
            const key = View.edgeKey(parentId, id);
            const linkExists = Model.TUT_LINKS.some(([a,b]) => View.edgeKey(a,b) === key);
            if (linkExists && !st.traversed.includes(key)) st.traversed.push(key);
        }

        // Agregar vecinos a la cola (orden ascendente) y registrar su padre
        const neighbors = Model.TUT_ADJ[id]
            .filter(n => !st.visited.includes(n) && !st.queue.includes(n))
            .sort((a,b) => a-b);
        neighbors.forEach(n => { if (st.parent[n] === undefined) st.parent[n] = id; });
        st.queue = [...st.queue, ...neighbors];

        View.setTutorialLog('_');
        advanceTutorialStep();
    }

    // Visita un nodo en DFS tutorial y actualiza estado
    function tutorialVisitDFS(id) {
        const st = Model.tutorialState.dfs;
        if (!st.parent) st.parent = {};
        st.current = id;
        if (!st.visited.includes(id)) st.visited.push(id);
        st.stack = st.stack.filter(x => x !== id);

        // Arista recorrida: usar el padre real que descubrió este nodo
        const parentId = st.parent[id];
        if (parentId !== undefined) {
            const key = View.edgeKey(parentId, id);
            const linkExists = Model.TUT_LINKS.some(([a,b]) => View.edgeKey(a,b) === key);
            if (linkExists && !st.traversed.includes(key)) st.traversed.push(key);
        }

        // Apilar vecinos en orden descendente para que el menor quede como tope.
        const neighbors = Model.TUT_ADJ[id]
            .filter(n => !st.visited.includes(n) && !st.stack.includes(n))
            .sort((a,b) => b-a);
        neighbors.forEach(n => { if (st.parent[n] === undefined) st.parent[n] = id; });
        st.stack = [...st.stack, ...neighbors];

        View.setTutorialLog('_');
        advanceTutorialStep();
    }

    // Avanza al siguiente paso del tutorial
    function advanceTutorialStep() {
        const ts     = Model.tutorialState;
        const phase  = ts.phase;
        const steps  = Model.TUT_STEPS[phase];

        ts.stepIndex++;

        View.renderTutorialGraph(phase, handleTutorialClick);
        View.updateTutorialPanel();

        if (ts.stepIndex >= steps.length) {
            // Fase completada
            if (phase === 'bfs') {
                // Transición a DFS
                setTimeout(() => {
                    ts.phase     = 'dfs';
                    ts.stepIndex = 0;
                    // Paso 0 de DFS es siempre null (concepto) → mostrar overlay
                    View.showConceptOverlay('dfs');
                    View.renderTutorialGraph('dfs', handleTutorialClick);
                    View.updateTutorialPanel();
                }, 600);
            } else {
                // Tutorial completo
                setTimeout(() => View.showTutorialComplete(), 600);
            }
            return;
        }

        // Siguiente paso
        const nextStep = Model.getTutorialStep();
        if (nextStep) {
            View.setTutorialInstruction(nextStep.instruction);
        }
    }

    // Saltar tutorial → ir directo al juego BFS real
    function skipTutorial() {
        View.hideConceptOverlay();
        startBFS();
    }

    // ── FASE 1: BFS ──────────────────────────────────────────────────
    function startBFS() {
        Model.state.phase = 'bfs';
        View.showGame('bfs');
        View.updatePanel('bfs');
        View.renderGraph('bfs', handleNodeClickBFS);
        View.setInstruction('Haz click en cualquier nodo para iniciar. Cuando haya varias opciones, avanza por el ID menor disponible.');
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
        /*
           BFS usa una cola.
           Al visitar un nodo, sus vecinos nuevos entran al final.
           El siguiente nodo correcto siempre es el primero de la cola.
        */
        const st = Model.state.bfs;
        if (!st.parent) st.parent = {};
        st.current = id;
        if (!st.visited.includes(id)) st.visited.push(id);
        st.queue = st.queue.filter(x => x !== id);

        // Arista recorrida: usar el padre real que descubrió este nodo
        const parentId = st.parent[id];
        if (parentId !== undefined) {
            const key = View.edgeKey(parentId, id);
            const linkExists = Model.LINKS.some(([a,b]) => View.edgeKey(a,b) === key);
            if (linkExists && !st.traversed.includes(key)) st.traversed.push(key);
        }

        const neighbors = Model.ADJ[id]
            .filter(n => !st.visited.includes(n) && !st.queue.includes(n))
            .sort((a,b) => a-b);
        neighbors.forEach(n => { if (st.parent[n] === undefined) st.parent[n] = id; });
        st.queue = [...st.queue, ...neighbors];
        View.setLog('', true);
        View.renderGraph('bfs', handleNodeClickBFS);
        View.updatePanel('bfs');
        View.showEvidence(id, 'bfs');
        View.setInstruction('BFS: próximo en cola por ID menor → ' + (st.queue.length ? Model.getUser(st.queue[0]).name : '(vacía)'));
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
        View.setInstruction('DFS: elige un nodo para iniciar. Si hay varias opciones, el tope debe corresponder al ID menor disponible.');
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
        /*
           DFS usa una pila.
           Al visitar un nodo, sus vecinos nuevos quedan disponibles.
           El siguiente nodo correcto siempre es el tope de la pila.
        */
        const st = Model.state.dfs;
        if (!st.parent) st.parent = {};
        st.current = id;
        if (!st.visited.includes(id)) st.visited.push(id);
        st.stack = st.stack.filter(x => x !== id);

        // Arista recorrida: usar el padre real que descubrió este nodo
        const parentId = st.parent[id];
        if (parentId !== undefined) {
            const key = View.edgeKey(parentId, id);
            const linkExists = Model.LINKS.some(([a,b]) => View.edgeKey(a,b) === key);
            if (linkExists && !st.traversed.includes(key)) st.traversed.push(key);
        }

        const neighbors = Model.ADJ[id]
            .filter(n => !st.visited.includes(n) && !st.stack.includes(n))
            .sort((a,b) => b-a);
        neighbors.forEach(n => { if (st.parent[n] === undefined) st.parent[n] = id; });
        st.stack = [...st.stack, ...neighbors];
        Model.computeSuspicion(st.visited);
        View.setLog('', true);
        View.renderGraph('dfs', handleNodeClickDFS);
        View.updatePanel('dfs');
        View.showEvidence(id, 'dfs');
        View.setInstruction('DFS: tope de pila por ID menor → ' + (st.stack.length ? Model.getUser(st.stack[st.stack.length-1]).name : '(vacía)'));
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
        // La acusacion compara el usuario elegido con el origen real del modelo.
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

Controller.init();
