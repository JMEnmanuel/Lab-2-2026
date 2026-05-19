/*
  Controller — Mision 3: Reconstruir la Red
  Conecta eventos del usuario con Model y View.
  No contiene logica de grafo ni de renderizado.
*/
const Controller = (() => {

  function init() {
    Model.init();
    bindModeSelector();
    bindAlgorithmSelector();
    bindStartButton();
    bindResetButton();
    refresh();
  }

  function bindModeSelector() {
    document.querySelectorAll("[data-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (Model.state.running) return;
        Model.setMode(btn.dataset.mode);
        updateModeUI();
        refresh();
      });
    });
  }

  function updateModeUI() {
    const mode = Model.state.mode;
    // Botones de modo
    document.querySelectorAll("[data-mode]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });
    // Texto del botón INICIAR
    const btnStart = document.getElementById("btn-start");
    if (btnStart) {
      btnStart.dataset.currentMode = mode;
      btnStart.querySelector(".btn-label").textContent =
        mode === "tutorial" ? "VER DEMO" : "JUGAR";
    }
    // Panel intro — descripción contextual
    const introDesc = document.getElementById("mode-description");
    if (introDesc) {
      introDesc.textContent = mode === "tutorial"
        ? "Observa cómo el algoritmo reconstruye la red paso a paso de forma automática."
        : "Pon a prueba tu conocimiento: selecciona las aristas tú mismo para reconstruir la red.";
    }
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

      if (Model.state.mode === "challenge") {
        startChallenge();
        return;
      }

      // Modo Tutorial — animación automática
      View.setControlsLocked(true);
      Model.runAnimation(
        () => refresh(),
        (totalCost, algorithm, evaluatedSteps) => {
          refresh();
          View.showVictory(totalCost, algorithm, evaluatedSteps);
          View.setControlsLocked(false);
        }
      );
    });
  }

  function startChallenge() {
    // Resetear al estado limpio con las mismas aristas
    Model.resetEdges();
    View.hideVictory();

    // Para Prim: marcar el nodo inicial como incluido en el panel visual
    if (Model.state.algorithm === "prim") {
      const startId = Model.state.challenge.startNode;
      // Mostrar el nodo inicial como incluido desde el arranque
      Model.state.mstNodes = [startId];
      Model.state.pendingNodes = Model.state.nodes
        .filter(n => n.id !== startId).map(n => n.id);
      Model.state.nodes.forEach(n => {
        n.inMST = n.id === startId;
        n.state = n.inMST ? "idle" : "pending";
      });
      // Poblar frontera inicial
      Model.state.frontierEdges = Model.getPrimFrontier().map(e => e.id);
      Model.state.activeFrontierNode = startId;
      Model.state.log = [
        `Prim inicia desde ${startId === 1 ? "Ana" : "nodo " + startId}. Selecciona la arista mínima de la frontera.`
      ];
    } else {
      Model.state.log = ["Kruskal listo. Selecciona la arista de menor peso que no forme ciclo."];
    }

    // Registrar handler de clicks
    View.setChallengeEdgeHandler(handleChallengeMove);
    const total = Model.state.nodes.length - 1;
    View.renderChallengeHint(Model.state.algorithm, false, 0, total);
    refresh();
  }

  function handleChallengeMove(edgeId) {
    if (Model.state.finished) return;

    const isCorrect = Model.state.algorithm === "kruskal"
      ? Model.validateKruskalMove(edgeId)
      : Model.validatePrimMove(edgeId);

    if (isCorrect) {
      // Aplicar jugada correcta en el modelo
      if (Model.state.algorithm === "kruskal") {
        Model.applyKruskalMove(edgeId);
      } else {
        Model.applyPrimMove(edgeId);
      }

      View.flashEdge(edgeId, "correct");

      const total = Model.state.nodes.length - 1;

      // Comprobar victoria
      if (Model.isMSTComplete()) {
        Model.state.finished = true;
        View.setChallengeEdgeHandler(null);
        View.renderChallengeHint(Model.state.algorithm, true, total, total);
        refresh();
        View.showVictory(Model.state.totalCost, Model.state.algorithm, Model.state.evaluatedSteps);
        return;
      }

      // Actualizar frontera de Prim en el panel
      if (Model.state.algorithm === "prim") {
        Model.state.frontierEdges = Model.getPrimFrontier().map(e => e.id);
      }

      View.renderChallengeHint(Model.state.algorithm, false, Model.state.acceptedCount, total);

    } else {
      // Jugada incorrecta — feedback sin revelar la respuesta
      View.flashEdge(edgeId, "wrong");
      const msg = Model.state.algorithm === "kruskal"
        ? "Esa arista formaría un ciclo o no es la de menor peso. Intenta de nuevo."
        : "No es la arista mínima de la frontera. Intenta de nuevo.";
      Model.state.log.unshift(msg);
    }

    refresh();
  }

  function bindResetButton() {
    document.getElementById("btn-reset").addEventListener("click", () => {
      if (Model.state.running) return;
      Model.newGame();
      View.hideVictory();
      View.setControlsLocked(false);
      View.setChallengeEdgeHandler(null);
      // Limpiar hint (sin progreso, sin victoria)
      const hint = document.getElementById("challenge-hint");
      if (hint) { hint.innerHTML = ""; hint.className = "challenge-hint"; }
      updateModeUI();
      refresh();
    });
  }

  function refresh() {
    View.render(Model.getGraph(), Model.state);
    updateModeUI();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", Controller.init);
