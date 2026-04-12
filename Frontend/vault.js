const BACKEND = "https://vault-dot-cloud-project-486813.el.r.appspot.com/";
/* ===============================================================
   CONSTELLATION BACKGROUND WITH PARALLAX MOUSE TRACKING
=============================================================== */
(function initConstellation() {
    const canvas = document.getElementById('constellation-canvas');
    const ctx = canvas.getContext('2d');
    let W, H, nodes, mouse = { x: -9999, y: -9999 };
    
    let targetPx = 0, targetPy = 0, curPx = 0, curPy = 0;

    const NODE_COUNT  = 120;
    const LINK_DIST   = 140;
    const LINK_DIST2  = LINK_DIST * LINK_DIST;
    const MOUSE_REPEL = 110;
    const BASE_SPEED  = 0.6;
    const MAX_SPEED   = 1.2;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function makeNode() {
        const angle = Math.random() * Math.PI * 2;
        const speed = BASE_SPEED * (0.4 + Math.random() * 0.6);
        return {
            x: Math.random() * W, y: Math.random() * H,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            driftAngle: Math.random() * Math.PI * 2,
            driftSpeed: 0.004 + Math.random() * 0.008,
            r: 1 + Math.random() * 1.2,
            type: Math.random() < 0.75 ? 'c' : Math.random() < 0.6 ? 'p' : 'w',
        };
    }

    function init() { resize(); nodes = Array.from({ length: NODE_COUNT }, makeNode); }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => { 
        mouse.x = e.clientX; 
        mouse.y = e.clientY; 
        targetPx = (e.clientX - W/2) * 0.03;
        targetPy = (e.clientY - H/2) * 0.03;
    });
    window.addEventListener('mouseleave', () => { 
        mouse.x = -9999; 
        mouse.y = -9999; 
        targetPx = 0; 
        targetPy = 0;
    });

    const COLORS = { c: '78,201,232', p: '123,104,238', w: '200,232,240' };

    function draw() {
        const isLight = document.body.classList.contains('light-theme');
        ctx.clearRect(0, 0, W, H);
        
        curPx += (targetPx - curPx) * 0.05;
        curPy += (targetPy - curPy) * 0.05;

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.driftAngle += n.driftSpeed;
            n.vx += Math.cos(n.driftAngle) * 0.012;
            n.vy += Math.sin(n.driftAngle) * 0.012;
            const mdx = n.x - mouse.x, mdy = n.y - mouse.y;
            const md2 = mdx * mdx + mdy * mdy;
            if (md2 < MOUSE_REPEL * MOUSE_REPEL && md2 > 0.1) {
                const md = Math.sqrt(md2);
                const force = (1 - md / MOUSE_REPEL) * 0.5;
                n.vx += (mdx / md) * force; n.vy += (mdy / md) * force;
            }
            const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
            if (spd > MAX_SPEED) { n.vx = (n.vx / spd) * MAX_SPEED; n.vy = (n.vy / spd) * MAX_SPEED; }
            if (spd < 0.2) { n.vx *= 1.05; n.vy *= 1.05; }
            n.x += n.vx; n.y += n.vy;
            if (n.x < -20) n.x = W + 20;
            if (n.x > W+20) n.x = -20;
            if (n.y < -20) n.y = H + 20;
            if (n.y > H+20) n.y = -20;
        }
        
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
                const d2 = dx * dx + dy * dy;
                if (d2 < LINK_DIST2) {
                    const alpha = (1 - d2 / LINK_DIST2) * (isLight ? 0.18 : 0.32);
                    ctx.beginPath();
                    const avgR = (nodes[i].r + nodes[j].r) / 2;
                    ctx.moveTo(nodes[i].x - curPx * avgR, nodes[i].y - curPy * avgR);
                    ctx.lineTo(nodes[j].x - curPx * avgR, nodes[j].y - curPy * avgR);
                    ctx.strokeStyle = `rgba(78,201,232,${alpha})`;
                    ctx.lineWidth = 0.6; ctx.stroke();
                }
            }
        }
        
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            const col = COLORS[n.type];
            const drawX = n.x - curPx * n.r;
            const drawY = n.y - curPy * n.r;
            
            const glow = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, n.r * 4);
            glow.addColorStop(0, `rgba(${col},${isLight ? 0.45 : 0.85})`);
            glow.addColorStop(1, `rgba(${col},0)`);
            ctx.beginPath(); ctx.arc(drawX, drawY, n.r * 4, 0, Math.PI * 2);
            ctx.fillStyle = glow; ctx.fill();
            ctx.beginPath(); ctx.arc(drawX, drawY, n.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${col},${isLight ? 0.55 : 1})`; ctx.fill();
        }
        requestAnimationFrame(draw);
    }
    init(); draw();
})();

/* ===============================================================
   3D TILT EFFECT (GSAP)
=============================================================== */
function init3DTiltEffect(selector) {
    const el = document.querySelector(selector);
    if (!el || !window.gsap) return;
    
    el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xPct = (x / rect.width) - 0.5;
        const yPct = (y / rect.height) - 0.5;
        
        gsap.to(el, { 
            rotationY: xPct * 8, 
            rotationX: -yPct * 8, 
            transformPerspective: 1000, 
            duration: 0.4, 
            ease: "power2.out" 
        });
    });
    
    el.addEventListener('mouseleave', () => {
        gsap.to(el, { 
            rotationY: 0, 
            rotationX: 0, 
            duration: 0.8, 
            ease: "power3.out" 
        });
    });
}
document.addEventListener("DOMContentLoaded", () => {
    init3DTiltEffect('#text-mode');
    init3DTiltEffect('#file-mode');
});

/* ===============================================================
   HUD SCAN OVERLAY
=============================================================== */
function showHUD(msg = 'Processing...') {
    document.getElementById('hud-status-text').textContent = msg;
    document.getElementById('hud-overlay').classList.add('active');
}
function hideHUD() {
    document.getElementById('hud-overlay').classList.remove('active');
}

/* ===============================================================
   GSAP MICRO-ANIMATIONS
=============================================================== */
function animateBtn(el) {
    if (!window.gsap) return;
    gsap.fromTo(el, { scale: 0.95 }, { scale: 1, boxShadow: '0 0 22px rgba(0,243,255,0.35)', duration: 0.35, ease: 'back.out(2)' });
}
function animateOutputReveal(text, elId) {
    const el = document.getElementById(elId);
    if (!window.gsap || !text) { if (el) el.textContent = text; return; }
    el.textContent = '';
    const chars = text.split('');
    let i = 0;
    function tick() {
        if (i < chars.length) { el.textContent += chars[i++]; setTimeout(tick, Math.min(3, 1800 / chars.length)); }
    }
    gsap.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3 });
    tick();
}
function animatePanelShake() {
    if (!window.gsap) return;
    gsap.to('#main-panel', { x: [-4, 4, -3, 3, 0], duration: 0.35, ease: 'none' });
}
function animateModalOpen(id) {
    if (!window.gsap) return;
    gsap.fromTo(`#${id} .modal-box`, { scale: 0.94, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.5)' });
}

/* ===============================================================
   THEME TOGGLE
=============================================================== */
function toggleTheme() {
    const isCurrentlyLight = document.body.classList.contains('light-theme');
    const flash = document.getElementById('theme-flash');

    flash.className = '';
    void flash.offsetWidth; 
    flash.className = isCurrentlyLight ? 'flash-dark' : 'flash-light';

    setTimeout(() => {
        document.body.classList.toggle('light-theme');
        const nowLight = document.body.classList.contains('light-theme');
        document.getElementById('theme-btn').textContent = nowLight ? '🌙' : '☀️';
        localStorage.setItem('vault-theme', nowLight ? 'light' : 'dark');
    }, 80);
}
(function () {
    if (localStorage.getItem('vault-theme') === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('theme-btn').textContent = '🌙';
    }
})();

/* ===============================================================
   INLINE KEY REVEAL
=============================================================== */
function toggleReveal(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    const svg = btn.querySelector('svg');
    if (isPassword) {
        svg.innerHTML = `
            <path d="M17.94 11.94A10.07 10.07 0 0 1 19 10s-3.5-6-9-6a8.5 8.5 0 0 0-4.36 1.24"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 10 4c5.5 0 9 6 9 6a18.5 18.5 0 0 1-2.16 3.19"/>
            <path d="M6.26 6.26A10 10 0 0 0 1 10s3.5 6 9 6a9.26 9.26 0 0 0 4.74-1.36"/>
            <line x1="1" y1="1" x2="19" y2="19"/>`;
        btn.title = 'Hide key';
    } else {
        svg.innerHTML = `
            <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/>
            <circle cx="10" cy="10" r="2.5"/>`;
        btn.title = 'Show key';
    }
}

/* ===============================================================
   KEY DERIVATION DISPLAY
=============================================================== */
function updateKDF(password, panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    if (!password) {
        panel.classList.remove('visible');
        return;
    }
    panel.classList.add('visible');

    const freq = {};
    for (const c of password) freq[c] = (freq[c] || 0) + 1;
    let entropy = 0;
    const len = password.length;
    for (const c in freq) {
        const p = freq[c] / len;
        entropy -= p * Math.log2(p);
    }
    const rawBits = Math.min(Math.round(entropy * len * 1.5), 256);
    const displayBits = rawBits;
    const pct = Math.min(rawBits / 128 * 100, 100);

    const color = rawBits < 30 ? 'var(--danger)' : rawBits < 60 ? 'var(--warning)' : 'var(--success)';

    const barEl  = document.getElementById(panelId + '-bar');
    const bitsEl = document.getElementById(panelId + '-bits');

    if (barEl) {
        barEl.style.width = pct + '%';
        barEl.style.background = color;
        barEl.style.boxShadow = `0 0 6px ${color}`;
    }
    if (bitsEl) {
        bitsEl.textContent = displayBits + ' bits';
        bitsEl.style.color = color;
    }
}

/* ===============================================================
   STRENGTH METER
=============================================================== */
function checkStrength(pw, fillId, timeId) {
    const fill = document.getElementById(fillId);
    const label = document.getElementById(timeId);
    if (!pw) { fill.style.width = '0'; label.textContent = ''; return; }
    let score = 0;
    if (pw.length > 5) score++;
    if (pw.length > 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (pw.length > 16) score++;
    const pct   = [0, 20, 40, 60, 80, 90, 100][Math.min(score, 6)];
    const color = score < 2 ? '#ff3333' : score < 4 ? '#ffaa00' : '#39ff14';
    const time  = score < 2 ? 'Instantly' : score < 4 ? '~2 Days' : 'Centuries';
    fill.style.width = pct + '%';
    fill.style.background = color;
    fill.style.boxShadow = `0 0 6px ${color}`;
    label.style.color = color;
    label.textContent = 'Crack: ' + time;
}

/* ===============================================================
   OUTPUT CIPHERTEXT FORMATTER
=============================================================== */
function formatCipherOutput(hex) {
    const outputEl = document.getElementById('text-output');
    const metaEl   = document.getElementById('cipher-meta-row');

    if (!hex || hex.length < 10 || !/^[0-9a-f]+$/i.test(hex)) {
        outputEl.textContent = hex;
        outputEl.style.color = 'var(--text-primary)';
        metaEl.style.display = 'none';
        return;
    }

    const groups = hex.match(/.{1,8}/g) || [hex];
    const bytes  = hex.length / 2;
    const bits   = bytes * 8;

    outputEl.innerHTML = groups.map((g, i) =>
        `<span class="cipher-group" style="color:var(--neon-cyan)">${g}</span>${i < groups.length - 1 ? '<span class="cipher-space"></span>' : ''}`
    ).join('');

    metaEl.style.display = 'flex';
    metaEl.innerHTML = `
        <span style="color:var(--text-muted)">BYTES&nbsp;</span><span>${bytes.toLocaleString()}</span>
        <span style="color:var(--text-muted)">BITS&nbsp;</span><span>${bits.toLocaleString()}</span>
        <span style="color:var(--text-muted)">GROUPS&nbsp;</span><span>${groups.length}</span>
        <span style="color:var(--text-muted)">ALGO&nbsp;</span><span>AES-256-GCM + KMS</span>`;
}

function animateOutputRevealFormatted(text, elId) {
    if (elId !== 'text-output') { animateOutputReveal(text, elId); return; }
    const isHex = text && text.length > 10 && /^[0-9a-f]+$/i.test(text.trim());
    if (isHex) {
        formatCipherOutput(text.trim());
        const outputEl = document.getElementById('text-output');
        if (window.gsap) gsap.fromTo(outputEl, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3 });
    } else {
        formatCipherOutput(text); 
        animateOutputReveal(text, elId);
    }
}

