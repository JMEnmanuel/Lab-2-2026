// ============================================================
// MODEL — Misión 2: Ruta Segura
// Solo datos. Sin lógica, sin DOM.
// ============================================================

// Grafo del TUTORIAL (simple, 5 nodos, para demostración)
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

// Nodo destino fijo (la víctima)
var TARGET_NODE = 'V';

// Umbral de riesgo para ganar cada intento
var RISK_THRESHOLD = 10;

// Estado global de la misión
var missionState = {
    currentAttempt: 1,
    maxAttempts:    3,
    phase: 'intro'
};

// ── DATOS DE POP-UPS POR PASO ──────────────────────────────
// anchorNode: ID del nodo al que se ancla el pop-up
// offset: dirección preferida del pop-up relativa al nodo
//         'top' | 'bottom' | 'left' | 'right'
var TUT_POPUPS = [
    {
        anchorNode: 'A',
        offset: 'top',
        title: 'PUNTO DE INICIO',
        body: 'Dijkstra parte siempre de un nodo origen. Su distancia es 0; todos los demás comienzan en ∞.'
    },
    {
        anchorNode: 'A',
        offset: 'top',
        title: 'EXPLORAR VECINOS',
        body: 'Desde A actualizamos B (costo 2) y C (costo 5). Guardamos el mejor camino conocido hacia cada vecino.'
    },
    {
        anchorNode: 'B',
        offset: 'top',
        title: 'NODO MÁS CERCANO',
        body: 'Siempre elegimos el nodo no visitado con menor distancia acumulada. Aquí es B con costo 2.'
    },
    {
        anchorNode: 'D',
        offset: 'top',
        title: 'RELAJACIÓN DE ARISTAS',
        body: 'D se alcanza con 3 (A→B→D). Dijkstra "relaja" la arista: si el nuevo costo es menor, lo reemplaza.'
    },
    {
        anchorNode: 'C',
        offset: 'bottom',
        title: 'SIN ACTUALIZACIÓN',
        body: 'C→V costaría 13, pero V ya tiene costo 5. El algoritmo descarta rutas peores automáticamente.'
    },
    {
        anchorNode: 'V',
        offset: 'left',
        title: '¡RUTA ÓPTIMA HALLADA!',
        body: 'A→B→D→V con riesgo total 5. Dijkstra garantiza que esta es la ruta de menor costo posible.'
    }
];
