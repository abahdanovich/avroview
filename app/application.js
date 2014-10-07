"use strict";

var gui = require('nw.gui');
var app = gui.App;
var fs = require('fs');
var win = gui.Window.get();

var graph;
var container_id = 'container';
var max_font_size = 26;
var min_font_size = 16;

win.maximize();

$(window).on('load', function() {
  $('#'+container_id).text('loading...');
});

$(window).on('resize', function() {
  $('#'+container_id).empty();
  main();
});

// --------------------------------------------------------

function main(){
  if (app.argv.length < 1) {
    alert("Expected file name as an argument");
    app.quit();
  }

  var max_depth;

  if (app.argv.length > 1) {
    max_depth = parseInt(app.argv[1], 10); 
  }

  var schema = readSchema();
  var data = parseTree(schema, max_depth);
  var container = $('#'+container_id)[0];

  graph = drawGraph(data, container);  
}

function readSchema() {
  var fileText = fs.readFileSync(app.argv[0]).toString();
  return JSON.parse(fileText);  
}

function parseTree(root, max_depth) {
  var nodes = [];
  var edges = [];

  var label = root.name || 'unnamed root';

  nodes.push({
    id: 1,
    label: label,
    shape: 'box',
    radius: 1,
    borderWidth: 2,
    fontSize: max_font_size,
    fontColor: 'red'
  });

  root.fields.forEach(function(field) {
    parseLevel(field, nodes, edges, 1, 1, max_depth);
  });

  return  {
    nodes: nodes,
    edges: edges
  };
}

function parseLevel(root, nodes, edges, parent_id, level, max_depth) {
  var node_id = nodes.length + 1;
  var label = root.name || 'unnamed';
  var type;

  if(Array.isArray(root.type) && root.type.length > 1 && $.isPlainObject(root.type[1])) {
    type = root.type[1];
  }

  var decorate = function(src, type) {
    switch (type) {
      case 'record': return '<'+src+'>';
      case 'array':  return '['+src+']';
      case 'map':  return '{'+src+'}';
      default: return src;
    }
  };

  nodes.push({
    id: node_id,
    label: decorate(label, type ? type.type : null),
    fontSize: Math.max(min_font_size, max_font_size-(3*level)),
    shape: 'ellipse',
    title: root.doc
  });

  edges.push({
    from: parent_id,
    to: node_id
  });

  var max_depth_reached = (max_depth && (level >= max_depth));

  if((! max_depth_reached) && type) {
    var fields;

    if (type.hasOwnProperty('fields')) {
      fields = type.fields;
    }

    if (type.hasOwnProperty('items') && type.items.hasOwnProperty('fields')) {
      fields = type.items.fields;
    }

    if (fields) {
      fields.forEach(function(field) {
        parseLevel(field, nodes, edges, node_id, level+1, max_depth);
      });
    }
  }
}

function drawGraph(data, container) {
  var options = {
    edges: {
      style: "arrow"
    },
    // hierarchicalLayout: {
    //   layout: 'direction',
    //   direction: 'LR'
    // },    
    // stabilize: true,
    // stabilizationIterations: 10,
    // smoothCurves: false,
    // selectable: false,
    // dragNetwork: false,
    // dragNodes: false,
    // zoomable: false
  };
  return new vis.Network(container, data, options);
}