/* ===============================================================
   TOTP — RFC 6238 IMPLEMENTATION
=============================================================== */
const TOTP_STATE = { secret: null, enabled: false, pendingCallback: null };
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes) {
    let bits = 0, val = 0, out = '';
    for (let i = 0; i < bytes.length; i++) {
        val = (val << 8) | bytes[i]; bits += 8;
        while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits > 0) out += B32[(val << (5 - bits)) & 31];
    return out;
}

function base32Decode(str) {
    str = str.toUpperCase().replace(/=+$/, '');
    const bytes = []; let bits = 0, val = 0;
    for (const c of str) {
        const idx = B32.indexOf(c);
        if (idx < 0) continue;
        val = (val << 5) | idx; bits += 5;
        if (bits >= 8) { bytes.push((val >>> (bits - 8)) & 255); bits -= 8; }
    }
    return new Uint8Array(bytes);
}

async function hmacSHA1(key, data) {
    const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}

async function generateTOTP(secret, timeStep) {
    const counter = Math.floor(Date.now() / 1000 / 30) + (timeStep || 0);
    const ctr = new Uint8Array(8); let c = counter;
    for (let i = 7; i >= 0; i--) { ctr[i] = c & 0xff; c >>= 8; }
    const hash = await hmacSHA1(base32Decode(secret), ctr);
    const off = hash[19] & 0xf;
    const code = ((hash[off] & 0x7f) << 24 | hash[off+1] << 16 | hash[off+2] << 8 | hash[off+3]) % 1000000;
    return code.toString().padStart(6, '0');
}

async function verifyTOTP(secret, input) {
    for (const step of [-1, 0, 1]) { if (await generateTOTP(secret, step) === input.trim()) return true; }
    return false;
}

function generateSecret() { return base32Encode(crypto.getRandomValues(new Uint8Array(20))); }
function getTOTPUri(secret) {
    return `otpauth://totp/HybridVault:vault%40hybrid?secret=${secret}&issuer=HybridVault&algorithm=SHA1&digits=6&period=30`;
}

(function loadTOTPState() {
    const saved = localStorage.getItem('vault-totp');
    if (saved) {
        try {
            const d = JSON.parse(saved);
            TOTP_STATE.secret = d.secret; TOTP_STATE.enabled = d.enabled;
            if (d.enabled) document.getElementById('totp-status-badge').style.display = '';
        } catch(e) {}
    }
})();

function saveTOTPState() {
    localStorage.setItem('vault-totp', JSON.stringify({ secret: TOTP_STATE.secret, enabled: TOTP_STATE.enabled }));
}

function open2FASetup() {
    if (!TOTP_STATE.secret) TOTP_STATE.secret = generateSecret();
    const secret = TOTP_STATE.secret;
    const uri = getTOTPUri(secret);
    document.getElementById('totp-qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(uri)}&bgcolor=ffffff&color=000000`;
    document.getElementById('totp-secret-display').textContent = secret;
    document.getElementById('totp-setup-status').textContent = '';
    document.getElementById('totp-verify-input').value = '';
    document.getElementById('totp-disable-btn').style.display = TOTP_STATE.enabled ? '' : 'none';
    document.getElementById('totpModal').classList.add('open');
    animateModalOpen('totpModal');
}

async function verifyTOTPSetup() {
    const code = document.getElementById('totp-verify-input').value.trim();
    const status = document.getElementById('totp-setup-status');
    if (code.length !== 6) { status.style.color = 'var(--danger)'; status.textContent = '⚠ Enter full 6-digit code'; return; }
    status.style.color = 'var(--text-muted)'; status.textContent = 'Verifying...';
    const ok = await verifyTOTP(TOTP_STATE.secret, code);
    if (ok) {
        TOTP_STATE.enabled = true; saveTOTPState();
        status.style.color = 'var(--success)'; status.textContent = '✓ 2FA enabled successfully';
        document.getElementById('totp-status-badge').style.display = '';
        document.getElementById('totp-disable-btn').style.display = '';
        if (window.gsap) gsap.fromTo('#totp-status-badge', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' });
    } else {
        status.style.color = 'var(--danger)'; status.textContent = '✕ Invalid code';
        animatePanelShake();
    }
}

function disableTOTP() {
    if (!confirm('Disable 2FA?')) return;
    TOTP_STATE.enabled = false; saveTOTPState();
    document.getElementById('totp-status-badge').style.display = 'none';
    document.getElementById('totp-setup-status').style.color = 'var(--warning)';
    document.getElementById('totp-setup-status').textContent = '2FA disabled';
    document.getElementById('totp-disable-btn').style.display = 'none';
}

let totpTimerInterval;
function startTOTPTimer() {
    const path = document.getElementById('totp-timer-path');
    if (!path) return;
    clearInterval(totpTimerInterval);
    totpTimerInterval = setInterval(() => {
        const rem = 30 - (Math.floor(Date.now() / 1000) % 30);
        path.style.strokeDashoffset = 157 * (1 - rem / 30);
        const pct = rem / 30;
        path.style.stroke = pct > 0.4 ? 'var(--neon-cyan)' : pct > 0.2 ? 'var(--warning)' : 'var(--danger)';
    }, 1000);
}

function requestTOTPVerify(callback) {
    TOTP_STATE.pendingCallback = callback;
    document.getElementById('totp-verify-code').value = '';
    document.getElementById('totp-verify-status').textContent = '';
    document.getElementById('totpVerifyModal').classList.add('open');
    animateModalOpen('totpVerifyModal');
    startTOTPTimer();
    setTimeout(() => document.getElementById('totp-verify-code').focus(), 300);
}

async function submitTOTPVerify() {
    const code = document.getElementById('totp-verify-code').value.trim();
    const status = document.getElementById('totp-verify-status');
    if (code.length !== 6) { status.textContent = 'Enter 6-digit code'; return; }
    const ok = await verifyTOTP(TOTP_STATE.secret, code);
    if (ok) {
        clearInterval(totpTimerInterval);
        document.getElementById('totpVerifyModal').classList.remove('open');
        if (TOTP_STATE.pendingCallback) { const cb = TOTP_STATE.pendingCallback; TOTP_STATE.pendingCallback = null; cb(); }
    } else {
        status.textContent = '✕ Invalid code — try again';
        document.getElementById('totp-verify-code').value = '';
        if (window.gsap) gsap.to('#totpVerifyModal .modal-box', { x: [-5,5,-4,4,0], duration: 0.3 });
    }
}

function cancelTOTPVerify() {
    clearInterval(totpTimerInterval); TOTP_STATE.pendingCallback = null;
    document.getElementById('totpVerifyModal').classList.remove('open');
}

/* ── KMS SIMULATOR LOGIC ── */
function createKMSOverlay() {
    const div = document.createElement('div');
    div.id = 'kms-sim-overlay';
    div.innerHTML = `
        <div class="kms-node"><div class="kms-icon">☁️</div><div class="kms-label">GCP KMS (asia-south1)</div></div>
        <div class="kms-track"><div class="kms-packet" id="kms-packet"></div></div>
        <div class="kms-node"><div class="kms-icon">💻</div><div class="kms-label" style="color:var(--text-muted)">Browser Memory</div></div>
        <div class="kms-status-text" id="kms-status-text">INITIALIZING...</div>
    `;
    document.body.appendChild(div);
}
createKMSOverlay();

function simulateKMSHandshake(mode) {
    return new Promise(resolve => {
        const overlay = document.getElementById('kms-sim-overlay');
        const packet = document.getElementById('kms-packet');
        const text = document.getElementById('kms-status-text');
        overlay.style.display = 'flex';
        
        if (window.gsap) {
            gsap.set(packet, { y: 0, background: 'var(--neon-pink)', boxShadow: '0 0 15px var(--neon-pink)' });
            
            const tl = gsap.timeline({ onComplete: () => {
                setTimeout(() => { overlay.style.display = 'none'; resolve(); }, 400);
            }});

            const action = mode === 'encrypt' ? 'ENCRYPT' : 'DECRYPT';
            
            tl.call(() => text.textContent = `1. REQUESTING DEK ${action} FROM MASTER KEY...`)
              .to(packet, { y: -120, duration: 0.8, ease: "power2.inOut" })
              .call(() => {
                  text.textContent = `2. GCP KMS: PERFORMING HARDWARE AES-256 OP...`;
                  packet.style.background = 'var(--neon-cyan)';
                  packet.style.boxShadow = '0 0 15px var(--neon-cyan)';
              })
              .to(packet, { scale: 1.5, duration: 0.2, yoyo: true, repeat: 1 })
              .call(() => text.textContent = `3. RETURNING PAYLOAD TO BROWSER...`)
              .to(packet, { y: 0, duration: 0.8, ease: "power2.inOut" })
              .call(() => text.textContent = `HANDSHAKE COMPLETE. SECURING DATA.`);
        } else {
            setTimeout(() => { overlay.style.display = 'none'; resolve(); }, 1500);
        }
    });
}

/* ===============================================================
   TEXT ENCRYPT / DECRYPT
=============================================================== */
async function processText(mode) {
    const msg = document.getElementById('message').value;
    const key = document.getElementById('text-key').value;
    if (!msg || !key) { alert('Input + key required'); return; }
    if (mode === 'decrypt' && TOTP_STATE.enabled) {
        requestTOTPVerify(() => _doProcessText(mode, msg, key));
        return;
    }
    _doProcessText(mode, msg, key);
}

async function _doProcessText(mode, msg, key) {
    hideHUD();
    showHUD(mode === 'encrypt' ? 'Encrypting...' : 'Decrypting...');
    const hudSafe = setTimeout(hideHUD, 12000);
    if (mode === 'encrypt') animateLockEncrypt('lock-text-encrypt');
    else                    animateLockDecrypt('lock-text-decrypt');

    const out = document.getElementById('text-output');
    const metaEl = document.getElementById('cipher-meta-row');
    out.textContent = mode === 'encrypt' ? 'Encrypting stream...' : 'Decrypting stream...';
    out.style.color = 'var(--text-muted)';
    if (metaEl) metaEl.style.display = 'none';
    document.getElementById('qr-container').style.display = 'none';
    const qrBtn = document.getElementById('qr-btn');
    if (qrBtn) qrBtn.classList.remove('active');

    try {
        await simulateKMSHandshake(mode);

        const res  = await fetch(BACKEND, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, key, mode })
        });
        clearTimeout(hudSafe); hideHUD();
        const data = await res.json();
        const result = data.result || data.error || 'Unknown error';
        const isError = !!data.error || !data.result;

        if (!isError) {
            animateOutputRevealFormatted(result, 'text-output');
            out.style.color = mode === 'encrypt' ? 'var(--neon-cyan)' : 'var(--text-primary)';
            saveToHistory(data.result, mode);
        } else {
            out.textContent = result;
            out.style.color = 'var(--danger)';
        }
        fetchLogs();
    } catch(e) {
        clearTimeout(hudSafe); hideHUD();
        out.textContent = 'Connection error: ' + e.message;
        out.style.color = 'var(--danger)';
    }
}

/* ===============================================================
   FILE ENCRYPT / DECRYPT
=============================================================== */
async function processFile(mode) {
    const fileInput = document.getElementById('file-input');
    const key = document.getElementById('file-key').value;
    if (fileInput.files.length === 0 || !key) { alert('File + key required'); return; }
    if (mode === 'decrypt' && TOTP_STATE.enabled) {
        requestTOTPVerify(() => _doProcessFile(mode, fileInput, key));
        return;
    }
    _doProcessFile(mode, fileInput, key);
}

