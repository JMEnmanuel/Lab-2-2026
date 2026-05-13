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

    // ── Posiciones en el SVG (800×560 canvas approx) ─────────────────
    const POSITIONS = {
        1: { x:180, y:130 }, 2: { x:440, y:100 }, 3: { x:700, y:130 },
        4: { x:120, y:330 }, 5: { x:380, y:310 }, 6: { x:660, y:320 },
        7: { x:200, y:510 }, 8: { x:460, y:500 }, 9: { x:680, y:500 }
    };

    // ── Aristas (adyacencias no dirigidas) ───────────────────────────
    const LINKS = [[1,2],[1,4],[2,3],[2,5],[3,6],[4,7],[5,3],[5,8],[6,9],[7,8],[8,9]];
    const ADJ = {
        1:[2,4], 2:[1,3,5], 3:[2,5,6], 4:[1,7], 5:[2,3,8],
        6:[3,9], 7:[4,8],   8:[5,7,9], 9:[6,8]
    };

    // ── Evidencias narrativas por nodo ───────────────────────────────
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

    // ── Estado del juego ─────────────────────────────────────────────
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

    function getUser(id)      { return USERS.find(u => u.id === id); }
    function getEvidence(id)  {
        if (id === originId) return ORIGIN_EVIDENCE_OVERRIDE;
        return EVIDENCE_POOL[id] || { priv:'—', pub:'—', roleLabel:'DESCONOCIDO', roleCls:'ev-role-neutral' };
    }

    const GRAPH = { nodes: USERS.map(u=>({...u,...POSITIONS[u.id]})), links: LINKS, adj: ADJ };

    return { GRAPH, USERS, POSITIONS, LINKS, ADJ, state, resetState, computeSuspicion, getUser, getEvidence,
             get originId() { return originId; } };
})();