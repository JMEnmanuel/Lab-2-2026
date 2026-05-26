(function () {
    const DEFAULT_CONFIG = {
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: ""
    };

    let active = false;
    let playerName = "";
    let missionId = "";
    let missionLabel = "";
    let startMs = 0;
    let elapsedSeconds = 0;
    let firebaseReady = false;
    let firestore = null;
    let firebaseApi = null;
    let hud = null;
    let promptEl = null;
    let boardEl = null;
    let pendingStart = null;
    let nativeCpu = false;
    let cpuTimer = null;
    let cpuToast = null;
    let hudTimer = null;

    function pad(n) {
        return String(n).padStart(2, "0");
    }

    function formatTime(seconds) {
        const safe = Math.max(0, Number(seconds) || 0);
        const minutes = Math.floor(safe / 60);
        return `${pad(minutes)}:${pad(safe % 60)}`;
    }

    function getFirebaseConfig() {
        return { ...DEFAULT_CONFIG, ...(window.RankingFirebaseConfig || {}) };
    }

    function hasFirebaseConfig() {
        const cfg = getFirebaseConfig();
        return Boolean(cfg.apiKey && cfg.projectId && cfg.appId);
    }

    async function loadFirebase() {
        if (firebaseReady || !hasFirebaseConfig()) return firebaseReady;
        try {
            const appMod = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
            const dbMod = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
            const app = appMod.initializeApp(getFirebaseConfig());
            firestore = dbMod.getFirestore(app);
            firebaseApi = dbMod;
            firebaseReady = true;
        } catch (err) {
            console.warn("Ranking Firebase no disponible, usando localStorage.", err);
            firebaseReady = false;
        }
        return firebaseReady;
    }

    function localKey(id) {
        return `red-segura-ranking:${id}`;
    }

    function readLocal(id) {
        try {
            return JSON.parse(localStorage.getItem(localKey(id)) || "[]");
        } catch (_) {
            return [];
        }
    }

    function writeLocal(id, entries) {
        localStorage.setItem(localKey(id), JSON.stringify(entries.slice(0, 10)));
    }

    async function saveResult(entry) {
        await loadFirebase();
        if (firebaseReady) {
            const ref = firebaseApi.collection(firestore, "rankings", entry.missionId, "times");
            await firebaseApi.addDoc(ref, {
                playerName: entry.playerName,
                seconds: entry.seconds,
                missionLabel: entry.missionLabel,
                createdAt: firebaseApi.serverTimestamp()
            });
            return;
        }
        const entries = readLocal(entry.missionId);
        entries.push({ ...entry, createdAt: new Date().toISOString() });
        entries.sort((a, b) => a.seconds - b.seconds);
        writeLocal(entry.missionId, entries);
    }

    async function getRanking(id) {
        await loadFirebase();
        if (firebaseReady) {
            const ref = firebaseApi.collection(firestore, "rankings", id, "times");
            const q = firebaseApi.query(ref, firebaseApi.orderBy("seconds", "asc"), firebaseApi.limit(10));
            const snap = await firebaseApi.getDocs(q);
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        return readLocal(id).slice(0, 10);
    }

    function injectStyles() {
        if (document.getElementById("ranking-mode-style")) return;
        const style = document.createElement("style");
        style.id = "ranking-mode-style";
        style.textContent = `
            body.ranking-mode {
                --rank-bg: #07090c;
                --rank-panel: rgba(13, 18, 23, .94);
                --rank-line: rgba(229, 235, 242, .18);
                --rank-text: #edf2f7;
                --rank-muted: #8d98a7;
                --rank-gold: #f6c453;
                --rank-blue: #35a7ff;
                --rank-red: #ff4f5e;
                background: var(--rank-bg) !important;
            }
            body.ranking-mode::before {
                content: "";
                position: fixed;
                inset: 0;
                z-index: -1;
                background:
                    linear-gradient(115deg, rgba(53,167,255,.11), transparent 34%),
                    linear-gradient(245deg, rgba(246,196,83,.12), transparent 38%),
                    repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 1px, transparent 1px 80px);
            }
            body.ranking-mode #damage-overlay,
            body.ranking-mode #scanlines,
            body.ranking-mode #particle-canvas,
            body.ranking-mode #particles {
                display: none !important;
            }
            body.ranking-mode .intro-card,
            body.ranking-mode .panel,
            body.ranking-mode .hud-card,
            body.ranking-mode .side-panel,
            body.ranking-mode .panel-card,
            body.ranking-mode #side-panel,
            body.ranking-mode .graph-frame,
            body.ranking-mode .graph-area {
                filter: none !important;
                border-color: var(--rank-line) !important;
                box-shadow: 0 18px 50px rgba(0,0,0,.28) !important;
            }
            .ranking-btn {
                border: 1px solid rgba(246,196,83,.86) !important;
                background: linear-gradient(135deg, #f6c453, #ff7a45) !important;
                color: #080a0d !important;
                font-weight: 900 !important;
                text-transform: uppercase;
            }
            .ranking-hud {
                position: fixed;
                left: 18px;
                top: 56px;
                z-index: 970;
                min-width: 190px;
                padding: 10px 13px;
                border: 1px solid rgba(246,196,83,.78);
                border-top: 4px solid #f6c453;
                background: rgba(7,9,12,.94);
                color: #edf2f7;
                font-family: 'Share Tech Mono', monospace;
                letter-spacing: .08em;
                text-transform: uppercase;
                box-shadow: 0 20px 44px rgba(0,0,0,.32);
                display: none;
            }
            body.ranking-mode .ranking-hud { display: block; }
            .ranking-hud small {
                display: block;
                color: #8d98a7;
                font-size: 8px;
                margin-bottom: 4px;
            }
            .ranking-hud strong {
                display: block;
                color: #f6c453;
                font-size: 24px;
                line-height: 1;
                margin-bottom: 6px;
            }
            .ranking-hud span {
                display: block;
                color: #35a7ff;
                font-size: 9px;
                white-space: nowrap;
            }
            .ranking-modal {
                position: fixed;
                inset: 0;
                z-index: 2600;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 24px;
                background: rgba(3,5,8,.82);
                backdrop-filter: blur(8px);
                font-family: 'Share Tech Mono', monospace;
                color: #edf2f7;
            }
            .ranking-modal.visible { display: flex; }
            .ranking-box {
                width: min(560px, 100%);
                border: 1px solid rgba(229,235,242,.18);
                border-top: 5px solid #f6c453;
                background: linear-gradient(180deg, rgba(16,21,28,.98), rgba(8,10,13,.98));
                padding: 22px;
                box-shadow: 0 30px 90px rgba(0,0,0,.48);
            }
            .ranking-kicker {
                color: #35a7ff;
                letter-spacing: .24em;
                font-size: 9px;
                text-transform: uppercase;
                margin-bottom: 8px;
            }
            .ranking-title {
                font-family: 'Orbitron', 'Share Tech Mono', monospace;
                color: #f6c453;
                font-size: clamp(24px, 5vw, 42px);
                letter-spacing: .08em;
                margin-bottom: 12px;
                text-transform: uppercase;
            }
            .ranking-copy {
                color: #aeb8c6;
                font-size: 12px;
                line-height: 1.6;
                margin-bottom: 14px;
            }
            .ranking-input {
                width: 100%;
                box-sizing: border-box;
                border: 1px solid rgba(246,196,83,.45);
                background: #080b10;
                color: #edf2f7;
                padding: 13px 12px;
                font: inherit;
                font-size: 14px;
                letter-spacing: .12em;
                text-transform: uppercase;
                margin-bottom: 12px;
                outline: none;
            }
            .ranking-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            .ranking-actions button {
                border: 1px solid rgba(229,235,242,.2);
                background: transparent;
                color: #edf2f7;
                padding: 11px 14px;
                font: inherit;
                font-size: 10px;
                letter-spacing: .12em;
                text-transform: uppercase;
                cursor: pointer;
            }
            .ranking-actions .primary {
                background: #f6c453;
                border-color: #f6c453;
                color: #080a0d;
                font-weight: 900;
            }
            .ranking-table {
                margin-top: 16px;
                border-top: 1px solid rgba(229,235,242,.14);
            }
            .ranking-cpu-toast {
                position: fixed;
                right: 18px;
                bottom: 72px;
                z-index: 980;
                width: min(320px, calc(100vw - 36px));
                border: 1px solid rgba(255,79,94,.64);
                border-left: 4px solid #ff4f5e;
                background: rgba(12, 14, 18, .96);
                color: #edf2f7;
                padding: 12px 14px;
                font-family: 'Share Tech Mono', monospace;
                font-size: 10px;
                letter-spacing: .1em;
                text-transform: uppercase;
                transform: translateY(18px);
                opacity: 0;
                pointer-events: none;
                transition: opacity .18s ease, transform .18s ease;
                box-shadow: 0 18px 44px rgba(0,0,0,.34);
            }
            .ranking-cpu-toast.visible {
                opacity: 1;
                transform: translateY(0);
            }
            .ranking-cpu-toast strong {
                display: block;
                color: #ff4f5e;
                margin-bottom: 5px;
            }
            .ranking-row {
                display: grid;
                grid-template-columns: 34px 1fr 76px;
                gap: 10px;
                padding: 10px 0;
                border-bottom: 1px solid rgba(229,235,242,.08);
                font-size: 12px;
                align-items: center;
            }
            .ranking-row strong { color: #f6c453; }
            .ranking-empty {
                color: #8d98a7;
                font-size: 11px;
                padding-top: 14px;
            }
            @media (max-width: 720px) {
                .ranking-hud {
                    top: auto;
                    bottom: 86px;
                    left: 12px;
                    min-width: 150px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function ensureCpuToast() {
        injectStyles();
        if (cpuToast) return;
        cpuToast = document.createElement("div");
        cpuToast.className = "ranking-cpu-toast";
        document.body.appendChild(cpuToast);
    }

    function showCpuToast(message) {
        ensureCpuToast();
        cpuToast.innerHTML = `<strong>// CPU RIVAL</strong>${message}`;
        cpuToast.classList.add("visible");
        setTimeout(() => cpuToast.classList.remove("visible"), 2200);
    }

    function startGenericCpu() {
        stopGenericCpu();
        const messages = [
            "Interferencia de validacion: +4s al cronometro.",
            "Ruido competitivo detectado: +4s al tiempo oficial.",
            "La CPU fuerza una recalibracion: +4s."
        ];
        cpuTimer = setInterval(() => {
            if (!active || nativeCpu) return;
            addPenalty(4);
            showCpuToast(messages[Math.floor(Math.random() * messages.length)]);
        }, 18000);
    }

    function stopGenericCpu() {
        if (cpuTimer) clearInterval(cpuTimer);
        cpuTimer = null;
    }

    function ensureHud() {
        injectStyles();
        if (hud) return;
        hud = document.createElement("div");
        hud.className = "ranking-hud";
        hud.innerHTML = `
            <small>// MODO RANKING</small>
            <strong id="ranking-hud-time">00:00</strong>
            <span id="ranking-hud-player">COMPETIDOR: —</span>
        `;
        document.body.appendChild(hud);
    }

    function updateHud() {
        if (!hud) return;
        const current = active ? Math.floor((Date.now() - startMs) / 1000) + elapsedSeconds : elapsedSeconds;
        const timeEl = hud.querySelector("#ranking-hud-time");
        const playerEl = hud.querySelector("#ranking-hud-player");
        if (timeEl) timeEl.textContent = formatTime(current);
        if (playerEl) playerEl.textContent = `COMPETIDOR: ${playerName || "—"}`;
    }

    function ensurePrompt() {
        injectStyles();
        if (promptEl) return;
        promptEl = document.createElement("div");
        promptEl.className = "ranking-modal";
        promptEl.innerHTML = `
            <div class="ranking-box">
                <div class="ranking-kicker">// CLASIFICATORIA EN VIVO</div>
                <div class="ranking-title">Modo Ranking</div>
                <p class="ranking-copy">
                    Ingresa tu nombre. El cronómetro empieza al entrar al desafío y la CPU se mantiene activa.
                </p>
                <input id="ranking-name-input" class="ranking-input" maxlength="18" autocomplete="off" placeholder="TU NOMBRE">
                <div class="ranking-actions">
                    <button type="button" class="primary" id="ranking-start-confirm">INICIAR CARRERA</button>
                    <button type="button" id="ranking-start-cancel">CANCELAR</button>
                </div>
            </div>
        `;
        document.body.appendChild(promptEl);
        promptEl.querySelector("#ranking-start-confirm").addEventListener("click", () => {
            const input = promptEl.querySelector("#ranking-name-input");
            const name = (input.value || "").trim();
            if (!name) {
                input.focus();
                return;
            }
            promptEl.classList.remove("visible");
            if (pendingStart) pendingStart(name);
            pendingStart = null;
        });
        promptEl.querySelector("#ranking-start-cancel").addEventListener("click", () => {
            promptEl.classList.remove("visible");
            pendingStart = null;
        });
    }

    function ensureBoard() {
        injectStyles();
        if (boardEl) return;
        boardEl = document.createElement("div");
        boardEl.className = "ranking-modal";
        boardEl.innerHTML = `
            <div class="ranking-box">
                <div class="ranking-kicker">// RESULTADOS OFICIALES</div>
                <div class="ranking-title">Tabla Ranking</div>
                <p class="ranking-copy" id="ranking-result-copy">Tiempo registrado.</p>
                <div class="ranking-table" id="ranking-table"></div>
                <div class="ranking-actions" style="margin-top:16px">
                    <button type="button" class="primary" id="ranking-close-board">CONTINUAR</button>
                </div>
            </div>
        `;
        document.body.appendChild(boardEl);
        boardEl.querySelector("#ranking-close-board").addEventListener("click", () => {
            boardEl.classList.remove("visible");
        });
    }

    async function renderBoard(id, copy) {
        ensureBoard();
        const copyEl = boardEl.querySelector("#ranking-result-copy");
        const table = boardEl.querySelector("#ranking-table");
        copyEl.textContent = copy;
        table.innerHTML = `<div class="ranking-empty">Cargando clasificación...</div>`;
        boardEl.classList.add("visible");
        const rows = await getRanking(id);
        if (!rows.length) {
            table.innerHTML = `<div class="ranking-empty">Aún no hay tiempos guardados para esta misión.</div>`;
            return;
        }
        table.innerHTML = rows.map((row, idx) => `
            <div class="ranking-row">
                <strong>#${idx + 1}</strong>
                <span>${String(row.playerName || "SIN NOMBRE").toUpperCase()}</span>
                <strong>${formatTime(row.seconds)}</strong>
            </div>
        `).join("");
    }

    function begin(options) {
        ensurePrompt();
        const opts = options || {};
        pendingStart = name => {
            active = true;
            nativeCpu = !!opts.nativeCpu;
            playerName = name;
            missionId = opts.missionId || "mission";
            missionLabel = opts.missionLabel || "MISION";
            elapsedSeconds = 0;
            startMs = Date.now();
            document.body.classList.add("ranking-mode");
            ensureHud();
            updateHud();
            window.dispatchEvent(new CustomEvent("ranking:start", {
                detail: { missionId, missionLabel, playerName }
            }));
            if (typeof opts.onStart === "function") opts.onStart();
            startHudTimer();
            if (!nativeCpu) startGenericCpu();
        };
        const input = promptEl.querySelector("#ranking-name-input");
        input.value = localStorage.getItem("red-segura-ranking:last-name") || "";
        promptEl.classList.add("visible");
        setTimeout(() => input.focus(), 0);
    }

    async function finish(meta) {
        if (!active) return;
        const seconds = Math.max(1, Math.floor((Date.now() - startMs) / 1000) + elapsedSeconds);
        active = false;
        stopGenericCpu();
        stopHudTimer();
        elapsedSeconds = seconds;
        updateHud();
        document.body.classList.remove("ranking-mode");
        if (playerName) localStorage.setItem("red-segura-ranking:last-name", playerName);

        if (meta && meta.success === false) {
            window.dispatchEvent(new CustomEvent("ranking:fail", { detail: { missionId, seconds } }));
            return;
        }

        const entry = {
            missionId,
            missionLabel,
            playerName,
            seconds,
            extra: meta && meta.extra ? meta.extra : {}
        };
        await saveResult(entry);
        await renderBoard(missionId, `${playerName.toUpperCase()} completó ${missionLabel} en ${formatTime(seconds)}.`);
        window.dispatchEvent(new CustomEvent("ranking:finish", { detail: entry }));
    }

    function cancel() {
        active = false;
        stopGenericCpu();
        stopHudTimer();
        elapsedSeconds = 0;
        document.body.classList.remove("ranking-mode");
        updateHud();
    }

    function addPenalty(seconds) {
        if (!active) return;
        elapsedSeconds += Math.max(0, Number(seconds) || 0);
        updateHud();
    }

    function startHudTimer() {
        stopHudTimer();
        hudTimer = setInterval(updateHud, 1000);
    }

    function stopHudTimer() {
        if (hudTimer) clearInterval(hudTimer);
        hudTimer = null;
    }

    window.RankingMode = {
        begin,
        finish,
        cancel,
        addPenalty,
        isActive: () => active,
        getElapsedSeconds: () => active ? Math.floor((Date.now() - startMs) / 1000) + elapsedSeconds : elapsedSeconds,
        formatTime,
        showBoard: mission => renderBoard(mission || missionId, "Clasificación actual.")
    };
})();
