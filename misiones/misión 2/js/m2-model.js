/*
   Model de Mision 2.

   Este archivo contiene solo datos y estado.
   No toca el DOM.
   Controller usa estos datos para validar acciones.
   View usa estos datos para dibujar grafo, HUD y tutorial.
*/

// ── GRAFO TUTORIAL (5 nodos) ────────────────────────────────
var TUT_NODES = [
    { id:'A', label:'APOYO-1',  x:100, y:200 },
    { id:'B', label:'NODO-B',   x:280, y:100 },
    { id:'C', label:'NODO-C',   x:280, y:300 },
    { id:'D', label:'NODO-D',   x:460, y:200 },
    { id:'V', label:'VÍCTIMA',  x:600, y:200 }
];

var TUT_EDGES = [
    { from:'A', to:'B', weight:2 },
    { from:'A', to:'C', weight:5 },
    { from:'B', to:'D', weight:1 },
    { from:'C', to:'D', weight:3 },
    { from:'D', to:'V', weight:2 },
    { from:'C', to:'V', weight:8 }
];

// ── GRAFO DEL JUEGO REAL (10 nodos, fijo) ───────────────────
// Ruta óptima: S → B → D → G → V  (costo = 12)
var GAME_NODES = [
    { id:'S', label:'SOPORTE',   x:80,  y:220 },
    { id:'A', label:'ALEX',      x:210, y:100 },
    { id:'B', label:'BLAKE',     x:210, y:220 },
    { id:'C', label:'CASEY',     x:210, y:340 },
    { id:'D', label:'DANA',      x:360, y:160 },
    { id:'E', label:'EMERY',     x:360, y:300 },
    { id:'F', label:'FINLEY',    x:490, y:80  },
    { id:'G', label:'GREY',      x:490, y:230 },
    { id:'H', label:'HARPER',    x:490, y:380 },
    { id:'V', label:'VÍCTIMA',   x:640, y:230 }
];

var GAME_EDGES = [
    { from:'S', to:'A', weight:6  },
    { from:'S', to:'B', weight:2  },
    { from:'S', to:'C', weight:8  },
    { from:'A', to:'D', weight:4  },
    { from:'A', to:'F', weight:7  },
    { from:'B', to:'D', weight:3  },
    { from:'B', to:'E', weight:9  },
    { from:'C', to:'E', weight:5  },
    { from:'C', to:'H', weight:11 },
    { from:'D', to:'F', weight:6  },
    { from:'D', to:'G', weight:4  },
    { from:'E', to:'G', weight:7  },
    { from:'E', to:'H', weight:6  },
    { from:'F', to:'V', weight:8  },
    { from:'G', to:'V', weight:3  },
    { from:'H', to:'V', weight:10 }
];

// Nodo origen y destino
var GAME_SOURCE = 'S';
var TARGET_NODE = 'V';

// Ruta óptima pre-calculada
var OPTIMAL_PATH = ['S','B','D','G','V'];
var OPTIMAL_COST = 12;

// Escudo
var SHIELD_MAX     = 20;
var RISK_THRESHOLD = 15;  // costo ≤15 para ganar

// Moneda
var COIN_USES_PER_GAME = 3;

// Estado global de la misión
var missionState = {
    currentAttempt: 1,
    maxAttempts:    3,
    phase: 'intro'
};

// Estado del juego real (se resetea en cada intento)
var gameState = {
    playerPath:   [],
    drawnEdges:   [],
    totalRisk:    0,
    shieldHP:     SHIELD_MAX,
    coinUsesLeft: COIN_USES_PER_GAME,
    dragging:     false,
    dragFrom:     null,
    finished:     false
};

// ── DATOS DE POP-UPS POR PASO (tutorial) ───────────────────
var TUT_POPUPS = [
    {
        anchorNode: 'A', offset: 'top',
        title: 'PUNTO DE INICIO',
        body: 'Dijkstra parte siempre de un nodo origen. Su distancia es 0; todos los demás comienzan en ∞.'
    },
    {
        anchorNode: 'A', offset: 'top',
        title: 'EXPLORAR VECINOS',
        body: 'Desde A actualizamos B (costo 2) y C (costo 5). Guardamos el mejor camino conocido hacia cada vecino.'
    },
    {
        anchorNode: 'B', offset: 'top',
        title: 'NODO MÁS CERCANO',
        body: 'Siempre elegimos el nodo no visitado con menor distancia acumulada. Aquí es B con costo 2.'
    },
    {
        anchorNode: 'D', offset: 'top',
        title: 'RELAJACIÓN DE ARISTAS',
        body: 'D se alcanza con 3 (A→B→D). Dijkstra "relaja" la arista: si el nuevo costo es menor, lo reemplaza.'
    },
    {
        anchorNode: 'C', offset: 'bottom',
        title: 'SIN ACTUALIZACIÓN',
        body: 'C→V costaría 13, pero V ya tiene costo 5. El algoritmo descarta rutas peores automáticamente.'
    },
    {
        anchorNode: 'V', offset: 'left',
        title: '¡RUTA ÓPTIMA HALLADA!',
        body: 'A→B→D→V con riesgo total 5. Dijkstra garantiza que esta es la ruta de menor costo posible.'
    }
];
