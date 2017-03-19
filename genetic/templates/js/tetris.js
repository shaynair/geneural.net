const BOUNDS = {
    width: 360,
    height: 360,
    depth: 1200,
    splitX: 6,
    splitY: 6,
    splitZ: 20
};
const MESH = { color: 0xffaa00, wireframe: true };
const VIEW_ANGLE = 45,
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
    init: function(hash = window.location.hash, playable = true) {
        WIDTH = window.innerWidth;
        HEIGHT = window.innerHeight;
        if (!playable || (hash && hash.length > 0)) {
            WIDTH *= 0.9;
            HEIGHT *= 0.55;
        }

        this.currentPoints = 0;
        this.sounds = {};
        this.frameTime = 0;
        this.cumulatedFrameTime = 0;
        this._lastFrameTime = Date.now();
        this.gameOver = false;
        this.gameStepTime = 1000;
        this.staticBlocks = [];
        this.automatic = [];
        this.playable = playable;
        this.moveCount = 0;

        this.renderer = new THREE.WebGLRenderer();
        this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, WIDTH / HEIGHT, NEAR, FAR);
        this.scene = new THREE.Scene();

        // the camera starts at 0,0,0 so pull it back
        this.camera.position.z = CAMERA_Z;
        this.scene.add(this.camera);

        // start the renderer
        this.renderer.setSize(WIDTH, HEIGHT);

        $("#game").remove();
        $(this.renderer.domElement).attr("id", "game").css("margin", "0 auto");
        $("#game-container").append($(this.renderer.domElement));

        this.Board.init(BOUNDS.splitX, BOUNDS.splitY, BOUNDS.splitZ);

        this.scene.add(new THREE.Mesh(
            new THREE.CubeGeometry(BOUNDS.width, BOUNDS.height,
                BOUNDS.depth, BOUNDS.splitX,
                BOUNDS.splitY, BOUNDS.splitZ),
            new THREE.MeshBasicMaterial(MESH)
        ));

        this.render();
        if (playable && (!hash || hash.length <= 1)) {
            this.sounds.collision = document.getElementById("audio_collision");
            this.sounds.move = document.getElementById("audio_move");
            this.sounds.gameover = document.getElementById("audio_gameover");
            this.sounds.score = document.getElementById("audio_score");

            $("#play_button").click((event) => {
                event.preventDefault();
                this.start();
            });
        } else {
            if (hash && hash.length > 1) {
                // Decode
                try {
                    let decoded = atob(hash);
                    for (let move of decoded.split(";")) {
                        if (move.length <= 0) {
                            continue;
                        }
                        let ob = move.split(",");
                        let shape = parseInt(ob[0]);
                        let position = { x: parseInt(ob[1].split("|")[0]), y: parseInt(ob[1].split("|")[1]) };
                        let rotation = { x: parseInt(ob[2].split("|")[0]), y: parseInt(ob[2].split("|")[1]), z: parseInt(ob[2].split("|")[2]) };
                        this.automatic.push({ shape, position, rotation });
                    }
                } catch (e) {
                    console.error(e);
                    return;
                }
                this.start();
            } else {
                this.render();
            }
        }
    },
    start: function() {
        if (this.playable || this.automatic.length === 0) {
            $("#menu").css("display", "none");
            $("#points").css("display", "block");
        }

        this.Block.generate();
        this.animate();

        if (!this.playable || this.automatic.length > 0) {
            this.gameStepTime = 60;
            return;
        }
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
        if (Tetris.playable) {
            $("#points").html(this.currentPoints);
            this.sounds.score.play();
        }
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
            return Object.assign({}, v);
        },
        roundVector: function(v) {
            v.x = Math.round(v.x);
            v.y = Math.round(v.y);
            v.z = Math.round(v.z);
        }
    }
};

Tetris.Block = {
    generate: function() {
        let data = null;

        if (Tetris.automatic.length > 0) {
            data = Tetris.automatic.shift();
        }
        let type = Math.floor(Math.random() * (CUBE_SHAPES.length));
        if (data !== null && 'shape' in data) {
            type = data.shape;
        }
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
            if (Tetris.playable) {
                $("#points").html("GAME OVER");
                Tetris.sounds.gameover.play();
            }
        }

        this.mesh.position.x = (this.position.x - BOUNDS.splitX / 2) * BLOCK_SIZE / 2;
        this.mesh.position.y = (this.position.y - BOUNDS.splitY / 2) * BLOCK_SIZE / 2;
        this.mesh.position.z = (this.position.z - (BOUNDS.splitZ - 1) / 2) * BLOCK_SIZE;
        this.mesh.rotation = { x: 0, y: 0, z: 0 };
        this.mesh.overdraw = true;

        Tetris.scene.add(this.mesh);

        if (data !== null && 'rotation' in data && 'position' in data) {
            this.rotate(data.rotation.x * 90, data.rotation.y * 90, data.rotation.z * 90);
            this.move(data.position.x - this.position.x, data.position.y - this.position.y, 0);
        }
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
            this.position = oldPos;
            this.mesh.position = oldPosition;
        }
        if (collision === COLLISION.GROUND) {
            this.hitBottom();
            if (Tetris.playable) {
                Tetris.sounds.collision.play();
            }
            Tetris.Board.checkCompleted();
        } else if (Tetris.playable) {
            Tetris.sounds.move.play();
        }
    },
    petrify: function() {
        for (let i of this.shape) {
            Tetris.addStaticBlock(this.position.x + i.x, this.position.y + i.y, this.position.z + i.z);
            Tetris.Board.fields[this.position.x + i.x][this.position.y + i.y][this.position.z + i.z] = FIELD.PETRIFIED;
        }
        Tetris.moveCount++;
    },
    hitBottom: function() {
        this.petrify();
        Tetris.scene.remove(this.mesh);
        this.generate();
    }
};

Tetris.Board = {
    init: function(_x, _y, _z) {
        this.fields = [];
        for (let x = 0; x < _x; x++) {
            this.fields.push([]);
            for (let y = 0; y < _y; y++) {
                this.fields[x].push([]);
                for (let z = 0; z < _z; z++) {
                    this.fields[x][y].push(FIELD.EMPTY);
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
                //console.log("petrified " + (i.x + posx) + ", " + (i.y + posy) + ", " + (i.z + posz));
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