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
win.on('loaded', function(){
  setTimeout(main, 100);
});

// --------------------------------------------------------

function main(){
  if (app.argv.length < 1) {
    alert("Expected file name as an argument");
    app.quit();
  }

  var max_depth;
  var container = $('#'+container_id);

  if (app.argv.length > 1) {
    max_depth = parseInt(app.argv[1], 10); 
  }

  var schema = readSchema();
  var data = parseTree(schema, max_depth);

  container.empty();

  graph = drawGraph(data, container[0]);  
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
    fontColor: 'red',
    title: root.namespace ? (root.namespace+'.'+label) : label
  });

  root.fields.forEach(function(field) {
    parseLevel(field, nodes, edges, 1, 1, max_depth, root.namespace);
  });

  return  {
    nodes: nodes,
    edges: edges
  };
}

function parseLevel(root, nodes, edges, parent_id, level, max_depth, namespace) {
  var node_id = nodes.length + 1;
  var type_def;

  if(Array.isArray(root.type) && root.type.length > 1 && $.isPlainObject(root.type[1])) {
    type_def = root.type[1];
  } else if($.isPlainObject(root.type) && root.hasOwnProperty('type')) {
    type_def = root.type;
  }

  var decorate = function(src, type_name) {
    switch (type_name) {
      case 'record': return '<'+src+'>';
      case 'array': return '['+src+']';
      case 'map':  return '{'+src+'}';
      case 'enum': return ':'+src+':';
      case 'string': return '_'+src+'_';
      case 'long': 
      case 'int': return '#'+src+'#';
      case 'double': return '~'+src+'~';
      case 'boolean': return '!'+src+'!';
      default: return src;
    }
  };

  var get_color = function(type_name) {
    switch (type_name) {
      case 'string': return 'blue';
      case 'double':
      case 'int':
      case 'long': return 'green';
      case 'boolean': return 'maroon';
      case 'array':
      case 'map':
      case 'enum':
      case 'record':  return 'purple';
      default: return 'black';
    }
  };

  var get_description = function(doc, type_name, type_def) {
    var result = [];

    if (type_name) {
      var str;

      if (type_name === 'enum' && type_def.hasOwnProperty('symbols')) {
        str = (type_name + ':<br />' + type_def.symbols.join(', '));
      } else if (type_name === 'record' && type_def.hasOwnProperty('name')) {
        str = type_def.name;
        if (namespace) {
          str = (namespace + '.' + str);
        }
        str = (type_name + ':<br />' + str);
      } else {
        str = type_name;
      }

      result.push(str);
    }

    if (doc) {
      result.push(doc);
    }

    return result.join('<br />');
  };

  var type_name;

  if (type_def) {
    type_name = type_def.type;
  } else if (Array.isArray(root.type) && root.type.length > 1){
    type_name = root.type[1];
  } else {
    type_name = root.type;
  }

  if (type_def && type_def.hasOwnProperty('namespace')) {
    namespace = type_def.namespace;
  }

  var label = decorate(root.name || 'unnamed', type_name);
  var title = get_description(root.doc, type_name, type_def);

  nodes.push({
    id: node_id,
    label: label,
    fontSize: Math.max(min_font_size, max_font_size-(3*level)),
    shape: 'ellipse',
    title: title,
    fontColor: get_color(type_name)
  });

  edges.push({
    from: parent_id,
    to: node_id
  });

  var max_depth_reached = (max_depth && (level >= max_depth));

  if((! max_depth_reached) && type_def) {
    var fields;

    if (type_def.hasOwnProperty('fields')) {
      fields = type_def.fields;
    }

    if (type_def.hasOwnProperty('items') && type_def.items.hasOwnProperty('fields')) {
      fields = type_def.items.fields;
    }

    if (fields) {
      fields.forEach(function(field) {
        parseLevel(field, nodes, edges, node_id, level+1, max_depth, namespace);
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
