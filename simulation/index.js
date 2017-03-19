const tetris = require('./tetris');
const zerorpc = require('zerorpc');

const server = new zerorpc.Server({
    simulate: function(heuristics, cb) {
        console.log("Heuristics: ", JSON.parse(heuristics));
        cb(null, tetris.init(JSON.parse(heuristics)));
    }
});

server.bind("tcp://0.0.0.0:3000");

server.on("error", (error) => {
    console.error("server: ", error);
});

console.log("Listening on port 3000.");