async function _doProcessFile(mode, fileInput, key) {
    const out = document.getElementById('file-output');
    const format = document.getElementById('file-format').value;
    if (mode === 'encrypt') animateLockEncrypt('lock-file-encrypt');
    else                    animateLockDecrypt('lock-file-decrypt');
    showHUD(mode === 'encrypt' ? 'Encrypting file...' : 'Decrypting file...');
    out.textContent = 'Transferring...'; out.style.color = 'var(--text-muted)';

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('key', key);
    formData.append('mode', mode);
    formData.append('format', format);

    try {
        await simulateKMSHandshake(mode);

        const res = await fetch(BACKEND + 'file', { method: 'POST', body: formData });
        hideHUD();
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url;
            let fname = mode === 'encrypt' ? 'encrypted.enc' : 'decrypted_file';
            const disp = res.headers.get('Content-Disposition');
            if (disp && disp.includes('filename=')) fname = disp.split('filename=')[1].replace(/"/g,'');
            a.download = fname; document.body.appendChild(a); a.click(); a.remove();
            if (mode === 'encrypt') {
                out.innerHTML = '✓ Done — download starting.' +
                    ' <button onclick="generateFileShareLink(_lastEncBlob,_lastEncName)" ' +
                    'style="background:none;border:none;color:var(--neon-cyan);font-family:inherit;' +
                    'font-size:11px;letter-spacing:1px;cursor:pointer;text-decoration:underline;padding:0;margin-left:6px">&#x1F517; Get share link</button>';
                window._lastEncBlob = blob;
                window._lastEncName = fname;
            } else {
                out.textContent = '✓ Done — download starting';
            }
            out.style.color = 'var(--success)';
        } else {
            const err = await res.json();
            out.textContent = '✕ ' + (err.error || 'Failed'); out.style.color = 'var(--danger)';
            animatePanelShake();
        }
        fetchLogs();
    } catch(e) {
        hideHUD(); out.textContent = 'Connection error'; out.style.color = 'var(--danger)';
    }
}

/* ===============================================================
   ENCRYPTED CHAT — FIREBASE SERVERLESS IMPLEMENTATION
=============================================================== */
const firebaseConfig = {
    apiKey: "AIzaSyC5ycgz6oNSzXF7DI-AifMEJnHPFpGf1ho",
    authDomain: "cloud-project-486813.firebaseapp.com",
    databaseURL: "https://cloud-project-486813-default-rtdb.firebaseio.com",
    projectId: "cloud-project-486813",
    storageBucket: "cloud-project-486813.firebasestorage.app",
    messagingSenderId: "214173355980",
    appId: "1:214173355980:web:684bf3535ffdb8af611769"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const CHAT_STATE = {
    roomId:         null,
    action:         null,
    cryptoKey:      null,
    myId:           null,
    myNick:         'You',
    isReady:        false,
    typingTimeout:  null,
    typingPeers:    {},
    seenMsgIds:     new Set(),
    roomRef:        null,
    myPeerRef:      null
};

/* ── OPEN MODAL ───────────────────────────── */
function openEncryptedChat() {
    document.getElementById('chatModal').classList.add('open');
    animateModalOpen('chatModal');
    const saved = localStorage.getItem('vault-chat-nick');
    if (saved) document.getElementById('chat-nickname').value = saved;
}

/* ── JOIN/CREATE ROOM ─────────────────────── */
async function joinChatRoom() {
    try {
        if (!window.crypto || !window.crypto.subtle) {
            alert("⚠️ ENCRYPTION ENGINE OFFLINE: You must access this site via HTTPS to use cryptography. Please add 'https://' to your URL bar.");
            return;
        }

        const roomIdRaw = document.getElementById('chat-room-id').value.trim().toUpperCase();
        const password  = document.getElementById('chat-room-key').value;
        const nickInput = document.getElementById('chat-nickname').value.trim();
        const action    = document.querySelector('input[name="chat-action"]:checked').value;

        if (!roomIdRaw || !password) { alert('Room code and password required.'); return; }

        CHAT_STATE.action = action;
        CHAT_STATE.myNick = nickInput || ('Peer-' + Math.random().toString(36).slice(2,5).toUpperCase());
        localStorage.setItem('vault-chat-nick', CHAT_STATE.myNick);

        const enc         = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
        const salt        = enc.encode(roomIdRaw.padEnd(16,'0').slice(0,16));
        CHAT_STATE.cryptoKey = await crypto.subtle.deriveKey(
            { name:'PBKDF2', salt, iterations:100000, hash:'SHA-256' },
            keyMaterial,
            { name:'AES-GCM', length:256 },
            false, ['encrypt','decrypt']
        );

        CHAT_STATE.roomId      = roomIdRaw;
        CHAT_STATE.myId        = Date.now().toString(36) + Math.random().toString(36).slice(2,5);
        CHAT_STATE.seenMsgIds  = new Set();
        CHAT_STATE.typingPeers = {};

        _chatSetStatus('Connecting to Firebase Node...', false);
        _fbConnect();

    } catch (error) {
        alert("❌ CHAT CRASHED: " + error.message);
        console.error("Chat Init Error:", error);
    }
}

/* ── FIREBASE CONNECTION ─────────────────── */
function _fbConnect() {
    CHAT_STATE.roomRef = db.ref('vault_rooms/' + CHAT_STATE.roomId);
    CHAT_STATE.myPeerRef = CHAT_STATE.roomRef.child('peers/' + CHAT_STATE.myId);

    if (CHAT_STATE.action === 'create') {
        CHAT_STATE.roomRef.child('meta').once('value', snap => {
            if (snap.exists()) {
                alert(`⚠️ Room "${CHAT_STATE.roomId}" already exists. Please select 'Join Existing Room'.`);
                leaveChatRoom();
            } else {
                CHAT_STATE.roomRef.child('meta').set({ created: Date.now() });
                _finalizeJoin();
            }
        });
    } else {
        CHAT_STATE.roomRef.child('meta').once('value', snap => {
            if (!snap.exists()) {
                alert(`⚠️ Room "${CHAT_STATE.roomId}" does not exist. Please create it first.`);
                leaveChatRoom();
            } else {
                _finalizeJoin();
            }
        });
    }
}

function _finalizeJoin() {
    // Automatic DB cleanup when user closes tab
    CHAT_STATE.myPeerRef.onDisconnect().remove();
    CHAT_STATE.roomRef.child('typing/' + CHAT_STATE.myId).onDisconnect().remove();
    
    CHAT_STATE.myPeerRef.set({ nick: CHAT_STATE.myNick, joined: Date.now() });
    CHAT_STATE.isReady = true;

    // Listen for total peer count
    CHAT_STATE.roomRef.child('peers').on('value', snap => {
        const peers = snap.val() || {};
        _chatConnected(Object.keys(peers).length);
    });

    // --- NEW: Announce when a peer joins ---
    CHAT_STATE.roomRef.child('peers').on('child_added', snap => {
        const peer = snap.val();
        const peerId = snap.key;
        // Only announce OTHER people joining (your own join is handled separately)
        if (peerId !== CHAT_STATE.myId) {
            _renderSystemMsg(`${peer.nick || 'A peer'} joined the room`, 'join');
        }
    });

    // --- NEW: Announce when a peer leaves ---
    CHAT_STATE.roomRef.child('peers').on('child_removed', snap => {
        const peer = snap.val();
        const peerId = snap.key;
        if (peerId !== CHAT_STATE.myId) {
            _renderSystemMsg(`${peer.nick || 'A peer'} left the room`, 'leave');
            _clearTypingPeer(peerId);
        }
    });

    // Listen for messages
    CHAT_STATE.roomRef.child('messages').on('child_added', async snap => {
        const frame = snap.val();
        if (CHAT_STATE.seenMsgIds.has(frame.msgId)) return;
        CHAT_STATE.seenMsgIds.add(frame.msgId);
        
        const plaintext = await chatDecrypt(frame.cipher);
        if (plaintext !== null) {
            renderChatMessage(
                { id: frame.msgId, nick: frame.nick, peerId: frame.peerId, ts: frame.ts, cipher: frame.cipher },
                plaintext, false
            );
            // Send read receipt if not mine
            if (frame.peerId !== CHAT_STATE.myId) {
                CHAT_STATE.roomRef.child('messages/' + frame.msgId + '/reads/' + CHAT_STATE.myId).set(true);
            }
        } else {
            renderChatMessage(
                { id: frame.msgId, nick: frame.nick, ts: frame.ts, cipher: frame.cipher },
                '[unable to decrypt — wrong password?]', false, true
            );
        }
    });

    // Listen for message updates (Read Receipts & Reactions)
    CHAT_STATE.roomRef.child('messages').on('child_changed', snap => {
        const frame = snap.val();
        if (frame.peerId === CHAT_STATE.myId && frame.reads) {
            const statusEl = document.getElementById('status-' + frame.msgId);
            if (statusEl && statusEl.dataset.status !== 'read') {
                statusEl.textContent = '✓✓';
                statusEl.className = 'msg-status read';
                statusEl.dataset.status = 'read';
                statusEl.title = 'Read by peer';
            }
        }
        if (frame.reactions) {
            _renderReactionsFromFirebase(frame.msgId, frame.reactions);
        }
    });

    // Listen for typing
    CHAT_STATE.roomRef.child('typing').on('value', snap => {
        const typing = snap.val() || {};
        Object.keys(typing).forEach(pid => {
            if (pid === CHAT_STATE.myId) return;
            if (typing[pid].active) _showTypingPeer(pid, typing[pid].nick);
            else _clearTypingPeer(pid);
        });
    });
}

/* ── UI STATE HELPERS ─────────────────────── */
function _chatSetStatus(msg, connected) {
    const el = document.getElementById('chat-status-text');
    if (connected) {
        el.innerHTML = `<span class="status-dot" style="width:6px;height:6px"></span> Connected via Firebase`;
    } else {
        el.textContent = msg || 'Not connected';
    }
}

function _chatConnected(count) {
    document.getElementById('chat-room-display').textContent = CHAT_STATE.roomId;
    document.getElementById('chat-e2e-banner').style.display = 'flex';
    
    const el = document.getElementById('chat-status-text');
    el.innerHTML = `<span class="status-dot" style="width:6px;height:6px"></span> Connected via Firebase`;
    
    const nickBadge = document.getElementById('chat-my-nick');
    nickBadge.textContent = CHAT_STATE.myNick;
    nickBadge.style.display = '';
    document.getElementById('chat-msg-input').disabled = false;
    document.getElementById('chat-send-btn').disabled  = false;
    
    if (document.getElementById('chat-empty')) {
        document.getElementById('chat-window').innerHTML = '';
        if (CHAT_STATE.action === 'create') {
            _renderSystemMsg(`You created room ${CHAT_STATE.roomId} as ${CHAT_STATE.myNick}`);
        } else {
            _renderSystemMsg(`You joined as ${CHAT_STATE.myNick}`);
        }
    }
    
    const badge = document.getElementById('chat-peer-badge');
    if (badge) badge.textContent = count > 1 ? `${count} peers` : '1 peer (you)';
    
    setTimeout(() => document.getElementById('chat-msg-input').focus(), 100);
}

/* ── TYPING INDICATOR ─────────────────────── */
function onChatInput() {
    if (!CHAT_STATE.isReady) return;
    CHAT_STATE.roomRef.child('typing/' + CHAT_STATE.myId).set({ nick: CHAT_STATE.myNick, active: true });
    
    clearTimeout(CHAT_STATE.typingTimeout);
    CHAT_STATE.typingTimeout = setTimeout(() => {
        if (CHAT_STATE.roomRef) CHAT_STATE.roomRef.child('typing/' + CHAT_STATE.myId).set({ active: false });
    }, 2500);
}

function _showTypingPeer(peerId, nick) {
    if (CHAT_STATE.typingPeers[peerId]) clearTimeout(CHAT_STATE.typingPeers[peerId].timer);
    CHAT_STATE.typingPeers[peerId] = { nick, timer: setTimeout(() => _clearTypingPeer(peerId), 4000) };
    _refreshTypingRow();
}

function _clearTypingPeer(peerId) {
    if (CHAT_STATE.typingPeers[peerId]) {
        clearTimeout(CHAT_STATE.typingPeers[peerId].timer);
        delete CHAT_STATE.typingPeers[peerId];
    }
    _refreshTypingRow();
}

function _refreshTypingRow() {
    const row = document.getElementById('chat-typing-row');
    if (!row) return;
    const peers = Object.values(CHAT_STATE.typingPeers);
    if (!peers.length) { row.innerHTML = ''; return; }
    const names = peers.map(p => escapeHtml(p.nick || 'Peer')).join(', ');
    const verb  = peers.length === 1 ? 'is' : 'are';
    row.innerHTML = `<span style="color:var(--text-muted);font-size:11px">${names} ${verb} typing</span>
        <span class="typing-dots"><span></span><span></span><span></span></span>`;
}

/* ── CRYPTO HELPERS ───────────────────────── */
async function chatEncrypt(plaintext) {
    const iv  = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ct  = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, CHAT_STATE.cryptoKey, enc.encode(plaintext));
    const b64 = (arr) => btoa(String.fromCharCode(...new Uint8Array(arr)));
    return b64(iv) + ':' + b64(ct);
}

