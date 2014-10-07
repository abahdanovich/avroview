"use strict";

var gui = require('nw.gui');
var app = gui.App;
var fs = require('fs');
var win = gui.Window.get();

var graph;
var dom = {
  container: '#container',
  search: 'input.search',
  toolbar: '#toolbar'
};
var max_font_size = 26;
var min_font_size = 16;
var all_nodes = [];

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
  var container = $(dom.container);

  if (app.argv.length > 1) {
    max_depth = parseInt(app.argv[1], 10); 
  }

  var schema = readSchema();
  var data = parseTree(schema, max_depth);

  container.empty();

  graph = drawGraph(data, container[0]);  

  $(dom.toolbar).show();

  var search_nodes_debounced = _.debounce(searchNodes, 500);

  $(dom.search).on('keyup', function(){
    search_nodes_debounced();
  });

  $('input:checkbox', dom.toolbar).on('change', function(){
    search_nodes_debounced();
  });
}

function getNodesIds(text, fields) {
  if(_.isEmpty(text)) {
    return [];
  }

  var re = new RegExp(text, "i");
  var nodes = all_nodes.filter(function(node){
    return _.any(fields, function(field){
      return node.hasOwnProperty(field) && node[field].match(re);
    });
  });

  return nodes.map(function(node){
    return node.id;
  });  
}

function searchNodes() {
  var text = $(dom.search).val();
  var fields = $('input:checkbox:checked', dom.toolbar)
    .map(function(){ 
      return $(this).attr('name'); 
    }).get();
  graph.selectNodes(getNodesIds(text, fields));
}

function readSchema() {
  var fileText = fs.readFileSync(app.argv[0]).toString();
  return JSON.parse(fileText);  
}

function parseTree(root, max_depth) {
  var nodes = [];
  var edges = [];

  var label = root.name || 'unnamed_root';
  var path = root.namespace ? (root.namespace+'.'+label) : label;

  var node = {
    id: 1,
    label: label,
    shape: 'box',
    radius: 1,
    borderWidth: 2,
    fontSize: max_font_size,
    fontColor: 'red',
    title: path
  };
  nodes.push(node);

  all_nodes.push({
    id: node.id,
    name: root.name || '',
    description: path
  });

  root.fields.forEach(function(field) {
    parseLevel(field, nodes, edges, 1, 1, max_depth, root.namespace, []);
  });

  return  {
    nodes: nodes,
    edges: edges
  };
}

function parseLevel(root, nodes, edges, parent_id, level, max_depth, namespace, ancestors) {
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

  var getColor = function(type_name) {
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

  var getDescription = function(doc, type_name, type_def, ancestors) {
    var result = [];

    if (ancestors && ancestors.length) {
      result.push(ancestors.join('.'));
    }

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

  var new_namespace;

  if (type_def && type_def.hasOwnProperty('namespace')) {
    new_namespace = type_def.namespace;
  }

  var name = root.name || 'unnamed';
  var path_element;

  if (type_name && type_name === 'array') {
    path_element = name + '[]';
  } else {
    path_element = name;
  }

  var label = decorate(name, type_name);
  var new_ancestors = ancestors.concat([path_element]);
  var title = getDescription(root.doc, type_name, type_def, new_ancestors);

  var node = {
    id: node_id,
    label: label,
    fontSize: Math.max(min_font_size, max_font_size-(3*level)),
    shape: 'ellipse',
    title: title,
    fontColor: getColor(type_name)
  };

  nodes.push(node);

  all_nodes.push({
    id: node.id,
    name: root.name || '',
    description: title
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
        parseLevel(field, nodes, edges, node_id, level+1, max_depth, new_namespace ? new_namespace : namespace, new_ancestors);
      });
    }
  }
}

function drawGraph(data, container) {
  var options = {
    edges: {
      style: "arrow"
    },
    nodes: {
      color: {
        background: '#97C2FC',
        border: '#2B7CE9',
        highlight: {
          background: 'yellow',
          border: '#2B7CE9'
        }
      },
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
