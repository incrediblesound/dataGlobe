/**
  @author David Piegza

  Implements a graph structure.
  Consists of Graph, Nodes and Edges.


  Nodes:
  Create a new Node with an id. A node has the properties
  id, position and data.

  Example:
  node = new Node(1);
  node.position.x = 100;
  node.position.y = 100;
  node.data.title = "Title of the node";

  The data property can be used to extend the node with custom
  informations. Then, they can be used in a visualization.


  Edges:
  Connects to nodes together.
  
  Example:
  edge = new Edge(node1, node2);

  An edge can also be extended with the data attribute. E.g. set a
  type like "friends", different types can then be draw in differnt ways. 


  Graph:
  
  Parameters:
  options = {
    limit: <int>, maximum number of nodes
  }

  Methods:
  addNode(node) - adds a new node and returns true if the node has been added,
                  otherwise false.
  getNode(node_id) - returns the node with node_id or undefined, if it not exist
  addEdge(node1, node2) - adds an edge for node1 and node2. Returns true if the
                          edge has been added, otherwise false (e.g.) when the
                          edge between these nodes already exist.
  
  reached_limit() - returns true if the limit has been reached, otherwise false

 */

function Graph(options) {
  this.options = options || {};
  this.nodeSet = {};
  this.nodes = [];
  this.edges = [];
  this.layout;
}

Graph.prototype.addNode = function(node) {
  if(this.nodeSet[node.id] == undefined && !this.reached_limit()) {
    this.nodeSet[node.id] = node;
    this.nodes.push(node);
    return true;
  }
  return false;
};

Graph.prototype.getNode = function(node_id) {
  return this.nodeSet[node_id];
};

Graph.prototype.addEdge = function(source, target) {
  if(source.addConnectedTo(target) === true) {
    var edge = new Edge(source, target);
    this.edges.push(edge);
    return true;
  }
  return false;
};

Graph.prototype.reached_limit = function() {
  if(this.options.limit != undefined)
    return this.options.limit <= this.nodes.length;
  else
    return false;
};


function Node(node_id) {
  this.id = node_id;
  this.nodesTo = [];
  this.nodesFrom = [];
  this.position = {};
  this.data = {};
}

Node.prototype.addConnectedTo = function(node) {
  if(this.connectedTo(node) === false) {
    this.nodesTo.push(node);
    return true;
  }
  return false;
};

Node.prototype.connectedTo = function(node) {
  for(var i=0; i < this.nodesTo.length; i++) {
    var connectedNode = this.nodesTo[i];
    if(connectedNode.id == node.id) {
      return true;
    }
  }
  return false;
};


function Edge(source, target) {
  this.source = source;
  this.target = target;
  this.data = {};
}
;/**
  @author David Piegza

  Implements a label for an object.

  It creates an text in canvas and sets the text-canvas as
  texture of a cube geometry.

  Parameters:
  text: <string>, text of the label

  Example:
  var label = new THREE.Label("Text of the label");
  label.position.x = 100;
  label.position.y = 100;
  scene.addObject(label);
 */

THREE.Label = function(text, parameters) {
  var parameters = parameters || {};

  var labelCanvas = document.createElement( "canvas" );

  function create() {
    var xc = labelCanvas.getContext("2d");
    var fontsize = "40pt";

    // set font size to measure the text
    xc.font = fontsize + " Arial";
    var len = xc.measureText(text).width;

    labelCanvas.setAttribute('width', len);

    // set font size again cause it will be reset
    // when setting a new width
    xc.font = fontsize + " Arial";
    xc.textBaseline = 'top';
    xc.fillText(text, 0, 0);

    var geometry = new THREE.CubeGeometry(len, 200, 0);
    var xm = new THREE.MeshBasicMaterial({map: new THREE.Texture(labelCanvas), transparent: true});
    xm.map.needsUpdate = true;

    // set text canvas to cube geometry
    var labelObject = new THREE.Mesh(geometry, xm);
    return labelObject;
  }

  return create();
}
;/**
  @author David Piegza

  Implements a selection for objects in a scene.

  It invokes a callback function when the mouse enters and when it leaves the object.
  Based on a Three.js selection example.

  Parameters:
    domElement: HTMLDomElement
    selected: callback function, passes the current selected object (on mouseover)
    clicked: callback function, passes the current clicked object
 */

