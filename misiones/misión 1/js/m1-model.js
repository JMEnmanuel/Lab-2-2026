/* =================================================================
   MODEL — Datos puros, grafo, evidencias, estado
   ================================================================= */
const Model = (() => {

    // ── Usuarios (9 nodos, nombre con número integrado) ──────────────
    const USERS = [
        { id:1, name:'1.Ana',     alias:'ana_r'     },
        { id:2, name:'2.Brayan',  alias:'brayan_x'  },
        { id:3, name:'3.Carlos',  alias:'carlos_k'  },
        { id:4, name:'4.Diana',   alias:'diana_m'   },
        { id:5, name:'5.Elena',   alias:'elena_z'   },
        { id:6, name:'6.Fiona',   alias:'fiona_v'   },
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
            roleLabel: 'PROPAGADOR', roleCls: 'ev-role-spread'
        },
        2: {
            priv: '"Me lo mandaron hace rato. No sé si creerlo pero... es bastante fuerte."',
            pub:  '"Algunas personas deberían pensar antes de actuar. #Reflexión"',
            roleLabel: 'PROPAGADOR', roleCls: 'ev-role-spread'
        },
        3: {
            priv: '"Ya lo vi. La verdad no me sorprende viniendo de esa persona."',
            pub:  '"Qué pena ajena con algunos. 😬"',
            roleLabel: 'PROPAGADOR', roleCls: 'ev-role-spread'
        },
        4: {
            priv: '"¿Qué? ¿De qué están hablando todos?"',
            pub:  '"Feliz día 🌞 ignorando el drama de hoy."',
            roleLabel: 'NEUTRAL', roleCls: 'ev-role-neutral'
        },
        5: {
            priv: '"Por favor paren. Eso que están compartiendo es sobre mí y es mentira."',
            pub:  '"No entiendo por qué la gente hace esto. Me duele mucho."',
            roleLabel: 'VÍCTIMA', roleCls: 'ev-role-victim'
        },
        6: {
            priv: '"Lo vi en el grupo. Ya tiene demasiados likes, esto se salió de control."',
            pub:  '"Hay que aprender a respetar la privacidad de los demás."',
            roleLabel: 'PROPAGADOR', roleCls: 'ev-role-spread'
        },
        7: {
            priv: '"Alguien me lo mandó al privado. Lo reenvié sin pensar, lo siento."',
            pub:  '"A veces uno comete errores. Pido disculpas."',
            roleLabel: 'PROPAGADOR', roleCls: 'ev-role-spread'
        },
        8: {
            priv: '"¿Ya vio lo del grupo general? Todo el mundo lo está viendo."',
            pub:  '"El chisme de hoy llegó lejos. 😳"',
            roleLabel: 'PROPAGADOR', roleCls: 'ev-role-spread'
        },
        9: {
            priv: '"Me lo mandaron hace unos minutos. Es lo primero que vi al despertar."',
            pub:  '"Esperemos que esto no le haga daño a nadie."',
            roleLabel: 'NEUTRAL', roleCls: 'ev-role-neutral'
        }
    };

    // ── Origen aleatorio ─────────────────────────────────────────────
    const POSSIBLE_ORIGINS = [1, 2, 3, 6, 8];
    let originId = POSSIBLE_ORIGINS[Math.floor(Math.random() * POSSIBLE_ORIGINS.length)];

    const ORIGIN_EVIDENCE_OVERRIDE = {
        priv: '"Esto va a ponerse interesante. Ya verán. 😈"',
        pub:  '"Hay personas que se creen intocables. Pronto todos sabrán la verdad."',
        roleLabel: '⚠ SOSPECHOSO PRINCIPAL', roleCls: 'ev-role-spread'
    };

    // ── Estado del juego principal ───────────────────────────────────
    const state = {
        phase:        'bfs',
        bfs: {
            visited:   [],
            queue:     [],
            traversed: [],
            current:   null,
            lives:     3,
            done:      false
        },
        dfs: {
            visited:   [],
            stack:     [],
            traversed: [],
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
        state.bfs  = { visited:[], queue:[], traversed:[], current:null, lives:3, done:false };
        state.dfs  = { visited:[], stack:[], traversed:[], current:null, lives:3, done:false, suspicion:{} };
        state.accusationLives = 3;
    }

    function computeSuspicion(visitOrder) {
        const total = visitOrder.length;
        visitOrder.forEach((id, idx) => {
            const base = 30;
            const bonus = idx < 3 ? Math.round(70 * (1 - idx / 3)) : 0;
            const degreeBonus = ADJ[id].length >= 3 ? 15 : 0;
            state.dfs.suspicion[id] = Math.min(95, base + bonus + degreeBonus);
        });
        if (state.dfs.suspicion[originId]) {
            state.dfs.suspicion[originId] = 98;
        }
    }

    function getUser(id)     { return USERS.find(u => u.id === id); }
    function getEvidence(id) {
        if (id === originId) return ORIGIN_EVIDENCE_OVERRIDE;
        return EVIDENCE_POOL[id] || { priv:'—', pub:'—', roleLabel:'DESCONOCIDO', roleCls:'ev-role-neutral' };
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
                instruction: 'BFS recorre la red por NIVELES — como una ola que se expande. Primero visita todos los vecinos cercanos antes de ir más lejos. Usa una COLA (el primero que entra, primero que sale).',
                concept: '📡 BFS = Búsqueda en Anchura\nVisita nodo a nodo, nivel por nivel.\nEstructura: COLA (FIFO — primero en entrar, primero en salir).',
                highlight: []
            },
            {
                expectedNode: 1,
                instruction: '▸ Haz click en el NODO A para iniciar el recorrido BFS. Es el punto de partida.',
                concept: 'Paso 1: Elige el nodo de inicio.\nEse nodo se marca como VISITADO\ny sus vecinos entran a la COLA.',
                highlight: [1]
            },
            {
                expectedNode: 2,
                instruction: '▸ La cola tiene [B, C]. BFS dice: visita el PRIMERO. Haz click en NODO B.',
                concept: 'COLA actual: [B, C]\nEl primero es B → debes visitarlo.\nAsí BFS garantiza recorrer por niveles.',
                highlight: [2]
            },
            {
                expectedNode: 3,
                instruction: '▸ Cola: [C, D]. El primero es C. Haz click en NODO C.',
                concept: 'COLA actual: [C, D]\nB ya fue visitado, sus vecinos nuevos (D) entraron al final.\nSiguiente: C.',
                highlight: [3]
            },
            {
                expectedNode: 4,
                instruction: '▸ Cola: [D, E]. Siguiente es D. Haz click en NODO D.',
                concept: 'COLA actual: [D, E]\nC también trajo a E al final.\nBFS termina cuando la cola queda vacía.',
                highlight: [4]
            },
            {
                expectedNode: 5,
                instruction: '▸ Último nodo: E. Haz click en NODO E para completar BFS.',
                concept: 'COLA actual: [E]\n¡Casi listo! Visita E y BFS habrá\nrecorrido toda la red por niveles.',
                highlight: [5]
            }
        ],
        dfs: [
            {
                expectedNode: null,
                instruction: 'DFS recorre la red en PROFUNDIDAD — sigue una cadena hasta el fondo antes de retroceder. Usa una PILA (el último que entra, primero que sale).',
                concept: '🔍 DFS = Búsqueda en Profundidad\nSigue un camino hasta el fondo,\nluego retrocede. Estructura: PILA (LIFO).',
                highlight: []
            },
            {
                expectedNode: 1,
                instruction: '▸ Haz click en NODO A para iniciar DFS. Sus vecinos B y C entran a la pila.',
                concept: 'Paso 1: Inicia desde A.\nSus vecinos [B, C] se apilan.\nLa PILA trabaja al revés: el ÚLTIMO apilado es el PRIMERO visitado.',
                highlight: [1]
            },
            {
                expectedNode: 2,
                instruction: '▸ Pila: [C, B]. El TOPE es B (último en entrar). Haz click en NODO B.',
                concept: 'PILA actual: [C, B]\nEl tope es B → DFS va primero\npor esa rama, sin importar el nivel.',
                highlight: [2]
            },
            {
                expectedNode: 4,
                instruction: '▸ Pila: [C, D]. DFS profundiza: el tope es D. Haz click en NODO D.',
                concept: 'PILA actual: [C, D]\nDFS sigue la rama más profunda\nantes de explorar otras.',
                highlight: [4]
            },
            {
                expectedNode: 3,
                instruction: '▸ D no tiene vecinos nuevos. DFS retrocede. Pila: [C]. Haz click en NODO C.',
                concept: 'PILA actual: [C]\nD era un callejón sin salida.\nDFS retrocede al siguiente en la pila: C.',
                highlight: [3]
            },
            {
                expectedNode: 5,
                instruction: '▸ Pila: [E]. Último nodo. Haz click en NODO E para completar DFS.',
                concept: 'PILA actual: [E]\nC trajo a E. ¡Último paso!\nDFS recorrió toda la red en profundidad.',
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
        tutorialState.bfs = { visited:[], queue:[], traversed:[], current:null };
        tutorialState.dfs = { visited:[], stack:[], traversed:[], current:null };
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
