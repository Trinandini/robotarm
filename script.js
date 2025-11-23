const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusDiv = document.getElementById('status');
const modeIndicator = document.getElementById('modeIndicator');
const startBtn = document.getElementById('startBtn');
const robotModeBtn = document.getElementById('robotModeBtn');
const objectModeBtn = document.getElementById('objectModeBtn');

let currentAttempt = 0;
let isAnimating = false;
let animationFrame = 0;
let placementMode = 'robot';
let robotPlaced = false;
let objectPlaced = false;

const attempts = [
    { offsetY: -60, result: 'Miss!' },
    { offsetY: 60, result: 'Miss!' },
    { offsetX: 50, offsetY: 0, result: 'Miss!' },
    { offsetX: 0, offsetY: 0, result: 'Success!' }
];

let robotBase = { x: 150, y: 100 };
let object = { x: 400, y: 250, width: 50, height: 50 };

function setMode(mode) {
    placementMode = mode;
    robotModeBtn.classList.toggle('active', mode === 'robot');
    objectModeBtn.classList.toggle('active', mode !== 'robot');
}

canvas.addEventListener('click', (e) => {
    if (isAnimating) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (placementMode === 'robot') {
        robotBase.x = x;
        robotBase.y = y;
        robotPlaced = true;
    } else {
        object.x = x - 25;
        object.y = y - 25;
        objectPlaced = true;
    }

    if (robotPlaced && objectPlaced) startBtn.disabled = false;

    drawScene(robotBase.x + 100, robotBase.y + 100, true, false);
});

function drawScene(armX, armY, gripperOpen, objectGrasped) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#34495e';
    ctx.fillRect(robotBase.x - 40, robotBase.y - 20, 80, 60);

    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(robotBase.x, robotBase.y);
    ctx.lineTo(armX, armY);
    ctx.stroke();

    ctx.fillStyle = '#f39c12';
    ctx.fillRect(object.x, object.y, object.width, object.height);
}

function animate() {
    if (!isAnimating) return;

    const attempt = attempts[currentAttempt];
    const targetX = object.x + 25 + (attempt.offsetX || 0);
    const targetY = object.y + 25 + (attempt.offsetY || 0);

    const frames = 60;
    const progress = animationFrame / frames;

    const startX = robotBase.x + 100;
    const startY = robotBase.y + 100;
    const currentX = startX + (targetX - startX) * progress;
    const currentY = startY + (targetY - startY) * progress;

    drawScene(currentX, currentY, true, currentAttempt === 3 && progress > 0.9);
    animationFrame++;

    if (animationFrame <= frames) requestAnimationFrame(animate);
    else {
        isAnimating = false;
        statusDiv.innerHTML = `<h2>${attempt.result}</h2>`;
        if (currentAttempt < 3) setTimeout(() => { currentAttempt++; startAttempt(); }, 1000);
    }
}

function startAttempt() {
    isAnimating = true;
    animationFrame = 0;
    animate();
}

function startDemo() {
    currentAttempt = 0;
    startAttempt();
}

function resetDemo() {
    location.reload();
}

drawScene(robotBase.x + 100, robotBase.y + 100, true, false);
