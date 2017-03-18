const BOUNDS = {
    width: 360,
    height: 360,
    depth: 1200,
    splitX: 6,
    splitY: 6,
    splitZ: 20
};
const MESH = { color: 0xffaa00, wireframe: true };
const WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;
const VIEW_ANGLE = 45,
    ASPECT = WIDTH / HEIGHT,
    NEAR = 0.1,
    FAR = 10000,
    CAMERA_Z = 600,
    INIT_Z = 15,
    BLOCK_SIZE = BOUNDS.width / BOUNDS.splitX;
const CUBE_FRAME = { color: 0x000000, shading: THREE.FlatShading, wireframe: true, transparent: true };

const CUBE_COLORS = [
    0x6666ff, 0x66ffff, 0xcc68EE, 0x666633, 0x66ff66, 0x9966ff,
    0x00ff66, 0x66EE33, 0x003399, 0x330099, 0xFFA500, 0x99ff00,
    0xee1289, 0x71C671, 0x00BFFF, 0x666633, 0x669966, 0x9966ff
];

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

window.Tetris = {
    currentPoints: 0,

    sounds: {},

    frameTime: 0,

    cumulatedFrameTime: 0,

    _lastFrameTime: Date.now(),

    gameOver: false,

    gameStepTime: 1000,

    staticBlocks: [],

    init: function() {
        this.sounds.collision = document.getElementById("audio_collision");
        this.sounds.move = document.getElementById("audio_move");
        this.sounds.gameover = document.getElementById("audio_gameover");
        this.sounds.score = document.getElementById("audio_score");

        this.renderer = new THREE.WebGLRenderer();
        this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
        this.scene = new THREE.Scene();

        // the camera starts at 0,0,0 so pull it back
        this.camera.position.z = CAMERA_Z;
        this.scene.add(this.camera);

        // start the renderer
        this.renderer.setSize(WIDTH, HEIGHT);

        $("body").append($(this.renderer.domElement));

        this.Board.init(BOUNDS.splitX, BOUNDS.splitY, BOUNDS.splitZ);

        this.scene.add(new THREE.Mesh(
            new THREE.CubeGeometry(BOUNDS.width, BOUNDS.height,
                BOUNDS.depth, BOUNDS.splitX,
                BOUNDS.splitY, BOUNDS.splitZ),
            new THREE.MeshBasicMaterial(MESH)
        ));

        this.render();

        $("#play_button").click((event) => {
            event.preventDefault();
            this.start();
        });
    },
    start: function() {
        $("#menu").css("display", "none");
        $("#points").css("display", "block");

        this.Block.generate();
        this.animate();

        $("body").on('keydown', (event) => {
            let key = event.which || event.keyCode;

            switch (key) {
                case 38: // up (arrow)
                    Tetris.Block.move(0, 1, 0);
                    break;
                case 40: // down (arrow)
                    Tetris.Block.move(0, -1, 0);
                    break;
                case 37: // left(arrow)
                    Tetris.Block.move(-1, 0, 0);
                    break;
                case 39: // right (arrow)
                    Tetris.Block.move(1, 0, 0);
                    break;
                case 32: // space
                    Tetris.Block.move(0, 0, -1);
                    break;

                case 87: // up (w)
                    Tetris.Block.rotate(90, 0, 0);
                    break;
                case 83: // down (s)
                    Tetris.Block.rotate(-90, 0, 0);
                    break;

                case 65: // left(a)
                    Tetris.Block.rotate(0, 0, 90);
                    break;
                case 68: // right (d)
                    Tetris.Block.rotate(0, 0, -90);
                    break;

                case 81: // (q)
                    Tetris.Block.rotate(0, 90, 0);
                    break;
                case 69: // (e)
                    Tetris.Block.rotate(0, -90, 0);
                    break;
            }
        });
    },
    animate: function() {
        let time = Date.now();
        this.frameTime = time - this._lastFrameTime;
        this._lastFrameTime = time;
        this.cumulatedFrameTime += this.frameTime;

        while (this.cumulatedFrameTime > this.gameStepTime) {
            this.cumulatedFrameTime -= this.gameStepTime;
            this.Block.move(0, 0, -1);
        }
        this.render();

        if (!this.gameOver) {
            requestAnimationFrame(this.animate.bind(this));
        }
    },
    render: function() {
        this.renderer.render(this.scene, this.camera);
    },
    addPoints: function(n) {
        this.currentPoints += n;
        $("#points").html(this.currentPoints);
        this.sounds.score.play();
    },
    addStaticBlock: function(x, y, z) {
        if (!this.staticBlocks.hasOwnProperty(x)) this.staticBlocks[x] = [];
        if (!this.staticBlocks[x].hasOwnProperty(y)) this.staticBlocks[x][y] = [];

        let mesh = THREE.SceneUtils.createMultiMaterialObject(new THREE.CubeGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE), [
            new THREE.MeshBasicMaterial(CUBE_FRAME),
            new THREE.MeshBasicMaterial({ color: CUBE_COLORS[z] })
        ]);

        mesh.position.x = (x - (BOUNDS.splitX - 1) / 2) * BLOCK_SIZE;
        mesh.position.y = (y - (BOUNDS.splitY - 1) / 2) * BLOCK_SIZE;
        mesh.position.z = (z - (BOUNDS.splitZ - 1) / 2) * BLOCK_SIZE;

        this.scene.add(mesh);
        this.staticBlocks[x][y][z] = mesh;
    },


    Utils: {
        cloneVector: function(v) {
            return { x: v.x, y: v.y, z: v.z };
        },
        roundVector: function(v) {
            v.x = Math.round(v.x);
            v.y = Math.round(v.y);
            v.z = Math.round(v.z);
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

        let geometry = new THREE.CubeGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        for (let i = 1; i < this.shape.length; i++) {
            let tmpGeometry = new THREE.Mesh(new THREE.CubeGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE));
            tmpGeometry.position.x = BLOCK_SIZE * this.shape[i].x;
            tmpGeometry.position.y = BLOCK_SIZE * this.shape[i].y;
            tmpGeometry.position.z = BLOCK_SIZE * this.shape[i].z;
            tmpGeometry.updateMatrix();
            geometry.merge(tmpGeometry.geometry, tmpGeometry.matrix);
        }

        this.mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, [
            new THREE.MeshBasicMaterial({ color: 0x000000, shading: THREE.FlatShading, wireframe: true, transparent: true }),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        ]);

        // initial position
        this.position = {
            x: Math.floor(BOUNDS.splitX / 2) - 1,
            y: Math.floor(BOUNDS.splitY / 2) - 1,
            z: INIT_Z
        };

        if (Tetris.Board.testCollision(true) === COLLISION.GROUND) {
            Tetris.gameOver = true;
            $("#points").html("GAME OVER");
            Tetris.sounds.gameover.play();
        }

        this.mesh.position.x = (this.position.x - BOUNDS.splitX / 2) * BLOCK_SIZE / 2;
        this.mesh.position.y = (this.position.y - BOUNDS.splitY / 2) * BLOCK_SIZE / 2;
        this.mesh.position.z = (this.position.z - (BOUNDS.splitZ - 1) / 2) * BLOCK_SIZE;
        this.mesh.rotation = { x: 0, y: 0, z: 0 };
        this.mesh.overdraw = true;

        Tetris.scene.add(this.mesh);
    },
    rotate: function(x, y, z) {
        let oldRotation = Tetris.Utils.cloneVector(this.mesh.rotation);
        this.mesh.rotation.x += x * Math.PI / 180;
        this.mesh.rotation.y += y * Math.PI / 180;
        this.mesh.rotation.z += z * Math.PI / 180;

        let rotateX = new THREE.Vector3(1, 0, 0);
        let rotateY = new THREE.Vector3(0, 1, 0);
        let rotateZ = new THREE.Vector3(0, 0, 1);

        let oldShapes = [];

        for (let i = 0; i < this.shape.length; i++) {
            oldShapes.push(this.shape[i]);

            let shape = CUBE_SHAPES[this.blockType][i];

            let vector = new THREE.Vector3(shape.x, shape.y, shape.z);
            vector.applyAxisAngle(rotateX, this.mesh.rotation.x);
            vector.applyAxisAngle(rotateY, this.mesh.rotation.y);
            vector.applyAxisAngle(rotateZ, this.mesh.rotation.z);
            this.shape[i] = { x: vector.x, y: vector.y, z: vector.z };

            Tetris.Utils.roundVector(this.shape[i]);
        }

        if (Tetris.Board.testCollision(false) === COLLISION.WALL) {
            console.log("collided");
            this.shape = oldShapes;
            this.mesh.rotation = oldRotation;
        }
    },

    move: function(x, y, z) {
        let oldPosition = Tetris.Utils.cloneVector(this.mesh.position);
        let oldPos = Tetris.Utils.cloneVector(this.position);

        this.mesh.position.x += x * BLOCK_SIZE;
        this.position.x += x;

        this.mesh.position.y += y * BLOCK_SIZE;
        this.position.y += y;

        this.mesh.position.z += z * BLOCK_SIZE;
        this.position.z += z;

        let collision = Tetris.Board.testCollision((z != 0));

        if (collision === COLLISION.WALL) {
            console.log("moved: " + oldPosition.x + ", " + oldPosition.y + ", " + oldPosition.z + " -> " + this.mesh.position.x + ", " + this.mesh.position.y + ", " + this.mesh.position.z);
            this.position = oldPos;
            this.mesh.position = oldPosition;
        }
        if (collision === COLLISION.GROUND) {
            this.hitBottom();
            Tetris.sounds.collision.play();
            Tetris.Board.checkCompleted();
        } else {
            Tetris.sounds.move.play();
        }
    },
    petrify: function() {
        for (let i of this.shape) {
            Tetris.addStaticBlock(this.position.x + i.x, this.position.y + i.y, this.position.z + i.z);
            Tetris.Board.fields[this.position.x + i.x][this.position.y + i.y][this.position.z + i.z] = FIELD.PETRIFIED;
        }
    },
    hitBottom: function() {
        this.petrify();
        Tetris.scene.remove(this.mesh);
        this.generate();
    }
};