THREE.ObjectSelection = function(parameters) {
  var parameters = parameters || {};

  this.domElement = parameters.domElement || document;
  this.projector = new THREE.Projector();
  this.INTERSECTED;

  var _this = this;

  var callbackSelected = parameters.selected;
  var callbackClicked = parameters.clicked;
  var mouse = { x: 0, y: 0 };

  this.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
  function onDocumentMouseMove( event ) {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  }

  this.domElement.addEventListener( 'click', onDocumentMouseClick, false );
  function onDocumentMouseClick( event ) {
    if(_this.INTERSECTED) {
      if(typeof callbackClicked === 'function') {
        callbackClicked(_this.INTERSECTED);
      }
    }
  }

  this.render = function(scene, camera) {
    var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
    this.projector.unprojectVector( vector, camera );

    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

    var intersects = raycaster.intersectObject(scene, true);

    if( intersects.length > 0 ) {
      if ( this.INTERSECTED != intersects[ 0 ].object ) {
        if ( this.INTERSECTED ) {
          this.INTERSECTED.material.color.setHex( this.INTERSECTED.currentHex );
        }

        this.INTERSECTED = intersects[ 0 ].object;
        this.INTERSECTED.currentHex = this.INTERSECTED.material.color.getHex();
        this.INTERSECTED.material.color.setHex( 0xff0000 );
        if(typeof callbackSelected === 'function') {
          callbackSelected(this.INTERSECTED);
        }
      }
    } else {
      if ( this.INTERSECTED ) {
        this.INTERSECTED.material.color.setHex( this.INTERSECTED.currentHex );
      }
      this.INTERSECTED = null;
      if(typeof callbackSelected === 'function') {
        callbackSelected(this.INTERSECTED);
      }
    }
  }
}
;/**
  @author David Piegza

  Implements a force-directed layout, the algorithm is based on Fruchterman and Reingold and
  the JUNG implementation.

  Needs the graph data structure Graph.js:
  https://github.com/davidpiegza/Graph-Visualization/blob/master/Graph.js

  Parameters:
  graph - data structure
  options = {
    layout: "2d" or "3d"
    attraction: <float>, attraction value for force-directed layout
    repulsion: <float>, repulsion value for force-directed layout
    iterations: <int>, maximum number of iterations
    width: <int>, width of the viewport
    height: <int>, height of the viewport

    positionUpdated: <function>, called when the position of the node has been updated
  }
  
  Examples:
  
  create:
  layout = new Layout.ForceDirected(graph, {width: 2000, height: 2000, iterations: 1000, layout: "3d"});
  
  call init when graph is loaded (and for reset or when new nodes has been added to the graph):
  layout.init();
  
  call generate in a render method, returns true if it's still calculating and false if it's finished
  layout.generate();


  Feel free to contribute a new layout!

 */

var Layout = Layout || {};

