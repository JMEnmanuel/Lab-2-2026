/*
  View - Mision 4
  Render minimo para verificar que el modelo de flujo carga y se puede inspeccionar.
*/
const Mission4View = (() => {
  const SVG_NS = "http://www.w3.org/2000/svg";

  function render(graph, solution) {
    renderGraph(graph);
    renderSummary(graph, solution);
    renderSteps(solution.steps);
  }

  function renderGraph(graph) {
    const svg = document.getElementById("flow-graph");
    if (!svg) return;
    svg.innerHTML = "";

    const defs = createSvgEl("defs");
    defs.appendChild(createMarker("arrow", "#33475c"));
    defs.appendChild(createMarker("arrow-green", "#3fb950"));
    svg.appendChild(defs);

    graph.edges.forEach(edge => {
      const from = graph.nodes.find(node => node.id === edge.from);
      const to = graph.nodes.find(node => node.id === edge.to);
      if (!from || !to) return;

      const line = createSvgEl("line", {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        class: edge.flow > 0 ? "edge-flow" : "edge-line"
      });
      svg.appendChild(line);

      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      const label = createSvgEl("text", {
        x: mx,
        y: my - 8,
        class: "edge-label"
      });
      label.textContent = `${edge.flow}/${edge.capacity}`;
      svg.appendChild(label);
    });

    graph.nodes.forEach(node => {
      const group = createSvgEl("g", {
        class: `node node-${node.type}`,
        transform: `translate(${node.x}, ${node.y})`
      });
      group.appendChild(createSvgEl("circle", { r: 30, class: "node-core" }));
      const label = createSvgEl("text", { class: "node-label" });
      label.textContent = node.id;
      group.appendChild(label);
      svg.appendChild(group);
    });
  }

  function renderSummary(graph, solution) {
    const target = document.getElementById("flow-summary");
    if (!target) return;
    target.innerHTML = `
      <div class="summary-line">Fuente: <strong>${graph.source}</strong></div>
      <div class="summary-line">Destino: <strong>${graph.sink}</strong></div>
      <div class="summary-line">Flujo maximo esperado: <strong>${solution.expected}</strong></div>
      <div class="summary-line">Flujo calculado: <strong>${solution.maxFlow}</strong></div>
      <div class="summary-line">Verificacion: <strong>${solution.passed ? "OK" : "REVISAR"}</strong></div>
    `;
  }

  function renderSteps(steps) {
    const target = document.getElementById("flow-steps");
    if (!target) return;
    target.innerHTML = "";
    steps.forEach((step, index) => {
      const row = document.createElement("div");
      row.className = "step-line";
      row.innerHTML = `${index + 1}. ${step.path.join(" -> ")} | cuello <strong>${step.bottleneck}</strong> | total <strong>${step.maxFlow}</strong>`;
      target.appendChild(row);
    });
  }

  function createMarker(id, color) {
    const marker = createSvgEl("marker", {
      id,
      viewBox: "0 0 10 10",
      refX: "9",
      refY: "5",
      markerWidth: "6",
      markerHeight: "6",
      orient: "auto-start-reverse"
    });
    marker.appendChild(createSvgEl("path", {
      d: "M 0 0 L 10 5 L 0 10 z",
      fill: color
    }));
    return marker;
  }

  function createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
    return el;
  }

  return { render };
})();
