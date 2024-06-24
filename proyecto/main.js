const PLAYER_STATS = 'https://raw.githubusercontent.com/DC-FZ6/VM24.csv/main/player_stats.csv';
const MAP_PICK_STATS = 'https://raw.githubusercontent.com/DC-FZ6/VM24.csv/main/map_pick_stats.csv';
const SIDE_PICK_STATS = 'https://raw.githubusercontent.com/DC-FZ6/VM24.csv/main/side_pick_stats.csv';
const BANNED_MAPS_STATS = 'https://raw.githubusercontent.com/DC-FZ6/VM24.csv/main/banned_maps_stats.csv';

//Visualizacion 1 (Gráfico de Barras Agrupado)
const SVG1 = d3.select("#vis-1").append("svg")
    .attr("viewBox", `0 0 1500 600`) 
    .attr("preserveAspectRatio", "xMidYMid meet");
    //gtp me ayudo con esta linea, ya que se veia desproporcional los datos, salian de la pantalla.
const WIDTH_VIS_1 = 1500;
const HEIGHT_VIS_1 = 600;
SVG1.attr("width", WIDTH_VIS_1).attr("height", HEIGHT_VIS_1);
const MARGIN_VIS_1 = { top: 50, right: 30, bottom: 100, left: 40 }; 
const width = WIDTH_VIS_1 - MARGIN_VIS_1.left - MARGIN_VIS_1.right;
const height = HEIGHT_VIS_1 - MARGIN_VIS_1.top - MARGIN_VIS_1.bottom;

//Visualizacion 2 (Grafico de Ejes Paralelos)
const SVG2 = d3.select("#vis-2").append("svg");
const WIDTH_VIS_2 = 1500;
const HEIGHT_VIS_2 = 600;
const MARGIN_VIS_2 = { top: 40, right: 30, bottom: 50, left: 60 };
SVG2.attr("width", WIDTH_VIS_2).attr("height", HEIGHT_VIS_2);
const width2 = WIDTH_VIS_2 - MARGIN_VIS_2.left - MARGIN_VIS_2.right;
const height2 = HEIGHT_VIS_2 - MARGIN_VIS_2.top - MARGIN_VIS_2.bottom;

//Visualizacion 3 (Grilla de Círculos)
const SVG3 = d3.select("#vis-3").append("svg");
const WIDTH_VIS_3 = 1500;
const HEIGHT_VIS_3 = 600;
const MARGIN_VIS_3 = { top: 50, right: 40, bottom: 50, left: 80 };
SVG3.attr("width", WIDTH_VIS_3).attr("height", HEIGHT_VIS_3);
const width3 = WIDTH_VIS_3 - MARGIN_VIS_3.left - MARGIN_VIS_3.right;
const height3 = HEIGHT_VIS_3 - MARGIN_VIS_3.top - MARGIN_VIS_3.bottom;

async function loadCSV(file) {
    return d3.csv(file);
}

async function loadData() {
    playerData = await d3.csv(PLAYER_STATS);
    createParallelCoordinates(playerData);
    createGridCircles(playerData);
}