Layout.ForceDirected = function(graph, options) {
  var options = options || {};
  
  this.layout = options.layout || "2d";
  this.attraction_multiplier = options.attraction || 5;
  this.repulsion_multiplier = options.repulsion || 0.75;
  this.max_iterations = options.iterations || 1000;
  this.graph = graph;
  this.width = options.width || 200;
  this.height = options.height || 200;
  this.finished = false;

  var callback_positionUpdated = options.positionUpdated;
  
  var EPSILON = 0.000001;
  var attraction_constant;
  var repulsion_constant;
  var forceConstant;
  var layout_iterations = 0;
  var temperature = 0;
  var nodes_length;
  var edges_length;
  var that = this;
  
  // performance test
  var mean_time = 0;

  /**
   * Initialize parameters used by the algorithm.
   */
  this.init = function() {
    this.finished = false;
    temperature = this.width / 10.0;
    nodes_length = this.graph.nodes.length;
    edges_length = this.graph.edges.length;
    forceConstant = Math.sqrt(this.height * this.width / nodes_length);
    attraction_constant = this.attraction_multiplier * forceConstant;
    repulsion_constant = this.repulsion_multiplier * forceConstant;
  };

  /**
   * Generates the force-directed layout.
   *
   * It finishes when the number of max_iterations has been reached or when
   * the temperature is nearly zero.
   */
  this.generate = function() {
    if(layout_iterations < this.max_iterations && temperature > 0.000001) {
      var start = new Date().getTime();
      
      // calculate repulsion
      for(var i=0; i < nodes_length; i++) {
        var node_v = graph.nodes[i];
        node_v.layout = node_v.layout || {};
        if(i==0) {
          node_v.layout.offset_x = 0;
          node_v.layout.offset_y = 0;
          if(this.layout === "3d") {
            node_v.layout.offset_z = 0;
          }
        }

        node_v.layout.force = 0;
        node_v.layout.tmp_pos_x = node_v.layout.tmp_pos_x || node_v.position.x;
        node_v.layout.tmp_pos_y = node_v.layout.tmp_pos_y || node_v.position.y;
        if(this.layout === "3d") {    
          node_v.layout.tmp_pos_z = node_v.layout.tmp_pos_z || node_v.position.z;
        }

        for(var j=i+1; j < nodes_length; j++) {
          var node_u = graph.nodes[j];
          if(i != j) {
            node_u.layout = node_u.layout || {};
            node_u.layout.tmp_pos_x = node_u.layout.tmp_pos_x || node_u.position.x;
            node_u.layout.tmp_pos_y = node_u.layout.tmp_pos_y || node_u.position.y;
            if(this.layout === "3d") {
              node_u.layout.tmp_pos_z = node_u.layout.tmp_pos_z || node_u.position.z;
            }

            var delta_x = node_v.layout.tmp_pos_x - node_u.layout.tmp_pos_x;
            var delta_y = node_v.layout.tmp_pos_y - node_u.layout.tmp_pos_y;
            if(this.layout === "3d") {
              var delta_z = node_v.layout.tmp_pos_z - node_u.layout.tmp_pos_z;
            }

            var delta_length = Math.max(EPSILON, Math.sqrt((delta_x * delta_x) + (delta_y * delta_y)));
            if(this.layout === "3d") {
              var delta_length_z = Math.max(EPSILON, Math.sqrt((delta_z * delta_z) + (delta_y * delta_y)));
            }

            var force = (repulsion_constant * repulsion_constant) / delta_length;
            if(this.layout === "3d") {
              var force_z = (repulsion_constant * repulsion_constant) / delta_length_z;
            }

            node_v.layout.force += force;
            node_u.layout.force += force;

            node_v.layout.offset_x += (delta_x / delta_length) * force;
            node_v.layout.offset_y += (delta_y / delta_length) * force;

            if(i==0) {
              node_u.layout.offset_x = 0;
              node_u.layout.offset_y = 0;
              if(this.layout === "3d") {
                node_u.layout.offset_z = 0;
              }
            }
            node_u.layout.offset_x -= (delta_x / delta_length) * force;
            node_u.layout.offset_y -= (delta_y / delta_length) * force;

            if(this.layout === "3d") {
              node_v.layout.offset_z += (delta_z / delta_length_z) * force_z;
              node_u.layout.offset_z -= (delta_z / delta_length_z) * force_z;
            }
          }
        }
      }
      
      // calculate attraction
      for(var i=0; i < edges_length; i++) {
        var edge = graph.edges[i];
        var delta_x = edge.source.layout.tmp_pos_x - edge.target.layout.tmp_pos_x;
        var delta_y = edge.source.layout.tmp_pos_y - edge.target.layout.tmp_pos_y;
        if(this.layout === "3d") {
          var delta_z = edge.source.layout.tmp_pos_z - edge.target.layout.tmp_pos_z;
        }  

        var delta_length = Math.max(EPSILON, Math.sqrt((delta_x * delta_x) + (delta_y * delta_y)));
        if(this.layout === "3d") {
          var delta_length_z = Math.max(EPSILON, Math.sqrt((delta_z * delta_z) + (delta_y * delta_y)));
        }
        var force = (delta_length * delta_length) / attraction_constant;
        if(this.layout === "3d") {
          var force_z = (delta_length_z * delta_length_z) / attraction_constant;
        }

        edge.source.layout.force -= force;
        edge.target.layout.force += force;

        edge.source.layout.offset_x -= (delta_x / delta_length) * force;
        edge.source.layout.offset_y -= (delta_y / delta_length) * force;
        if(this.layout === "3d") {    
          edge.source.layout.offset_z -= (delta_z / delta_length_z) * force_z;
        }

        edge.target.layout.offset_x += (delta_x / delta_length) * force;
        edge.target.layout.offset_y += (delta_y / delta_length) * force;
        if(this.layout === "3d") {    
          edge.target.layout.offset_z += (delta_z / delta_length_z) * force_z;
        }        
      }
      
      // calculate positions
      for(var i=0; i < nodes_length; i++) {
        var node = graph.nodes[i];
        var delta_length = Math.max(EPSILON, Math.sqrt(node.layout.offset_x * node.layout.offset_x + node.layout.offset_y * node.layout.offset_y));
        if(this.layout === "3d") {
          var delta_length_z = Math.max(EPSILON, Math.sqrt(node.layout.offset_z * node.layout.offset_z + node.layout.offset_y * node.layout.offset_y));
        }

        node.layout.tmp_pos_x += (node.layout.offset_x / delta_length) * Math.min(delta_length, temperature);
        node.layout.tmp_pos_y += (node.layout.offset_y / delta_length) * Math.min(delta_length, temperature);
        if(this.layout === "3d") {    
          node.layout.tmp_pos_z += (node.layout.offset_z / delta_length_z) * Math.min(delta_length_z, temperature);
        }

        var updated = true;
        node.position.x -=  (node.position.x-node.layout.tmp_pos_x)/10;
          node.position.y -=  (node.position.y-node.layout.tmp_pos_y)/10;

        if(this.layout === "3d") {    
          node.position.z -=  (node.position.z-node.layout.tmp_pos_z)/10;
        }
        
        // execute callback function if positions has been updated
        if(updated && typeof callback_positionUpdated === 'function') {
          callback_positionUpdated(node);
        }
      }
      temperature *= (1 - (layout_iterations / this.max_iterations));
      layout_iterations++;

      var end = new Date().getTime();
      mean_time += end - start;
    } else {
      if(!this.finished) {        
        console.log("Average time: " + (mean_time/layout_iterations) + " ms");
      }
      this.finished = true;
      return false;
    }
    return true;
  };

  /**
   * Stops the calculation by setting the current_iterations to max_iterations.
   */
  this.stop_calculating = function() {
    layout_iterations = this.max_iterations;
  }
};
;/**
  @author David Piegza

  Implements a simple graph drawing with force-directed placement in 2D and 3D.

  It uses the force-directed-layout implemented in:
  https://github.com/davidpiegza/Graph-Visualization/blob/master/layouts/force-directed-layout.js

  Drawing is done with Three.js: http://github.com/mrdoob/three.js

  To use this drawing, include the graph-min.js file and create a SimpleGraph object:

  <!DOCTYPE html>
  <html>
    <head>
      <title>Graph Visualization</title>
      <script type="text/javascript" src="path/to/graph-min.js"></script>
    </head>
    <body onload="new Drawing.SimpleGraph({layout: '3d', showStats: true, showInfo: true})">
    </bod>
  </html>

  Parameters:
  options = {
    layout: "2d" or "3d"

    showStats: <bool>, displays FPS box
    showInfo: <bool>, displays some info on the graph and layout
              The info box is created as <div id="graph-info">, it must be
              styled and positioned with CSS.


    selection: <bool>, enables selection of nodes on mouse over (it displays some info
               when the showInfo flag is set)


    limit: <int>, maximum number of nodes

    numNodes: <int> - sets the number of nodes to create.
    numEdges: <int> - sets the maximum number of edges for a node. A node will have
              1 to numEdges edges, this is set randomly.
  }


  Feel free to contribute a new drawing!

 */

