// El controlador une el modelo con la vista y maneja la lógica
function init() {
    // Dibujamos inicialmente pasando la función de navegación como callback
    drawConnections();
    drawNodes(navegarMision);
    
    // Configurar listener para el botón de volver
    document.getElementById('btn-volver').addEventListener('click', volverAlGrafo);

    // Iniciar efectos ambientales
    iniciarEfectosGlitch();
}

function navegarMision(id) {
    const node = nodesData.find(n => n.id === id);
    if (node) {
        showTransition(node.name);
    }
}

function volverAlGrafo() {
    hideTransition();
}

function marcarCompletada(id) {
    if (!misionesCompletadas.includes(id)) {
        misionesCompletadas.push(id);
        // Volver a renderizar los nodos para reflejar el nuevo estado
        drawNodes(navegarMision);
    }
}

function iniciarEfectosGlitch() {
    setInterval(() => {
        const circles = document.querySelectorAll('.node-circle:not(.completed)');
        if(circles.length > 0) {
            const randomIdx = Math.floor(Math.random() * circles.length);
            const target = circles[randomIdx];
            target.style.opacity = Math.random() > 0.1 ? "1" : "0.4";
            setTimeout(() => target.style.opacity = "1", 100);
        }
    }, 1000);
}

// Arrancar la aplicación al cargar los scripts
init();