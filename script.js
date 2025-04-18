// script.js

// References to DOM elements
const img1 = document.getElementById('img1');
const img2 = document.getElementById('img2');
const imgTemp = document.getElementById('img-temp');
const audio = document.getElementById('audio');
const container = document.getElementById('waveform-container');
const bgCanvas = document.getElementById('wave-bg');
const playedCanvas = document.getElementById('wave-played');
const playedWrapper = document.getElementById('played-wrapper');
const controls = document.getElementById('controls');
const pauseImg = document.getElementById('pause');

// Canvas contexts
const ctxBg = bgCanvas.getContext('2d');
const ctxPlayed = playedCanvas.getContext('2d');

// Constants
const BAR_WIDTH = 4;
const BAR_GAP = 6;
const MARGIN = 20;
const CANVAS_HEIGHT = 60;
const BG_COLOR = '#FFFFFF';
const BAR_COLOR = '#C7C7C7';

// Mutable colors for played waveform
let PLAYED_BAR_COLOR = '#00FF8E';
let PLAYED_BG_COLOR = '#25744A';

// State
let audioBuffer = null;
let peaks = [];
let currentTransition = null;

// Utility: draw a capsule-shaped bar
function drawCapsule(ctx, xCenter, y, height, width, fillStyle) {
    const r = width / 2;
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(xCenter, y + r, r, Math.PI, 0);
    ctx.lineTo(xCenter + r, y + height - r);
    ctx.arc(xCenter, y + height - r, r, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
}

// Redraw the "played" overlay
function redrawPlayed() {
    const W = container.clientWidth;
    const H = CANVAS_HEIGHT;
    ctxPlayed.clearRect(0, 0, W, H);
    ctxPlayed.fillStyle = PLAYED_BG_COLOR;
    ctxPlayed.fillRect(0, 0, W, H);

    peaks.forEach((p, i) => {
        const barH = p * H * 0.6;
        const xCenter = MARGIN + i * (BAR_WIDTH + BAR_GAP) + BAR_WIDTH / 2;
        const yStart = (H - barH) / 2;
        drawCapsule(ctxPlayed, xCenter, yStart, barH, BAR_WIDTH, PLAYED_BAR_COLOR);
    });
}

// Main render function: resize, compute peaks, draw
function renderWaveform() {
    if (!audioBuffer) return;

    // Measure
    const W = container.clientWidth;
    const H = CANVAS_HEIGHT;

    // Resize canvases
    [bgCanvas, playedCanvas].forEach(c => {
        c.style.width = W + 'px';
        c.style.height = H + 'px';
        c.width = W;
        c.height = H;
    });

    // Compute peaks
    const data = audioBuffer.getChannelData(0);
    const numBars = Math.floor((W - MARGIN * 2) / (BAR_WIDTH + BAR_GAP));
    const chunk = Math.floor(data.length / numBars);
    peaks = Array.from({ length: numBars }, (_, i) => {
        let max = 0;
        const start = i * chunk;
        for (let j = 0; j < chunk; j++) {
            max = Math.max(max, Math.abs(data[start + j]));
        }
        return max;
    });

    // Draw background
    ctxBg.clearRect(0, 0, W, H);
    ctxBg.fillStyle = BG_COLOR;
    ctxBg.fillRect(0, 0, W, H);
    peaks.forEach((p, i) => {
        const barH = p * H * 0.6;
        const xCenter = MARGIN + i * (BAR_WIDTH + BAR_GAP) + BAR_WIDTH / 2;
        const yStart = (H - barH) / 2;
        drawCapsule(ctxBg, xCenter, yStart, barH, BAR_WIDTH, BAR_COLOR);
    });

    // Draw played overlay
    redrawPlayed();
}

// Fetch and decode audio
fetch(audio.src)
    .then(r => r.arrayBuffer())
    .then(ab => new (window.AudioContext || window.webkitAudioContext)().decodeAudioData(ab))
    .then(buffer => {
        audioBuffer = buffer;
        renderWaveform();
    })
    .catch(console.error);

// Debounce helper
function debounce(fn, delay = 100) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// Redraw on resize
window.addEventListener('resize', debounce(renderWaveform, 100));

// Seek support
container.addEventListener('click', e => {
    const rect = container.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
});

// Update played width on timeupdate
audio.addEventListener('timeupdate', () => {
    const pct = audio.currentTime / (audio.duration || 1);
    playedWrapper.style.width = (pct * 100) + '%';
});

// Crossfade image helper
function crossFadeImage(newSrc) {
    if (img1.src.includes(newSrc)) return;
    imgTemp.src = newSrc;
    imgTemp.style.opacity = '0';
    imgTemp.style.display = 'block';
    void imgTemp.offsetWidth;
    imgTemp.style.opacity = '1';
    setTimeout(() => {
        img1.src = newSrc;
        imgTemp.style.display = 'none';
        imgTemp.style.opacity = '0';
    }, 300);
}

// Update SVG gradients
function updateSvgsGradient(color) {
    document.querySelectorAll('linearGradient#waveGradient stop')
        .forEach(stop => stop.setAttribute('stop-color', color));
}

// Toggle between SVGs
function toggleWaveSvgs() {
    document.querySelectorAll('.wave-svg')
        .forEach(svg => svg.classList.toggle('wave-hidden'));
}

// Header click handling
document.addEventListener('DOMContentLoaded', () => {
    const items = Array.from(document.querySelectorAll('#header ul li'));
    items.forEach((item, i) => {
        item.addEventListener('click', () => {
            // Cancel in-flight animation
            if (currentTransition) {
                cancelAnimationFrame(currentTransition);
                currentTransition = null;
            }

            let targetBar, targetBg, newImgSrc, showImg2;
            switch (i) {
                case 0:
                    targetBar = '#00FF8E'; targetBg = '#25744A'; newImgSrc = 'images/img1.png'; showImg2 = false; break;
                case 1:
                    targetBar = '#8E84FF'; targetBg = '#363360'; newImgSrc = 'images/img2.png'; showImg2 = false; break;
                case 2:
                    targetBar = '#FFFF03'; targetBg = '#747426'; newImgSrc = 'images/img3.png'; showImg2 = false; break;
                case 3:
                    targetBar = '#00FF8E'; targetBg = '#363360'; newImgSrc = 'images/img4.1.png'; showImg2 = true; break;
                case 4:
                    targetBar = '#FF87A5'; targetBg = '#562838'; newImgSrc = 'images/img5.png'; showImg2 = false; break;
            }

            // Image transition + gradient update
            crossFadeImage(newImgSrc);
            updateSvgsGradient(targetBar);

            // Show/hide img2
            if (showImg2) {
                img2.style.opacity = '0';
                img2.style.display = 'block';
                setTimeout(() => img2.style.opacity = '1', 50);
            } else {
                img2.style.opacity = '0';
                setTimeout(() => img2.style.display = 'none', 300);
            }

            // Active class swap
            document.querySelector('#header ul li.active')?.classList.remove('active');
            item.classList.add('active');

            // Animate color change
            const startTime = performance.now();
            const duration = 300;
            function animate(timestamp) {
                const progress = Math.min((timestamp - startTime) / duration, 1);
                // instant swap of colors (progress ignored for now)
                PLAYED_BAR_COLOR = targetBar;
                PLAYED_BG_COLOR = targetBg;
                redrawPlayed();
                if (progress < 1) {
                    currentTransition = requestAnimationFrame(animate);
                } else {
                    currentTransition = null;
                }
            }
            currentTransition = requestAnimationFrame(animate);
        });
    });

    // Toggle switch thumb
    const thumb = document.querySelector('#mySwitch .toggle-thumb');
    thumb.addEventListener('click', () => {
        thumb.parentElement.classList.toggle('on');
        toggleWaveSvgs();
    });

    // Play/pause controls
    const playIcons = controls.querySelectorAll('img:not(#pause)');
    controls.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            playIcons.forEach(img => img.style.display = 'none');
            pauseImg.style.display = 'block';
        } else {
            audio.pause();
            playIcons.forEach(img => img.style.display = 'block');
            pauseImg.style.display = 'none';
        }
    });
});