var Drawing = Drawing || {};

Drawing.SimpleGraph = function(options) {
  var options = options || {};

  this.layout = options.layout || "3d";
  this.layout_options = options.graphLayout || {};
  this.show_stats = options.showStats || false;
  this.show_info = options.showInfo || false;
  this.show_labels = options.showLabels || false;
  this.selection = options.selection || false;
  this.limit = options.limit || 10;
  this.nodes_count = options.numNodes || 20;
  this.edges_count = options.numEdges || 10;

  var camera, controls, scene, renderer, interaction, geometry, object_selection;
  var stats;
  var info_text = {};
  var graph = new Graph({limit: options.limit});

  var geometries = [];

  var that=this;

  init();
  animate();

  function init() {
    // Three.js initialization
    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize( window.innerWidth, window.innerHeight );

    camera = new THREE.PerspectiveCamera(40, window.innerWidth/window.innerHeight, 1, 1000000);
    camera.position.z = 5000;

    controls = new THREE.OrbitControls(camera);

    // controls.rotateSpeed = 0.5;
    // controls.zoomSpeed = 5.2;
    // controls.panSpeed = 1;

    // controls.noZoom = false;
    // controls.noPan = false;

    // controls.staticMoving = false;
    // controls.dynamicDampingFactor = 0.3;

    // controls.keys = [ 65, 83, 68 ];

    controls.addEventListener('change', render);

    scene = new THREE.Scene();

    // Node geometry
    if(that.layout === "3d") {
      geometry = new THREE.CubeGeometry( 25, 25, 25 );
    } else {
      geometry = new THREE.CubeGeometry( 50, 50, 0 );
    }

    // Create node selection, if set
    if(that.selection) {
      object_selection = new THREE.ObjectSelection({
        domElement: renderer.domElement,
        selected: function(obj) {
          // display info
          if(obj != null) {
            info_text.select = "Object " + obj.id;
          } else {
            delete info_text.select;
          }
        },
        clicked: function(obj) {
        }
      });
    }

    document.body.appendChild( renderer.domElement );

    // Stats.js
    // if(that.show_stats) {
    //   stats = new Stats();
    //   stats.domElement.style.position = 'absolute';
    //   stats.domElement.style.top = '0px';
    //   document.body.appendChild( stats.domElement );
    // }

    // Create info box
    if(that.show_info) {
      var info = document.createElement("div");
      var id_attr = document.createAttribute("id");
      id_attr.nodeValue = "graph-info";
      info.setAttributeNode(id_attr);
      document.body.appendChild( info );
    }
  }


  /**
   *  Creates a graph with random nodes and edges.
   *  Number of nodes and edges can be set with
   *  numNodes and numEdges.
   */
  this.user;
  this.insertNode = function(data, isUser) {
    var node = new Node(data.fbId);
    node.position.x = data.latitude;
    node.position.y = data.longitude;
    // node.data.name = data.name;

    if(isUser){
      this.user = node;
      graph.addNode(node);
      drawNode(node);
    } else {
      graph.addNode(node);
      drawNode(node);
      if(graph.addEdge(node, this.user)){
        drawEdge(node, this.user);
      }
    }
    if(graph.layout === undefined){
      that.layout_options.width = that.layout_options.width || 2000;
      that.layout_options.height = that.layout_options.height || 2000;
      that.layout_options.iterations = that.layout_options.iterations || 100000;
      that.layout_options.layout = that.layout_options.layout || that.layout;
      graph.layout = new Layout.ForceDirected(graph, that.layout_options);
      info_text.nodes = "Nodes " + graph.nodes.length;
      info_text.edges = "Edges " + graph.edges.length;
      graph.layout.init();
    }
    return node;
  }

  this.getNode = function(id){
    return graph.getNode(id);
  }

  this.addEdge = function(source, target){
    if(graph.addEdge(source, target)){
      drawEdge(source, target);
    }
  }


  /**
   *  Create a node object and add it to the scene.
   */
  function drawNode(node) {
    var draw_object = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( {  color: Math.random() * 0xffffff, opacity: 0.5 } ) );

    if(that.show_labels) {
      if(node.data.title != undefined) {
        var label_object = new THREE.Label(node.data.title);
      } else {
        var label_object = new THREE.Label(node.id);
      }
      node.data.label_object = label_object;
      scene.add( node.data.label_object );
    }

    var area = 5000;
    draw_object.position.x = Math.floor(Math.random() * (area + area + 1) - area);
    draw_object.position.y = Math.floor(Math.random() * (area + area + 1) - area);

    if(that.layout === "3d") {
      draw_object.position.z = Math.floor(Math.random() * (area + area + 1) - area);
    }

    draw_object.id = node.id;
    node.data.draw_object = draw_object;
    node.position = draw_object.position;
    scene.add( node.data.draw_object );
  }


  /**
   *  Create an edge object (line) and add it to the scene.
   */
  function drawEdge(source, target) {
      material = new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 1, linewidth: 1.5 });

      var tmp_geo = new THREE.Geometry();
      tmp_geo.vertices.push(source.data.draw_object.position);
      tmp_geo.vertices.push(target.data.draw_object.position);

      line = new THREE.Line( tmp_geo, material, THREE.LinePieces );
      line.scale.x = line.scale.y = line.scale.z = 1;
      line.originalScale = 1;

      geometries.push(tmp_geo);

      scene.add( line );
  }


  function animate() {
    requestAnimationFrame( animate );
    controls.update();
    render();
    if(that.show_info) {
      printInfo();
    }
  }


  function render() {
    // Generate layout if not finished
    if(graph.layout !== undefined){
      if(!graph.layout.finished) {
        info_text.calc = "<span style='color: red'>Calculating layout...</span>";
        graph.layout.generate();
      } else {
        info_text.calc = "";
      }
    }

    // Update position of lines (edges)
    for(var i=0; i<geometries.length; i++) {
      geometries[i].verticesNeedUpdate = true;
    }


    // Show labels if set
    // It creates the labels when this options is set during visualization
    if(that.show_labels) {
      var length = graph.nodes.length;
      for(var i=0; i<length; i++) {
        var node = graph.nodes[i];
        if(node.data.label_object != undefined) {
          node.data.label_object.position.x = node.data.draw_object.position.x;
          node.data.label_object.position.y = node.data.draw_object.position.y - 100;
          node.data.label_object.position.z = node.data.draw_object.position.z;
          node.data.label_object.lookAt(camera.position);
        } else {
          if(node.data.title != undefined) {
            var label_object = new THREE.Label(node.data.title, node.data.draw_object);
          } else {
            var label_object = new THREE.Label(node.id, node.data.draw_object);
          }
          node.data.label_object = label_object;
          scene.add( node.data.label_object );
        }
      }
    } else {
      var length = graph.nodes.length;
      for(var i=0; i<length; i++) {
        var node = graph.nodes[i];
        if(node.data.label_object != undefined) {
          scene.remove( node.data.label_object );
          node.data.label_object = undefined;
        }
      }
    }

    // render selection
    if(that.selection) {
      object_selection.render(scene, camera);
    }

    // update stats
    // if(that.show_stats) {
    //   stats.update();
    // }

    // render scene
    renderer.render( scene, camera );
  }

  /**
   *  Prints info from the attribute info_text.
   */
  function printInfo(text) {
    var str = '';
    for(var index in info_text) {
      if(str != '' && info_text[index] != '') {
        str += " - ";
      }
      str += info_text[index];
    }
    document.getElementById("graph-info").innerHTML = str;
  }

  // Generate random number
  function randomFromTo(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
  }

  // Stop layout calculation
  this.stop_calculating = function() {
    graph.layout.stop_calculating();
  }
}
;$(document).ready(function(){
  var drawing = new Drawing.SimpleGraph({numNodes: 50, showStats: false, showInfo: true});
  $.get('/api/get-user').then(function(response){
    var user = JSON.parse(response);
    var friendsList = user.friends;
    console.log('user: ', user)
    drawing.createGraph(user, true);
    $.get('/api/get-friends').then(function(response){
      //get all friends from database and store in hashTable with fbId as key
      //for later reference
      var friends = JSON.parse(response);
      friends = friends.data;

      setInterval(function(){
        if(friends.length){
          drawing.createGraph(friends.pop());
        }
      }, 500)

      var storage = {};
      for(var i = 0; i < friends.length; i++){
        var current = friends[i];
        storage[current.fbId] = current;
      }
      FBData.get('newsFeed', 'me', function(data){
      var myPosts = JSON.parse(data);
      var investigatePosts = function(posts){
        var current = posts.pop();
        console.log('post: ', current);
        FBData.get('postLikes', current.id, function(data){
          console.log('likes data: ', data)
          if(posts.length){
            return investigatePosts(posts);
          } else {
            return;
          }
        })
      }
      })

    });
  });
});
;var queryStringData = {
  friendsQuery: {
    queryString: [ "SELECT uid, name, current_location.latitude, current_location.longitude, pic_square ","FROM user ","WHERE uid in (","SELECT uid2 FROM friend ","WHERE uid1 = me())" ],
    url: '/api/save-friends',
    endpoint: '/fql'
  },
  timelineQuery: {
    queryString: [],
    url: '/api/save-timeline'
  },
  checkinsQuery: {
    queryString: ['checkins{place,id,from,created_time,message,tags}'],
    type: 'checkins',
    url: '/api/save-checkins',
    endpoint: '/me'
  },
  mutualFriends: {
    queryString: ['SELECT uid1 FROM friend WHERE uid2=[targetID] AND uid1 IN (SELECT uid2 FROM friend WHERE uid1=me())'],
    url: '/api/save-mutual',
    endpoint: '/me'
  },
  newsFeed: {
    queryString: ['posts{id,type,from,to,with_tags,created_time,message,story,link,name,tags,picture}'],
    endpoint: false
  }
}
;var filter = function(array){
  var results = [];
  for(var i = 0; i < array.length; i++){
    results.push(array[i].id)
  }
  return results;
}

