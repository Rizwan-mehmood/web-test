// script.js

// References to DOM elements
const img1 = document.getElementById('img1');
const img2 = document.getElementById('img2');
const audio = document.getElementById('audio');
const container = document.getElementById('waveform-container');
const bgCanvas = document.getElementById('wave-bg');
const playedCanvas = document.getElementById('wave-played');
const playedWrapper = document.getElementById('played-wrapper');
const ctxBg = bgCanvas.getContext('2d');
const ctxPlayed = playedCanvas.getContext('2d');

const W = container.clientWidth;
const H = container.clientHeight;

// Bar‑drawing constants
const BAR_WIDTH = 4;
const BAR_GAP = 6;
const BAR_COLOR = '#C7C7C7';
const BG_COLOR = '#FFFFFF';
const MARGIN = 20;

// Mutable played‑waveform colors
let PLAYED_BAR_COLOR = '#00FF8E';
let PLAYED_BG_COLOR = '#25744A';

// Array to store precomputed peaks
let peaks = [];

// Initial hide of second image
img2.style.display = 'none';

// Resize canvases to match container
[bgCanvas, playedCanvas].forEach(c => {
    c.width = W;
    c.height = H;
    c.style.width = W + 'px';
    c.style.height = H + 'px';
});

// Draw a vertical “capsule” bar at (xCenter, y) with given height, width, and fillStyle
function drawCapsule(ctx, xCenter, y, height, width, fillStyle) {
    const r = width / 2;
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(xCenter, y + r, r, Math.PI, 0);
    ctx.lineTo(xCenter + r, y + height - r);
    ctx.arc(xCenter, y + height - r, r, 0, Math.PI);
    ctx.lineTo(xCenter - r, y + r);
    ctx.closePath();
    ctx.fill();
}

// Redraw the “played” canvas using current PLAYED_* colors
function redrawPlayed() {
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

// Fetch and process audio data to compute peaks, then draw both canvases once
fetch(audio.src)
    .then(r => r.arrayBuffer())
    .then(ab => {
        const actx = new (window.AudioContext || window.webkitAudioContext)();
        return actx.decodeAudioData(ab);
    })
    .then(buffer => {
        const data = buffer.getChannelData(0);
        const numBars = Math.floor((W - MARGIN * 2) / (BAR_WIDTH + BAR_GAP));
        const chunk = Math.floor(data.length / numBars);

        peaks = Array.from({ length: numBars }, (_, i) => {
            let max = 0, start = i * chunk;
            for (let j = 0; j < chunk; j++) {
                max = Math.max(max, Math.abs(data[start + j]));
            }
            return max;
        });

        // Draw background waveform
        ctxBg.fillStyle = BG_COLOR;
        ctxBg.fillRect(0, 0, W, H);
        peaks.forEach((p, i) => {
            const barH = p * H * 0.6;
            const xCenter = MARGIN + i * (BAR_WIDTH + BAR_GAP) + BAR_WIDTH / 2;
            const yStart = (H - barH) / 2;
            drawCapsule(ctxBg, xCenter, yStart, barH, BAR_WIDTH, BAR_COLOR);
        });

        // Initial draw of played waveform
        redrawPlayed();
    })
    .catch(console.error);

// Update played‑wrapper width on audio timeupdate (CSS transition handles smoothness)
audio.addEventListener('timeupdate', () => {
    const pct = audio.currentTime / (audio.duration || 1);
    playedWrapper.style.width = (pct * 100) + '%';
});

// Seek support: click waveform to jump
container.addEventListener('click', e => {
    const rect = container.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
});


const imgTemp = document.getElementById('img-temp');

function updateSvgsGradient(color) {
    document.querySelectorAll('linearGradient#waveGradient stop')
        .forEach(stop => stop.setAttribute('stop-color', color));
}

function toggleWaveSvgs() {
    document.querySelectorAll('.wave-svg')
        .forEach(svg => svg.classList.toggle('wave-hidden'));
}



function crossFadeImage(newSrc) {
    // If same image, skip
    if (img1.src.includes(newSrc)) return;

    imgTemp.src = newSrc;
    imgTemp.style.opacity = '0';
    imgTemp.style.display = 'block';

    // Trigger a repaint (force style reflow)
    void imgTemp.offsetWidth;

    imgTemp.style.opacity = '1';
    setTimeout(() => {
        img1.src = newSrc;
        imgTemp.style.display = 'none';
        imgTemp.style.opacity = '0';
    }, 300);
}


// Modify the click handler in the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
    const items = Array.from(document.querySelectorAll('#header ul li'));
    let currentTransition = null;

    items.forEach((item, i) => {
        item.addEventListener('click', () => {
            // Cancel any ongoing transitions
            if (currentTransition) {
                cancelAnimationFrame(currentTransition);
                currentTransition = null;
            }

            // Get current colors
            const startBar = PLAYED_BAR_COLOR;
            const startBg = PLAYED_BG_COLOR;
            let targetBar, targetBg, newImgSrc, showImg2;

            // Determine target values
            switch (i) {
                case 0:
                    targetBar = '#00FF8E';
                    targetBg = '#25744A';
                    newImgSrc = 'images/img1.png';
                    showImg2 = false;
                    break;
                case 1:
                    targetBar = '#8E84FF';
                    targetBg = '#363360';
                    newImgSrc = 'images/img2.png';
                    showImg2 = false;
                    break;
                case 2:
                    targetBar = '#FFFF03';
                    targetBg = '#747426';
                    newImgSrc = 'images/img3.png';
                    showImg2 = false;
                    break;
                case 3:
                    targetBar = '#00FF8E';
                    targetBg = '#363360';
                    newImgSrc = 'images/img4.1.png';
                    showImg2 = true;
                    break;
                case 4:
                    targetBar = '#FF87A5';
                    targetBg = '#562838';
                    newImgSrc = 'images/img5.png';
                    showImg2 = false;
                    break;
            }

            // Image transition
            if (img1.src !== newImgSrc) {
                crossFadeImage(newImgSrc);
                updateSvgsGradient(targetBar);
            }

            // Handle img2
            if (showImg2) {
                img2.style.opacity = '0';
                img2.style.display = 'block';
                setTimeout(() => {
                    img2.style.opacity = '1';
                }, 50);
            } else {
                img2.style.opacity = '0';
                setTimeout(() => {
                    img2.style.display = 'none';
                }, 300);
            }

            // Active class transition
            const activeItem = document.querySelector('#header ul li.active');
            if (activeItem) {
                activeItem.classList.remove('active');
            }
            item.classList.add('active');

            // Color transition
            const startTime = performance.now();
            const duration = 300;

            function animate(timestamp) {
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Interpolate colors
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
});

// Toggle switch thumb
const thumb = document.querySelector('#mySwitch .toggle-thumb');
thumb.addEventListener('click', () => {
    thumb.parentElement.classList.toggle('on');
    toggleWaveSvgs();
});

// Add this near the bottom of your existing script.js

const controls = document.getElementById('controls');
const pauseImg = document.getElementById('pause');

const playIcons = controls.querySelectorAll('img:not(#pause)'); // vector1 & vector2

controls.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        // Show pause icon, hide play icons
        playIcons.forEach(img => img.style.display = 'none');
        pauseImg.style.display = 'block';
    } else {
        audio.pause();
        // Show play icons, hide pause icon
        playIcons.forEach(img => img.style.display = 'block');
        pauseImg.style.display = 'none';
    }
});
