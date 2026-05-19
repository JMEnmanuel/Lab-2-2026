/*
  Controller - Mision 4
  Arranque minimo: inicializa el modelo, resuelve el flujo y renderiza la base.
*/
const Mission4Controller = (() => {
  function init() {
    Mission4Model.init();
    const solution = Mission4Model.solveMaxFlow();
    Mission4View.render(Mission4Model.getGraph(), solution);
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", Mission4Controller.init);
