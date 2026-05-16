/*
  Controller — Mision 3: Reconstruir la Red
  Conecta eventos del usuario con Model y View.
  No contiene logica de grafo ni de renderizado.
*/
const Controller = (() => {

  function init() {
    Model.init();
    bindAlgorithmSelector();
    bindStartButton();
    bindResetButton();
    refresh();
  }

  function bindAlgorithmSelector() {
    document.querySelectorAll("[data-algorithm]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (Model.state.running) return; // bloquear durante animacion
        Model.setAlgorithm(btn.dataset.algorithm);
        refresh();
      });
    });
  }

  function bindStartButton() {
    document.getElementById("btn-start").addEventListener("click", () => {
      if (Model.state.running || Model.state.finished) return;

      View.setControlsLocked(true);

      Model.runAnimation(
        () => refresh(),                    // onStep: re-render en cada paso
        (totalCost, algorithm, evaluatedSteps) => {
          refresh();
          View.showVictory(totalCost, algorithm, evaluatedSteps);
          View.setControlsLocked(false);
        }
      );
    });
  }

  function bindResetButton() {
    document.getElementById("btn-reset").addEventListener("click", () => {
      if (Model.state.running) return;
      Model.newGame();          // grafo nuevo cada vez que se resetea
      View.hideVictory();
      View.setControlsLocked(false);
      refresh();
    });
  }

  function refresh() {
    View.render(Model.getGraph(), Model.state);
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", Controller.init);
