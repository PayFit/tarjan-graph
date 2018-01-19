'use strict';

function Vertex(name, successors) {
  this.name = name;
  this.successors = successors;
  this.reset();
}

Vertex.prototype = {
  reset: function reset() {
    this.index = -1;
    this.lowLink = -1;
    this.onStack = false;
    this.visited = false;
  }
};

function Graph() {
  this.vertices = {};
}

Graph.prototype = {
  add: function add(key, descendants) {
    var _this = this;

    descendants = [].concat(descendants);

    var successors = descendants.map(function (descendant) {
      if (!_this.vertices[descendant]) {
        _this.vertices[descendant] = new Vertex(descendant, []);
      }
      return _this.vertices[descendant];
    });

    if (!this.vertices[key]) {
      this.vertices[key] = new Vertex(key);
    }

    this.vertices[key].successors = successors;
    return this;
  },
  addAndFilterDescendants: function addAndFilterDescendants(key, descendants, filter) {
    var _this2 = this;

    descendants = [].concat(descendants);

    var successors = descendants.reduce(function (fold, descendant) {
      if (filter && !filter(descendant)) {
        return fold;
      }

      if (!_this2.vertices[descendant]) {
        _this2.vertices[descendant] = new Vertex(descendant, []);
      }
      fold.push(_this2.vertices[descendant]);
      return fold;
    }, []);

    if (!this.vertices[key]) {
      this.vertices[key] = new Vertex(key);
    }

    this.vertices[key].successors = successors;
    return this;
  },
  reset: function reset() {
    var _this3 = this;

    Object.keys(this.vertices).forEach(function (key) {
      _this3.vertices[key].reset();
    });
  },
  addAndVerify: function addAndVerify(key, dependencies) {
    this.add(key, dependencies);
    var cycles = this.getCycles();
    if (cycles.length) {
      var message = 'Detected ' + cycles.length + ' cycle' + (cycles.length === 1 ? '' : 's') + ':';
      message += '\n' + cycles.map(function (scc) {
        var names = scc.map(function (v) {
          return v.name;
        });
        return '  ' + names.join(' -> ') + ' -> ' + names[0];
      }).join('\n');

      var err = new Error(message);
      err.cycles = cycles;
      throw err;
    }

    return this;
  },
  dfs: function dfs(key, visitor) {
    this.reset();
    var stack = [this.vertices[key]];
    var v = void 0;
    while (v = stack.pop()) {
      if (v.visited) {
        continue;
      }

      // pre-order traversal
      visitor(v);
      v.visited = true;

      v.successors.forEach(function (w) {
        return stack.push(w);
      });
    }
  },
  getDescendants: function getDescendants(key) {
    var descendants = [];
    var ignore = true;
    this.dfs(key, function (v) {
      if (ignore) {
        // ignore the first node
        ignore = false;
        return;
      }
      descendants.push(v.name);
    });
    return descendants;
  },
  hasCycle: function hasCycle() {
    return this.getCycles().length > 0;
  },
  getStronglyConnectedComponents: function getStronglyConnectedComponents() {
    var _this4 = this;

    var V = Object.keys(this.vertices).map(function (key) {
      _this4.vertices[key].reset();
      return _this4.vertices[key];
    });

    var index = 0;
    var stack = [];
    var components = [];

    function stronglyConnect(v) {
      v.index = index;
      v.lowLink = index;
      index++;
      stack.push(v);
      v.onStack = true;

      v.successors.forEach(function (w) {
        if (w.index < 0) {
          stronglyConnect(w);
          v.lowLink = Math.min(v.lowLink, w.lowLink);
        } else if (w.onStack) {
          v.lowLink = Math.min(v.lowLink, w.index);
        }
      });

      if (v.lowLink === v.index) {
        var scc = [];
        var w = void 0;
        do {
          w = stack.pop();
          w.onStack = false;
          scc.push(w);
        } while (w !== v);

        components.push(scc);
      }
    }

    V.forEach(function (v) {
      if (v.index < 0) {
        stronglyConnect(v);
      }
    });

    return components;
  },
  getCycles: function getCycles() {
    return this.getStronglyConnectedComponents().filter(function (scc) {
      return scc.length > 1;
    });
  },
  clone: function clone() {
    var _this5 = this;

    var graph = new Graph();

    Object.keys(this.vertices).forEach(function (key) {
      var v = _this5.vertices[key];
      graph.add(v.name, v.successors.map(function (w) {
        return w.name;
      }));
    });

    return graph;
  },
  toDot: function toDot() {
    var V = this.vertices;
    var lines = ['digraph {'];

    var cycles = this.getCycles();
    cycles.forEach(function (scc, i) {
      lines.push('  subgraph cluster' + i + ' {');
      lines.push('    color=red;');
      lines.push('    ' + scc.map(function (v) {
        return v.name;
      }).join('; ') + ';');
      lines.push('  }');
    });

    Object.keys(V).forEach(function (key) {
      var v = V[key];
      if (v.successors.length) {
        v.successors.forEach(function (w) {
          return lines.push('  ' + v.name + ' -> ' + w.name);
        });
      }
    });

    lines.push('}');
    return lines.join('\n') + '\n';
  }
};

module.exports = Graph;

