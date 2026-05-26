/*
   Model de Mision 1.

   Este archivo guarda datos y estado.
   No debe modificar HTML ni usar document.querySelector.
   Controller lee y cambia este estado.
   View recibe estos datos para dibujar la pantalla.
*/
const Model = (() => {

    // ── Usuarios (9 nodos, nombre con número integrado) ──────────────
    const USERS = [
        { id:1, name:'1.Omar',     alias:'yesid_r'     },
        { id:2, name:'2.Brayan',  alias:'brayan_x'  },
        { id:3, name:'3.Mancipe',  alias:'david_k'  },
        { id:4, name:'4.Diana',   alias:'diana_m'   },
        { id:5, name:'5.Elena',   alias:'elena_z'   },
        { id:6, name:'6.Natalia',   alias:'Nat'   },
        { id:7, name:'7.Gabriel', alias:'gabriel_t' },
        { id:8, name:'8.Hana',    alias:'hana_j'    },
        { id:9, name:'9.Ivan',    alias:'ivan_q'    }
    ];

    // ── Posiciones en el SVG ─────────────────────────────────────────
    const POSITIONS = {
        1: { x:180, y:130 }, 2: { x:440, y:100 }, 3: { x:700, y:130 },
        4: { x:120, y:330 }, 5: { x:380, y:310 }, 6: { x:660, y:320 },
        7: { x:200, y:510 }, 8: { x:460, y:500 }, 9: { x:680, y:500 }
    };

    // ── Aristas ──────────────────────────────────────────────────────
    const LINKS = [[1,2],[1,4],[2,3],[2,5],[3,6],[4,7],[5,3],[5,8],[6,9],[7,8],[8,9]];
    const ADJ = {
        1:[2,4], 2:[1,3,5], 3:[2,5,6], 4:[1,7], 5:[2,3,8],
        6:[3,9], 7:[4,8],   8:[5,7,9], 9:[6,8]
    };

    // ── Evidencias narrativas ────────────────────────────────────────
    const EVIDENCE_POOL = {
        1: [
            {
                priv: '"Ajá, ¿tú viste esa captura que anda rodando? A mí me llegó ya con medio salón opinando."',
                pub:  '"La gente habla sin saber y después se hace la loca, ombe."',
                trace: 'El registro entra cuando la captura ya fue vista en dos chats distintos.',
                clue: 'Habla de algo que ya estaba rodando antes de su mensaje.'
            },
            {
                priv: '"Primo, eso me cayó reenviado. Ni sé de dónde salió, pero el grupo está prendido."',
                pub:  '"Uno debería confirmar antes de tirar comentarios, ¿sí o qué?"',
                trace: 'La cadena privada conserva marcas de reenvío previas.',
                clue: 'Reconoce recepción previa; no aparece como primera fuente.'
            },
            {
                priv: '"Ey, me lo mandó Brayan y después Diana preguntó qué era esa vaina. Esto va rápido."',
                pub:  '"No todo chisme merece tarima, pelaos."',
                trace: 'Menciona otros nodos antes de intervenir públicamente.',
                clue: 'Su relato depende de mensajes que ya existían.'
            }
        ],
        2: [
            {
                priv: '"Me lo pasaron hace rato, compa. No sé si sea cierto, pero la gente está embaladísima."',
                pub:  '"Hay quienes tiran la piedra y esconden la mano. Qué vaina seria."',
                trace: 'Su chat cita una captura con compresión de reenvío.',
                clue: 'Dice que le llegó antes de opinar.'
            },
            {
                priv: '"A mí me llegó por interno, no fui yo el que armó ese bololó."',
                pub:  '"Barranquilla es chiquita cuando el chisme coge buseta."',
                trace: 'El mensaje llega después de una primera publicación en el grupo.',
                clue: 'Se defiende como receptor, pero amplifica el tema.'
            },
            {
                priv: '"No manden mi nombre en eso, yo solo pregunté si era verdad."',
                pub:  '"Si van a hablar, hablen con pruebas, ajá."',
                trace: 'Hay una pregunta suya pegada a una captura enviada por otro usuario.',
                clue: 'Su actividad reacciona a material anterior.'
            }
        ],
        3: [
            {
                priv: '"Ya lo vi, y nojoda... eso está fuerte. Pero a mí me apareció cuando ya todos estaban comentando."',
                pub:  '"Qué pena con la gente que disfruta ese show."',
                trace: 'Entra al hilo después de varias respuestas acumuladas.',
                clue: 'Comenta tarde dentro de una conversación ya activa.'
            },
            {
                priv: '"Me etiquetaron en el comentario, por eso entré. Yo ni sabía qué pasaba."',
                pub:  '"A veces el silencio salva más que el comentario filoso."',
                trace: 'Su primera acción visible es responder a una mención.',
                clue: 'La mención lo arrastra al caso; no abre la cadena.'
            },
            {
                priv: '"Ese pantallazo me llegó borroso, como reenviado mil veces. ¿Quién empezó esa vaina?"',
                pub:  '"Dejen de echarle leña al incendio, pelaos."',
                trace: 'La evidencia contiene una imagen degradada por varios reenvíos.',
                clue: 'Pregunta por el inicio, señal de que no lo conoce.'
            }
        ],
        4: [
            {
                priv: '"¿Cuál drama? Yo estaba en clase, no entiendo nada de lo que están diciendo."',
                pub:  '"Hoy solo quiero entregar el taller y sobrevivir, gracias."',
                trace: 'No hay capturas salientes ni reenvíos asociados.',
                clue: 'Su actividad inicia con confusión, no con difusión.'
            },
            {
                priv: '"Pásame contexto, pero sin mandarme esa cosa, que no quiero meterme en problema."',
                pub:  '"Respirar, tomar agua y no opinar de vidas ajenas."',
                trace: 'Rechaza recibir la captura completa.',
                clue: 'Evita participar en la cadena de distribución.'
            },
            {
                priv: '"Yo vi fue a la gente alterada, pero no abrí ningún link raro."',
                pub:  '"El grupo hoy parece mercado en quincena."',
                trace: 'Solo registra lectura del chat general, sin adjuntos enviados.',
                clue: 'Observa el ruido sin empujar el contenido.'
            }
        ],
        5: [
            {
                priv: '"Por favor, paren. Eso que están pasando es sobre mí y no es como lo están contando."',
                pub:  '"Duele que una mentira corra más que cualquier explicación."',
                trace: 'Aparece como persona afectada por la publicación central.',
                clue: 'Su mensaje pide detener la difusión.'
            },
            {
                priv: '"No me sigan mandando capturas, de verdad. Ya bastante tengo con ver mi nombre ahí."',
                pub:  '"Si no saben el daño que hacen, al menos no compartan."',
                trace: 'Recibe múltiples copias desde nodos distintos.',
                clue: 'La evidencia la ubica como objetivo del rumor.'
            },
            {
                priv: '"Mamá ya se enteró por otra persona. ¿Ustedes entienden lo grave que es esto?"',
                pub:  '"A veces el chisme también es violencia."',
                trace: 'El impacto aparece después de que el contenido cruza varios contactos.',
                clue: 'Responde al daño, no al inicio de la cadena.'
            }
        ],
        6: [
            {
                priv: '"Lo vi en el grupo grande, ya tenía un pocotón de reacciones. Esto se salió de madre."',
                pub:  '"La privacidad no es juego, mi gente."',
                trace: 'Detectado después de que la publicación ya acumulaba alcance.',
                clue: 'Describe una propagación que ya estaba avanzada.'
            },
            {
                priv: '"A mí me llegó cuando ya estaban haciendo memes. Qué falta de respeto, de verdad."',
                pub:  '"No todo lo que da risa está bien compartirlo."',
                trace: 'Se conecta tras actividad masiva en el hilo público.',
                clue: 'Su entrada ocurre después del pico de exposición.'
            },
            {
                priv: '"Yo reaccioné tarde, porque pensé que era broma. Después vi que era serio."',
                pub:  '"El relajo también tiene límite, coste."',
                trace: 'La reacción queda marcada varios minutos después de los primeros envíos.',
                clue: 'No coincide con la ventana inicial del caso.'
            }
        ],
        7: [
            {
                priv: '"Me lo mandaron al privado y yo, de bruto, lo reenvié. La embarré, lo sé."',
                pub:  '"Uno también tiene que responder por lo que comparte."',
                trace: 'Confiesa un reenvío posterior a la primera oleada.',
                clue: 'Admite amplificación, no creación.'
            },
            {
                priv: '"Yo pensé que ya todo el mundo sabía. Igual no era excusa, compa."',
                pub:  '"Perdón a quien le cayó encima esta vuelta."',
                trace: 'Su reenvío ocurre cuando la conversación ya era pública.',
                clue: 'Se suma por presión del grupo.'
            },
            {
                priv: '"Me dejé llevar por el vacile y terminé mandando algo que no debía."',
                pub:  '"No repitan lo que yo hice. Eso no fue juego."',
                trace: 'La cadena muestra un envío suyo conectado a contenido recibido.',
                clue: 'Hay rastro claro de entrada antes de salida.'
            }
        ],
        8: [
            {
                priv: '"¿Ya viste lo del grupo general? Eso está en boca de todo el mundo, qué locura."',
                pub:  '"El chisme de hoy cogió carretera, ombe."',
                trace: 'Aparece cuando el rumor ya está en el grupo general.',
                clue: 'Habla de alcance masivo ya existente.'
            },
            {
                priv: '"Me desperté y tenía como veinte mensajes de esa vaina. ¿Quién soltó eso primero?"',
                pub:  '"Cuando una cosa se riega así, después nadie responde."',
                trace: 'Recibe múltiples notificaciones antes de publicar.',
                clue: 'Pregunta por la fuente original.'
            },
            {
                priv: '"Yo solo vi el alboroto completo, no el primer mensaje. Eso venía rodando desde temprano."',
                pub:  '"La lengua corre más que Transmetro en hora pico."',
                trace: 'Su primer registro es posterior a varias conexiones activas.',
                clue: 'Ubica el inicio antes de su participación.'
            }
        ],
        9: [
            {
                priv: '"Me lo mandaron hace unos minutos. Yo apenas estoy entendiendo el cuento."',
                pub:  '"Ojalá esto no le haga daño a nadie, porque se siente pesado."',
                trace: 'Último registro de lectura, sin reenvíos salientes.',
                clue: 'Recibe tarde y no amplifica.'
            },
            {
                priv: '"Yo abrí el chat y ya eso estaba explotado. Ni alcancé a ver quién empezó."',
                pub:  '"Qué cansancio ese afán de destruir por una pantalla."',
                trace: 'Solo hay lectura tardía del grupo.',
                clue: 'Llega al final de la cadena.'
            },
            {
                priv: '"No me metan en ese lío, yo no pasé nada. Vi fue el desorden armado."',
                pub:  '"A veces cerrar el chat también es cuidarse."',
                trace: 'No registra adjuntos enviados ni menciones iniciales.',
                clue: 'Permanece como observador tardío.'
            }
        ]
    };

    // ── Origen aleatorio ─────────────────────────────────────────────
    const POSSIBLE_ORIGINS = [1, 2, 3, 6, 8];
    let originId = POSSIBLE_ORIGINS[Math.floor(Math.random() * POSSIBLE_ORIGINS.length)];

    const ORIGIN_EVIDENCE_POOL = [
        {
            priv: '"Voy a tirar esto antes de que borren todo. Después no digan que nadie avisó."',
            pub:  '"Hay verdades que tienen que salir, así a algunos les arda."',
            trace: 'Primer registro temporal: aparece antes de capturas, respuestas o reenvíos.',
            clue: 'No hay referencias a mensajes anteriores en su registro.'
        },
        {
            priv: '"Tengo el pantallazo listo. Si lo suelto ahora, esto prende en cinco minutos."',
            pub:  '"A veces toca destapar lo que otros esconden, ajá."',
            trace: 'La marca horaria antecede a la primera reacción del grupo.',
            clue: 'El tono anticipa reacción, no responde a una cadena previa.'
        },
        {
            priv: '"Nadie ha dicho nada todavía. Voy a ponerlo en el grupo y que cada quien saque cuentas."',
            pub:  '"No me culpen por mostrar lo que estaba tapado."',
            trace: 'No cita mensajes anteriores ni adjuntos recibidos.',
            clue: 'Su registro queda antes del ruido público del caso.'
        }
    ];

    const evidenceRolls = {};
    function rollEvidence() {
        USERS.forEach(u => { evidenceRolls[u.id] = Math.floor(Math.random() * 3); });
    }
    rollEvidence();

    // ── Estado del juego principal ───────────────────────────────────
    const state = {
        phase:        'bfs',
        bfs: {
            visited:   [],
            queue:     [],
            traversed: [],
            parent:    {},
            current:   null,
            lives:     3,
            done:      false
        },
        dfs: {
            visited:   [],
            stack:     [],
            traversed: [],
            parent:    {},
            current:   null,
            lives:     3,
            done:      false,
            suspicion: {}
        },
        cpu: {
            progress: 0,
            turn: 0,
            lastAction: 'CPU en espera. El ruido digital aun no avanza.',
            pressure: 'stable',
            lockedEvidenceId: null
        },
        accusationLives: 3
    };

    const CPU_ACTIONS = {
        correct: [
            'La CPU replica el rumor en canales secundarios.',
            'La CPU empuja comentarios viejos para tapar el rastro.',
            'La CPU aumenta el ruido alrededor de los nodos ya visitados.'
        ],
        mistake: [
            'La CPU aprovecha el error y contamina una pista recuperada.',
            'La CPU acelera la difusion mientras corriges el recorrido.',
            'La CPU crea falsos sospechosos en la red.'
        ],
        repeat: [
            'La CPU gana un poco de terreno por la duda en el rastreo.',
            'La CPU mantiene vivo el ruido mientras revisas un nodo repetido.',
            'La CPU refuerza una conversacion secundaria.'
        ],
        accusation: [
            'La CPU usa la acusacion fallida para borrar parte de la trazabilidad.',
            'La CPU redirige la culpa hacia otro nodo y acelera la confusion.',
            'La CPU convierte el fallo en una ola de desinformacion.'
        ]
    };

    function resetState() {
        originId = POSSIBLE_ORIGINS[Math.floor(Math.random() * POSSIBLE_ORIGINS.length)];
        rollEvidence();
        state.phase = 'bfs';
        state.bfs  = { visited:[], queue:[], traversed:[], parent:{}, current:null, lives:3, done:false };
        state.dfs  = { visited:[], stack:[], traversed:[], parent:{}, current:null, lives:3, done:false, suspicion:{} };
        state.cpu  = { progress:0, turn:0, lastAction:'CPU en espera. El ruido digital aun no avanza.', pressure:'stable', lockedEvidenceId:null };
        state.accusationLives = 3;
    }

    function runCpuTurn(kind) {
        const gains = { correct: 3, mistake: 14, repeat: 7, accusation: 22 };
        const pool = CPU_ACTIONS[kind] || CPU_ACTIONS.correct;
        const action = pool[state.cpu.turn % pool.length];
        const visitedTotal = state.bfs.visited.length + state.dfs.visited.length;
        const pressureBonus = visitedTotal >= 12 ? 2 : visitedTotal >= 7 ? 1 : 0;
        state.cpu.turn += 1;
        state.cpu.progress = Math.min(100, state.cpu.progress + (gains[kind] || 5) + pressureBonus);
        state.cpu.lastAction = action;
        state.cpu.pressure = state.cpu.progress >= 75 ? 'critical' : state.cpu.progress >= 45 ? 'warning' : 'stable';
        state.cpu.lockedEvidenceId = kind === 'mistake'
            ? USERS[(state.cpu.turn + visitedTotal) % USERS.length].id
            : null;
        return { ...state.cpu };
    }

    function computeSuspicion(visitOrder) {
        visitOrder.forEach((id, idx) => {
            const base = 30;
            const bonus = idx < 3 ? Math.round(70 * (1 - idx / 3)) : 0;
            const degreeBonus = ADJ[id].length >= 3 ? 15 : 0;
            const originBonus = id === originId ? 35 : 0;
            state.dfs.suspicion[id] = Math.min(95, base + bonus + degreeBonus + originBonus);
        });
    }

    function getUser(id)     { return USERS.find(u => u.id === id); }
    function getEvidence(id) {
        const roll = evidenceRolls[id] || 0;
        if (id === originId) return ORIGIN_EVIDENCE_POOL[roll % ORIGIN_EVIDENCE_POOL.length];
        const variants = EVIDENCE_POOL[id];
        return variants ? variants[roll % variants.length] : { priv:'—', pub:'—', trace:'Sin registro.', clue:'Sin pista.' };
    }

    const GRAPH = { nodes: USERS.map(u=>({...u,...POSITIONS[u.id]})), links: LINKS, adj: ADJ };

    // ================================================================
    //  TUTORIAL MODEL
    // ================================================================

    // 5 nodos fijos — grafo simple para enseñar
    const TUT_USERS = [
        { id:1, name:'Nodo A' },
        { id:2, name:'Nodo B' },
        { id:3, name:'Nodo C' },
        { id:4, name:'Nodo D' },
        { id:5, name:'Nodo E' }
    ];

    // Posiciones en el SVG tutorial (centradas en 800×500)
    const TUT_POSITIONS = {
        1: { x:400, y:120 },   // raíz / centro-top
        2: { x:200, y:280 },   // izq
        3: { x:600, y:280 },   // der
        4: { x:130, y:430 },   // izq-baja
        5: { x:560, y:430 }    // der-baja
    };

    const TUT_LINKS = [[1,2],[1,3],[2,4],[3,5],[2,3]];
    const TUT_ADJ   = {
        1:[2,3],
        2:[1,3,4],
        3:[1,2,5],
        4:[2],
        5:[3]
    };

    // BFS desde nodo 1: orden correcto → 1, 2, 3, 4, 5
    const TUT_BFS_ORDER = [1, 2, 3, 4, 5];
    // DFS desde nodo 1: orden correcto → 1, 2, 3, 4, 5 (pila: push neighbors sorted desc)
    // ADJ[1]=[2,3] → push 3,2 → tope=2 → visit 2 → ADJ[2]=[1,3,4] filtrados=[3,4] → push 4,3 → tope=3...
    const TUT_DFS_ORDER  = [1, 2, 4, 3, 5];

    // Pasos del tutorial: cada paso tiene texto de instrucción + nodo esperado (null = solo leer)
    const TUT_STEPS = {
        bfs: [
            {
                expectedNode: null,
                instruction: 'BFS recorre la red por NIVELES. Si hay varios vecinos disponibles al mismo tiempo, se elige primero el nodo con ID menor. Usa una COLA.',
                concept: '📡 BFS = Búsqueda en Anchura\nVisita nivel por nivel.\nDesempate: ID menor primero.\nEstructura: COLA (FIFO).',
                highlight: []
            },
            {
                expectedNode: 1,
                instruction: '▸ Haz click en NODO A (ID 1) para iniciar el recorrido BFS. Es el punto de partida.',
                concept: 'Paso 1: Elige el nodo de inicio.\nEse nodo se marca como VISITADO\ny sus vecinos entran a la COLA ordenados por ID.',
                highlight: [1]
            },
            {
                expectedNode: 2,
                instruction: '▸ La cola tiene [B ID 2, C ID 3]. BFS visita el PRIMERO: el ID menor disponible. Haz click en NODO B.',
                concept: 'COLA actual: [B(2), C(3)]\nEl primero es B porque tiene menor ID.\nAsí BFS recorre por niveles.',
                highlight: [2]
            },
            {
                expectedNode: 3,
                instruction: '▸ Cola: [C ID 3, D ID 4]. El primero es C. Haz click en NODO C.',
                concept: 'COLA actual: [C(3), D(4)]\nB ya fue visitado y D entró al final.\nSiguiente: C.',
                highlight: [3]
            },
            {
                expectedNode: 4,
                instruction: '▸ Cola: [D ID 4, E ID 5]. Siguiente es D. Haz click en NODO D.',
                concept: 'COLA actual: [D(4), E(5)]\nC también trajo a E al final.\nBFS termina cuando la cola queda vacía.',
                highlight: [4]
            },
            {
                expectedNode: 5,
                instruction: '▸ Último nodo: E (ID 5). Haz click en NODO E para completar BFS.',
                concept: 'COLA actual: [E(5)]\nVisita E y BFS habrá recorrido toda la red por niveles.',
                highlight: [5]
            }
        ],
        dfs: [
            {
                expectedNode: null,
                instruction: 'DFS recorre la red en PROFUNDIDAD. Si hay varios vecinos disponibles, se elige primero el nodo con ID menor. Usa una PILA.',
                concept: '🔍 DFS = Búsqueda en Profundidad\nSigue un camino hasta el fondo.\nDesempate: ID menor primero.\nEstructura: PILA (LIFO).',
                highlight: []
            },
            {
                expectedNode: 1,
                instruction: '▸ Haz click en NODO A (ID 1) para iniciar DFS. Sus vecinos B y C entran a la pila.',
                concept: 'Paso 1: Inicia desde A.\nPara visitar menor ID primero, se apilan sus vecinos como [C(3), B(2)].\nLa PILA visita el último que entró.',
                highlight: [1]
            },
            {
                expectedNode: 2,
                instruction: '▸ Pila: [C ID 3, B ID 2]. El TOPE es B: menor ID disponible. Haz click en NODO B.',
                concept: 'PILA actual: [C(3), B(2)]\nEl tope es B, así DFS avanza primero por el menor ID disponible.',
                highlight: [2]
            },
            {
                expectedNode: 4,
                instruction: '▸ Pila: [C ID 3, D ID 4]. DFS profundiza: el tope es D. Haz click en NODO D.',
                concept: 'PILA actual: [C(3), D(4)]\nD es el único vecino nuevo desde B, por eso queda en el tope.',
                highlight: [4]
            },
            {
                expectedNode: 3,
                instruction: '▸ D no tiene vecinos nuevos. DFS retrocede. Pila: [C ID 3]. Haz click en NODO C.',
                concept: 'PILA actual: [C(3)]\nD no abre nuevos nodos.\nDFS retrocede al siguiente nodo pendiente.',
                highlight: [3]
            },
            {
                expectedNode: 5,
                instruction: '▸ Pila: [E ID 5]. Último nodo. Haz click en NODO E para completar DFS.',
                concept: 'PILA actual: [E(5)]\nC trajo a E. Último paso: DFS completa la red en profundidad.',
                highlight: [5]
            }
        ]
    };

    // Estado del tutorial
    const tutorialState = {
        phase:       'bfs',   // 'bfs' | 'dfs'
        stepIndex:   0,
        bfs: {
            visited:   [],
            queue:     [],
            traversed: [],
            current:   null
        },
        dfs: {
            visited:   [],
            stack:     [],
            traversed: [],
            current:   null
        }
    };

    function resetTutorial() {
        tutorialState.phase     = 'bfs';
        tutorialState.stepIndex = 0;
        tutorialState.bfs = { visited:[], queue:[], traversed:[], parent:{}, current:null };
        tutorialState.dfs = { visited:[], stack:[], traversed:[], parent:{}, current:null };
    }

    function getTutorialStep() {
        return TUT_STEPS[tutorialState.phase][tutorialState.stepIndex];
    }

    function getTotalTutorialSteps() {
        return TUT_STEPS.bfs.length + TUT_STEPS.dfs.length;
    }

    function getTutorialProgressIndex() {
        const bfsLen = TUT_STEPS.bfs.length;
        return tutorialState.phase === 'bfs'
            ? tutorialState.stepIndex
            : bfsLen + tutorialState.stepIndex;
    }

    const TUT_GRAPH = {
        nodes: TUT_USERS.map(u => ({ ...u, ...TUT_POSITIONS[u.id] })),
        links: TUT_LINKS,
        adj:   TUT_ADJ
    };

    return {
        // Juego principal
        GRAPH, USERS, POSITIONS, LINKS, ADJ, state, resetState,
        computeSuspicion, runCpuTurn, getUser, getEvidence,
        get originId() { return originId; },

        // Tutorial
        TUT_GRAPH, TUT_USERS, TUT_POSITIONS, TUT_LINKS, TUT_ADJ,
        TUT_STEPS, TUT_BFS_ORDER, TUT_DFS_ORDER,
        tutorialState, resetTutorial,
        getTutorialStep, getTotalTutorialSteps, getTutorialProgressIndex
    };
})();
