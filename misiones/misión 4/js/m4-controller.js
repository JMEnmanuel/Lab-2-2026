/*
  Controller - Mision 4: Control del Impacto
  + Boton confirmar ruta (modo Desafio)
  + Init de particulas
*/
const Mission4Controller = (() => {

  let started  = false;
  let finished = false;

  /* ── estado de la UI ────────────────────────────────────────────── */

  function getViewState() {
    return {
      currentPath:       Mission4Model.getCurrentPath(),
      currentBottleneck: Mission4Model.getCurrentBottleneck(),
      maxFlow:           Mission4Model.state.maxFlow,
      finished:          Mission4Model.state.finished,
      steps:             Mission4Model.state.steps.map(s => ({ ...s, path: [...s.path] }))
    };
  }

  function getChallengeViewState() {
    return {
      selectedPath: Mission4Model.getSelectedPath(),
      feedback:     Mission4Model.state.feedback,
      maxFlow:      Mission4Model.state.maxFlow,
      steps:        Mission4Model.state.steps.map(s => ({ ...s, path: [...s.path] })),
      onNodeClick:  handleNodeClick
    };
  }

  /* ── handler de click en nodo (modo Desafio) ─────────────────────── */

  function handleNodeClick(nodeId) {
    if (Mission4Model.getMode() !== "challenge") return;
    if (Mission4Model.state.finished) return;

    Mission4Model.selectPathNode(nodeId);
    Mission4View.updateChallenge(Mission4Model.getGraph(), getChallengeViewState());
  }

  /* ── confirmar ruta en modo Desafio ─────────────────────────────── */

  function handleConfirmPath() {
    if (Mission4Model.getMode() !== "challenge") return;
    if (Mission4Model.state.finished) return;

    const path = Mission4Model.getSelectedPath();
    if (path.length < 2) return;

    const result = Mission4Model.applyAugmentingPath(path);

    if (result.applied) {
      // limpiar selección tras aplicar
      Mission4Model.resetSelectedPath();

      // si acaba de terminar, mostramos overlay
      if (result.finished) {
        Mission4View.updateChallenge(Mission4Model.getGraph(), getChallengeViewState());
        if (window.RankingMode && RankingMode.isActive()) {
          RankingMode.finish({
            success: true,
            extra: { maxFlow: result.maxFlow, steps: Mission4Model.state.steps.length }
          });
        }
        Mission4View.showCompletion(result.maxFlow);
      } else {
        // feedback positivo en el estado del modelo (lo pone applyAugmentingPath pero
        // lo sobreescribimos aquí con un mensaje más descriptivo)
        Mission4Model.state.feedback = {
          ok: true,
          message: `✔ Flujo +${result.bottleneck} aplicado. Flujo total: ${result.maxFlow}.`
        };
        Mission4View.updateChallenge(Mission4Model.getGraph(), getChallengeViewState());
      }
    } else {
      // no debería pasar si el botón está bien deshabilitado, pero por seguridad:
      Mission4Model.state.feedback = {
        ok: false,
        message: result.reason || "Ruta inválida."
      };
      Mission4View.updateChallenge(Mission4Model.getGraph(), getChallengeViewState());
    }
  }

  /* ── limpiar ruta seleccionada ──────────────────────────────────── */

  function handleClearPath() {
    if (Mission4Model.getMode() !== "challenge") return;
    Mission4Model.resetSelectedPath();
    Mission4View.updateChallenge(Mission4Model.getGraph(), getChallengeViewState());
  }

  /* ── cambio de modo ─────────────────────────────────────────────── */

  function applyMode(mode) {
    Mission4Model.setMode(mode);

    const btnTutorial   = document.getElementById("btn-mode-tutorial");
    const btnChallenge  = document.getElementById("btn-mode-challenge");
    const tutorialCtrl  = document.getElementById("tutorial-controls");
    const challengeCtrl = document.getElementById("challenge-controls");

    if (mode === "tutorial") {
      btnTutorial.classList.add("btn-mode-active");
      btnChallenge.classList.remove("btn-mode-active");
      tutorialCtrl.style.display  = "";
      challengeCtrl.style.display = "none";
    } else {
      btnChallenge.classList.add("btn-mode-active");
      btnTutorial.classList.remove("btn-mode-active");
      tutorialCtrl.style.display  = "none";
      challengeCtrl.style.display = "";
    }

    Mission4Model.reset();
    started  = false;
    finished = false;

    if (mode === "challenge") {
      Mission4View.render(Mission4Model.getGraph(), {});
      Mission4View.updateChallenge(Mission4Model.getGraph(), getChallengeViewState());
    } else {
      Mission4View.render(Mission4Model.getGraph(), {});
    }
  }

  /* ── handlers tutorial ──────────────────────────────────────────── */

  function handleStart() {
    if (started || Mission4Model.getMode() !== "tutorial") return;
    started  = true;
    finished = false;
    const result = Mission4Model.runNextAugmentingStep();
    finished = result.finished || false;
    Mission4View.update(Mission4Model.getGraph(), getViewState());
  }

  function handleNext() {
    if (!started || finished || Mission4Model.getMode() !== "tutorial") return;
    const result = Mission4Model.runNextAugmentingStep();
    finished = result.finished || false;
    Mission4View.update(Mission4Model.getGraph(), getViewState());
  }

  function handleReset() {
    if (window.RankingMode && RankingMode.isActive()) RankingMode.finish({ success: false });
    Mission4Model.reset();
    started  = false;
    finished = false;
    Mission4View.render(Mission4Model.getGraph(), {});
  }

  /* ── enlazar botones ────────────────────────────────────────────── */

  function bindButtons() {
    const btnStart     = document.getElementById("btn-start");
    const btnNext      = document.getElementById("btn-next");
    const btnReset     = document.getElementById("btn-reset");
    const btnClose     = document.getElementById("btn-close-completion");
    const btnTutorial  = document.getElementById("btn-mode-tutorial");
    const btnChallenge = document.getElementById("btn-mode-challenge");
    const btnRanking   = document.getElementById("btn-start-ranking");
    const btnConfirm   = document.getElementById("btn-confirm-path");
    const btnClear     = document.getElementById("btn-clear-path");

    if (btnStart)     btnStart.addEventListener("click",     handleStart);
    if (btnNext)      btnNext.addEventListener("click",      handleNext);
    if (btnReset)     btnReset.addEventListener("click",     handleReset);
    if (btnClose)     btnClose.addEventListener("click",     () => {
      if (window.RankingMode && RankingMode.isActive()) RankingMode.finish({ success: false });
      handleReset();
    });
    if (btnTutorial)  btnTutorial.addEventListener("click",  () => applyMode("tutorial"));
    if (btnChallenge) btnChallenge.addEventListener("click", () => applyMode("challenge"));
    if (btnRanking)   btnRanking.addEventListener("click",   () => {
      RankingMode.begin({
        missionId: "mision-4",
        missionLabel: "MISION 04",
        onStart: () => applyMode("challenge")
      });
    });
    const btnViewRanking = document.getElementById("btn-view-ranking");
    if (btnViewRanking) btnViewRanking.addEventListener("click", () => RankingMode.showBoard("mision-4"));
    if (btnConfirm)   btnConfirm.addEventListener("click",   handleConfirmPath);
    if (btnClear)     btnClear.addEventListener("click",     handleClearPath);
  }

  /* ── arranque ───────────────────────────────────────────────────── */

  function init() {
    Mission4Model.init();
    Mission4View.initParticles();          // ← sistema de partículas
    Mission4View.render(Mission4Model.getGraph(), {});
    bindButtons();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", Mission4Controller.init);
