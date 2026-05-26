/*
   View del selector de misiones.

   Este archivo dibuja el SVG, tooltip, transicion, particulas y footer.
   No decide a que pagina navegar.
*/
const SelectorView = (() => {
    const SVG_NS = "http://www.w3.org/2000/svg";

    function renderLinks(nodes, links, state) {
        const layer = document.getElementById("links-layer");
        layer.innerHTML = "";

        links.forEach(([a, b], index) => {
            const n1 = nodes.find(node => node.id === a);
            const n2 = nodes.find(node => node.id === b);
            const isHot = state.activeNode === a || state.activeNode === b;
            const isDone = state.completed.includes(a) && state.completed.includes(b);

            ["link-base", "link-dash"].forEach((baseClass, layerIndex) => {
                const line = createSvgElement("line", {
                    x1: n1.x,
                    y1: n1.y,
                    x2: n2.x,
                    y2: n2.y
                });

                let className = baseClass;
                if (layerIndex === 1) {
                    className += isHot ? " hot" : isDone ? " done" : "";
                    line.style.animationDelay = `${index * 0.5}s`;
                }

                line.setAttribute("class", className);
                layer.appendChild(line);
            });
        });
    }

    function renderNodes(nodes, state, handlers) {
        const layer = document.getElementById("nodes-layer");
        layer.innerHTML = "";

        nodes.forEach(node => {
            const isDone = state.completed.includes(node.id);
            const isCredit = node.type === "credits";
            const isLocked = node.pending && !node.file;
            const radius = isCredit ? 20 : 62;
            const outerRadius = isCredit ? 30 : 82;
            const corruption = state.corruption[node.id] || 0;

            const group = createSvgElement("g", {
                class: `node-group${isDone ? " completed" : ""}${isCredit ? " cred-node" : ""}${isLocked ? " locked" : ""}`,
                transform: `translate(${node.x},${node.y})`
            });

            const pulse = createSvgElement("circle", { r: radius, class: "node-pulse" });
            pulse.style.animationDelay = `${node.id * 0.8}s`;

            const outer = createSvgElement("circle", { r: outerRadius, class: "node-outer" });
            outer.style.animationDelay = `${node.id * 3}s`;

            const body = createSvgElement("circle", { r: radius, class: "node-body" });

            group.appendChild(pulse);
            group.appendChild(outer);
            group.appendChild(body);

            if (!isCredit) {
                group.appendChild(createCorruptionArc(radius, corruption, isDone));
                group.appendChild(createText("t-id", "-40", `[0${node.id}]`));
                group.appendChild(createText("t-name", "-20", node.name));
                group.appendChild(createText("t-sub", "-4", node.sub));
                group.appendChild(createText("t-code", "12", node.code));
                group.appendChild(createText("t-corr", "28", getNodeStatusText(isLocked, isDone, corruption)));
            } else {
                group.appendChild(createText("t-name", "4", node.name));
            }

            group.addEventListener("click", () => handlers.onNavigate(node.id));
            group.addEventListener("mouseenter", event => handlers.onHoverStart(event, node));
            group.addEventListener("mousemove", moveTip);
            group.addEventListener("mouseleave", handlers.onHoverEnd);

            layer.appendChild(group);
        });
    }

    function showTip(event, node) {
        const tip = document.getElementById("tooltip");
        const status = node.pending && !node.file ? "<br><br>ESTADO: PENDIENTE" : "";
        tip.innerHTML = `<span class="tip-name">${node.name} // ${node.sub}</span>${node.desc}<br><br>ALGORITMO: ${node.code}${status}`;
        tip.style.display = "block";
        moveTip(event);
    }

    function moveTip(event) {
        const tip = document.getElementById("tooltip");
        tip.style.left = Math.min(event.clientX + 16, window.innerWidth - 240) + "px";
        tip.style.top = Math.min(event.clientY - 8, window.innerHeight - 110) + "px";
    }

    function hideTip() {
        document.getElementById("tooltip").style.display = "none";
    }

    function showPendingTransition(node) {
        document.getElementById("tr-title").textContent = node.name;
        document.getElementById("tr-sub").textContent = "PROTOCOLO PENDIENTE // AUN NO DISPONIBLE";
        document.getElementById("bar-fill").style.transition = "none";
        document.getElementById("bar-fill").style.width = "0%";
        document.getElementById("bar-pct").textContent = "0%";
        document.getElementById("tr-screen").classList.add("on");
    }

    function showNavigationTransition(node, onComplete) {
        const fill = document.getElementById("bar-fill");
        const percent = document.getElementById("bar-pct");

        document.getElementById("tr-title").textContent = node.name;
        document.getElementById("tr-sub").textContent = node.sub + " // " + node.code;
        document.getElementById("tr-screen").classList.add("on");

        fill.style.transition = "none";
        fill.style.width = "0%";
        percent.textContent = "0%";

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                fill.style.transition = "width 1.6s ease";
                fill.style.width = "100%";
            });
        });

        let progress = 0;
        const intervalId = setInterval(() => {
            progress = Math.min(progress + 2, 100);
            percent.textContent = progress + "%";
            if (progress >= 100) clearInterval(intervalId);
        }, 32);

        setTimeout(onComplete, 1800);
    }

    function hideTransition() {
        document.getElementById("tr-screen").classList.remove("on");
    }

    function updateFooter(state) {
        const totalMissions = 5;
        const done = state.completed.filter(id => id <= totalMissions).length;
        document.getElementById("progress-text").textContent = `SECTORES RESTAURADOS: ${done}/${totalMissions}`;
        document.getElementById("nodes-val").textContent = `${totalMissions - done}/${totalMissions}`;
        document.getElementById("integrity-val").textContent = Math.min(23 + done * 15, 100) + "%";
    }

    function updateClock() {
        const date = new Date();
        const pad = value => String(value).padStart(2, "0");
        document.getElementById("clock").textContent = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    function spawnParticles() {
        const container = document.getElementById("particles");
        const chars = "010110100111ABCDEFG10010";

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement("div");
            const size = Math.random() > 0.7 ? "2px" : "1px";
            particle.className = "particle";
            particle.style.cssText = `left:${Math.random() * 100}vw;bottom:${Math.random() * 40}vh;width:${size};height:${size};--dx:${Math.random() * 50 - 25}px;animation-duration:${5 + Math.random() * 9}s;animation-delay:${Math.random() * 10}s`;
            container.appendChild(particle);
        }

        for (let i = 0; i < 12; i++) {
            const stream = document.createElement("div");
            let text = "";
            stream.className = "data-stream";

            for (let j = 0; j < 14; j++) {
                text += chars[Math.floor(Math.random() * chars.length)] + " ";
            }

            stream.textContent = text;
            stream.style.cssText = `left:${5 + Math.random() * 90}vw;top:-60px;animation-duration:${9 + Math.random() * 14}s;animation-delay:${Math.random() * 12}s`;
            container.appendChild(stream);
        }
    }

    function ambientGlitch() {
        const bodies = document.querySelectorAll(".node-body");
        if (!bodies.length) return;

        const target = bodies[Math.floor(Math.random() * bodies.length)];
        target.style.opacity = Math.random() > 0.07 ? "1" : "0.45";
        setTimeout(() => { target.style.opacity = "1"; }, 70);
    }

    function createCorruptionArc(radius, corruption, isDone) {
        const percent = isDone ? 0 : corruption / 100;
        const circumference = 2 * Math.PI * radius;
        const arc = createSvgElement("circle", {
            r: radius,
            fill: "none",
            stroke: isDone ? "#00ff41" : "#ff2244",
            "stroke-width": "2",
            "stroke-dasharray": `${percent * circumference} ${circumference}`,
            "stroke-dashoffset": circumference * 0.25,
            opacity: "0.35"
        });

        arc.style.transform = "rotate(-90deg)";
        arc.style.transformBox = "fill-box";
        arc.style.transformOrigin = "center";
        return arc;
    }

    function createText(className, dy, textContent) {
        const text = createSvgElement("text", {
            class: className,
            "text-anchor": "middle",
            dy
        });
        text.textContent = textContent;
        return text;
    }

    function createSvgElement(tag, attrs = {}) {
        const element = document.createElementNS(SVG_NS, tag);
        Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
        return element;
    }

    function getNodeStatusText(isLocked, isDone, corruption) {
        if (isLocked) return "PENDIENTE";
        if (isDone) return "RESTAURADO";
        return `CORRUPCION: ${corruption}%`;
    }

    return {
        renderLinks,
        renderNodes,
        showTip,
        hideTip,
        showPendingTransition,
        showNavigationTransition,
        hideTransition,
        updateFooter,
        updateClock,
        spawnParticles,
        ambientGlitch
    };
})();