async function createGroupedBarChart() {
    try {
        const [mapData, sideData, bannedData] = await Promise.all([
            loadCSV(MAP_PICK_STATS),
            loadCSV(SIDE_PICK_STATS),
            loadCSV(BANNED_MAPS_STATS)
        ]);

        // Procesar datos
        const maps = mapData.map(d => d.Map);
        const days = mapData.columns.slice(2);
        const totalPlays = mapData.reduce((acc, d) => {
            acc[d.Map] = +d.Total;
            return acc;
        }, {});

        const sideStats = sideData.reduce((acc, d) => {
            acc[d.Map] = { atk: +d['Atk Wins'], def: +d['Def Wins'] };
            return acc;
        }, {});

        const bannedStats = bannedData.reduce((acc, d) => {
            acc[d.Map] = days.reduce((dayAcc, day) => {
                dayAcc[day] = +d[day];
                return dayAcc;
            }, {});
            return acc;
        }, {});

        // Transformar datos para D3
        const transformedData = [];
        mapData.forEach(d => {
            days.forEach(day => {
                transformedData.push({
                    map: d.Map,
                    day: day,
                    count: +d[day]
                });
            });
        });

        // Agregar SVG
        const svg = SVG1.append("g")
            .attr("transform", `translate(${MARGIN_VIS_1.left},${MARGIN_VIS_1.top})`);

        // Escalas
        const x0 = d3.scaleBand()
            .domain(days)
            .range([0, width])
            .paddingInner(0.1);

        const x1 = d3.scaleBand()
            .domain(maps)
            .range([0, x0.bandwidth()])
            .padding(0.05);

        const y = d3.scaleLinear()
            .domain([0, 4])
            .range([height, 0]);

        const color = d3.scaleOrdinal()
            .domain(maps)
            .range(d3.schemeCategory10);

        // Tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px");

        // Estado para saber si hay alguna barra seleccionada
        let selectedMap = null;

        // mostrar el mapa seleccionado
        const selectedMapText = svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("");

        // Dibujar barras
        const bars = svg.append("g")
            .selectAll("g")
            .data(d3.group(transformedData, d => d.day))
            .join("g")
            .attr("transform", d => `translate(${x0(d[0])},0)`)
            .selectAll("rect")
            .data(d => d[1])
            .join("rect")
            .attr("x", d => x1(d.map))
            .attr("y", d => y(d.count))
            .attr("width", x1.bandwidth())
            .attr("height", d => height - y(d.count) + 3)
            .attr("fill", d => color(d.map))
            .attr("map", d => d.map) // Agregar un atributo para facilitar la selección
            .on("mouseover", function(event, d) {
                if (!selectedMap) {
                    d3.select(this).attr("opacity", 0.7);
                }
                tooltip.style("visibility", "visible")
                    .html(`Mapa: ${d.map}<br>Total: ${totalPlays[d.map]}<br>Día: ${d.day}<br>Jugados en el dia: ${d.count}<br>Baneado: ${bannedStats[d.map][d.day]} veces<br>ATK: ${sideStats[d.map].atk}, DEF: ${sideStats[d.map].def}`)
                    .style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mousemove", function(event) {
                tooltip.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function() {
                if (!selectedMap) {
                    d3.select(this).attr("opacity", 1);
                }
                tooltip.style("visibility", "hidden");
            })
            .on("click", function(event, d) {
                selectedMap = selectedMap === d.map ? null : d.map; // Alternar selección
                d3.selectAll("rect").attr("opacity", function() {
                    return selectedMap && d3.select(this).attr("map") !== selectedMap ? 0.2 : 1;
                });
                selectedMapText.text(selectedMap ? `Mapa Seleccionado: ${selectedMap} (Total: ${totalPlays[selectedMap]}, ATK: ${sideStats[selectedMap].atk}, DEF: ${sideStats[selectedMap].def})` : "");
            });

        // Ejes
        svg.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("d")));

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x0));

        // Leyenda
        const legend = svg.append("g")
            .attr("transform", `translate(0, ${height + 50})`);

        maps.forEach((map, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(${i * 150}, 0)`);

            legendRow.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", color(map))
                .on("click", function() {
                    selectedMap = selectedMap === map ? null : map; // Alternar selección
                    d3.selectAll("rect").attr("opacity", function() {
                        return selectedMap && d3.select(this).attr("map") !== selectedMap ? 0.2 : 1;
                    });
                    selectedMapText.text(selectedMap ? `Mapa Seleccionado: ${selectedMap} (Total: ${totalPlays[selectedMap]}, ATK: ${sideStats[selectedMap].atk}, DEF: ${sideStats[selectedMap].def})` : "");
                });

            legendRow.append("text")
                .attr("x", 20)
                .attr("y", 10)
                .attr("text-anchor", "start")
                .style("text-transform", "capitalize")
                .text(`${map} (Total: ${totalPlays[map]})`)
                .on("click", function() {
                    selectedMap = selectedMap === map ? null : map; // Alternar selección
                    d3.selectAll("rect").attr("opacity", function() {
                        return selectedMap && d3.select(this).attr("map") !== selectedMap ? 0.2 : 1;
                    });
                    selectedMapText.text(selectedMap ? `Mapa Seleccionado: ${selectedMap} (Total: ${totalPlays[selectedMap]}, ATK: ${sideStats[selectedMap].atk}, DEF: ${sideStats[selectedMap].def})` : "");
                });
        });
    

    } catch (error) {
        console.error('Error loading CSV files:', error);
    }
}

loadData();
createGroupedBarChart();
let playerData;

//gráfico de ejes paralelos
async function createParallelCoordinates(data) {
    SVG2.selectAll("*").remove();

    const svg = SVG2.append("g")
        .attr("transform", `translate(${MARGIN_VIS_2.left},${MARGIN_VIS_2.top})`);

    const dimensions = ["K", "D", "A", "KD", "KDA", "ACS/Map", "K/Map", "D/Map", "A/Map"];
    
    const color = d3.scaleSequential(d3.interpolateRainbow)
        .domain([0, data.length - 1]);

    const y = {};
    for (let dim of dimensions) {
        y[dim] = d3.scaleLinear()
            .domain(d3.extent(data, d => +d[dim]))
            .range([height2, 0]);
    }

    const x = d3.scalePoint()
        .range([0, width2 - 200])
        .padding(1)
        .domain(dimensions);

    let selectedPlayers = [];

    function path(d) {
        return d3.line()(dimensions.map(p => [x(p), y[p](d[p])]));
    }

    function updateOpacity() {
        svg.selectAll("path")
            .style("opacity", d => {
                // Mostrar camino solo si el jugador está en selectedPlayers
                return (selectedPlayers.length === 0 || selectedPlayers.includes(d)) ? 1 : 0.1;
            });
    }
    svg.selectAll("path")
        .data(data)
        .join("path")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", (d, i) => color(i));

    svg.selectAll("g")
        .data(dimensions)
        .join("g")
        .attr("transform", d => `translate(${x(d)})`)
        .each(function(d) { d3.select(this).call(d3.axisLeft(y[d])); })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(d => d)
        .style("fill", "black");
        
    svg.selectAll(".player-name")
        .data(data)
        .join("text")
        .attr("class", "player-name")
        .attr("x", width2 - 160)
        .attr("y", (d, i) => i * (height2 / data.length))
        .text(d => `${d.Player} (${d.Team})`)
        .style("font-size", "12px")
        .style("fill", (d, i) => color(i))
        .on("click", function(event, d) {
            // Toggle para añadir o quitar jugador seleccionado
            if (selectedPlayers.includes(d)) {
                selectedPlayers = selectedPlayers.filter(player => player !== d);
            } else {
                selectedPlayers.push(d);
            }
            updateOpacity();
        });
}

//grilla de círculos
// Variables globales para guardar datos originales y orden actual
let originalData = [];
let currentSort = "";

// Función para crear la grilla de círculos según los datos proporcionados
async function createGridCircles(data) {
    SVG3.selectAll("*").remove(); // Elimina todo lo que haya en SVG3

    const svg = SVG3.append("g")
        .attr("transform", `translate(${MARGIN_VIS_3.left},${MARGIN_VIS_3.top})`);

    // Llama a la función para crear los botones de filtro y ordenamiento
    createButtons(data);

    // Guardar los datos originales la primera vez que se llama a esta función
    if (originalData.length === 0) {
        originalData = data.slice();
    }

    // Función para ordenar los datos y actualizar la grilla de círculos
    function updateGrid(sortedData) {
        const color = d3.scaleSequential(d3.interpolateRainbow)
            .domain([0, sortedData.length - 1]);
    
        const numCols = 10;
        const numRows = Math.ceil(sortedData.length / numCols);
        const circleRadius = 18;
        const xPadding = 150;
        const yPadding = 100;
    
        // Actualizar círculos
        const circles = svg.selectAll("circle")
            .data(sortedData, d => d.Player) // Usar el identificador único (por ejemplo, Player) como clave de datos
            .join(
                enter => enter.append("circle")
                    .attr("r", circleRadius)
                    .style("stroke", "black")
                    .attr("cx", (d, i) => (i % numCols) * xPadding)
                    .attr("cy", (d, i) => Math.floor(i / numCols) * yPadding)
                    .style("fill", (d, i) => color(i)),
                update => update // No es necesario actualizar nada si los datos no cambian
                    .attr("cx", (d, i) => (i % numCols) * xPadding)
                    .attr("cy", (d, i) => Math.floor(i / numCols) * yPadding),
                exit => exit.remove() // Eliminar elementos que ya no están en los datos
            );
    
        // Actualizar etiquetas de texto
        svg.selectAll(".circle-label")
            .data(sortedData, d => d.Player) // Usar el identificador único como clave de datos
            .join(
                enter => enter.append("text")
                    .attr("class", "circle-label")
                    .attr("x", (d, i) => (i % numCols) * xPadding)
                    .attr("y", (d, i) => Math.floor(i / numCols) * yPadding + circleRadius + 15)
                    .style("text-anchor", "middle")
                    .style("font-size", "12px")
                    .text(d => `${d.Player} (${d.Team})`),
                update => update // No es necesario actualizar nada si los datos no cambian
                    .attr("x", (d, i) => (i % numCols) * xPadding)
                    .attr("y", (d, i) => Math.floor(i / numCols) * yPadding + circleRadius + 15),
                exit => exit.remove() // Eliminar elementos que ya no están en los datos
            );
    }
    
    // Función para crear los botones de filtro y ordenamiento
    function createButtons(data) {
        // Limpiar el contenedor de botones antes de agregar nuevos
        d3.select("#button-container").selectAll("*").remove();

        const buttonContainer = d3.select("#button-container");

        // Botón para ordenar por K/D/A
        const select = buttonContainer.append("select")
            .attr("id", "sort-select")
            .on("change", function() {
                const selectedValue = d3.select(this).property("value");
                let sortedData;

                switch (selectedValue) {
                    case "k-desc":
                        sortedData = data.slice().sort((a, b) => b.K - a.K); // Orden descendente por K
                        break;
                    case "k-asc":
                        sortedData = data.slice().sort((a, b) => a.K - b.K); // Orden ascendente por K
                        break;
                    case "d-desc":
                        sortedData = data.slice().sort((a, b) => b.D - a.D); // Orden descendente por D
                        break;
                    case "d-asc":
                        sortedData = data.slice().sort((a, b) => a.D - b.D); // Orden ascendente por D
                        break;
                    case "a-desc":
                        sortedData = data.slice().sort((a, b) => b.A - a.A); // Orden descendente por A
                        break;
                    case "a-asc":
                        sortedData = data.slice().sort((a, b) => a.A - b.A); // Orden ascendente por A
                        break;
                    default:
                        sortedData = data; // Sin ordenamiento
                        break;
                }

                updateGrid(sortedData); // Actualizar la grilla con los datos ordenados
                currentSort = selectedValue; // Actualizar orden actual
                updateSortText(selectedValue); // Actualizar texto de ordenamiento
            });

        // Opciones para ordenar por K/D/A
        const options = [
            { value: "k-desc", text: "Ordenar por K Descendente" },
            { value: "k-asc", text: "Ordenar por K Ascendente" },
            { value: "d-desc", text: "Ordenar por D Descendente" },
            { value: "d-asc", text: "Ordenar por D Ascendente" },
            { value: "a-desc", text: "Ordenar por A Descendente" },
            { value: "a-asc", text: "Ordenar por A Ascendente" }
        ];

        select.selectAll("option")
            .data(options)
            .enter().append("option")
            .attr("value", d => d.value)
            .text(d => d.text);

        // Agregar un botón para limpiar el ordenamiento
        buttonContainer.append("button")
            .text("Mostrar todos")
            .on("click", function() {
                updateGrid(originalData); // Volver a mostrar todos los datos originales
                currentSort = ""; // Reiniciar orden actual
                updateSortText(""); // Limpiar texto de ordenamiento
            });

        // Función para actualizar el texto de ordenamiento
        function updateSortText(selectedValue) {
            // Seleccionar el elemento de texto y actualizar su contenido
            d3.select("#sort-text")
                .text(selectedValue ? `Ordenado por: ${selectedValue}` : "");
        }

        // Agregar texto de ordenamiento inicial
        buttonContainer.append("p")
            .attr("id", "sort-text")
            .text(currentSort ? `Ordenado por: ${currentSort}` : ""); // Mostrar orden actual si existe
    }

    // Crear la grilla inicial al cargar los datos
    updateGrid(data);
}
//orden de datos
function updateVisualizations(sortBy) {
    const sortedData = playerData.sort((a, b) => d3.descending(+a[sortBy], +b[sortBy]));
    createParallelCoordinates(sortedData);
    createGridCircles(sortedData);
}

// Event listener para el dropdown de ordenamiento
d3.select("#sort-by").on("change", function(event) {
    const sortBy = d3.select(this).property("value");
    updateVisualizations(sortBy);
});



//codigo modificado, inspirado de la tarea 2. musica pagina.
try {
    const audio = new Audio('https://github.com/DC-FZ6/VM24.csv/raw/main/VALORANTChampions21.mp3');
    audio.volume = 0.3;
    audio.loop = true;
    let playAudio = false;
    if (playAudio) {
        audio.play();
        d3.select("#sound").text("OFF Music 🎵")
    }
    d3.select("#sound").on("click", d => {
        playAudio = !playAudio;
        if (playAudio) {
            audio.play();
            d3.select("#sound").text("OFF Music 🎵")
        }
        else {
            audio.pause();
            d3.select("#sound").text("ON Music 🎵")
        }
    })
} catch (error) { };
