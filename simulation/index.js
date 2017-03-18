const tetris = require('./tetris');
var argv = require('minimist')(process.argv.slice(2));
console.log(tetris.init(argv));