async function chatDecrypt(packed) {
    try {
        const [ivB64, ctB64] = packed.split(':');
        const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
        const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));
        const pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, CHAT_STATE.cryptoKey, ct);
        return new TextDecoder().decode(pt);
    } catch(e) { return null; }
}

/* ── SEND MESSAGE ─────────────────────────── */
async function sendChatMessage() {
    const input = document.getElementById('chat-msg-input');
    const text  = input.value.trim();
    if (!text || !CHAT_STATE.cryptoKey || !CHAT_STATE.isReady) return;
    input.value = '';

    clearTimeout(CHAT_STATE.typingTimeout);
    CHAT_STATE.roomRef.child('typing/' + CHAT_STATE.myId).set({ active: false });

    const cipherPacked = await chatEncrypt(text);
    const msgId        = Date.now().toString(36) + '-' + CHAT_STATE.myId;
    const ts           = Date.now();

    CHAT_STATE.seenMsgIds.add(msgId);
    renderChatMessage(
        { id: msgId, nick: CHAT_STATE.myNick, peerId: CHAT_STATE.myId, ts, cipher: cipherPacked },
        text, true, false, 'sending'
    );

    CHAT_STATE.roomRef.child('messages/' + msgId).set({
        msgId: msgId,
        cipher: cipherPacked,
        nick: CHAT_STATE.myNick,
        peerId: CHAT_STATE.myId,
        ts: ts
    }).then(() => {
        const statusEl = document.getElementById('status-' + msgId);
        if (statusEl && statusEl.dataset.status !== 'read') {
            statusEl.textContent = '✓';
            statusEl.className   = 'msg-status sent';
            statusEl.dataset.status = 'sent';
        }
    });
}

/* ── REACTIONS ─────────────────────────────── */
let _pickerMsgId = null;

function _openReactionPicker(msgId, anchorEl) {
    _pickerMsgId = msgId;
    const picker = document.getElementById('reaction-picker-popup');
    const rect   = anchorEl.getBoundingClientRect();
    picker.style.display = 'flex';
    picker.style.top  = (rect.top  + window.scrollY - 54) + 'px';
    picker.style.left = (rect.left + window.scrollX) + 'px';
    setTimeout(() => document.addEventListener('click', _closePicker, { once: true }), 50);
}

function _closePicker() {
    document.getElementById('reaction-picker-popup').style.display = 'none';
    _pickerMsgId = null;
}

function pickReaction(emoji) {
    if (!_pickerMsgId || !CHAT_STATE.isReady) { _closePicker(); return; }
    const msgId = _pickerMsgId;
    _closePicker();

    CHAT_STATE.roomRef.child(`messages/${msgId}/reactions/${CHAT_STATE.myId}_${emoji.codePointAt(0)}`).once('value', snap => {
        if (snap.exists()) {
            snap.ref.remove(); 
        } else {
            snap.ref.set({ emoji: emoji, nick: CHAT_STATE.myNick, peerId: CHAT_STATE.myId });
        }
    });
}

function _renderReactionsFromFirebase(msgId, reactionsObj) {
    const container = document.getElementById('reactions-' + msgId);
    if (!container) return;
    const counts = {};
    Object.values(reactionsObj).forEach(r => {
        if (!counts[r.emoji]) counts[r.emoji] = { count:0, isMine:false, nicks:[] };
        counts[r.emoji].count++;
        counts[r.emoji].nicks.push(r.nick || 'Peer');
        if (r.peerId === CHAT_STATE.myId) counts[r.emoji].isMine = true;
    });
    container.innerHTML = Object.entries(counts).map(([emoji, d]) =>
        `<span class="reaction-pill${d.isMine?' mine':''}" title="${d.nicks.join(', ')}">${emoji}${d.count>1?' '+d.count:''}</span>`
    ).join('');
}

/* ── RENDER HELPERS ───────────────────────── */
function renderChatMessage(msg, plaintext, isMine, isError=false, statusInit='') {
    const win = document.getElementById('chat-window');
    const div = document.createElement('div');
    div.className    = 'chat-msg ' + (isMine ? 'mine' : 'theirs');
    div.dataset.msgId = msg.id;

    const time       = new Date(msg.ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    const cipherPeek = msg.cipher ? msg.cipher.slice(0,28) + '…' : '';
    const senderName = escapeHtml(isMine ? 'You' : (msg.nick || 'Peer'));
    const statusHtml = isMine
        ? `<span class="msg-status ${statusInit||'sent'}" id="status-${msg.id}" data-status="${statusInit||'sent'}">${statusInit==='sending'?'…':'✓'}</span>`
        : '';
    const bubbleStyle = isError ? ' style="color:var(--danger)"' : '';

    div.innerHTML = `
        <div class="chat-bubble"${bubbleStyle}
             ondblclick="_openReactionPicker('${msg.id}', this)"
             title="Double-click to react">${escapeHtml(plaintext)}</div>
        <div class="chat-reactions" id="reactions-${msg.id}"></div>
        <div class="chat-meta">${senderName} · ${time}${statusHtml}</div>
        <div class="chat-cipher-peek" title="Ciphertext (AES-256-GCM)">&#x1F512; ${cipherPeek}</div>`;
    win.appendChild(div);
    win.scrollTop = win.scrollHeight;
}

function _renderSystemMsg(text, type='') {
    const win = document.getElementById('chat-window');
    if (!win) return;
    const div = document.createElement('div');
    div.className = 'chat-system-msg';
    div.innerHTML = `<span class="chat-system-pill ${type}">${escapeHtml(text)}</span>`;
    win.appendChild(div);
    win.scrollTop = win.scrollHeight;
}

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── NICKNAME CHANGE ──────────────────────── */
function promptNickChange() {
    const newNick = prompt('Enter new display name:', CHAT_STATE.myNick);
    if (!newNick || !newNick.trim()) return;
    const old = CHAT_STATE.myNick;
    CHAT_STATE.myNick = newNick.trim().slice(0,20);
    localStorage.setItem('vault-chat-nick', CHAT_STATE.myNick);
    document.getElementById('chat-my-nick').textContent = CHAT_STATE.myNick;
    _renderSystemMsg(`You renamed yourself: ${old} → ${CHAT_STATE.myNick}`);
    if (CHAT_STATE.isReady) CHAT_STATE.myPeerRef.update({ nick: CHAT_STATE.myNick });
}

/* ── LEAVE ROOM ───────────────────────────── */
function leaveChatRoom() {
    clearTimeout(CHAT_STATE.typingTimeout);
    if (CHAT_STATE.roomRef && CHAT_STATE.myId) {
        CHAT_STATE.myPeerRef.remove();
        CHAT_STATE.roomRef.child('typing/' + CHAT_STATE.myId).remove();
        CHAT_STATE.roomRef.off();
        CHAT_STATE.roomRef.child('peers').off();
        CHAT_STATE.roomRef.child('messages').off();
        CHAT_STATE.roomRef.child('typing').off();
    }
    
    CHAT_STATE.roomId = null;  
    CHAT_STATE.isReady    = false;
    CHAT_STATE.cryptoKey  = null;
    CHAT_STATE.seenMsgIds = new Set();
    CHAT_STATE.typingPeers = {};

    document.getElementById('chat-msg-input').disabled = true;
    document.getElementById('chat-send-btn').disabled  = true;
    document.getElementById('chat-e2e-banner').style.display = 'none';
    document.getElementById('chat-status-text').textContent  = 'Not connected';
    document.getElementById('chat-my-nick').style.display    = 'none';
    document.getElementById('chat-typing-row').innerHTML     = '';
    document.getElementById('chat-window').innerHTML =
        '<div class="chat-empty">Join a room to start chatting.<br><span style="font-size:10px;opacity:0.5">Messages are encrypted before leaving your browser.</span></div>';
    document.getElementById('chat-room-id').value  = '';
    document.getElementById('chat-room-key').value = '';
}

/* ── COPY ROOM DETAILS ───────────────────────────── */
function copyRoomDetails() {
    const pwd = document.getElementById('chat-room-key').value;
    const text = `🔒 Join my secure vault chat!\n\nRoom Code: ${CHAT_STATE.roomId}\nPassword: ${pwd}\n\nLink: ${window.location.origin}`;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => showToast('Room details copied!'));
    } else {
        legacyCopy(text, () => showToast('Room details copied!'));
    }
}


/* ===============================================================
   THREAT MAP
=============================================================== */
let threatMapData = [];
let threatAnimFrame = null;
let threatPings = [];
let radarAngle = 0;
let pingInterval;

const COUNTRY_COORDS = {
    'US':[-98,38],'CA':[-96,56],'MX':[-102,24],'BR':[-51,-10],'AR':[-65,-34],
    'GB':[-2,54],'FR':[2,46],'DE':[10,51],'IT':[12,42],'ES':[-4,40],
    'RU':[100,60],'CN':[104,35],'JP':[138,36],'KR':[128,37],'IN':[78,21],
    'AU':[134,-26],'ZA':[25,-29],'NG':[8,10],'EG':[30,26],'SA':[45,24],
    'PK':[70,30],'TH':[101,13],'SG':[104,1],'ID':[120,-5],'TR':[35,39],
    'UA':[32,49],'SE':[18,60],'NL':[5,52],'PL':[20,52],'BD':[90,24],
    'PH':[122,13],'VN':[108,14],'MY':[110,3],'Unknown':[20,30],
};

function mercatorXY(lon, lat, W, H) {
    lat = Math.max(-80, Math.min(85, lat));
    const x = (lon + 180) / 360 * W;
    const latRad = lat * Math.PI / 180;
    const mercN  = Math.log(Math.tan(Math.PI/4 + latRad/2));
    const y = H/2 - (mercN * H / (2 * Math.PI)) * 0.9 + H * 0.05;
    return { x, y };
}

function countryToXY(cc, W, H) {
    const coords = COUNTRY_COORDS[cc] || COUNTRY_COORDS['Unknown'];
    return mercatorXY(coords[0], coords[1], W, H);
}

let worldGeoJSON = null;
fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
    .then(res => res.json())
    .then(data => { worldGeoJSON = data; });

function drawWorldMap(ctx, W, H, dark) {
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W);
    grad.addColorStop(0, dark ? '#041424' : '#eaf0ff');
    grad.addColorStop(1, dark ? '#01050a' : '#cdd8f0');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = dark ? 'rgba(0,243,255,0.05)' : 'rgba(0,85,204,0.08)';
    ctx.lineWidth = 1; ctx.beginPath();
    for(let x=0; x<=W; x+=40) { ctx.moveTo(x,0); ctx.lineTo(x,H); }
    for(let y=0; y<=H; y+=40) { ctx.moveTo(0,y); ctx.lineTo(W,y); }
    ctx.stroke();
    if (!worldGeoJSON) { ctx.fillStyle = dark ? 'rgba(0,243,255,0.6)' : '#0055cc'; ctx.font = '12px "Share Tech Mono"'; ctx.fillText("CALIBRATING...", 20, 30); return; }
    ctx.fillStyle   = dark ? 'rgba(0,40,60,0.4)' : 'rgba(255,255,255,0.6)';
    ctx.strokeStyle = dark ? 'rgba(0,243,255,0.5)' : 'rgba(0,85,204,0.7)';
    ctx.lineWidth = 0.8; ctx.setLineDash([2,3]);
    if(dark) { ctx.shadowColor = '#00f3ff'; ctx.shadowBlur = 4; }
    worldGeoJSON.features.forEach(feature => {
        if (!feature.geometry) return;
        const type = feature.geometry.type, coords = feature.geometry.coordinates;
        ctx.beginPath();
        if (type === 'Polygon') coords.forEach(ring => drawRing(ring, ctx, W, H));
        else if (type === 'MultiPolygon') coords.forEach(poly => poly.forEach(ring => drawRing(ring, ctx, W, H)));
        ctx.fill(); ctx.stroke();
    });
    ctx.setLineDash([]); ctx.shadowBlur = 0;
}

