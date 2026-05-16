/*
   Controller del selector de misiones.

   Este archivo conecta Model y View.
   Aqui viven los eventos, timers y navegacion.
*/
const SelectorController = (() => {
    function init() {
        document.getElementById("btn-cancel").addEventListener("click", SelectorView.hideTransition);

        SelectorView.spawnParticles();
        renderAll();

        setInterval(SelectorView.updateClock, 1000);
        setInterval(SelectorView.ambientGlitch, 600);
        setInterval(updateCorruption, 3000);

        SelectorView.updateClock();
    }

    function renderAll() {
        const nodes = SelectorModel.getNodes();
        const links = SelectorModel.getLinks();
        const state = SelectorModel.getState();

        SelectorView.renderLinks(nodes, links, state);
        SelectorView.renderNodes(nodes, state, {
            onNavigate: navigate,
            onHoverStart: handleHoverStart,
            onHoverEnd: handleHoverEnd
        });
        SelectorView.updateFooter(state);
    }

    function navigate(id) {
        const node = SelectorModel.getNode(id);
        if (!node) return;

        if (!node.file) {
            SelectorView.showPendingTransition(node);
            return;
        }

        SelectorView.showNavigationTransition(node, () => {
            window.location.href = node.file;
        });
    }

    function handleHoverStart(event, node) {
        SelectorModel.setActiveNode(node.id);
        SelectorView.renderLinks(SelectorModel.getNodes(), SelectorModel.getLinks(), SelectorModel.getState());
        SelectorView.showTip(event, node);
    }

    function handleHoverEnd() {
        SelectorModel.clearActiveNode();
        SelectorView.renderLinks(SelectorModel.getNodes(), SelectorModel.getLinks(), SelectorModel.getState());
        SelectorView.hideTip();
    }

    function markCompleted(id) {
        SelectorModel.markCompleted(id);
        renderAll();
    }

    function updateCorruption() {
        SelectorModel.fluctuateCorruption();
        renderAll();
    }

    return {
        init,
        markCompleted
    };
})();

document.addEventListener("DOMContentLoaded", SelectorController.init);

// Expuesto por compatibilidad si luego una mision necesita marcarse completada.
window.marcarCompletada = SelectorController.markCompleted;