Tetris.Board = {
    fields: [],
    init: function(_x, _y, _z) {
        for (let x = 0; x < _x; x++) {
            this.fields[x] = [];
            for (let y = 0; y < _y; y++) {
                this.fields[x][y] = [];
                for (let z = 0; z < _z; z++) {
                    this.fields[x][y][z] = FIELD.EMPTY;
                }
            }
        }
    },
    testCollision: function(ground_check) {
        let posx = Tetris.Block.position.x,
            posy = Tetris.Block.position.y,
            posz = Tetris.Block.position.z,
            shape = Tetris.Block.shape;

        for (let i of shape) {
            if ((i.x + posx) < 0 || (i.y + posy) < 0 || (i.x + posx) >= this.fields.length || (i.y + posy) >= this.fields[0].length) {
                return COLLISION.WALL;
            }

            if (this.fields[i.x + posx][i.y + posy][i.z + posz - 1] === FIELD.PETRIFIED) {
                return ground_check ? COLLISION.GROUND : COLLISION.WALL;
            }

            if ((i.z + posz) <= 0) {
                return COLLISION.GROUND;
            }
        }
    },
    checkCompleted: function() {
        let rebuild = false;
        let sum, expected = this.fields[0].length * this.fields.length,
            bonus = 0;

        for (let z = 0; z < this.fields[0][0].length; z++) {
            sum = 0;
            for (let y = 0; y < this.fields[0].length; y++) {
                for (let x = 0; x < this.fields.length; x++) {
                    if (this.fields[x][y][z] === FIELD.PETRIFIED) sum++;
                }
            }

            if (sum == expected) {
                bonus += 1 + bonus; // 1, 3, 7, 15...

                for (let y2 = 0; y2 < this.fields[0].length; y2++) {
                    for (let x2 = 0; x2 < this.fields.length; x2++) {
                        for (let z2 = z; z2 < this.fields[0][0].length - 1; z2++) {
                            this.fields[x2][y2][z2] = this.fields[x2][y2][z2 + 1];
                        }
                        this.fields[x2][y2][this.fields[0][0].length - 1] = FIELD.EMPTY;
                    }
                }
                rebuild = true;
                z--;
            }
        }
        if (bonus) {
            Tetris.addPoints(1000 * bonus);
        }
        if (rebuild) {
            for (let z = 0; z < this.fields[0][0].length - 1; z++) {
                for (let y = 0; y < this.fields[0].length; y++) {
                    for (let x = 0; x < this.fields.length; x++) {
                        if (this.fields[x][y][z] === FIELD.PETRIFIED && !Tetris.staticBlocks[x][y][z]) {
                            Tetris.addStaticBlock(x, y, z);
                        }
                        if (this.fields[x][y][z] == FIELD.EMPTY && Tetris.staticBlocks[x][y][z]) {
                            Tetris.scene.remove(Tetris.staticBlocks[x][y][z]);
                            delete Tetris.staticBlocks[x][y][z];
                        }
                    }
                }
            }
        }
    }
};

$(document).ready(Tetris.init.bind(Tetris));