const BOUNDS = {
    splitX: 6,
    splitY: 6,
    splitZ: 20
};

const INIT_Z = 20;

const COLLISION = { NONE: 0, WALL: 1, GROUND: 2 };
const FIELD = { EMPTY: 0, ACTIVE: 1, PETRIFIED: 2 };

const CUBE_SHAPES = [
    [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: 1, y: 2, z: 0 }
    ],
    [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 2, z: 0 },
    ],
    [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 1, z: 0 }
    ],
    [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 2, z: 0 },
        { x: 1, y: 1, z: 0 }
    ],
    [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: 1, y: 2, z: 0 }
    ]
];
// --------------------------------

const THREE = require('three');
const Base64 = require('js-base64').Base64;

let Tetris = {
    currentPoints: 0,

    gameOver: false,

    heuristics: {},

    movesDone: [],

    init: function(heuristics) {
        this.Board.init(BOUNDS.splitX, BOUNDS.splitY, BOUNDS.splitZ);
        this.heuristics = heuristics;
        return JSON.stringify({ score: this.start(), moves: this.generateCode() });
    },
    generateCode: function() {
        let code = "";
        for (let m of this.movesDone) {
            code += m.position.x + "|" + m.position.y + "|" + m.position.z;
            code += ",";
            code += Math.floor(m.rotation.x / 90) + "|" + Math.floor(m.rotation.y / 90) + "|" + Math.floor(m.rotation.z / 90);
            code += ";";
        }
        return Base64.encodeURI(code.length > 0 ? code.substring(0, code.length - 1) : code);
    },
    start: function() {
        this.Block.generate();
        return this.animate();
    },
    animate: function() {
        while (!this.gameOver && this.makeMove()) {
            this.drop();
        }
        return this.finished();
    },
    addPoints: function(n) {
        this.currentPoints += n;
    },
    drop: function() {
        while (!this.Block.move(0, 0, -1));
    },
    makeMove: function() {
        //move, rotate
        let best = null;
        let b = 0;
        for (let move of this.allMoves()) {
            let u = this.Heuristic.utility(move.fields, this.heuristics);
            if (u > b || best === null) {
                b = u;
                best = move;
            }
        }
        if (best === null) {
            return false;
        }
        console.log("Rotate " + JSON.stringify(best.rotation) + ", Move " + JSON.stringify(best.position));
        this.Block.rotate(best.rotation.x, best.rotation.y, best.rotation.z);
        this.Block.move(best.position.x - this.Block.position.x, best.position.y - this.Block.position.y, 0);
        this.movesDone.push(best);
        return true;
    },
    allMoves: function() {
        let moves = [];
        let rotations = this.Block.possibleRotations();
        for (let i = 0; i < rotations.rotates.length; i++) {
            let rotation = rotations.rotates[i];
            let shape = rotations.shapes[i];
            for (let x = 0; x < this.Board.fields.length; x++) {
                for (let y = 0; y < this.Board.fields[x].length; y++) {
                    let position = { x, y, z: INIT_Z };
                    if (!this.Board.testCollision(true, this.Board.fields, position, shape)) {
                        moves.push({ rotation, position });
                    }
                }
            }
        }
        return moves;
    },
    finished: function() {
        return this.Heuristic.utility(this.Board.fields, this.heuristics);
    },
    Heuristic: {
        utility: function(fields, heuristics) {
            let s = 0;
            for (let key in heuristics) {
                if (heuristics.hasOwnProperty(key) && typeof this[key] === 'function') {
                    s += this[key](fields) * heuristics[key];
                }
            }
            return s;
        },
        _holes_in_board: (fields) => {
            let holes = [];
            let block_in_col = false;
            for (let x = 0; x < fields.length; x++) {
                for (let y = 0; y < fields[x].length; y++) {
                    for (let z = fields[x][y].length - 1; z >= 0; z--) {
                        if (block_in_col && fields[x][y][z] === FIELD.EMPTY) {
                            holes.push({ x, y, z });
                        } else if (fields[x][y][z] !== FIELD.EMPTY) {
                            block_in_col = true;
                        }
                    }
                    block_in_col = false;
                }
            }
            return holes;
        },
        _heights: (fields) => {
            let heights = {};
            for (let z = fields[0][0].length; z >= 0; z--) {
                for (let y = 0; y < fields[0].length; y++) {
                    for (let x = 0; x < fields.length; x++) {
                        let key = x + "-" + y;
                        if (!heights.hasOwnProperty(key) && fields[x][y][z] !== FIELD.EMPTY) {
                            heights[key] = z + 1;
                        }
                    }
                }
            }
            return heights;
        },
        num_holes: function(fields = Tetris.Board.fields) {
            return this._holes_in_board(fields).length;
        },
        num_blocks_above_holes: function(fields = Tetris.Board.fields) {
            let c = 0;
            for (let hole of this._holes_in_board(fields)) {
                for (let z = hole.z + 1; z < fields[0][0].length; z++) {
                    if (fields[hole.x][hole.y][z] !== FIELD.EMPTY) {
                        c++;
                    } else {
                        break;
                    }
                }
            }
            return c;
        },
        num_gaps: function(fields = Tetris.Board.fields) {
            let gaps = 0;
            for (let z = 0; z < fields[0][0].length; z++) {
                for (let y = 0; y < fields[0].length; y++) {
                    let sequence = 1; // Start with wall
                    // 0 = no progress, 1 = found block, 2 = found block-gap
                    for (let x = 0; x < fields.length; x++) {
                        if (sequence == 0 && fields[x][y][z] !== FIELD.EMPTY) {
                            sequence = 1;
                        } else if (sequence == 1 && fields[x][y][z] === FIELD.EMPTY) {
                            sequence = 2;
                        } else if (sequence == 2) {
                            if (fields[x][y][z] !== FIELD.EMPTY) {
                                gaps++;
                                sequence = 1;
                            } else {
                                sequence = 0;
                            }
                        }
                    }
                    if (sequence == 2) {
                        // walls
                        gaps++;
                    }
                }
            }
            return gaps;
        },
        max_height: function(fields = Tetris.Board.fields) {
            for (let z = fields[0][0].length; z >= 0; z--) {
                for (let y = 0; y < fields[0].length; y++) {
                    for (let x = 0; x < fields.length; x++) {
                        if (fields[x][y][z] !== FIELD.EMPTY) {
                            return z + 1;
                        }
                    }
                }
            }
            return 0;
        },
        avg_height: function(fields = Tetris.Board.fields) {
            let obj = this._heights(fields);
            return Object.keys(obj).map(o => obj[o]).reduce((a, b) => a + b, 0) / Object.keys(obj).length;
        },
        num_blocks: function(fields = Tetris.Board.fields) {
            let c = 0;
            for (let z = fields[0][0].length; z >= 0; z--) {
                for (let y = 0; y < fields[0].length; y++) {
                    for (let x = 0; x < fields.length; x++) {
                        if (fields[x][y][z] !== FIELD.EMPTY) {
                            c++;
                        }
                    }
                }
            }
            return c;
        },
        completed_lines: function(fields = Tetris.Board.fields) {
            return Tetris.Board.checkCompleted(fields).length;
        },
        bumpiness: function(fields = Tetris.Board.fields) {
            let total_bumpy = 0;
            let obj = this._heights(fields);
            for (let y = 0; y < fields[0].length; y++) {
                for (let x = 0; x < fields.length; x++) {
                    if (!obj.hasOwnProperty(x + "-" + y)) {
                        obj[x + "-" + y] = 0;
                    }
                }
            }

            for (let y = 0; y < fields[0].length - 1; y++) {
                for (let x = 0; x < fields.length; x++) {
                    if (x < fields.length - 1) {
                        // Right
                        total_bumpy += Math.abs(obj[x + "-" + y] - obj[(x + 1) + "-" + y]);
                    }
                    // Down
                    total_bumpy += Math.abs(obj[x + "-" + y] - obj[x + "-" + (y + 1)]);
                }
            }
            return total_bumpy;
        },
    },
    Utils: {
        cloneVector: (v) => {
            return { x: v.x, y: v.y, z: v.z };
        },
        roundVector: (v) => {
            v.x = Math.round(v.x);
            v.y = Math.round(v.y);
            v.z = Math.round(v.z);
        },
        cloneField: (f) => {
            let fields = Tetris.Board.initFields(f.length, f[0].length, f[0][0].length);
            for (let x = 0; x < fields.length; x++) {
                for (let y = 0; y < fields[0].length; y++) {
                    for (let z = 0; z < fields[0][0].length; z++) {
                        fields[x][y][z] = f[x][y][z];
                    }
                }
            }
            return fields;
        }
    }
};

