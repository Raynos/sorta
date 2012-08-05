var Stream = require('stream');
var EventEmitter = require('events').EventEmitter;

var sorta = module.exports = function (opts, cb) {
    if (typeof opts === 'object') {
        return new Sorta(opts, cb);
    }
    else {
        return new Sorta(cb, opts);
    }
};

function Sorta (opts, createElement) {
    Stream.call(this);
    if (!opts) opts = {};
    
    this.writable = true;
    this.element = document.createElement('div');
    
    this.rows = {};
    this._createElement = createElement;
}

Sorta.prototype = new Stream;

Sorta.prototype.appendTo = function (target) {
    target.appendChild(this.element);
};

Sorta.prototype.write = function (row) {
    var self = this;
    var rows = self.rows;
    
    if (typeof row !== 'object') {
        self.emit('error', new Error('non-object parameter to write: ' + row));
    }
    
    var r = rows[row.key];
    if (!r) {
        r = rows[row.key] = new EventEmitter;
        r.key = row.key;
        r.value = row.value;
        r.element = self._createElement(r);
        r.element.dataset.key = row.key;
        r.update = function (v) {
            self.write({ key : r.key, value : v });
        };
    }
    else {
        self.element.removeChild(r.element);
    }
    
    var nodes = self.element.childNodes;
    for (var i = 0; i < nodes.length; i++) {
        var key = nodes[i].dataset.key;
        if (row.value > rows[key].value) {
            self.element.insertBefore(r.element, nodes[i]);
            break;
        }
    }
    if (i === nodes.length) {
        self.element.appendChild(r.element);
    }
    r.value = row.value;
    
    nodes = self.element.childNodes;
    for (var j = 0; j < nodes.length; j++) {
        var key = nodes[j].dataset.key;
        if (rows[key].index !== j || key === row.key) {
            rows[key].index = j;
            rows[key].emit('update');
            self.emit('update', rows[key]);
        }
    }
};

Sorta.prototype.end = function () {
    this.writable = false;
};

Sorta.prototype.destroy = function () {
    this.writable = false;
};
