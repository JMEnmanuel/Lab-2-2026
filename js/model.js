// El modelo contiene los datos puros
var nodesData = [
    { id: 1, name: "Misión 1", x: 300, y: 300 },
    { id: 2, name: "Misión 2", x: 700, y: 250 },
    { id: 3, name: "Misión 3", x: 800, y: 700 },
    { id: 4, name: "Misión 4", x: 250, y: 750 },
    { id: 5, name: "Créditos", x: 500, y: 900 } // Posición corregida
];

var links = [
    [1, 2], [2, 3], [3, 4], [4, 1], [1, 5], [2, 5], [3, 5], [4, 5]
];

// Estado de la aplicación
var misionesCompletadas = [];