Tetris.Block = {
    position: {},
    generate: function() {
        let type = Math.floor(Math.random() * (CUBE_SHAPES.length));
        this.blockType = type;

        this.shape = [];
        for (let i = 0; i < CUBE_SHAPES[type].length; i++) {
            this.shape[i] = Tetris.Utils.cloneVector(CUBE_SHAPES[type][i]);
        }

        // initial position
        this.position = {
            x: Math.floor(BOUNDS.splitX / 2) - 1,
            y: Math.floor(BOUNDS.splitY / 2) - 1,
            z: INIT_Z
        };

        if (Tetris.Board.testCollision(true) === COLLISION.GROUND) {
            Tetris.gameOver = true;
        }
        this.rotation = { x: 0, y: 0, z: 0 };
    },
    rotate: function(x, y, z) {
        let oldRotation = Tetris.Utils.cloneVector(this.rotation);
        this.rotation.x += x * Math.PI / 180;
        this.rotation.y += y * Math.PI / 180;
        this.rotation.z += z * Math.PI / 180;

        let oldShapes = [];

        for (let i = 0; i < this.shape.length; i++) {
            oldShapes.push(this.shape[i]);
        }

        this.shape = this.rotateShape(this.rotation.x, this.rotation.y, this.rotation.z);

        if (Tetris.Board.testCollision(false) === COLLISION.WALL) {
            this.shape = oldShapes;
            this.rotation = oldRotation;
        }
    },
    rotateShape: function(x, y, z) {
        let rotateX = new THREE.Vector3(1, 0, 0);
        let rotateY = new THREE.Vector3(0, 1, 0);
        let rotateZ = new THREE.Vector3(0, 0, 1);
        let shapes = [];
        for (let i = 0; i < this.shape.length; i++) {
            let shape = CUBE_SHAPES[this.blockType][i];

            let vector = new THREE.Vector3(shape.x, shape.y, shape.z);
            vector.applyAxisAngle(rotateX, x);
            vector.applyAxisAngle(rotateY, y);
            vector.applyAxisAngle(rotateZ, z);
            shapes.push({ x: vector.x, y: vector.y, z: vector.z });

            Tetris.Utils.roundVector(shapes[i]);
        }
        return shapes;
    },
    possibleRotations: function() {
        let types = [90, -90, 180, 0];
        let coords = [
            [0, 0, 1],
            [0, 1, 0],
            [1, 0, 0]
        ];
        let ret = [];
        let rotates = [];
        for (let t of types) {
            for (let c of coords) {
                let shapes = this.rotateShape(c[0] * t * Math.PI / 180, c[1] * t * Math.PI / 180, c[2] * t * Math.PI / 180);

                let cmp = JSON.stringify(shapes);
                if (!ret.some(ele => JSON.stringify(ele) === cmp)) {
                    ret.push(shapes);
                    rotates.push({ x: c[0] * t, y: c[1] * t, z: c[2] * t });
                }
            }
        }
        return { shapes: ret, rotates: rotates };
    },
    move: function(x, y, z) {
        let oldPos = Tetris.Utils.cloneVector(this.position);
        this.position.x += x;
        this.position.y += y;
        this.position.z += z;

        let collision = Tetris.Board.testCollision(z !== 0);

        if (collision === COLLISION.WALL) {
            this.position = oldPos;
        }
        if (collision === COLLISION.GROUND) {
            this.hitBottom();
            Tetris.Board.complete();
            return true;
        }
        return false;
    },
    petrify: function() {
        for (let i of this.shape) {
            Tetris.Board.fields[this.position.x + i.x][this.position.y + i.y][this.position.z + i.z] = FIELD.PETRIFIED;
        }
    },
    hitBottom: function() {
        this.petrify();
        this.generate();
    }
};

