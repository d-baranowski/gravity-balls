import {createConnection} from "./createConnection.js";

function getPosition(el) {
    let xPosition = 0;
    let yPosition = 0;

    while (el) {
        xPosition += (el.offsetLeft - el.scrollLeft + el.clientLeft);
        yPosition += (el.offsetTop - el.scrollTop + el.clientTop);
        el = el.offsetParent;
    }
    return {
        x: xPosition,
        y: yPosition
    };
}

function rainbow(n) {
    n = n * 240 / 255;
    return 'hsl(' + n + ',100%,50%)';
}

const mapOver = (value, istart, istop, ostart, ostop) => {
    return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
};

function getMagnitude(vec) {
    return Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2));
}

class Ball {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;
        this.xVelocity = 0.1;
        this.yVelocity = 0.1;
        this.radius = 3;
        this.color = rainbow(0);
        this.x = Math.random() * 10000 % canvas.width;
        this.y = Math.random() * 10000 % canvas.height;
    }

    update() {
        this.x+=this.xVelocity;
        this.y+=this.yVelocity;

        /*if (this.y + this.yVelocity > this.canvas.height || this.y + this.yVelocity < 0) {
            this.yVelocity = -this.yVelocity;
        }
        if (this.x + this.xVelocity > this.canvas.width || this.x + this.xVelocity < 0) {
            this.xVelocity = -this.xVelocity;
        }*/

        this.radius = mapOver(getMagnitude({x: this.xVelocity, y: this.yVelocity}), 0, 50, 3, 7);
        this.color = mapOver(getMagnitude({x: this.xVelocity, y: this.yVelocity}), 15, 50, 50, 255);
        this.draw();
    }

    addForce(force) {
        this.xVelocity += force.x;
        this.yVelocity += force.y;
    }

    draw() {
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
        this.context.fillStyle = rainbow(this.color);
        this.context.fill();
    }
}

export const gravityBallsOfColours = () => {
    const playerOne = { x: 0, y: 0, pull: false, push: false, mode: 'pull' };
    let playerTwo = { x: -10, y: -10, pull: false, push: false, mode: 'pull'  };

    document.getElementById('placeholder').innerHTML =
        `<canvas width="${window.innerWidth -15}px" height="${window.innerHeight - 45}" id="canvas"></canvas>`;

    const canvas = document.getElementById('canvas');
    const context = canvas.getContext("2d");

    let canvasPos = getPosition(canvas);

    canvas.addEventListener("mousemove", (e) => {
        playerOne.x = e.clientX - canvasPos.x;
        playerOne.y = e.clientY - canvasPos.y;
    });

    canvas.addEventListener("mousedown", () => {
        playerOne[playerOne.mode] = true;
    });

    canvas.addEventListener("mouseup", () => {
        playerOne[playerOne.mode] = false;
    });

    window.addEventListener("keyup", function(event) {
        if (event.key === ' ') {
            event.preventDefault();
            playerOne.mode = playerOne.mode === 'pull' ? 'push' : 'pull';
        }
        else if (event.key === 'Enter') {
            for (let i = 0; i < 10; i++) {
                balls.push(new Ball(canvas, context))
            }
        }
    });

    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.beginPath();
        context.arc(playerOne.x, playerOne.y, 5, 0, 2 * Math.PI, true);
        context.fillStyle = playerOne.mode === 'pull' ? '#FFFFFF' : "#FF0000";
        context.fill();

        context.beginPath();
        context.arc(playerTwo.x, playerTwo.y, 5, 0, 2 * Math.PI, true);
        context.fillStyle = '#FFFF00';
        context.fill();
    }

    const balls = [];

    for (let i = 0; i < 500; i++) {
        balls.push(new Ball(canvas, context));
    }

    function getDirectionVector(pointOne, pointTwo) {
        const vector = {x: pointTwo.x-pointOne.x, y: pointTwo.y-pointOne.y};
        const mag = getMagnitude(vector);
        vector.x = vector.x / mag;
        vector.y = vector.y / mag;

        return vector;
    }

    function playerForces(player, balls) {
        if (player.pull) {
            balls.forEach(ball => {
                const dir = getDirectionVector(player, ball);
                ball.addForce({x: -(dir.x), y: -(dir.y)})
            });
        }

        if (player.push) {
            balls.forEach(ball => {
                const dir = getDirectionVector(player, ball);
                ball.addForce({x: (dir.x), y: (dir.y)})
            });
        }
    }

    function update() {
        draw();
        balls.forEach(ball => ball.update());

        playerForces(playerOne, balls);
        playerForces(playerTwo, balls);

        balls.forEach(ball => {
            ball.xVelocity = ball.xVelocity * 0.99;
            ball.yVelocity = ball.yVelocity * 0.99;
        });

        requestAnimationFrame(update);
    }

    if (!location.hash) {
        location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
    }
    const chatHash = location.hash.substring(1);
    createConnection('tbrd6Bv7LyXeG8xX' ,chatHash).then(({ subscribe, publish }) => {
        subscribe('playerTwo', (data) => {
            playerTwo = data;
        });

        setInterval(() => {
            publish(playerOne);
        },20);
    });

    update();
};