/*
   Controller - Mision Final

   Conecta el estado narrativo con la vista.
*/
const FinalController = (() => {
    let clockTimer = null;

    // Inicializa efectos, primer render y reloj global.
    function init() {
        FinalView.spawnParticles();
        renderAll();
        FinalView.updateClock();
        clockTimer = setInterval(FinalView.updateClock, 1000);
        window.addEventListener("beforeunload", () => clearInterval(clockTimer));
    }

    // Relee modelo completo y refresca todas las zonas de la UI.
    function renderAll() {
        const state = FinalModel.getState();
        FinalView.applyRestorationState(state);
        FinalView.renderGlobalStatus(state);
        FinalView.renderFractureMap(state);
        FinalView.renderModules(FinalModel.getModules(), state, {
            onSelect: handleModuleSelect
        });
        FinalView.renderPhasePanel(FinalModel.getModule(state.activeModuleId), FinalModel.getPhase(), state, {
            onStart: handlePhaseStart,
            onAction: handlePhaseAction
        });
    }

    // Selecciona tarjeta de modulo sin ejecutar aun el reto.
    function handleModuleSelect(moduleId) {
        FinalModel.selectModule(moduleId);
        renderAll();
    }

    // Inicia la fase jugable del modulo seleccionado.
    function handlePhaseStart(moduleId) {
        FinalModel.startPhase(moduleId);
        renderAll();
    }

    // Ejecuta acciones de minijuego y re-renderiza el resultado.
    function handlePhaseAction(action, payload) {
        FinalModel.handleAction(action, payload);
        renderAll();
    }

    return { init };
})();

document.addEventListener("DOMContentLoaded", FinalController.init);