Tetris.Board = {
    fields: [],
    initFields: function(_x, _y, _z) {
        let fields = [];
        for (let x = 0; x < _x; x++) {
            fields.push([]);
            for (let y = 0; y < _y; y++) {
                fields[x].push([]);
                for (let z = 0; z < _z; z++) {
                    fields[x][y].push(FIELD.EMPTY);
                }
            }
        }
        return fields;
    },
    init: function(_x, _y, _z) {
        this.fields = this.initFields(_x, _y, _z);
    },
    testCollision: function(ground_check, fields = this.fields, position = Tetris.Block.position, shape = Tetris.Block.shape) {
        let posx = position.x,
            posy = position.y,
            posz = position.z;

        for (let i of shape) {
            if ((i.x + posx) < 0 || (i.y + posy) < 0 || (i.x + posx) >= fields.length || (i.y + posy) >= fields[0].length) {
                return COLLISION.WALL;
            }

            if (fields[i.x + posx][i.y + posy][i.z + posz - 1] === FIELD.PETRIFIED) {
                return ground_check ? COLLISION.GROUND : COLLISION.WALL;
            }

            if ((i.z + posz) <= 0) {
                return COLLISION.GROUND;
            }
        }
    },
    complete: function() {
        let bonus = 0;

        for (let c of this.checkCompleted(this.fields)) {
            bonus += 1 + bonus;
            for (let y2 = 0; y2 < this.fields[0].length; y2++) {
                for (let x2 = 0; x2 < this.fields.length; x2++) {
                    for (let z2 = c; z2 < this.fields[0][0].length - 1; z2++) {
                        this.fields[x2][y2][z2] = this.fields[x2][y2][z2 + 1];
                    }
                    this.fields[x2][y2][this.fields[0][0].length - 1] = FIELD.EMPTY;
                }
            }
        }

        Tetris.addPoints(bonus * 1000);
    },
    checkCompleted: function(fields) {
        let rebuild = false;
        let sum, expected = fields[0].length * fields.length;
        let c = [];

        for (let z = 0; z < fields[0][0].length; z++) {
            sum = 0;
            for (let y = 0; y < fields[0].length; y++) {
                for (let x = 0; x < fields.length; x++) {
                    if (fields[x][y][z] === FIELD.PETRIFIED) sum++;
                }
            }

            if (sum == expected) {
                c.push(z);
                z--;
            }
        }
        return c;
    }
};

module.exports = Tetris;