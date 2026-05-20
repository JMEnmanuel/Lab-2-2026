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
        { id:1, name:'1.Ana',     alias:'ana_r'     },
        { id:2, name:'2.Brayan',  alias:'brayan_x'  },
        { id:3, name:'3.Mancipe',  alias:'carlos_k'  },
        { id:4, name:'4.Diana',   alias:'diana_m'   },
        { id:5, name:'5.Elena',   alias:'elena_z'   },
        { id:6, name:'6.Natalia',   alias:'fiona_v'   },
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
        1: {
            priv: '"Oye, ¿ya viste lo que está circulando sobre alguien del grupo? Dicen que es real."',
            pub:  '"Hay cosas que uno no puede callar. La verdad siempre sale."',
            trace: 'Recibio el rumor despues de que ya habia circulado en dos chats.',
            clue: 'Reacciona al contenido; no aparece como primer emisor.',
            roleLabel: 'PROPAGADOR', roleCls: 'ev-role-spread'
        },
        2: {
            priv: '"Me lo mandaron hace rato. No sé si creerlo pero... es bastante fuerte."',
            pub:  '"Algunas personas deberían pensar antes de actuar. #Reflexión"',
            trace: 'Su mensaje cita una captura reenviada por otro nodo.',
            clue: 'Dice "me lo mandaron"; indica receptor, no origen.',
            roleLabel: 'PROPAGADOR', roleCls: 'ev-role-spread'
        },
        3: {
            priv: '"Ya lo vi. La verdad no me sorprende viniendo de esa persona."',
            pub:  '"Qué pena ajena con algunos. 😬"',
            trace: 'Entra al hilo cuando el rumor ya tenia respuestas previas.',
            clue: 'Comenta despues de verlo; no lo inicia.',
            roleLabel: 'PROPAGADOR', roleCls: 'ev-role-spread'
        },
        4: {
            priv: '"¿Qué? ¿De qué están hablando todos?"',
            pub:  '"Feliz día 🌞 ignorando el drama de hoy."',
            trace: 'No comparte enlaces ni capturas del rumor.',
            clue: 'Desconoce el tema al inicio.',
            roleLabel: 'NEUTRAL', roleCls: 'ev-role-neutral'
        },
        5: {
            priv: '"Por favor paren. Eso que están compartiendo es sobre mí y es mentira."',
            pub:  '"No entiendo por qué la gente hace esto. Me duele mucho."',
            trace: 'Recibe el impacto directo del rumor.',
            clue: 'Es la victima; pide detener la difusion.',
            roleLabel: 'VÍCTIMA', roleCls: 'ev-role-victim'
        },
        6: {
            priv: '"Lo vi en el grupo. Ya tiene demasiados likes, esto se salió de control."',
            pub:  '"Hay que aprender a respetar la privacidad de los demás."',
            trace: 'Detectado despues de que la publicacion ya tenia alcance.',
            clue: 'Habla de algo que ya se salio de control.',
            roleLabel: 'PROPAGADOR', roleCls: 'ev-role-spread'
        },
        7: {
            priv: '"Alguien me lo mandó al privado. Lo reenvié sin pensar, lo siento."',
            pub:  '"A veces uno comete errores. Pido disculpas."',
            trace: 'Confiesa reenvio posterior.',
            clue: 'Fue reenviador, no primer emisor.',
            roleLabel: 'PROPAGADOR', roleCls: 'ev-role-spread'
        },
        8: {
            priv: '"¿Ya vio lo del grupo general? Todo el mundo lo está viendo."',
            pub:  '"El chisme de hoy llegó lejos. 😳"',
            trace: 'Aparece cuando el rumor ya esta en el grupo general.',
            clue: 'Describe alcance masivo ya existente.',
            roleLabel: 'PROPAGADOR', roleCls: 'ev-role-spread'
        },
        9: {
            priv: '"Me lo mandaron hace unos minutos. Es lo primero que vi al despertar."',
            pub:  '"Esperemos que esto no le haga daño a nadie."',
            trace: 'Ultimo registro de lectura; no hay reenvios salientes.',
            clue: 'Recibio tarde y no amplifico.',
            roleLabel: 'NEUTRAL', roleCls: 'ev-role-neutral'
        }
    };

    // ── Origen aleatorio ─────────────────────────────────────────────
    const POSSIBLE_ORIGINS = [1, 2, 3, 6, 8];
    let originId = POSSIBLE_ORIGINS[Math.floor(Math.random() * POSSIBLE_ORIGINS.length)];

    const ORIGIN_EVIDENCE_OVERRIDE = {
        priv: '"Lo voy a soltar primero por aqui. Cuando todos lo vean, ya no podran frenarlo."',
        pub:  '"Hay personas que se creen intocables. Pronto todos sabran la verdad."',
        trace: 'Primer registro temporal: publica antes que existan reenvios, capturas o respuestas.',
        clue: 'Clave: habla en futuro y no cita a nadie. Es emisor inicial.',
        roleLabel: 'INICIADOR', roleCls: 'ev-role-origin'
    };

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
        accusationLives: 3
    };

    function resetState() {
        originId = POSSIBLE_ORIGINS[Math.floor(Math.random() * POSSIBLE_ORIGINS.length)];
        state.phase = 'bfs';
        state.bfs  = { visited:[], queue:[], traversed:[], parent:{}, current:null, lives:3, done:false };
        state.dfs  = { visited:[], stack:[], traversed:[], parent:{}, current:null, lives:3, done:false, suspicion:{} };
        state.accusationLives = 3;
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
        if (id === originId) return ORIGIN_EVIDENCE_OVERRIDE;
        return EVIDENCE_POOL[id] || { priv:'—', pub:'—', trace:'Sin registro.', clue:'Sin pista.', roleLabel:'DESCONOCIDO', roleCls:'ev-role-neutral' };
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
        computeSuspicion, getUser, getEvidence,
        get originId() { return originId; },

        // Tutorial
        TUT_GRAPH, TUT_USERS, TUT_POSITIONS, TUT_LINKS, TUT_ADJ,
        TUT_STEPS, TUT_BFS_ORDER, TUT_DFS_ORDER,
        tutorialState, resetTutorial,
        getTutorialStep, getTotalTutorialSteps, getTutorialProgressIndex
    };
})();
