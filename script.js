const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusDiv = document.getElementById('status');
const startBtn = document.getElementById('startBtn');

let placementMode = "robot";
let robotPlaced = false;
let objectPlaced = false;
let isAnimating = false;
let frame = 0;
let attempt = 0;

let robot = { x: null, y: null };
let object = { x: null, y: null };

const attempts = [
    { xOff: 0, yOff: -80 },
    { xOff: 80, yOff: 20 },
    { xOff: -60, yOff: 40 },
    { xOff: 0, yOff: 0 }
];

function setMode(mode) {
    placementMode = mode;
    statusDiv.innerHTML = mode === "robot" ? "Click to place ROBOT" : "Click to place OBJECT";
}

canvas.addEventListener("click", (e) => {
    if (isAnimating) return;

    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (placementMode === "robot") {
        robot.x = x;
        robot.y = y;
        robotPlaced = true;
        statusDiv.innerHTML = "Robot placed — now place object.";
    } else {
        object.x = x;
        object.y = y;
        objectPlaced = true;
        statusDiv.innerHTML = "Object placed — press START.";
    }

    if (robotPlaced && objectPlaced) startBtn.disabled = false;
    draw(robot.x, robot.y);
});

function draw(armX, armY, holding = false) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (robotPlaced) {
        ctx.fillStyle = "#2b2d42";
        ctx.fillRect(robot.x - 20, robot.y - 20, 40, 40);
    }

    if (objectPlaced && !holding) {
        ctx.fillStyle = "#ffb703";
        ctx.fillRect(object.x - 20, object.y - 20, 40, 40);
    }

    if (armX) {
        ctx.strokeStyle = "#00a6fb";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(robot.x, robot.y);
        ctx.lineTo(armX, armY);
        ctx.stroke();

        if (holding) {
            ctx.fillStyle = "#ffb703";
            ctx.fillRect(armX - 20, armY - 20, 40, 40);
        }
    }
}

function startDemo() {
    attempt = 0;
    animate();
}

function animate() {
    if (attempt >= attempts.length) {
        statusDiv.innerHTML = "Simulation complete!";
        return;
    }

    isAnimating = true;
    let offset = attempts[attempt];
    
    let targetX = object.x + offset.xOff;
    let targetY = object.y + offset.yOff;

    let armX = robot.x + (targetX - robot.x) * (frame / 60);
    let armY = robot.y + (targetY - robot.y) * (frame / 60);

    draw(armX, armY, attempt === 3 && frame > 45);
    
    frame++;

    if (frame <= 60) {
        requestAnimationFrame(animate);
    } else {
        frame = 0;
        attempt++;
        setTimeout(() => animate(), 900);
    }
}

function resetDemo() {
    location.reload();
}

draw();