function drawRing(ring, ctx, W, H) {
    ring.forEach((coord, i) => {
        const pos = mercatorXY(coord[0], coord[1], W, H);
        if (i === 0) ctx.moveTo(pos.x, pos.y); else ctx.lineTo(pos.x, pos.y);
    });
    ctx.closePath();
}

function spawnRandomPing(W, H) {
    if (!threatMapData.length || !document.getElementById('threatModal').classList.contains('open')) return;
    const log = threatMapData[Math.floor(Math.random() * threatMapData.length)];
    const rawCC = (log.location || '').split(',')[1]?.trim() || 'Unknown';
    const cc = COUNTRY_COORDS[rawCC] ? rawCC : 'Unknown';
    const isFail = log.status.includes('FAIL') || log.status.includes('ERROR');
    const isFile = log.action.includes('FILE');
    const isPanic = log.action.includes('PURGE') || log.action.includes('PANIC');
    const {x, y} = countryToXY(cc, W, H);
    const jx = (Math.random()-0.5)*20, jy = (Math.random()-0.5)*20;
    const color = isFail ? '#ff3333' : isPanic ? '#7b68ee' : isFile ? '#00f3ff' : '#39ff14';
    const startX = Math.random() > 0.5 ? -20 : W + 20;
    const startY = Math.random() * H;
    threatPings.push({ x: x+jx, y: y+jy, startX, startY, color, maxR: 20 + Math.random()*15, born: Date.now(), label: isFail ? 'THREAT BLOCKED' : 'DATA SECURED' });
}

function drawThreatMap(logs) {
    const canvas = document.getElementById('threat-map-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 860, H = 360;
    canvas.width = W; canvas.height = H;
    const dark = !document.body.classList.contains('light-theme');
    let totalFails = 0;
    const countries = new Set();
    logs.forEach(log => {
        const rawCC = (log.location || '').split(',')[1]?.trim() || 'Unknown';
        if(COUNTRY_COORDS[rawCC]) countries.add(rawCC);
        if(log.status.includes('FAIL') || log.status.includes('ERROR')) totalFails++;
    });
    document.getElementById('stat-total').textContent = logs.length;
    document.getElementById('stat-fail').textContent  = totalFails;
    document.getElementById('stat-countries').textContent = countries.size;
    const feed = document.getElementById('threat-feed');
    feed.innerHTML = '';
    logs.slice(0, 25).forEach(log => {
        const row = document.createElement('div');
        const isFail = log.status.includes('FAIL') || log.status.includes('ERROR');
        const isPanic = log.action.includes('PURGE');
        row.className = 'threat-event ' + (isFail ? 'fail' : isPanic ? 'warn' : 'ok');
        row.innerHTML = `<span>${formatLogTimestamp(log.time)}</span><span>${log.action}</span><span>${log.location||'Unknown'}</span><span>${log.status}</span>`;
        feed.appendChild(row);
    });
    threatPings = [];
    clearInterval(pingInterval);
    pingInterval = setInterval(() => spawnRandomPing(W, H), 700);
    if (threatAnimFrame) cancelAnimationFrame(threatAnimFrame);
    animatePings(ctx, W, H, dark);
}

function animatePings(ctx, W, H, dark) {
    if (!document.getElementById('threatModal').classList.contains('open')) return;
    drawWorldMap(ctx, W, H, dark);
    const now = Date.now();
    radarAngle += 0.015;
    ctx.save(); ctx.translate(W/2, H/2); ctx.rotate(radarAngle);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0, 0, W, 0, 0.4); ctx.lineTo(0,0);
    const radarGrad = ctx.createLinearGradient(0,0,W,0);
    radarGrad.addColorStop(0, dark ? 'rgba(0,243,255,0.15)' : 'rgba(0,85,204,0.1)');
    radarGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radarGrad; ctx.fill(); ctx.restore();
    threatPings.forEach(p => {
        const age = now - p.born, lifespan = 2500;
        if (age > lifespan) return;
        const t = age / lifespan, alpha = 1 - Math.pow(t, 2);
        if (t < 0.6) {
            const lineAlpha = 1 - (t / 0.6);
            ctx.beginPath(); ctx.moveTo(p.startX, p.startY);
            const cpX = (p.startX + p.x)/2, cpY = Math.min(p.startY, p.y) - 60;
            ctx.quadraticCurveTo(cpX, cpY, p.x, p.y);
            ctx.strokeStyle = p.color + Math.floor(lineAlpha * 150).toString(16).padStart(2,'0');
            ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
        }
        const r = t * p.maxR;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2,'0');
        ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
        ctx.fill(); ctx.shadowBlur = 0;
        if (t > 0.1 && t < 0.7) {
            ctx.fillStyle = p.color + Math.floor(alpha * 200).toString(16).padStart(2,'0');
            ctx.font = '10px "Share Tech Mono"';
            ctx.fillText(`[${p.label}]`, p.x + 8, p.y - 8);
        }
    });
    threatPings = threatPings.filter(p => (now - p.born) < 2500);
    threatAnimFrame = requestAnimationFrame(() => animatePings(ctx, W, H, dark));
}

async function openThreatMap() {
    document.getElementById('threatModal').classList.add('open');
    animateModalOpen('threatModal');
    setTimeout(refreshThreatMap, 100);
}

async function refreshThreatMap() {
    let logs = [];
    try {
        const res = await fetch(BACKEND + 'logs');
        if (res.ok) { const d = await res.json(); logs = d.logs || []; }
    } catch(e) {}
    if (!logs.length) {
        logs = [
            { time:'demo', ip:'demo', location:'New York, US', action:'TEXT ENCRYPT', status:'SUCCESS' },
            { time:'demo', ip:'demo', location:'London, GB',   action:'FILE ENCRYPT', status:'SUCCESS' },
            { time:'demo', ip:'demo', location:'Moscow, RU',   action:'TEXT DECRYPT', status:'FAIL: INVALID KEY' },
            { time:'demo', ip:'demo', location:'Mumbai, IN',   action:'TEXT ENCRYPT', status:'SUCCESS' },
            { time:'demo', ip:'demo', location:'Beijing, CN',  action:'TEXT DECRYPT', status:'FAIL: INVALID KEY' },
        ];
    }
    threatMapData = logs;
    drawThreatMap(logs);
}

function formatLogTimestamp(ts) {
    return ts || 'Unknown';
}

/* ===============================================================
   LOGS
=============================================================== */
async function fetchLogs() {
    try {
        const res = await fetch(BACKEND + 'logs?personal=true');
        const data = await res.json();
        const container = document.getElementById('log-container');
        if (!container) return;
        container.innerHTML = '';
        if (!data.logs.length) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">No logs yet.</div>';
            return;
        }
        data.logs.forEach(l => {
            const row = document.createElement('div'); row.className = 'log-entry';
            const statusClass = l.status.includes('FAIL') || l.status.includes('ERROR') ? 'status-fail'
                : l.status.includes('WIPE') ? 'status-panic'
                : l.status.includes('ALERT') ? 'status-warn' : 'status-ok';
            row.innerHTML = `<span style="color:var(--text-muted)">${formatLogTimestamp(l.time)}</span><span>${l.ip}</span><span>${l.location || 'Unknown'}</span><span>${l.device || 'Unknown'}</span><span>${l.action}</span><span class="${statusClass}">${l.status}</span>`;
            container.appendChild(row);
        });
    } catch(e) {}
}

function openLogs() {
    document.getElementById('logModal').classList.add('open');
    animateModalOpen('logModal');
    fetchLogs();
}

