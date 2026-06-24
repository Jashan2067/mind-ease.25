// Game Modal Management
function openGame(gameType) {
    const modal = document.getElementById(`${gameType}-modal`);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Initialize game-specific setup
        if (gameType === 'doodle') {
            initDoodlePad();
        } else if (gameType === 'bubble') {
            initBubbleCanvas();
        }
    }
}

function closeGame(gameType) {
    const modal = document.getElementById(`${gameType}-modal`);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';

        // Clean up game-specific resources
        if (gameType === 'breathing') {
            stopBreathing();
        } else if (gameType === 'bubble') {
            stopBubbles();
        }
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('game-modal')) {
        const gameType = e.target.id.replace('-modal', '');
        closeGame(gameType);
    }
});

// ===== BREATHING CIRCLE GAME =====
let breathingInterval;
let breathingActive = false;

function startBreathing() {
    if (breathingActive) {
        stopBreathing();
        return;
    }

    breathingActive = true;
    const circle = document.querySelector('.breathing-circle');
    const instruction = document.querySelector('.breathing-instruction');
    const button = document.querySelector('#breathing-modal .action-button');

    button.textContent = 'Stop Exercise';

    let isInhaling = true;

    function breathe() {
        if (isInhaling) {
            circle.classList.remove('exhale');
            circle.classList.add('inhale');
            instruction.textContent = 'Inhale';
        } else {
            circle.classList.remove('inhale');
            circle.classList.add('exhale');
            instruction.textContent = 'Exhale';
        }
        isInhaling = !isInhaling;
    }

    breathe(); // Start immediately
    breathingInterval = setInterval(breathe, 4000);
}

function stopBreathing() {
    breathingActive = false;
    clearInterval(breathingInterval);
    const circle = document.querySelector('.breathing-circle');
    const button = document.querySelector('#breathing-modal .action-button');
    circle.classList.remove('inhale', 'exhale');
    if (button) button.textContent = 'Start Exercise';
}

// ===== BUBBLE POP GAME =====
let bubbleCanvas;
let bubbleCtx;
let bubbles = [];
let bubbleScore = 0;
let bubbleAnimationFrame;
let bubblesActive = false;

function initBubbleCanvas() {
    bubbleCanvas = document.getElementById('bubble-canvas');
    if (!bubbleCanvas) return;

    bubbleCtx = bubbleCanvas.getContext('2d');
    bubbleCanvas.width = bubbleCanvas.offsetWidth;
    bubbleCanvas.height = bubbleCanvas.offsetHeight;

    bubbleCanvas.addEventListener('click', popBubble);
}

class Bubble {
    constructor() {
        this.x = Math.random() * bubbleCanvas.width;
        this.y = bubbleCanvas.height + 50;
        this.radius = Math.random() * 30 + 20;
        this.speed = Math.random() * 2 + 1;
        this.hue = Math.random() * 360;
        this.opacity = 0.7;
    }

    update() {
        this.y -= this.speed;
        this.x += Math.sin(this.y * 0.01) * 0.5;
    }

    draw() {
        bubbleCtx.save();
        bubbleCtx.globalAlpha = this.opacity;

        // Bubble gradient
        const gradient = bubbleCtx.createRadialGradient(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            0,
            this.x,
            this.y,
            this.radius
        );
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 80%, 0.8)`);
        gradient.addColorStop(0.5, `hsla(${this.hue}, 70%, 60%, 0.6)`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 50%, 0.2)`);

        bubbleCtx.fillStyle = gradient;
        bubbleCtx.beginPath();
        bubbleCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        bubbleCtx.fill();

        // Highlight
        bubbleCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        bubbleCtx.beginPath();
        bubbleCtx.arc(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            this.radius * 0.3,
            0,
            Math.PI * 2
        );
        bubbleCtx.fill();

        bubbleCtx.restore();
    }
}

function startBubbles() {
    if (bubblesActive) {
        stopBubbles();
        return;
    }

    bubblesActive = true;
    bubbleScore = 0;
    bubbles = [];
    document.getElementById('bubble-score').textContent = bubbleScore;
    document.querySelector('#bubble-modal .action-button').textContent = 'Stop Game';

    animateBubbles();
}

function animateBubbles() {
    if (!bubblesActive) return;

    bubbleCtx.clearRect(0, 0, bubbleCanvas.width, bubbleCanvas.height);

    // Add new bubbles randomly
    if (Math.random() < 0.03 && bubbles.length < 15) {
        bubbles.push(new Bubble());
    }

    // Update and draw bubbles
    for (let i = bubbles.length - 1; i >= 0; i--) {
        bubbles[i].update();
        bubbles[i].draw();

        // Remove bubbles that are off screen
        if (bubbles[i].y < -50) {
            bubbles.splice(i, 1);
        }
    }

    bubbleAnimationFrame = requestAnimationFrame(animateBubbles);
}

function popBubble(e) {
    if (!bubblesActive) return;

    const rect = bubbleCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = bubbles.length - 1; i >= 0; i--) {
        const dx = x - bubbles[i].x;
        const dy = y - bubbles[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < bubbles[i].radius) {
            // Create pop effect
            createPopEffect(bubbles[i].x, bubbles[i].y, bubbles[i].hue);
            bubbles.splice(i, 1);
            bubbleScore++;
            document.getElementById('bubble-score').textContent = bubbleScore;
            break;
        }
    }
}

