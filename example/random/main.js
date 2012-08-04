var sorta = require('../');
var $ = require('jquery-browserify');

var JSONStream = require('JSONStream');
var parser = JSONStream.parse([ true ]);

var shoe = require('shoe');
var stream = shoe('/updates');
stream.pipe(parser);

var s = sorta(function (row) {
    var name = $('<span>').attr('class', 'name').text(row.key);
    var rank = $('<span>').attr('class', 'rank');
    var score = $('<span>').attr('class', 'score');
    
    row.on('update', function () {
        rank.text(row.index + 1);
        score.text(row.value);
    });
    
    return $('<div>').append('#', rank, ' ', name, ', ', score, ' points')[0];
});
parser.pipe(s);
s.appendTo(document.body);