async function wipeScreen() {
    try { await fetch(BACKEND + 'panic', { method: 'POST' }); } catch(e) {}
    document.querySelectorAll('input[type="text"],input[type="password"],textarea').forEach(el => el.value = '');
    const out = document.getElementById('text-output');
    out.textContent = 'System wiped.';
    out.style.color = 'var(--text-muted)';
    document.getElementById('cipher-meta-row').style.display = 'none';
    document.getElementById('qr-container').style.display = 'none';
    const qrBtn = document.getElementById('qr-btn');
    if (qrBtn) qrBtn.classList.remove('active');
    if (window.gsap) gsap.to('.page-wrap', { opacity: 0, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.in' });
    setTimeout(() => alert('SECURE WIPE EXECUTED'), 300);
}

/* ===============================================================
   HISTORY
=============================================================== */
function getHistory() { try { return JSON.parse(localStorage.getItem('vault-history') || '[]'); } catch { return []; } }
function saveToHistory(result, mode) {
    const h = getHistory();
    h.unshift({ result, mode, time: new Date().toLocaleString() });
    if (h.length > 50) h.length = 50;
    localStorage.setItem('vault-history', JSON.stringify(h));
}
function renderHistory() {
    const c = document.getElementById('history-container');
    const h = getHistory();
    if (!h.length) { c.innerHTML = '<div style="padding:30px;text-align:center;color:var(--text-muted)">No history yet.</div>'; return; }
    c.innerHTML = '';
    h.forEach((entry, i) => {
        const row = document.createElement('div'); row.className = 'history-entry';
        row.innerHTML = `<span class="hist-result" title="${entry.result}">${entry.result}</span>
            <span style="color:var(--text-muted);font-size:11px">${entry.time}</span>
            <span><span class="badge badge-${entry.mode === 'encrypt' ? 'enc' : 'dec'}">${entry.mode}</span></span>
            <span><button class="btn btn-sm btn-primary" style="padding:4px 9px;font-size:10px" onclick="copyHistoryItem(${i})">📋 Copy</button></span>`;
        c.appendChild(row);
    });
}
function copyHistoryItem(i) {
    const h = getHistory(); if (!h[i]) return;
    navigator.clipboard.writeText(h[i].result).catch(() => {
        const ta = document.createElement('textarea'); ta.value = h[i].result;
        ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    });
}
function clearHistory() {
    if (!confirm('Clear all history?')) return;
    localStorage.removeItem('vault-history'); renderHistory();
}
function openHistory() {
    document.getElementById('historyModal').classList.add('open');
    animateModalOpen('historyModal');
    renderHistory();
}

/* ===============================================================
   COPY & QR
=============================================================== */
function copyText() {
    const el = document.getElementById('text-output');
    const txt = el.innerText.replace(/\s+/g, '').trim() || el.textContent.trim();
    const placeholders = ['Waiting for encryption...','Encrypting stream...','Decrypting stream...','System wiped.'];
    if (!txt || placeholders.includes(txt)) { alert('Nothing to copy yet.'); return; }
    const btn = document.getElementById('copy-btn');
    function markDone() {
        btn.textContent = '✓ Copied!';
        btn.style.borderColor = 'var(--success)'; btn.style.color = 'var(--success)';
        setTimeout(() => { btn.textContent = '📋 Copy'; btn.style.borderColor = ''; btn.style.color = ''; }, 2200);
    }
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(txt).then(markDone).catch(() => legacyCopy(txt, markDone));
    } else { legacyCopy(txt, markDone); }
}

function legacyCopy(txt, onSuccess) {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;opacity:0;z-index:-1';
    document.body.appendChild(ta);
    if (navigator.userAgent.match(/ipad|iphone/i)) {
        const range = document.createRange(); range.selectNodeContents(ta);
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        ta.setSelectionRange(0, 999999);
    } else { ta.select(); }
    try { const ok = document.execCommand('copy'); if (ok) onSuccess(); else alert('Copy failed.'); }
    catch(e) { alert('Copy failed.'); }
    document.body.removeChild(ta);
}

function toggleQRCode() {
    const qrBox = document.getElementById('qr-container');
    const qrBtn = document.getElementById('qr-btn');
    const isOpen = qrBox.style.display === 'block';
    if (isOpen) {
        qrBox.style.display = 'none';
        qrBtn.classList.toggle('active', false);
        return;
    }

    const el = document.getElementById('text-output');
    const txt = el.innerText.replace(/\s+/g,'').trim() || el.textContent.trim();
    const placeholders = ['Waiting for encryption...','Encrypting stream...','Decrypting stream...','System wiped.'];
    if (!txt || placeholders.includes(txt)) {
        qrBox.style.display = 'none';
        qrBtn.classList.toggle('active', false);
        alert('Encrypt something first.');
        return;
    }

    const render = document.getElementById('qr-render');
    render.innerHTML = '';
    qrBox.style.display = 'block';
    qrBtn.classList.toggle('active', true);
    if (window.QRCode) {
        new QRCode(render, { text: txt, width: 180, height: 180, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
    } else {
        render.innerHTML = '<div style="width:180px;height:180px;display:flex;align-items:center;justify-content:center;color:#666;font-size:11px">QR library not loaded</div>';
    }
}

/* ===============================================================
   PDF REPORT
=============================================================== */
async function downloadReport() {
    const { jsPDF } = window.jspdf; const doc = new jsPDF();
    doc.text("FORENSIC INCIDENT REPORT", 14, 20);
    doc.setFontSize(10); doc.text("Generated: " + new Date().toLocaleString(), 14, 30);
    try {
        const res = await fetch(BACKEND + 'logs'); const data = await res.json();
        const rows = data.logs.map(l => [
            l.time, l.ip, l.location || 'Unknown',
            (l.device||'Unknown').replace(/[^\x00-\x7F]/g,'').trim(),
            (l.action||'').replace(/[^\x00-\x7F]/g,'').trim(), l.status
        ]);
        doc.autoTable({ head:[['Time','IP','Location','Device','Action','Status']], body: rows, startY: 40, theme:'grid', styles:{fontSize:7} });
        doc.save('Forensic_Report.pdf');
    } catch(e) { alert('Error: ' + e); }
}

/* ===============================================================
   MODAL HELPERS
=============================================================== */
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    if (id === 'threatModal' && threatAnimFrame) { cancelAnimationFrame(threatAnimFrame); threatAnimFrame = null; }
    if (id === 'chatModal') {
        clearTimeout(CHAT_STATE.typingTimeout);
        if (CHAT_STATE.roomRef && CHAT_STATE.myId) {
            CHAT_STATE.roomRef.child('typing/' + CHAT_STATE.myId).set({ active: false });
        }
    }
}
window.addEventListener('click', e => {
    ['logModal','historyModal','threatModal','totpModal','totpVerifyModal','chatModal'].forEach(id => {
        if (e.target.id === id) closeModal(id);
    });
});

/* ===============================================================
   DROP ZONE
=============================================================== */
(function() {
    const zone = document.getElementById('drop-zone');
    ['dragenter','dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('drag-over'); }));
    ['dragleave','drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('drag-over'); }));
    zone.addEventListener('drop', e => {
        const f = e.dataTransfer.files;
        if (f.length) { document.getElementById('file-input').files = f; showFile(f[0].name); }
    });
})();
function handleFileSelect(input) { if (input.files.length) showFile(input.files[0].name); }
function showFile(name) { document.getElementById('drop-zone-file').textContent = '✓ ' + name; }

/* ===============================================================
   NEW DIGITAL LOCKPICK MATRIX (Brute Force Sim)
=============================================================== */
let bruteIv = null, bruteRunning = false;

function startBruteForce() {
    const pw = document.getElementById('text-key').value;
    if (!pw) return alert('Enter a password first');
    
    if (bruteRunning) closeBrute();
    bruteRunning = true;
    
    const overlay = document.getElementById('brute-overlay');
    const consoleDiv = document.getElementById('brute-console');
    const resultBox = document.getElementById('brute-result-box');
    const iterSpan = document.getElementById('brute-iter');

    overlay.style.display = 'flex'; 
    consoleDiv.innerHTML = '';
    resultBox.style.display = 'none';
    resultBox.innerHTML = '';

    const hasUpper = /[A-Z]/.test(pw), hasDigit = /[0-9]/.test(pw), hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const isWeak = pw.length < 8 || (!hasUpper && !hasDigit) || (!hasDigit && !hasSpecial);
    
    const stopAt = isWeak ? 80 : 200; 
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

    let c = 0;
    let lockedCount = 0;

    bruteIv = setInterval(() => {
        if (!bruteRunning) { clearInterval(bruteIv); bruteIv = null; return; }

        if (isWeak && c > 10 && c % 8 === 0 && lockedCount < pw.length) lockedCount++;
        if (!isWeak && c > 10 && c % 15 === 0 && lockedCount < Math.floor(pw.length / 2)) lockedCount++; 

        let attemptStr = '';
        for (let i = 0; i < pw.length; i++) {
            if (i < lockedCount) attemptStr += `<span class="b-locked">${pw[i]}</span>`; 
            else attemptStr += chars.charAt(Math.floor(Math.random() * chars.length)); 
        }

        const hexAddr = "0x" + Math.random().toString(16).substr(2, 4).toUpperCase();
        const attemptId = "#" + String(c).padStart(4, '0');

        const isFinalSuccess = isWeak && lockedCount === pw.length;
        const resStatus = isFinalSuccess ? "<span style='color:var(--success)'>MATCH</span>" : "<span class='b-fail'>FAIL</span>";

        const line = document.createElement('div');
        line.className = 'brute-line';
        line.innerHTML = `<span>${attemptId}</span><span>${hexAddr}</span><span>${resStatus}</span><span class="b-matrix">[ ${attemptStr} ]</span>`;
        consoleDiv.appendChild(line);

        while (consoleDiv.children.length > 50) consoleDiv.removeChild(consoleDiv.firstChild);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;

        iterSpan.textContent = (c * 210000).toLocaleString(); 
        c++;

        if (isFinalSuccess || (!isWeak && c >= stopAt)) {
            clearInterval(bruteIv); 
            bruteIv = null; 
            bruteRunning = false;
            
            resultBox.style.display = 'block';
            if (isWeak) {
                resultBox.innerHTML = `<div class="crack-success-msg">⚠️ PASSWORD COMPROMISED ⚠️<br><span style="font-size:16px;margin-top:8px;display:block">KEY ISOLATED: <strong>${pw}</strong></span><span style="font-size:14px;display:block;margin-top:6px;">TIME: ${(c * 0.04).toFixed(2)}s</span></div>`;
                resultBox.style.background = 'rgba(57,255,20,0.1)';
                resultBox.style.borderTopColor = 'var(--success)';
            } else {
                resultBox.innerHTML = `<div class="crack-fail-msg">🛡️ BRUTE FORCE TERMINATED 🛡️<br><span style="font-size:14px;margin-top:8px;display:block;color:var(--text-muted);">KMS THROTTLE DETECTED / ENTROPY SECURE</span><span style="font-size:12px;opacity:0.7;display:block;margin-top:4px">EST. CRACK TIME: 4,000,000 YEARS</span></div>`;
                resultBox.style.background = 'rgba(0,243,255,0.05)';
                resultBox.style.borderTopColor = 'var(--neon-cyan)';
            }
        }
    }, 40); 
}

function closeBrute() {
    clearInterval(bruteIv); bruteIv = null; bruteRunning = false;
    document.getElementById('brute-overlay').style.display = 'none';
    document.getElementById('brute-console').innerHTML = '';
    document.getElementById('brute-result-box').innerHTML = '';
    document.getElementById('brute-result-box').style.display = 'none';
}


/* ===============================================================
   BOOT SEQUENCE
=============================================================== */
(function runBoot() {
    if (!window.gsap) { document.getElementById('boot-overlay').classList.add('done'); return; }
    const overlay  = document.getElementById('boot-overlay');
    const logo     = document.getElementById('boot-logo');
    const lines    = [0,1,2,3,4,5].map(i => document.getElementById('bl'+i));
    const barWrap  = document.getElementById('boot-bar-wrap');
    const barFill  = document.getElementById('boot-bar-fill');
    const barPct   = document.getElementById('boot-pct');
    const pageWrap = document.querySelector('.page-wrap');
    gsap.set(pageWrap, { opacity: 0 });
    const tl = gsap.timeline({ onComplete: finishBoot });
    tl.to(logo, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    lines.forEach((line, i) => { tl.to(line, { opacity: 1, duration: 0.15, ease: 'none' }, `+=${i === 0 ? 0.1 : 0.22}`); });
    tl.to(barWrap, { opacity: 1, duration: 0.2 }, '+=0.1');
    tl.to({}, { duration: 0.8, onUpdate: function() {
        const pct = Math.round(this.progress() * 100);
        barFill.style.width = pct + '%'; barPct.textContent = pct + '%';
    }});
    tl.to(overlay, { opacity: 0, duration: 0.4, delay: 0.15, ease: 'power2.in' });
    function finishBoot() {
        overlay.classList.add('done');
        gsap.fromTo(pageWrap, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', clearProps: 'all' });
        gsap.from('.glitch-title',  { opacity: 0, y: -12, duration: 0.5, ease: 'power3.out', clearProps: 'all' });
        gsap.from('.subtitle',      { opacity: 0, duration: 0.4, delay: 0.15, clearProps: 'all' });
        gsap.from('.panel',         { opacity: 0, y: 20, duration: 0.5, delay: 0.2, ease: 'power2.out', clearProps: 'all' });
        gsap.from('.header-controls .icon-btn', { opacity: 0, scale: 0.7, stagger: 0.07, duration: 0.35, delay: 0.25, ease: 'back.out(2)', clearProps: 'all' });
        gsap.fromTo('.security-bar', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.5, ease: 'power2.out', clearProps: 'all' });
    }
})();

/* ===============================================================
   ANIMATED LOCK ICON HELPERS
=============================================================== */
function animateLockEncrypt(lockId) {
    const lock = document.getElementById(lockId);
    if (!lock) return;
    lock.classList.remove('lock-unlocked', 'lock-spinning');
    lock.classList.add('lock-spinning');
    setTimeout(() => lock.classList.remove('lock-spinning'), 500);
}
function animateLockDecrypt(lockId) {
    const lock = document.getElementById(lockId);
    if (!lock) return;
    lock.classList.remove('lock-unlocked');
    setTimeout(() => lock.classList.add('lock-unlocked'), 300);
}

setInterval(fetchLogs, 5000);

/* ===============================================================
   AUTO-LOCK ON INACTIVITY
=============================================================== */
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;
let lockTimer = null, lockDeadline = null, _lockEnabled = false, _lockHash = null;

async function hashKey(key) {
    const enc = new TextEncoder().encode(key);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function enableAutoLock(pin) {
    if (!pin || pin.length < 4) return false;
    _lockHash = await hashKey(pin); _lockEnabled = true;
    resetLockTimer(); return true;
}

function disableAutoLock() {
    _lockEnabled = false; _lockHash = null;
    clearTimeout(lockTimer); lockDeadline = null;
    document.getElementById('lock-overlay').classList.remove('active');
    showToast('Auto-lock disabled');
}

function resetLockTimer() {
    if (!_lockEnabled) return;
    clearTimeout(lockTimer); lockDeadline = Date.now() + LOCK_TIMEOUT_MS;
    lockTimer = setTimeout(triggerLock, LOCK_TIMEOUT_MS);
}

function triggerLock() {
    if (!_lockEnabled) return;
    document.getElementById('lock-overlay').classList.add('active');
    document.getElementById('lock-password-input').value = '';
    document.getElementById('lock-error').textContent = '';
    document.getElementById('lock-timer-display').textContent = 'Locked at ' + new Date().toLocaleTimeString();
    setTimeout(() => document.getElementById('lock-password-input').focus(), 100);
}

async function attemptUnlock() {
    const input = document.getElementById('lock-password-input').value;
    const errEl = document.getElementById('lock-error');
    if (!input) { errEl.textContent = 'Enter your lock PIN.'; return; }
    const inputHash = await hashKey(input);
    if (inputHash !== _lockHash) {
        errEl.textContent = '✕ Wrong PIN — try again.';
        if (window.gsap) gsap.to('.lock-input-wrap', { x: [-6,6,-5,5,0], duration: 0.3 });
        return;
    }
    document.getElementById('lock-overlay').classList.remove('active');
    errEl.textContent = ''; resetLockTimer();
}

['click','keydown','mousemove','touchstart'].forEach(evt => {
    document.addEventListener(evt, () => { if (_lockEnabled && lockDeadline) resetLockTimer(); }, { passive: true });
});

function openLockSettings() {
    document.getElementById('lockSettingsModal').classList.add('open');
    animateModalOpen('lockSettingsModal');
    const statusEl = document.getElementById('lock-current-status');
    statusEl.textContent = _lockEnabled ? 'Auto-lock is ON' : 'Auto-lock is OFF';
    statusEl.style.color = _lockEnabled ? 'var(--success)' : 'var(--text-muted)';
    document.getElementById('lock-pin-input').value = '';
    document.getElementById('lock-pin-confirm').value = '';
    document.getElementById('lock-setup-error').textContent = '';

    // Show/hide disable section based on lock state
    const disableSection = document.getElementById('lock-disable-section');
    const disableBtn     = document.getElementById('lock-disable-btn');
    const pinLabel       = document.getElementById('lock-pin-label');
    if (_lockEnabled) {
        disableSection.style.display = 'block';
        disableBtn.style.display     = '';
        pinLabel.textContent         = 'Set New PIN (replaces current)';
        document.getElementById('lock-current-pin').value = '';
    } else {
        disableSection.style.display = 'none';
        disableBtn.style.display     = 'none';
        pinLabel.textContent         = 'New Lock PIN (min 4 characters)';
    }
}

async function saveLockSettings() {
    const pin     = document.getElementById('lock-pin-input').value;
    const confirm = document.getElementById('lock-pin-confirm').value;
    const errEl   = document.getElementById('lock-setup-error');
    if (!pin) { errEl.textContent = 'Enter a PIN to enable, or click Disable Lock.'; return; }
    if (pin.length < 4) { errEl.textContent = 'PIN must be at least 4 characters.'; return; }
    if (pin !== confirm) { errEl.textContent = '✕ PINs do not match.'; return; }
    const ok = await enableAutoLock(pin);
    if (ok) { closeModal('lockSettingsModal'); showToast('Auto-lock enabled — vault locks after 5 min inactivity'); }
}

async function confirmDisableAutoLock() {
    const errEl  = document.getElementById('lock-setup-error');
    const pinVal = document.getElementById('lock-current-pin').value;
    if (!pinVal) {
        errEl.textContent = '✕ Enter your current PIN in the red field to disable.';
        return;
    }
    const inputHash = await hashKey(pinVal);
    if (inputHash !== _lockHash) {
        errEl.textContent = '✕ Wrong PIN — cannot disable lock.';
        document.getElementById('lock-current-pin').value = '';
        if (window.gsap) gsap.to('#lockSettingsModal .modal-box', { x: [-5,5,-4,4,0], duration: 0.3 });
        return;
    }
    disableAutoLock();
    closeModal('lockSettingsModal');
}


/* ===============================================================
   TOAST NOTIFICATION
=============================================================== */
function showToast(msg, duration = 3000) {
    let toast = document.getElementById('vault-toast');
    if (!toast) {
        toast = document.createElement('div'); toast.id = 'vault-toast';
        toast.style.cssText = ['position:fixed','bottom:24px','left:50%','transform:translateX(-50%) translateY(20px)',
            'background:rgba(8,14,26,0.95)','border:1px solid rgba(78,201,232,0.3)',
            'color:#4ec9e8','font-family:"Share Tech Mono",monospace','font-size:12px',
            'letter-spacing:1.5px','padding:10px 20px','border-radius:4px',
            'z-index:9999','opacity:0','transition:all 0.3s ease',
            'pointer-events:none','backdrop-filter:blur(10px)',
            'box-shadow:0 0 20px rgba(78,201,232,0.1)'].join(';');
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; });
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(10px)'; }, duration);
}

/* ===============================================================
   TAB SWITCHING (Now uses smooth GSAP unfolding)
=============================================================== */
function switchTab(mode, el) {
    if (!window.gsap) {
        document.querySelectorAll('.mode-content').forEach(e => e.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(e => e.classList.remove('active'));
        document.getElementById(mode + '-mode').classList.add('active');
        el.classList.add('active');
        return;
    }

    const oldTab = document.querySelector('.mode-content.active');
    if (oldTab && oldTab.id !== mode + '-mode') {
        gsap.to(oldTab, { 
            opacity: 0, 
            y: 10, 
            duration: 0.2, 
            onComplete: () => {
                oldTab.classList.remove('active');
                document.querySelectorAll('.tab').forEach(e => e.classList.remove('active'));
                el.classList.add('active');
                
                const newTab = document.getElementById(mode + '-mode');
                newTab.classList.add('active');
                gsap.fromTo(newTab, 
                    { opacity: 0, y: -10, scale: 0.98 }, 
                    { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out' }
                );
            }
        });
    }
}

/* ===============================================================
   STATS DASHBOARD
=============================================================== */
async function renderStats() {
    const container = document.getElementById('stats-content');
    container.innerHTML = '<div class="stats-empty">Loading stats...</div>';
    let logs = [];
    try {
        const res = await fetch(BACKEND + 'logs');
        if (res.ok) { const d = await res.json(); logs = d.logs || []; }
    } catch(e) {}
    const history = getHistory();
    if (!logs.length && !history.length) {
        container.innerHTML = '<div class="stats-empty">No activity yet.<br>Encrypt something to see stats appear here.</div>';
        return;
    }
    const total = logs.length;
    const encrypts = logs.filter(l => l.action && l.action.includes('ENCRYPT')).length;
    const decrypts = logs.filter(l => l.action && l.action.includes('DECRYPT')).length;
    const failures = logs.filter(l => l.status && (l.status.includes('FAIL') || l.status.includes('ERROR'))).length;
    const fileOps  = logs.filter(l => l.action && l.action.includes('FILE')).length;
    const successRate = total ? Math.round(((total - failures) / total) * 100) : 0;
    const hourBuckets = new Array(24).fill(0);
    logs.forEach(l => { if (!l.time) return; const m = l.time.match(/(\d{2}):/); if (m) hourBuckets[parseInt(m[1])]++; });
    const maxHour = Math.max(...hourBuckets, 1);
    const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets));
    const actionCounts = {};
    logs.forEach(l => { if (!l.action) return; const key = l.action.replace(/\(.*?\)/g,'').trim(); actionCounts[key] = (actionCounts[key]||0)+1; });
    const topActions = Object.entries(actionCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const maxAction = topActions[0]?.[1] || 1;
    const actionColors = ['#4ec9e8','#7b68ee','#3de8a0','#ffaa00','#ff3333'];
    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card cyan"><div class="stat-num" id="sn-total">0</div><div class="stat-label">Total Ops</div></div>
            <div class="stat-card green"><div class="stat-num" id="sn-enc">0</div><div class="stat-label">Encryptions</div></div>
            <div class="stat-card purple"><div class="stat-num" id="sn-dec">0</div><div class="stat-label">Decryptions</div></div>
            <div class="stat-card teal"><div class="stat-num" id="sn-rate">0%</div><div class="stat-label">Success Rate</div></div>
            <div class="stat-card amber"><div class="stat-num" id="sn-file">0</div><div class="stat-label">File Ops</div></div>
            <div class="stat-card red"><div class="stat-num" id="sn-fail">0</div><div class="stat-label">Failed Attempts</div></div>
        </div>
        <div class="stats-chart-wrap">
            <div class="stats-chart-title">Activity by Hour (last 50 ops)</div>
            <div class="stats-activity-grid" id="activity-grid"></div>
            <div class="activity-hours">${Array.from({length:24},(_,i)=>`<div class="activity-hour-label">${i%6===0?i:''}</div>`).join('')}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:6px;letter-spacing:1px">Peak hour: <span style="color:var(--neon-cyan)">${peakHour}:00–${peakHour+1}:00</span></div>
        </div>
        <div class="stats-chart-wrap">
            <div class="stats-chart-title">Operations Breakdown</div>
            <div class="stats-bar-chart">
                ${topActions.map(([action,count],i)=>`
                    <div class="stats-bar-row">
                        <div class="stats-bar-label">${action.length>12?action.slice(0,12)+'…':action}</div>
                        <div class="stats-bar-track"><div class="stats-bar-fill" style="width:0%;background:${actionColors[i]};box-shadow:0 0 6px ${actionColors[i]}40" data-target="${Math.round(count/maxAction*100)}"></div></div>
                        <div class="stats-bar-val">${count}</div>
                    </div>`).join('')}
            </div>
        </div>`;
    const targets = { total, encrypts, decrypts, successRate, fileOps, failures };
    const els = { total: document.getElementById('sn-total'), encrypts: document.getElementById('sn-enc'), decrypts: document.getElementById('sn-dec'), successRate: document.getElementById('sn-rate'), fileOps: document.getElementById('sn-file'), failures: document.getElementById('sn-fail') };
    const duration = 800, start = performance.now();
    function countUp(ts) {
        const p = Math.min((ts - start) / duration, 1), ease = 1 - Math.pow(1-p, 3);
        if (els.total) els.total.textContent = Math.round(targets.total * ease);
        if (els.encrypts) els.encrypts.textContent = Math.round(targets.encrypts * ease);
        if (els.decrypts) els.decrypts.textContent = Math.round(targets.decrypts * ease);
        if (els.successRate) els.successRate.textContent = Math.round(targets.successRate * ease) + '%';
        if (els.fileOps) els.fileOps.textContent = Math.round(targets.fileOps * ease);
        if (els.failures) els.failures.textContent = Math.round(targets.failures * ease);
        if (p < 1) requestAnimationFrame(countUp);
    }
    requestAnimationFrame(countUp);
    const grid = document.getElementById('activity-grid');
    if (grid) hourBuckets.forEach(count => {
        const cell = document.createElement('div');
        cell.className = 'activity-cell' + (count===0?'':count<maxHour*0.25?' l1':count<maxHour*0.5?' l2':count<maxHour*0.75?' l3':' l4');
        grid.appendChild(cell);
    });
    setTimeout(() => { document.querySelectorAll('.stats-bar-fill').forEach(bar => { bar.style.width = bar.dataset.target + '%'; }); }, 100);
}

function openStatsPanel() {
    document.querySelectorAll('.mode-content').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(e => e.classList.remove('active'));
    document.getElementById('stats-mode').classList.add('active');
    if (window.gsap) gsap.fromTo('#stats-mode', { opacity:0, y:10 }, { opacity:1, y:0, duration:0.3, ease:'power2.out' });
    renderStats();
    document.getElementById('main-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ===============================================================
   BATCH FILE ENCRYPTION
=============================================================== */
let batchFiles = [], batchMode = 'encrypt', batchZipFile = null;

function switchFileSub(mode) {
    document.querySelectorAll('.file-sub-content').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.file-sub-tab').forEach(e => e.classList.remove('active'));
    document.getElementById('file-' + mode).classList.add('active');
    document.getElementById('fsub-' + mode).classList.add('active');
    if (mode === 'batch') initBatchDropZone();
}

function initBatchDropZone() {
    const zone = document.getElementById('batch-drop-zone');
    if (!zone || zone._dropInit) return;
    zone._dropInit = true;
    ['dragenter','dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('drag-over'); }));
    ['dragleave','drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('drag-over'); }));
    zone.addEventListener('drop', e => {
        const files = Array.from(e.dataTransfer.files);
        if (batchMode === 'decrypt') handleZipSelect(files); else handleBatchFiles(files);
    });
}

function setBatchMode(mode) {
    batchMode = mode; batchFiles = []; batchZipFile = null;
    const encBtn = document.getElementById('bmode-enc'), decBtn = document.getElementById('bmode-dec');
    const dzIcon = document.getElementById('batch-dz-icon'), dzText = document.getElementById('batch-dz-text');
    const fileInp = document.getElementById('batch-file-input');
    const keyLbl  = document.getElementById('batch-key-label');
    const actBtn  = document.getElementById('batch-action-btn');
    const list = document.getElementById('batch-file-list');
    const summary = document.getElementById('batch-summary');
    const prog = document.getElementById('batch-progress');
    const fill = document.getElementById('batch-progress-fill');
    list.innerHTML = ''; list.style.display = 'none';
    summary.textContent = ''; summary.style.color = '';
    prog.style.display = 'none'; fill.style.width = '0%';
    if (mode === 'encrypt') {
        encBtn.classList.add('active'); encBtn.classList.remove('decrypt-active');
        decBtn.classList.remove('active', 'decrypt-active');
        dzIcon.textContent = '📁'; dzText.innerHTML = 'Drop multiple files here or <strong>click to browse</strong>';
        fileInp.removeAttribute('accept'); fileInp.multiple = true;
        keyLbl.textContent = 'Encryption Key (applied to all files)';
        actBtn.innerHTML = '🔒 Encrypt All &amp; Download ZIP';
        actBtn.onclick = runBatchEncrypt; actBtn.className = 'btn btn-primary';
    } else {
        decBtn.classList.add('active', 'decrypt-active'); encBtn.classList.remove('active');
        dzIcon.textContent = '📦'; dzText.innerHTML = 'Drop your <strong>vault-encrypted-*.zip</strong> here or <strong>click to browse</strong>';
        fileInp.setAttribute('accept', '.zip'); fileInp.multiple = false;
        keyLbl.textContent = 'Decryption Key (used for all files in the ZIP)';
        actBtn.innerHTML = '🔓 Decrypt ZIP &amp; Download Files';
        actBtn.onclick = runBatchDecrypt; actBtn.className = 'btn btn-secondary';
    }
}

function handleBatchSelect(input) {
    const files = Array.from(input.files);
    if (batchMode === 'decrypt') handleZipSelect(files); else handleBatchFiles(files);
}

function handleBatchFiles(files) {
    const valid = files.filter(f => !f.name.endsWith('.zip'));
    if (valid.length !== files.length) showToast('ZIP files skipped — use Decrypt mode to process a ZIP');
    batchFiles = valid;
    renderBatchList(valid.map(f => ({ name: f.name, size: f.size })));
    document.getElementById('batch-summary').textContent = `${valid.length} file${valid.length !== 1 ? 's' : ''} selected`;
}

function handleZipSelect(files) {
    const zip = files.find(f => f.name.endsWith('.zip'));
    if (!zip) { showToast('Please select a .zip file from a previous batch encrypt'); return; }
    batchZipFile = zip;
    if (!window.JSZip) { document.getElementById('batch-summary').textContent = 'JSZip not loaded.'; return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const z = await JSZip.loadAsync(e.target.result);
            const names = Object.keys(z.files).filter(n => !z.files[n].dir);
            renderBatchList(names.map(n => { const entry = z.files[n]; return { name: n, size: entry._data ? entry._data.uncompressedSize : 0 }; }));
            document.getElementById('batch-summary').textContent = `${names.length} encrypted file${names.length !== 1 ? 's' : ''} found in ZIP`;
        } catch(err) { document.getElementById('batch-summary').textContent = 'Could not read ZIP: ' + err.message; }
    };
    reader.readAsArrayBuffer(zip);
}

function renderBatchList(items) {
    const list = document.getElementById('batch-file-list');
    list.innerHTML = ''; list.style.display = items.length ? 'block' : 'none';
    items.forEach(item => {
        const row = document.createElement('div'); row.className = 'batch-file-item';
        const size = !item.size ? '' : item.size < 1024 ? item.size + ' B' : item.size < 1048576 ? (item.size/1024).toFixed(1)+' KB' : (item.size/1048576).toFixed(1)+' MB';
        const safeId = item.name.replace(/\W/g,'_');
        row.innerHTML = `<span class="batch-file-name" title="${item.name}">${item.name}</span><span class="batch-file-size">${size}</span><span class="batch-file-status" id="bs-${safeId}"></span>`;
        list.appendChild(row);
    });
}

async function runBatchEncrypt() {
    if (!batchFiles.length) { alert('Select at least one file first.'); return; }
    const key = document.getElementById('batch-key').value;
    if (!key) { alert('Enter an encryption key.'); return; }
    const progressWrap = document.getElementById('batch-progress');
    const progressFill = document.getElementById('batch-progress-fill');
    const summary = document.getElementById('batch-summary');
    progressWrap.style.display = 'block'; progressFill.style.width = '0%'; summary.style.color = '';
    if (!window.JSZip) { summary.textContent = 'JSZip not loaded.'; return; }
    const zip = new JSZip(); let done = 0, errors = 0;
    for (const file of batchFiles) {
        const safeId = file.name.replace(/\W/g,'_');
        const statusEl = document.getElementById('bs-' + safeId);
        if (statusEl) { statusEl.textContent = '⟳'; statusEl.style.color = 'var(--text-muted)'; }
        try {
            const formData = new FormData();
            formData.append('file', file); formData.append('key', key); formData.append('mode','encrypt'); formData.append('format','original');
            const res = await fetch(BACKEND + 'file', { method: 'POST', body: formData });
            if (res.ok) {
                const arrBuf = await res.arrayBuffer(); zip.file(file.name + '.enc', arrBuf);
                if (statusEl) { statusEl.textContent = '✓'; statusEl.style.color = 'var(--success)'; }
            } else { errors++; if (statusEl) { statusEl.textContent = '✕'; statusEl.style.color = 'var(--danger)'; } }
        } catch(e) { errors++; if (statusEl) { statusEl.textContent = '✕'; statusEl.style.color = 'var(--danger)'; } }
        done++;
        progressFill.style.width = Math.round((done/batchFiles.length)*100) + '%';
        summary.textContent = `Encrypting ${done} / ${batchFiles.length}...`;
    }
    summary.textContent = 'Generating ZIP archive...';
    try {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a'); a.href = url; a.download = 'vault-encrypted-' + Date.now() + '.zip';
        document.body.appendChild(a); a.click(); a.remove();
        const ok = done - errors;
        summary.textContent = `✓ ${ok} file${ok!==1?'s':''} encrypted` + (errors?` · ${errors} failed`:'') + ' — ZIP downloaded.';
        summary.style.color = errors ? 'var(--warning)' : 'var(--success)';
    } catch(e) { summary.textContent = 'ZIP error: ' + e.message; summary.style.color = 'var(--danger)'; }
}

async function runBatchDecrypt() {
    if (!batchZipFile) { alert('Drop a vault-encrypted ZIP file first.'); return; }
    const key = document.getElementById('batch-key').value;
    if (!key) { alert('Enter the decryption key.'); return; }
    if (!window.JSZip) { alert('JSZip not loaded.'); return; }
    const progressWrap = document.getElementById('batch-progress'), progressFill = document.getElementById('batch-progress-fill'), summary = document.getElementById('batch-summary');
    progressWrap.style.display = 'block'; progressFill.style.width = '0%'; summary.style.color = ''; summary.textContent = 'Reading ZIP...';
    let sourceZip;
    try { const buf = await batchZipFile.arrayBuffer(); sourceZip = await JSZip.loadAsync(buf); }
    catch(e) { summary.textContent = 'Could not open ZIP: ' + e.message; summary.style.color = 'var(--danger)'; return; }
    const entries = Object.keys(sourceZip.files).filter(n => !sourceZip.files[n].dir);
    const outZip = new JSZip(); let done = 0, errors = 0;
    for (const entryName of entries) {
        const safeId = entryName.replace(/\W/g,'_');
        const statusEl = document.getElementById('bs-' + safeId);
        if (statusEl) { statusEl.textContent = '⟳'; statusEl.style.color = 'var(--text-muted)'; }
        try {
            const encBytes = await sourceZip.files[entryName].async('arraybuffer');
            const formData = new FormData();
            formData.append('file', new File([encBytes], entryName)); formData.append('key', key); formData.append('mode','decrypt'); formData.append('format','original');
            const res = await fetch(BACKEND + 'file', { method: 'POST', body: formData });
            if (res.ok) {
                const decBuf = await res.arrayBuffer();
                let fname = entryName.endsWith('.enc') ? entryName.slice(0,-4) : entryName;
                const disp = res.headers.get('Content-Disposition');
                if (disp && disp.includes('filename=')) fname = disp.split('filename=')[1].replace(/"/g,'');
                outZip.file(fname, decBuf);
                if (statusEl) { statusEl.textContent = '✓'; statusEl.style.color = 'var(--success)'; }
            } else { errors++; if (statusEl) { statusEl.textContent = '✕'; statusEl.style.color = 'var(--danger)'; } }
        } catch(e) { errors++; if (statusEl) { statusEl.textContent = '✕'; statusEl.style.color = 'var(--danger)'; } }
        done++;
        progressFill.style.width = Math.round((done/entries.length)*100) + '%';
        summary.textContent = `Decrypting ${done} / ${entries.length}...`;
    }
    if (done - errors === 0) { summary.textContent = '✕ All files failed — wrong key?'; summary.style.color = 'var(--danger)'; return; }
    summary.textContent = 'Generating decrypted ZIP...';
    try {
        const outBlob = await outZip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(outBlob);
        const a = document.createElement('a'); a.href = url; a.download = 'vault-decrypted-' + Date.now() + '.zip';
        document.body.appendChild(a); a.click(); a.remove();
        const ok = done - errors;
        summary.textContent = `✓ ${ok} file${ok!==1?'s':''} decrypted` + (errors?` · ${errors} failed`:'') + ' — ZIP downloaded.';
        summary.style.color = errors ? 'var(--warning)' : 'var(--success)';
    } catch(e) { summary.textContent = 'ZIP error: ' + e.message; summary.style.color = 'var(--danger)'; }
}

/* ===============================================================
   SHAREABLE ENCRYPTED LINKS
=============================================================== */
function generateShareLink() {
    const el = document.getElementById('text-output');
    const txt = el.innerText.replace(/\s+/g,'').trim() || el.textContent.trim();
    const placeholders = ['Waiting for encryption...','Encrypting stream...','Decrypting stream...','System wiped.'];
    if (!txt || placeholders.includes(txt)) { alert('Encrypt something first.'); return; }
    const encoded = encodeURIComponent(txt);
    const shareUrl = window.location.origin + window.location.pathname + '#vault=' + encoded;
    document.getElementById('share-link-content').textContent = shareUrl;
    document.getElementById('share-file-section').style.display = 'none';
    document.getElementById('shareModal').classList.add('open');
    animateModalOpen('shareModal');
}

async function generateFileShareLink(encBlob, filename) {
    if (encBlob.size > 512 * 1024) {
        document.getElementById('share-link-content').textContent = 'File too large for a URL link (' + (encBlob.size/1024).toFixed(0) + ' KB). Share the downloaded .enc file directly.';
        document.getElementById('share-file-section').style.display = 'none';
        document.getElementById('shareModal').classList.add('open');
        animateModalOpen('shareModal');
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        const b64 = reader.result.split(',')[1];
        const shareUrl = window.location.origin + window.location.pathname + '#vault-file=' + encodeURIComponent(b64) + '&vfn=' + encodeURIComponent(filename || 'file.enc');
        document.getElementById('share-link-content').textContent = shareUrl;
        document.getElementById('share-file-section').style.display = 'block';
        document.getElementById('share-file-name').textContent = filename;
        document.getElementById('shareModal').classList.add('open');
        animateModalOpen('shareModal');
    };
    reader.readAsDataURL(encBlob);
}

function copyShareLink() {
    const url = document.getElementById('share-link-content').textContent;
    const btn = document.querySelector('#shareModal .btn-primary');
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(() => {
            btn.textContent = '✓ Copied!';
            setTimeout(() => { btn.textContent = '📋 Copy Link'; }, 2000);
        });
    } else {
        legacyCopy(url, () => { btn.textContent = '✓ Copied!'; setTimeout(() => { btn.textContent = '📋 Copy Link'; }, 2000); });
    }
}

(function checkShareFragment() {
    const hash = window.location.hash;
    if (!hash.startsWith('#vault')) return;
    setTimeout(() => {
        try {
            if (hash.startsWith('#vault-file=')) {
                const params = new URLSearchParams(hash.slice(1));
                const b64 = decodeURIComponent(params.get('vault-file') || '');
                const fname = decodeURIComponent(params.get('vfn') || 'shared.enc');
                if (!b64) return;
                const byteChars = atob(b64); const bytes = new Uint8Array(byteChars.length);
                for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
                const blob = new Blob([bytes]); const url = URL.createObjectURL(blob);
                const fileTab = document.querySelectorAll('.tab')[1];
                if (fileTab) switchTab('file', fileTab);
                const out = document.getElementById('file-output');
                out.style.color = 'var(--neon-cyan)';
                out.innerHTML = '🔗 Shared encrypted file loaded from link.<br><small style="color:var(--text-muted)">Enter password and decrypt.</small>';
                const a = document.createElement('a'); a.href = url; a.download = fname;
                document.body.appendChild(a); a.click(); a.remove();
                showToast('Shared file downloaded — enter password and decrypt');
            } else if (hash.startsWith('#vault=')) {
                const ciphertext = decodeURIComponent(hash.slice(7));
                const textTab = document.querySelector('.tab');
                if (textTab) switchTab('text', textTab);
                document.getElementById('message').value = ciphertext;
                document.getElementById('text-output').textContent = 'Shared ciphertext loaded — enter the password and click Decrypt.';
                document.getElementById('text-output').style.color = 'var(--neon-cyan)';
            }
            history.replaceState(null, '', window.location.pathname);
        } catch(e) {}
    }, 3500);
})();

/* ===============================================================
   SAFARI PASSWORD PROMPT KILLER
=============================================================== */
window.addEventListener('beforeunload', () => {
    document.querySelectorAll('input[type="password"]').forEach(input => {
        input.value = '';
        input.type = 'text';
    });
});
