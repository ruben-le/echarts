import * as echarts from 'echarts/core';
import { GraphChart } from 'echarts/charts';
import { SVGRenderer } from 'echarts/renderers';

import {
    TitleComponent,
    TooltipComponent,
    GridComponent
} from 'echarts/components';

import { categories } from './categories.js'; // Import der Kategorien
import { quelldaten } from './bt-struktur/5.15 Aldi.JSON';
const ELK = require('elkjs');
const elk = new ELK({workerUrl: './node_modules/elkjs/lib/elk-worker.min.js'});

// APACHE ECHART
echarts.use(
    [TitleComponent, TooltipComponent, GridComponent, GraphChart, SVGRenderer]
);

const myChart = echarts.init(document.getElementById('beteiligungsstruktur-echarts'), null, { renderer: 'svg' });

const graph = quelldaten.initialGraph; // Beteiligungsstruktur

const elkGraph = convertToElkGraph(graph);

elk.layout(elkGraph).then(function (result) {
    myChart.setOption(formatToEcharts(result));
}).catch(console.error);

function convertToElkGraph(jsonGraph) {
    return {
        id: "root",
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN'
        },
        children: jsonGraph.nodes.map(function (node) {
            node.id = node.orbisId;
            node.width = 30;
            node.height = 30;
            return node;
        }),
        edges: jsonGraph.edges.map(function (edge) {
            edge.id = edge.ownerId + '>' + edge.shareOfId;
            edge.sources = [edge.ownerId];
            edge.targets = [edge.shareOfId];
            return edge;
        })
    }
}

function formatToEcharts(elkFormatGraph) {
    return {
        series: [
            {
                name: elkFormatGraph.children.map(function (node) {
                    return node.nameKomplett;
                }),
                type: 'graph',
                layout: 'none',
                animation: true,
                emphasis: {
                    focus: 'adjacency', // bei Maus über Element werden Verbindungen highlighted.
                    scale: true,
                },
                nodes: elkFormatGraph.children.map(function (child) {
                    child.name = child.nameKomplett;
                    child.value = child.type;
                    child.category = getCategory(child);
                    return child;
                }),
                edges: elkFormatGraph.edges.map(function (edge) {
                    edge.value = edge.label;
                    edge.label = {
                        show: true, // Dauerhaftes Anzeigen der edge labels
                        formatter: '{c}' // Verwendung von edge.value als label
                    }
                    edge.source = edge.sources[0];
                    edge.target = edge.targets[0];
                    return edge;
                }),
                categories: categories, // Kategorien für nodes
                roam: true, // Verschieben und Zoomen im chart
                label: {
                    show: true,
                    position: 'right',
                    color: 'black',
                    formatter: '{b}'
                },
                lineStyle: {
                    color: 'black',
                    curveness: 0,
                    width: 2
                }
            }
        ]
    }
}

// Mapping auf richtige Kategorie
function getCategory(node) {
    if (node.root) {
        return categories.findIndex(category => category.name === 'ROOT');
    }
    return categories.findIndex(category => category.name === node.type);
}


