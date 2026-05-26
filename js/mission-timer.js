(function () {
    const DEFAULTS = {
        durationSeconds: 240,
        missionLabel: "MISION",
        startSelectors: [],
        stopSelectors: [],
        resetSelectors: [],
        startWhenVisible: [],
        stopWhenVisible: [],
        canStart: null,
        shouldStop: null
    };

    let config = { ...DEFAULTS };
    let remaining = DEFAULTS.durationSeconds;
    let intervalId = null;
    let expired = false;
    let completed = false;
    let hud = null;
    let overlay = null;

    function pad(n) {
        return String(n).padStart(2, "0");
    }

    function formatTime(seconds) {
        const safe = Math.max(0, seconds);
        return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`;
    }

    function elementVisible(el) {
        if (!el) return false;
        if (el.classList.contains("hidden")) return false;
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    function anySelectorVisible(selectors) {
        return selectors.some(selector => {
            try {
                return Array.from(document.querySelectorAll(selector)).some(elementVisible);
            } catch (_) {
                return false;
            }
        });
    }

    function injectStyles() {
        if (document.getElementById("mission-timer-style")) return;
        const style = document.createElement("style");
        style.id = "mission-timer-style";
        style.textContent = `
            .mission-timer-hud {
                position: fixed;
                top: 56px;
                right: 18px;
                z-index: 950;
                min-width: 148px;
                padding: 8px 12px;
                border: 1px solid rgba(255,170,0,.72);
                border-left: 3px solid #ffaa00;
                background: rgba(5,7,10,.9);
                color: #ffaa00;
                font-family: 'Share Tech Mono', monospace;
                letter-spacing: .12em;
                text-transform: uppercase;
                box-shadow: 0 0 22px rgba(255,170,0,.12), inset 0 0 0 1px rgba(255,170,0,.08);
                pointer-events: none;
            }
            .mission-timer-label {
                display: block;
                font-size: 7px;
                color: #c2c8d8;
                margin-bottom: 3px;
            }
            .mission-timer-value {
                display: block;
                font-size: 18px;
                line-height: 1;
                color: #ffaa00;
                text-shadow: 0 0 14px rgba(255,170,0,.3);
            }
            .mission-timer-hud.is-low {
                border-color: rgba(255,34,68,.85);
                border-left-color: #ff2244;
                color: #ff2244;
                animation: missionTimerPulse .8s ease-in-out infinite;
            }
            .mission-timer-hud.is-low .mission-timer-value { color: #ff2244; }
            .mission-timer-hud.is-idle { opacity: .48; filter: grayscale(.25); }
            .mission-timeout-overlay {
                position: fixed;
                inset: 0;
                z-index: 2000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 28px;
                background: radial-gradient(circle at center, rgba(255,34,68,.14), rgba(5,5,7,.96) 58%);
                font-family: 'Share Tech Mono', monospace;
                color: #dfe7ff;
                text-align: center;
            }
            .mission-timeout-overlay.visible { display: flex; }
            .mission-timeout-box {
                width: min(520px, 100%);
                border: 1px solid rgba(255,34,68,.7);
                border-left: 4px solid #ff2244;
                background: rgba(8,10,16,.96);
                padding: 24px;
                box-shadow: 0 0 36px rgba(255,34,68,.22);
            }
            .mission-timeout-kicker {
                font-size: 9px;
                color: #ff2244;
                letter-spacing: .28em;
                margin-bottom: 10px;
            }
            .mission-timeout-title {
                font-family: 'Orbitron', 'Share Tech Mono', monospace;
                font-size: clamp(20px, 4vw, 34px);
                color: #ff2244;
                letter-spacing: .16em;
                margin-bottom: 12px;
            }
            .mission-timeout-copy {
                font-size: 12px;
                line-height: 1.8;
                color: #c2c8d8;
                margin-bottom: 20px;
            }
            .mission-timeout-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
                flex-wrap: wrap;
            }
            .mission-timeout-actions button,
            .mission-timeout-actions a {
                border: 1px solid #ffaa00;
                background: transparent;
                color: #ffaa00;
                padding: 10px 16px;
                font: inherit;
                font-size: 10px;
                letter-spacing: .14em;
                text-transform: uppercase;
                cursor: pointer;
                text-decoration: none;
            }
            .mission-timeout-actions button:hover,
            .mission-timeout-actions a:hover {
                background: #ffaa00;
                color: #050507;
            }
            body.mission-timer-expired main,
            body.mission-timer-expired #game-ui,
            body.mission-timer-expired .screen,
            body.mission-timer-expired .mission-shell {
                pointer-events: none;
            }
            @keyframes missionTimerPulse {
                0%, 100% { transform: translateY(0); box-shadow: 0 0 22px rgba(255,34,68,.16); }
                50% { transform: translateY(1px); box-shadow: 0 0 30px rgba(255,34,68,.34); }
            }
            @media (max-width: 720px) {
                .mission-timer-hud {
                    top: auto;
                    right: 12px;
                    bottom: 42px;
                    min-width: 118px;
                }
                .mission-timer-value { font-size: 15px; }
            }
        `;
        document.head.appendChild(style);
    }

    function ensureUI() {
        injectStyles();
        if (!hud) {
            hud = document.createElement("div");
            hud.className = "mission-timer-hud is-idle";
            hud.innerHTML = `
                <span class="mission-timer-label">// ${config.missionLabel} · TIEMPO RESTANTE</span>
                <span class="mission-timer-value">--:--</span>
            `;
            document.body.appendChild(hud);
        }
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "mission-timeout-overlay";
            overlay.innerHTML = `
                <div class="mission-timeout-box">
                    <div class="mission-timeout-kicker">// CPU TOMO LA VENTAJA</div>
                    <div class="mission-timeout-title">TIEMPO AGOTADO</div>
                    <p class="mission-timeout-copy">
                        La mision no se resolvio antes del limite. El rival automatizado cerro la ventana de respuesta.
                    </p>
                    <div class="mission-timeout-actions">
                        <button type="button" id="mission-timeout-retry">REINTENTAR</button>
                        <a href="../../index.html">VOLVER AL MAPA</a>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.querySelector("#mission-timeout-retry").addEventListener("click", () => {
                window.location.reload();
            });
        }
        updateHud();
    }

    function updateHud() {
        if (!hud) return;
        const value = hud.querySelector(".mission-timer-value");
        value.textContent = formatTime(remaining);
        hud.classList.toggle("is-low", remaining <= 30 && !completed && !expired);
        hud.classList.toggle("is-idle", !intervalId && !expired && !completed);
    }

    function start() {
        if (intervalId || expired || completed) return;
        if (typeof config.canStart === "function" && !config.canStart()) return;
        remaining = remaining > 0 ? remaining : config.durationSeconds;
        updateHud();
        intervalId = setInterval(tick, 1000);
        updateHud();
        window.dispatchEvent(new CustomEvent("missiontimer:start", { detail: { remaining } }));
    }

    function stop() {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
        completed = true;
        updateHud();
        window.dispatchEvent(new CustomEvent("missiontimer:stop", { detail: { remaining } }));
    }

    function reset() {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
        expired = false;
        completed = false;
        remaining = config.durationSeconds;
        document.body.classList.remove("mission-timer-expired");
        if (overlay) overlay.classList.remove("visible");
        updateHud();
    }

    function expire() {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
        expired = true;
        remaining = 0;
        document.body.classList.add("mission-timer-expired");
        ensureUI();
        overlay.classList.add("visible");
        updateHud();
        window.dispatchEvent(new CustomEvent("missiontimer:expired"));
    }

    function tick() {
        if ((typeof config.shouldStop === "function" && config.shouldStop()) || anySelectorVisible(config.stopWhenVisible) || anySelectorVisible(config.stopSelectors)) {
            stop();
            return;
        }
        remaining -= 1;
        if (remaining <= 0) {
            expire();
            return;
        }
        updateHud();
    }

    function bind() {
        config.startSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.addEventListener("click", () => setTimeout(start, 0)));
        });
        document.addEventListener("click", event => {
            const shouldStart = config.startSelectors.some(selector => {
                try {
                    return event.target.closest(selector);
                } catch (_) {
                    return false;
                }
            });
            if (shouldStart) setTimeout(start, 0);
        });
        config.resetSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.addEventListener("click", () => setTimeout(reset, 0)));
        });
        const observer = new MutationObserver(() => {
            if (!intervalId && !expired && !completed && anySelectorVisible(config.startWhenVisible)) start();
            if (intervalId && ((typeof config.shouldStop === "function" && config.shouldStop()) || anySelectorVisible(config.stopWhenVisible) || anySelectorVisible(config.stopSelectors))) stop();
        });
        observer.observe(document.body, { attributes: true, childList: true, subtree: true, attributeFilter: ["class", "style"] });
        if (anySelectorVisible(config.startWhenVisible)) start();
    }

    window.MissionTimer = {
        configure(options) {
            config = { ...DEFAULTS, ...options };
            remaining = config.durationSeconds;
            ensureUI();
            bind();
        },
        start,
        stop,
        reset,
        expire
    };
})();