var FBData = (function(){

var queryMap = queryStringData;

function getRequest(query, endpoint, cb){
  var queryData = queryMap[query];
  // generate a parameter object for either FQL or Graph API syntax
  var queryType;
  if(!queryData.endpoint){
    queryType = '/' + endpoint;
  } else {
    queryType = queryData.endpoint;
  }
  var queryParameters = {};
  if(queryType === "/fql"){
    queryParameters["q"] = queryData.queryString.join('');
  } else {
    queryParameters["fields"] = queryData.queryString.join('');;
  }
  console.log('my query:', queryType, queryParameters);
  // querying attempt using FQL + facebook API
  FB.api(
    queryType,
    queryParameters,

    // callback when async http request responds
    function(Qresponse){
      var payload;
      var data;
      if(Qresponse){
        // special prep just for checkin data from facebook to app server
        if(queryData.type === 'checkins'){
          fetchPaginatedCheckinData(Qresponse);
        }
        data = data || Qresponse;
        payload = JSON.stringify(data)
        if(queryData.url){
          $.post(queryData.url, {response: payload}).then(function(response){
            console.log('ajax success:', queryData.url, response);
          })
        } else {
          return cb(payload);
        }
      }
    }
  );
}

function fetchPaginatedCheckinData(initialGetResponse){
  if(initialGetResponse.next){
    var nextPage = initialGetResponse.next;
    var data = formatCheckinDataForDB(initialGetResponse);
    console.table(data);
    setTimeout(function(data){
      $.get(nextPage,
        function(nextResponse){
          console.table('paginated response:', nextResponse);
          fetchPaginatedCheckinData(nextResponse);
        }
      );
    });
  }
}

function getMutual(){
  $.get('/api/get-friends').then(function(response){
    console.log(response);
    response = JSON.parse(response);
    var friends = response.data;
    $('.friends').text(friends.length.toString());
    $('.helper').toggle();
    $('.title').toggle();
    var done = 0;
    var eachFriend = function(friendsArray){
      var current = friendsArray.pop();
      var id = current.fbId;
      FB.api('/me/mutualfriends/'+id, function(response){
        var mutuals = filter(response.data);
        var payload = {userB: id, mutuals: mutuals}
        $.post('/api/save-mutual', payload).then(function(response){
          done++;
          $('.done').text(''+ done);
          if(friendsArray.length){
            return eachFriend(friendsArray);
          } else {
            return;
          }
        })
      });
    };
    eachFriend(friends);
  });
}

function getPostLikes(id, cb){
  FB.api('/'+id+'/likes',function (response){
    cb(response);
  });
}

// https:graph.facebook.com/{user-id}?fields=checkins{tags,from,message,...}
function formatCheckinDataForDB(facebookResponse){
  var formattedData = [];
  console.log('fb response',facebookResponse);
  arrayOfCheckins = (facebookResponse.checkins) ? facebookResponse.checkins.data : [];
  arrayOfCheckins.forEach(function(item, index){
    if(item){
      var formattedItem = {
        fbId: item.id,
        checkin_date: item.data[index].created_time,

        place: {
          fbId: item.place.id,
          name: item.place.name,
          photo: null
        } || null,
        latitude: item.place.latitude,
        longitude: item.place.longitude,

        from: {
          name: item.from.name,
          fbId: item.from.id
        } || null,
        message: item.message || null,
        clique: item.tags.data || []
      };
    results.push(formattedItem);
    }
  });
  return formattedData;
}

return {
  get: getRequest,
  getMutual: getMutual,
  getPostLikes: getPostLikes
};
})();
;(function(window){
// This is called with the results from from FB.getLoginStatus().
function statusChangeCallback(response) {
  // The response object is returned with a status field that lets the
  // app know the current login status of the person.
  // Full docs on the response object can be found in the documentation
  // for FB.getLoginStatus().
  if (response.status === 'connected') {
    // Logged into your app and Facebook.
    testAPI();
  } else if (response.status === 'not_authorized') {
    // The person is logged into Facebook, but not your app.
    document.getElementById('status').innerHTML = 'Please log ' +
      'into this app.';
  } else {
    // The person is not logged into Facebook, so we're not sure if
    // they are logged into this app or not.
    document.getElementById('status').innerHTML = 'Please log ' +
      'into Facebook.';
  }
}

// This function is called when someone finishes with the Login
// Button.  See the onlogin handler attached to it in the sample
// code below.
function checkLoginState() {
  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });
}