function createPopEffect(x, y, hue) {
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const particle = {
            x: x,
            y: y,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            radius: 3,
            hue: hue,
            life: 20
        };

        animateParticle(particle);
    }
}

function animateParticle(particle) {
    let frame = 0;
    const animate = () => {
        if (frame >= particle.life) return;

        bubbleCtx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${1 - frame / particle.life})`;
        bubbleCtx.beginPath();
        bubbleCtx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        bubbleCtx.fill();

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1;
        frame++;

        requestAnimationFrame(animate);
    };
    animate();
}

function stopBubbles() {
    bubblesActive = false;
    cancelAnimationFrame(bubbleAnimationFrame);
    bubbles = [];
    const button = document.querySelector('#bubble-modal .action-button');
    if (button) button.textContent = 'Start Popping';
}

// ===== MEMORY MATCH GAME =====
const memoryIcons = ['🌸', '🌺', '🌻', '🌼', '🌷', '🌹', '🪷', '🏵️'];
let memoryCards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let canFlip = true;

function startMemory() {
    // Reset game
    matchedPairs = 0;
    moves = 0;
    flippedCards = [];
    canFlip = true;

    document.getElementById('moves').textContent = moves;
    document.getElementById('matches').textContent = matchedPairs;

    // Create shuffled deck
    memoryCards = [...memoryIcons, ...memoryIcons]
        .sort(() => Math.random() - 0.5);

    // Create grid
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';

    memoryCards.forEach((icon, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = index;
        card.innerHTML = `
            <div class="card-back">❓</div>
            <div class="card-front">${icon}</div>
        `;
        card.addEventListener('click', () => flipCard(card, icon, index));
        grid.appendChild(card);
    });
}

function flipCard(card, icon, index) {
    if (!canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) {
        return;
    }

    card.classList.add('flipped');
    flippedCards.push({ card, icon, index });

    if (flippedCards.length === 2) {
        canFlip = false;
        moves++;
        document.getElementById('moves').textContent = moves;

        setTimeout(checkMatch, 800);
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;

    if (card1.icon === card2.icon && card1.index !== card2.index) {
        // Match found
        card1.card.classList.add('matched');
        card2.card.classList.add('matched');
        matchedPairs++;
        document.getElementById('matches').textContent = matchedPairs;

        if (matchedPairs === memoryIcons.length) {
            setTimeout(() => {
                alert(`🎉 Congratulations! You won in ${moves} moves!`);
            }, 500);
        }
    } else {
        // No match
        card1.card.classList.remove('flipped');
        card2.card.classList.remove('flipped');
    }

    flippedCards = [];
    canFlip = true;
}

// ===== DOODLE PAD GAME =====
let doodleCanvas;
let doodleCtx;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

function initDoodlePad() {
    doodleCanvas = document.getElementById('doodle-canvas');
    if (!doodleCanvas) return;

    doodleCtx = doodleCanvas.getContext('2d');
    doodleCanvas.width = doodleCanvas.offsetWidth;
    doodleCanvas.height = doodleCanvas.offsetHeight;

    doodleCtx.lineCap = 'round';
    doodleCtx.lineJoin = 'round';

    // Mouse events
    doodleCanvas.addEventListener('mousedown', startDrawing);
    doodleCanvas.addEventListener('mousemove', draw);
    doodleCanvas.addEventListener('mouseup', stopDrawing);
    doodleCanvas.addEventListener('mouseout', stopDrawing);

    // Touch events
    doodleCanvas.addEventListener('touchstart', handleTouchStart);
    doodleCanvas.addEventListener('touchmove', handleTouchMove);
    doodleCanvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    const rect = doodleCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function draw(e) {
    if (!isDrawing) return;

    const rect = doodleCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    doodleCtx.strokeStyle = document.getElementById('color-picker').value;
    doodleCtx.lineWidth = document.getElementById('brush-size').value;

    doodleCtx.beginPath();
    doodleCtx.moveTo(lastX, lastY);
    doodleCtx.lineTo(x, y);
    doodleCtx.stroke();

    lastX = x;
    lastY = y;
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = doodleCanvas.getBoundingClientRect();
    lastX = touch.clientX - rect.left;
    lastY = touch.clientY - rect.top;
    isDrawing = true;
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;

    const touch = e.touches[0];
    const rect = doodleCanvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    doodleCtx.strokeStyle = document.getElementById('color-picker').value;
    doodleCtx.lineWidth = document.getElementById('brush-size').value;

    doodleCtx.beginPath();
    doodleCtx.moveTo(lastX, lastY);
    doodleCtx.lineTo(x, y);
    doodleCtx.stroke();

    lastX = x;
    lastY = y;
}

function clearCanvas() {
    doodleCtx.clearRect(0, 0, doodleCanvas.width, doodleCanvas.height);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.game-modal.active');
        if (activeModal) {
            const gameType = activeModal.id.replace('-modal', '');
            closeGame(gameType);
        }
    }
});
