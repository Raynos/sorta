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
    
    for (var i = 0; i < this.sorted.length; i++) {
        var c = this.compare(this.sorted[i].value, row.value);
        if (c > 0) break;
    }
    
    var r = this.rows[row.key];
    /*
    if (r && r.index === i) {
        if (r.value !== row.value) {
            r.value = row.value;
            r.emit('update', r);
        }
        return;
    }
    */
    
    if (!r) {
        r = this.rows[row.key] = new EventEmitter;
        r.key = row.key;
        r.value = row.value;
        r.index = i;
        r.element = this._createElement(r);
        this.element.appendChild(r.element);
    }
    else {
        this.element.removeChild(r.element);
        this.sorted.splice(r.index, 1);
    }
    
    if (this.sorted[i+1]) {
        this.element.insertBefore(r.element, this.sorted[i+1]);
    }
    else {
        this.element.appendChild(r.element);
    }
    
    this.sorted.splice(i, 0, r);
    r.index = i;
    
    r.value = row.value;
    r.emit('update', r);
    this.emit('update', r);
    
    for (; i < this.sorted.length; i++) {
        this.sorted[i].index = i;
        this.sorted[i].emit('update', this.sorted[i]);
        this.emit('update', this.sorted[i]);
    }
};

Sorta.prototype.end = function () {
    this.writable = false;
};

Sorta.prototype.destroy = function () {
    this.writable = false;
};
