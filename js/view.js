// La vista se encarga de dibujar y mostrar/ocultar elementos
var nodesLayer = document.getElementById('nodes-layer');
var connectionsLayer = document.getElementById('connections-layer');
var transitionScreen = document.getElementById('transition-screen');
var transitionText = document.getElementById('transition-text');

function drawConnections() {
    connectionsLayer.innerHTML = '';
    links.forEach(link => {
        const startNode = nodesData.find(n => n.id === link[0]);
        const endNode = nodesData.find(n => n.id === link[1]);
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("class", "connection");
        line.setAttribute("x1", startNode.x);
        line.setAttribute("y1", startNode.y);
        line.setAttribute("x2", endNode.x);
        line.setAttribute("y2", endNode.y);
        connectionsLayer.appendChild(line);
    });
}

function drawNodes(onClickCallback) {
    nodesLayer.innerHTML = '';
    nodesData.forEach(node => {
        const isCompleted = misionesCompletadas.includes(node.id);
        
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", `node-group ${isCompleted ? 'completed' : ''}`);
        g.setAttribute("transform", `translate(${node.x}, ${node.y})`);
        
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", "45");
        circle.setAttribute("class", "node-circle");
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("class", "node-text");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dy", "5");
        text.textContent = node.name;

        g.appendChild(circle);
        g.appendChild(text);

        // Pasamos el evento al controlador mediante el callback
        g.addEventListener('click', () => onClickCallback(node.id));

        nodesLayer.appendChild(g);
    });
}

function showTransition(name) {
    transitionText.textContent = `CARGANDO: ${name.toUpperCase()}...`;
    transitionScreen.style.display = 'flex';
}

function hideTransition() {
    transitionScreen.style.display = 'none';
}