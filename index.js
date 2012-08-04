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

sorta.ascend = sorta;

sorta.descend = function (cb) {
    return sorta({
        compare : function (a, b) { return a - b }
    }, cb);
};

function Sorta (opts, createElement) {
    Stream.call(this);
    if (!opts) opts = {};
    this.compare = opts.compare || function (a, b) { return b - a };
    
    this.writable = true;
    this.element = document.createElement('div');
    
    this.elements = {};
    this.rows = {};
    this.sorted = [];
    
    this._createElement = createElement;
}

Sorta.prototype = new Stream;

Sorta.prototype.appendTo = function (target) {
    target.appendChild(this.element);
};

Sorta.prototype.write = function (row) {
    if (typeof row !== 'object') {
        this.emit('error', new Error('non-object parameter to write: ' + row));
    }
    
    var r = this.rows[row.key];
    if (r) {
        this.sorted.splice(r.index, 1);
    }
    
    for (var i = 0; i < this.sorted.length; i++) {
        var c = this.compare(this.sorted[i].value, row.value);
        if (c < 0) break;
    }
    
    var created = !r;
    if (!r) {
        r = this.rows[row.key] = new EventEmitter;
        r.key = row.key;
        r.value = row.value;
        r.index = i;
        this.elements[row.key] = this._createElement(r);
    }
    else if (r.index !== i) {
        this.element.removeChild(this.elements[row.key]);
    }
        
    this.sorted.splice(i, 0, r);
    
    if (created || r.index !== i) {
        if (i === this.sorted.length - 1) {
            this.element.appendChild(this.elements[row.key]);
        }
        else {
            var prev = this.sorted[i + 1].key;
            this.elements[prev].insertBefore(this.elements[row.key]);
        }
    }
    
    r.index = i;
    
    if (r.value !== row.value) {
        r.value = row.value;
        r.emit('update', r);
        this.emit('update', r);
    }
    for (++i; i < this.sorted.length; i++) {
        this.sorted[i].index = i;
        this.emit('update', this.sorted[i]);
    }
};

Sorta.prototype.end = function () {
    this.writable = false;
};

Sorta.prototype.destroy = function () {
    this.writable = false;
};
