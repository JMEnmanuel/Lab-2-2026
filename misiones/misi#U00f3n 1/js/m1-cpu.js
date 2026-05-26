/*
   Efectos visuales de la CPU rival para Mision 1.

   El Controller decide cuando hay turno de CPU.
   Este archivo decide que interferencias aparecen y como se comportan.
*/
const M1CpuEffects = (() => {
    const EVENT_TABLE = {
        correct:    { none: 0.16, popup: 0.42, blackout: 0.18, mirror: 0.16, combo: 0.08 },
        repeat:     { none: 0.10, popup: 0.44, blackout: 0.20, mirror: 0.16, combo: 0.10 },
        mistake:    { none: 0.05, popup: 0.46, blackout: 0.20, mirror: 0.15, combo: 0.14 },
        accusation: { none: 0.04, popup: 0.42, blackout: 0.22, mirror: 0.15, combo: 0.17 }
    };

    function runTurn(kind, cpu) {
        const pressure = cpu.pressure || 'stable';
        const event = pickEvent(kind, pressure);

        if (event === 'popup' || event === 'combo') {
            showPopup(kind, cpu);
        }

        if (event === 'blackout' || event === 'combo') {
            flickerVision(kind, pressure, Math.random() < 0.55 ? 'blackout' : 'jam');
        }

        if (event === 'mirror' || event === 'combo') {
            mirrorVision(kind, pressure);
        }

        if ((kind === 'mistake' || pressure === 'critical') && Math.random() < 0.32) {
            setTimeout(() => showPopup('repeat', cpu), 260);
        }
    }

    function showPopup(kind, cpu) {
        const layer = getLayer();
        if (!layer || !cpu) return;

        const activeAds = [...layer.querySelectorAll('.cpu-ad-popup')];
        if (activeAds.length >= 4) activeAds[0].remove();

        const pressure = cpu.pressure || 'stable';
        const variant = pickVariant(cpu.turn, kind);
        const ad = document.createElement('div');
        ad.className = `cpu-ad-popup ${kind || 'correct'} ${pressure} ${variant.size}`;
        setPopupPosition(ad, cpu.turn, 0);

        const copy = getCopy(kind, pressure);
        ad.innerHTML = `
            <div class="cpu-ad-chrome">
                <span>${copy.tag}</span>
                <button type="button" class="cpu-ad-close" aria-label="Cerrar interferencia">x</button>
            </div>
            <div class="cpu-ad-title">${copy.title}</div>
            <div class="cpu-ad-body">${copy.body}</div>
            <div class="cpu-ad-meter">
                <span>RUIDO CPU</span>
                <strong>${cpu.progress}%</strong>
            </div>
        `;

        let closeTricks = [...variant.closeTricks];
        const closeButton = ad.querySelector('.cpu-ad-close');
        closeButton.addEventListener('click', e => {
            e.stopPropagation();
            if (closeTricks.length > 0) {
                applyCloseTrick(ad, closeTricks.shift(), cpu.turn, closeTricks.length);
                return;
            }
            closePopup(ad);
        });
        ad.addEventListener('click', e => e.stopPropagation());
        layer.appendChild(ad);

        const life = pressure === 'critical' ? 7000 : pressure === 'warning' ? 5600 : 4200;
        setTimeout(() => closePopup(ad), life);
    }

    function flickerVision(kind, pressure, mode) {
        const layer = getLayer();
        if (!layer) return;

        const jam = document.createElement('div');
        jam.className = `cpu-vision-jam ${pressure} ${mode}`;
        jam.innerHTML = `
            <div class="cpu-vision-noise"></div>
            <div class="cpu-vision-label">${getJamLabel(kind)}</div>
        `;
        layer.appendChild(jam);
        const duration = pressure === 'critical' ? 1450 : pressure === 'warning' ? 1150 : 850;
        setTimeout(() => jam.remove(), duration);
    }

    function mirrorVision(kind, pressure) {
        const canvas = document.getElementById('main-canvas');
        const layer = getLayer();
        if (!canvas || !layer) return;

        canvas.classList.add('cpu-mirror-active');
        const label = document.createElement('div');
        label.className = `cpu-mirror-label ${pressure}`;
        label.textContent = getMirrorLabel(kind);
        layer.appendChild(label);

        const duration = pressure === 'critical' ? 2600 : pressure === 'warning' ? 2200 : 1700;
        setTimeout(() => {
            canvas.classList.remove('cpu-mirror-active');
            label.remove();
        }, duration);
    }

    function applyCloseTrick(ad, trick, turn, remaining) {
        if (trick === 'resize') {
            resizePopup(ad);
            return;
        }
        if (trick === 'glitch') {
            glitchPopup(ad);
            return;
        }
        dodgePopup(ad, turn, remaining);
    }

    function dodgePopup(ad, turn, salt) {
        ad.classList.remove('dodging');
        setPopupPosition(ad, turn, salt + 1);
        ad.offsetHeight;
        ad.classList.add('dodging');
        setTimeout(() => ad.classList.remove('dodging'), 240);
    }

    function resizePopup(ad) {
        ad.classList.remove('tiny', 'normal', 'giant', 'resizing');
        ad.classList.add(Math.random() < 0.58 ? 'giant' : 'tiny');
        ad.offsetHeight;
        ad.classList.add('resizing');
        setTimeout(() => ad.classList.remove('resizing'), 300);
    }

    function glitchPopup(ad) {
        ad.classList.remove('glitching');
        ad.offsetHeight;
        ad.classList.add('glitching');
        setTimeout(() => ad.classList.remove('glitching'), 360);
    }

    function closePopup(ad) {
        if (!ad || ad.classList.contains('closing')) return;
        ad.classList.add('closing');
        setTimeout(() => ad.remove(), 170);
    }

    function clear() {
        const layer = getLayer();
        if (layer) layer.innerHTML = '';
        const canvas = document.getElementById('main-canvas');
        if (canvas) canvas.classList.remove('cpu-mirror-active');
    }

    function getLayer() {
        return document.getElementById('cpu-ad-layer');
    }

    function setPopupPosition(ad, turn, salt) {
        const x = ((turn * 73 + salt * 97) % 300) - 150;
        const y = ((turn * 47 + salt * 83) % 230) - 115;
        ad.style.left = `calc(50% + ${x}px)`;
        ad.style.top = `calc(50% + ${y}px)`;
    }

    function pickVariant(turn, kind) {
        const roll = Math.random();
        const size = roll > 0.62 ? 'giant' : roll < 0.18 ? 'tiny' : 'normal';
        const trickCount = roll > 0.72 ? 3 : roll > 0.36 ? 2 : 1;
        return { size, closeTricks: makeCloseTricks(trickCount) };
    }

    function makeCloseTricks(count) {
        const options = ['dodge', 'resize', 'glitch'];
        const tricks = [];
        for (let i = 0; i < count; i++) {
            tricks.push(options[Math.floor(Math.random() * options.length)]);
        }
        return tricks;
    }

    function pickEvent(kind, pressure) {
        const table = { ...(EVENT_TABLE[kind] || EVENT_TABLE.correct) };
        if (pressure === 'warning') {
            table.none = Math.max(0.04, table.none - 0.06);
            table.combo += 0.06;
        }
        if (pressure === 'critical') {
            table.none = 0.02;
            table.popup += 0.06;
            table.blackout += 0.04;
            table.mirror += 0.04;
            table.combo += 0.12;
        }

        const total = table.none + table.popup + table.blackout + table.mirror + table.combo;
        const roll = Math.random() * total;
        if (roll < table.none) return 'none';
        if (roll < table.none + table.popup) return 'popup';
        if (roll < table.none + table.popup + table.blackout) return 'blackout';
        if (roll < table.none + table.popup + table.blackout + table.mirror) return 'mirror';
        return 'combo';
    }

    function getCopy(kind, pressure) {
        const critical = pressure === 'critical';
        const copies = {
            correct: {
                tag: '// ANUNCIO INFECTADO',
                title: critical ? 'ULTIMA HORA: RUMOR EN VIVO' : 'Nuevo comentario sospechoso',
                body: 'La CPU abre una interrupcion sobre tu ruta. Puede cerrarse, si logras alcanzarla.'
            },
            repeat: {
                tag: '// REDIRECCION',
                title: 'Ese nodo ya fue revisado',
                body: 'La duda le da espacio a la CPU para mover ventanas falsas por el tablero.'
            },
            mistake: {
                tag: '// POP-UP HOSTIL',
                title: critical ? 'PISTA CONTAMINADA' : 'Oferta de pista falsa',
                body: 'El error activa ruido visual: la ventana intenta escapar antes de cerrarse.'
            },
            accusation: {
                tag: '// DESINFORMACION',
                title: 'Acusacion discutida',
                body: 'La CPU convierte el fallo en ruido publico y bloquea tu lectura del tablero.'
            }
        };
        return copies[kind] || copies.correct;
    }

    function getJamLabel(kind) {
        if (kind === 'mistake') return 'VISION BLOQUEADA // ERROR APROVECHADO';
        if (kind === 'accusation') return 'DESINFORMACION EN PANTALLA';
        if (kind === 'repeat') return 'RUIDO POR REVISION REPETIDA';
        return 'INTERFERENCIA DE CPU';
    }

    function getMirrorLabel(kind) {
        if (kind === 'mistake') return 'ESPEJO ACTIVADO // RUTA INVERTIDA';
        if (kind === 'accusation') return 'REFLEJO DE DESINFORMACION';
        if (kind === 'repeat') return 'ESPEJO POR DUDA DETECTADA';
        return 'CPU INVIERTE LA VISION';
    }

    return { runTurn, clear };
})();

window.M1CpuEffects = M1CpuEffects;