window.fbAsyncInit = function() {
  $.get('/fbconfig').then(function(id){
    console.log(id);
    console.log(typeof id);

    FB.init({
      appId      : id || appConfig.fbId,
      cookie     : true,  // enable cookies to allow the server to access
                          // the session
      xfbml      : true,  // parse social plugins on this page
      version    : 'v1.0' // use version 2.1
    });
    setTimeout(function(){
      checkLoginState();
    });
  })

    // Now that we've initialized the JavaScript SDK, we call
    // FB.getLoginStatus() from within checkLoginState().  This function gets the state of the
    // person visiting this page and can return one of three states to
    // the callback you provide.  They can be:
    //
    // 1. Logged into your app ('connected')
    // 2. Logged into Facebook, but not your app ('not_authorized')
    // 3. Not logged into Facebook and can't tell if they are logged into
    //    your app or not.
    //
    // These three cases are handled in the callback function.

};

// Load the SDK asynchronously
(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// Here we run a very simple test of the Graph API after login is
// successful.  See statusChangeCallback() for when this call is made.
// successful response adds property FB.dataGlobeUserLocation with latitude, longitude for initial user graph node
function testAPI() {
  console.log('Welcome!  Fetching your information.... ');
  FB.api('/me',
    function(response) {
      console.log('Successful login for: ' + response.name);
      document.getElementById('status').innerHTML =
        'Thanks for logging in, ' + response.name + '!';
      console.log('isloggedIn response:',response);

      FB.api('/fql',
        {
          q: "SELECT current_location.latitude, current_location.longitude, first_name, last_name, uid, pic_square FROM user WHERE uid = me()"
        },
        function(response){
          console.log('save user: ', response);
          $.post('/api/save-user', {user: response.data})
        }
      );
  });
}

})(window);
