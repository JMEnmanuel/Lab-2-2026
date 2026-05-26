/*
   CPU rival para Mision 2.

   
*/
const M2CpuEffects = (() => {
    let enabled = false;
    let progress = 0;
    let turn = 0;
    let timers = [];
    let qteActive = false;
    let qteKeyHandler = null;

    function setEnabled(value) {
        enabled = !!value;
        document.body.dataset.m2Cpu = enabled ? 'enabled' : 'disabled';
        updatePanel(enabled ? 'CPU lista para sabotear pesos.' : 'Modo solo: CPU desactivada.');
    }

    function onGameStart(config) {
        setEnabled(config && config.enabled);
        progress = 0;
        turn = 0;
        clear();
        updatePanel(enabled ? 'CPU observando tu ruta.' : 'Modo solo: sin interferencias.');
    }

    function runTurn(event) {
        if (!enabled || !event) return;
        turn += 1;
        progress = Math.min(100, progress + getProgressGain(event));

        const action = pickAction();
        if (action === 'weights') distortWeights();
        else if (action === 'edges') glitchEdges();
        else if (action === 'both') {
            distortWeights();
            queue(() => glitchEdges(), 240);
        }
        if (shouldLaunchQte()) {
            queue(() => startQuickTimeEvent(), action === 'none' ? 120 : 520);
        }

        const labels = {
            none: 'La CPU no encontro una grieta esta vez.',
            weights: 'La CPU distorsiona pesos de aristas cercanas.',
            edges: 'La CPU mete ruido en conexiones del grafo.',
            both: 'La CPU combina pesos falsos y aristas inestables.'
        };
        updatePanel(labels[action] || labels.none);
    }

    function getCoinInterference(ctx) {
        if (!enabled || !ctx || !ctx.success || !ctx.nextNodeId) return null;
        progress = Math.min(100, progress + 12);
        updatePanel('La CPU intenta contaminar la pista de la moneda.');

        if (Math.random() > 0.48) return null;

        const fake = pickFakeHint(ctx);
        if (!fake) return null;
        return {
            fakeNodeId: fake.id,
            message: `SENAL INTERFERIDA: ${fake.id} (${fake.label})`
        };
    }

    function flashFalseHint(nodeId) {
        if (!enabled) return;
        const svg = document.getElementById('game-svg');
        if (!svg) return;
        const node = svg.querySelector(`[data-id="${nodeId}"]`);
        if (!node) return;
        node.classList.add('cpu-false-hint');
        queue(() => node.classList.remove('cpu-false-hint'), 1500);
    }

    function clear() {
        timers.forEach(id => clearTimeout(id));
        timers = [];
        // Reservado para limpiar efectos visuales, timers o bloqueos futuros.
        document.querySelectorAll('.cpu-weight-fake').forEach(el => {
            if (el.dataset.realWeight) el.textContent = el.dataset.realWeight;
            el.classList.remove('cpu-weight-fake');
        });
        document.querySelectorAll('.cpu-edge-glitch, .cpu-edge-hidden, .cpu-false-hint').forEach(el => {
            el.classList.remove('cpu-edge-glitch', 'cpu-edge-hidden', 'cpu-false-hint');
        });
        endQuickTimeEvent(false, true);
    }

    function isEnabled() {
        return enabled;
    }

    function getProgressGain(event) {
        const riskPressure = event.risk > 12 ? 4 : event.risk > 7 ? 2 : 0;
        const wrongPathPressure = event.path && !isPathPrefixOptimal(event.path) ? 4 : 1;
        return 7 + riskPressure + wrongPathPressure;
    }

    function pickAction() {
        const roll = Math.random();
        const criticalBoost = progress >= 65 ? 0.1 : 0;
        if (roll < 0.16) return 'none';
        if (roll < 0.48 + criticalBoost) return 'weights';
        if (roll < 0.78) return 'edges';
        return 'both';
    }

    function shouldLaunchQte() {
        if (qteActive) return false;
        const chance = progress >= 65 ? 0.46 : progress >= 35 ? 0.34 : 0.24;
        return Math.random() < chance;
    }

    function startQuickTimeEvent() {
        if (!enabled || qteActive || document.getElementById('m2-qte')) return;
        qteActive = true;

        const sequence = makeQteSequence(progress >= 65 ? 5 : 4);
        const stepMs = progress >= 65 ? 1300 : 1600;
        let index = 0;
        let stepTimer = null;

        const qte = document.createElement('div');
        qte.id = 'm2-qte';
        qte.className = 'm2-qte';
        qte.innerHTML = `
            <div class="m2-qte-kicker">// SINCRONIZA LA RUTA</div>
            <div class="m2-qte-row"></div>
            <div class="m2-qte-pulse"><div class="m2-qte-pulse-fill"></div></div>
            <div class="m2-qte-note">Presiona la tecla iluminada antes de que caiga el pulso.</div>
        `;
        document.body.appendChild(qte);

        const row = qte.querySelector('.m2-qte-row');
        sequence.forEach((key, i) => {
            const item = document.createElement('span');
            item.className = 'm2-qte-key';
            item.dataset.index = String(i);
            item.textContent = key;
            row.appendChild(item);
        });

        qteKeyHandler = event => {
            if (!qteActive) return;
            if (qte.classList.contains('failed') || qte.classList.contains('success')) {
                event.preventDefault();
                return;
            }
            const expected = sequence[index];
            const pressed = String(event.key || '').toUpperCase();
            if (pressed !== expected) {
                event.preventDefault();
                failQuickTimeEvent(qte, stepTimer);
                return;
            }
            event.preventDefault();
            markQteStep(qte, index, 'done');
            index += 1;
            if (index >= sequence.length) {
                finishQuickTimeEvent(qte, stepTimer);
                return;
            }
            armQteStep(qte, index, stepMs, () => failQuickTimeEvent(qte, stepTimer));
        };
        window.addEventListener('keydown', qteKeyHandler, true);

        function armQteStep(element, stepIndex, duration, onTimeout) {
            clearTimeout(stepTimer);
            markQteStep(element, stepIndex, 'active');
            const fill = element.querySelector('.m2-qte-pulse-fill');
            if (fill) {
                fill.style.animation = 'none';
                fill.offsetHeight;
                fill.style.animation = `m2QteDrain ${duration}ms linear forwards`;
            }
            stepTimer = queue(onTimeout, duration);
        }

        armQteStep(qte, index, stepMs, () => failQuickTimeEvent(qte, stepTimer));
        updatePanel('La CPU lanza un pulso QTE: estabiliza la ruta.');
    }

    function markQteStep(qte, index, state) {
        qte.querySelectorAll('.m2-qte-key').forEach(el => {
            if (Number(el.dataset.index) === index) {
                el.classList.remove('active', 'done');
                el.classList.add(state);
            } else if (state === 'active') {
                el.classList.remove('active');
            }
        });
    }

    function finishQuickTimeEvent(qte, stepTimer) {
        clearTimeout(stepTimer);
        qte.classList.add('success');
        updatePanel('QTE completado: la interferencia fue estabilizada.');
        queue(() => endQuickTimeEvent(true), 520);
    }

    function failQuickTimeEvent(qte, stepTimer) {
        clearTimeout(stepTimer);
        qte.classList.add('failed');
        const penalty = progress >= 65 ? 12 : 8;
        if (window.MissionTimer && typeof MissionTimer.penalize === 'function') {
            MissionTimer.penalize(penalty, 'm2-cpu-qte');
        }
        progress = Math.min(100, progress + 8);
        updatePanel(`QTE fallido: CPU roba ${penalty}s del reloj.`);
        queue(() => endQuickTimeEvent(false), 620);
    }

    function endQuickTimeEvent(success, immediate) {
        const qte = document.getElementById('m2-qte');
        if (qte) {
            if (immediate) qte.remove();
            else {
                qte.classList.add(success ? 'closing-success' : 'closing-fail');
                queue(() => qte.remove(), 180);
            }
        }
        if (qteKeyHandler) window.removeEventListener('keydown', qteKeyHandler, true);
        qteKeyHandler = null;
        qteActive = false;
    }

    function makeQteSequence(length) {
        const keys = ['Q', 'W', 'E', 'A', 'S', 'D'];
        const sequence = [];
        for (let i = 0; i < length; i++) {
            sequence.push(keys[Math.floor(Math.random() * keys.length)]);
        }
        return sequence;
    }

    function distortWeights() {
        const labels = [...document.querySelectorAll('#game-svg .game-weight-label')];
        if (!labels.length) return;
        shuffle(labels).slice(0, progress >= 65 ? 4 : 3).forEach(label => {
            const real = Number(label.dataset.realWeight || label.textContent);
            const fake = makeFakeWeight(real);
            label.textContent = fake;
            label.classList.add('cpu-weight-fake');
            const key = label.dataset.edge;
            document.querySelectorAll(`#game-svg [data-edge="${key}"]`).forEach(el => el.classList.add('cpu-weight-fake'));
        });
        queue(() => clearWeightDistortion(), progress >= 65 ? 2600 : 2100);
    }

    function clearWeightDistortion() {
        document.querySelectorAll('#game-svg .game-weight-label.cpu-weight-fake').forEach(label => {
            label.textContent = label.dataset.realWeight || label.textContent;
        });
        document.querySelectorAll('#game-svg .cpu-weight-fake').forEach(el => el.classList.remove('cpu-weight-fake'));
    }

    function glitchEdges() {
        const edges = [...document.querySelectorAll('#game-svg .game-edge')];
        if (!edges.length) return;
        shuffle(edges).slice(0, progress >= 65 ? 5 : 3).forEach((edge, idx) => {
            edge.classList.add(idx === 0 && Math.random() < 0.45 ? 'cpu-edge-hidden' : 'cpu-edge-glitch');
            const key = edge.dataset.edge;
            document.querySelectorAll(`#game-svg .game-weight-bg[data-edge="${key}"], #game-svg .game-weight-label[data-edge="${key}"]`)
                .forEach(el => el.classList.add('cpu-edge-glitch'));
        });
        queue(() => {
            document.querySelectorAll('#game-svg .cpu-edge-glitch, #game-svg .cpu-edge-hidden')
                .forEach(el => el.classList.remove('cpu-edge-glitch', 'cpu-edge-hidden'));
        }, progress >= 65 ? 2200 : 1700);
    }

    function makeFakeWeight(real) {
        const delta = Math.random() < 0.55 ? -3 : 3;
        return Math.max(1, Math.min(12, real + delta + Math.floor(Math.random() * 3)));
    }

    function pickFakeHint(ctx) {
        const last = ctx.path[ctx.path.length - 1];
        const neighbors = GAME_EDGES
            .filter(edge => edge.from === last || edge.to === last)
            .map(edge => edge.from === last ? edge.to : edge.from)
            .filter(id => id !== ctx.nextNodeId && !ctx.path.includes(id));
        const candidates = neighbors.length
            ? neighbors
            : ctx.nodes.map(n => n.id).filter(id => id !== ctx.nextNodeId && !ctx.path.includes(id));
        if (!candidates.length) return null;
        const id = candidates[Math.floor(Math.random() * candidates.length)];
        return ctx.nodes.find(n => n.id === id) || null;
    }

    function isPathPrefixOptimal(path) {
        if (!window.OPTIMAL_PATH || !path) return true;
        return path.every((id, idx) => OPTIMAL_PATH[idx] === id);
    }

    function updatePanel(message) {
        const panel = document.getElementById('m2-cpu-panel');
        if (!panel) return;
        panel.dataset.pressure = progress >= 75 ? 'critical' : progress >= 45 ? 'warning' : 'stable';
        const state = document.getElementById('m2-cpu-state');
        const val = document.getElementById('m2-cpu-progress-val');
        const fill = document.getElementById('m2-cpu-progress-fill');
        const log = document.getElementById('m2-cpu-log');
        if (state) state.textContent = enabled ? 'ACTIVA' : 'DESACTIVADA';
        if (val) val.textContent = `${progress}%`;
        if (fill) fill.style.width = `${progress}%`;
        if (log) log.textContent = message || 'CPU en espera.';
    }

    function queue(fn, delay) {
        const id = setTimeout(fn, delay);
        timers.push(id);
        return id;
    }

    function shuffle(items) {
        return items
            .map(item => ({ item, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(entry => entry.item);
    }

    return { setEnabled, onGameStart, runTurn, getCoinInterference, flashFalseHint, clear, isEnabled };
})();

window.M2CpuEffects = M2CpuEffects;
