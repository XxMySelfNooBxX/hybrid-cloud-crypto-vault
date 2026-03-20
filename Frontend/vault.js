const BACKEND = "https://cloud-project-486813.el.r.appspot.com/";

/* ===============================================================
   THREE.JS PARTICLE FIELD
=============================================================== */
/* ===============================================================
   CONSTELLATION BACKGROUND — single 2D canvas, no WebGL needed
=============================================================== */
(function initConstellation() {
    const canvas = document.getElementById('constellation-canvas');
    const ctx = canvas.getContext('2d');
    let W, H, nodes, mouse = { x: -9999, y: -9999 };

    const NODE_COUNT  = 120;
    const LINK_DIST   = 140;
    const LINK_DIST2  = LINK_DIST * LINK_DIST;
    const MOUSE_REPEL = 110;
    const BASE_SPEED  = 0.6;   // base autonomous velocity
    const MAX_SPEED   = 1.2;   // hard cap so nodes never fly off

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function makeNode() {
        const angle = Math.random() * Math.PI * 2;
        const speed = BASE_SPEED * (0.4 + Math.random() * 0.6);
        return {
            x:      Math.random() * W,
            y:      Math.random() * H,
            vx:     Math.cos(angle) * speed,
            vy:     Math.sin(angle) * speed,
            // each node has its own slow-turning drift angle
            driftAngle: Math.random() * Math.PI * 2,
            driftSpeed: 0.004 + Math.random() * 0.008,
            r:      1 + Math.random() * 1.2,
            type:   Math.random() < 0.75 ? 'c' : Math.random() < 0.6 ? 'p' : 'w',
        };
    }

    function init() {
        resize();
        nodes = Array.from({ length: NODE_COUNT }, makeNode);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    // Reset mouse when it leaves the window
    window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

    const COLORS = { c: '78,201,232', p: '123,104,238', w: '200,232,240' };

    function draw() {
        const isLight = document.body.classList.contains('light-theme');
        ctx.clearRect(0, 0, W, H);

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];

            // 1. Autonomous drift — slowly rotate each node's heading
            n.driftAngle += n.driftSpeed;
            n.vx += Math.cos(n.driftAngle) * 0.012;
            n.vy += Math.sin(n.driftAngle) * 0.012;

            // 2. Mouse repulsion (only when mouse is on screen)
            const mdx = n.x - mouse.x, mdy = n.y - mouse.y;
            const md2 = mdx * mdx + mdy * mdy;
            if (md2 < MOUSE_REPEL * MOUSE_REPEL && md2 > 0.1) {
                const md  = Math.sqrt(md2);
                const force = (1 - md / MOUSE_REPEL) * 0.5;
                n.vx += (mdx / md) * force;
                n.vy += (mdy / md) * force;
            }

            // 3. Speed cap — clamp without killing direction
            const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
            if (spd > MAX_SPEED) {
                n.vx = (n.vx / spd) * MAX_SPEED;
                n.vy = (n.vy / spd) * MAX_SPEED;
            }
            // Minimum speed — nodes never fully stop
            if (spd < 0.2) {
                n.vx *= 1.05;
                n.vy *= 1.05;
            }

            // 4. Move
            n.x += n.vx;
            n.y += n.vy;

            // 5. Wrap edges smoothly
            if (n.x < -20)  n.x = W + 20;
            if (n.x > W+20) n.x = -20;
            if (n.y < -20)  n.y = H + 20;
            if (n.y > H+20) n.y = -20;
        }

        // Draw links
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const d2 = dx * dx + dy * dy;
                if (d2 < LINK_DIST2) {
                    const alpha = (1 - d2 / LINK_DIST2) * (isLight ? 0.18 : 0.32);
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = `rgba(78,201,232,${alpha})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }

        // Draw nodes with soft glow
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            const col = COLORS[n.type];
            const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
            glow.addColorStop(0, `rgba(${col},${isLight ? 0.45 : 0.85})`);
            glow.addColorStop(1, `rgba(${col},0)`);
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${col},${isLight ? 0.55 : 1})`;
            ctx.fill();
        }

        requestAnimationFrame(draw);
    }

    init();
    draw();
})();


/* ===============================================================
   HUD SCAN OVERLAY
=============================================================== */
let hudTimeout;
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
    gsap.fromTo(el,
        { scale: 0.95, boxShadow: '0 0 0px transparent' },
        { scale: 1, boxShadow: '0 0 22px rgba(0,243,255,0.35)', duration: 0.35, ease: 'back.out(2)' }
    );
}

function animateOutputReveal(text, elId) {
    const el = document.getElementById(elId);
    if (!window.gsap || !text) { if(el) el.textContent = text; return; }
    el.textContent = '';
    const chars = text.split('');
    let i = 0;
    function tick() {
        if (i < chars.length) {
            el.textContent += chars[i++];
            setTimeout(tick, Math.min(3, 1800 / chars.length));
        }
    }
    gsap.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3 });
    tick();
}

function animatePanelShake() {
    if (!window.gsap) return;
    gsap.to('#main-panel', {
        x: [-4, 4, -3, 3, 0], duration: 0.35, ease: 'none'
    });
}

function animateModalOpen(id) {
    if (!window.gsap) return;
    gsap.fromTo(`#${id} .modal-box`,
        { scale: 0.94, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.5)' }
    );
}


/* ===============================================================
   THEME TOGGLE
=============================================================== */
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    document.getElementById('theme-btn').textContent = isLight ? '🌙' : '☀️';
    localStorage.setItem('vault-theme', isLight ? 'light' : 'dark');
}
(function() {
    if (localStorage.getItem('vault-theme') === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('theme-btn').textContent = '🌙';
    }
})();


/* ===============================================================
   STRENGTH METER
=============================================================== */
function checkStrength(pw, fillId, timeId) {
    const fill = document.getElementById(fillId);
    const label = document.getElementById(timeId);
    if (!pw) { fill.style.width = '0'; label.textContent = ''; return; }
    let score = 0;
    if (pw.length > 5)  score++;
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
   TOTP — SIMPLE SOFTWARE TOTP (RFC 6238) IMPLEMENTATION
=============================================================== */
const TOTP_STATE = {
    secret: null,
    enabled: false,
    pendingCallback: null,
};

// Base32 alphabet
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes) {
    let bits = 0, val = 0, out = '';
    for (let i = 0; i < bytes.length; i++) {
        val = (val << 8) | bytes[i];
        bits += 8;
        while (bits >= 5) {
            out += B32[(val >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) out += B32[(val << (5 - bits)) & 31];
    return out;
}

function base32Decode(str) {
    str = str.toUpperCase().replace(/=+$/, '');
    const bytes = [];
    let bits = 0, val = 0;
    for (const c of str) {
        const idx = B32.indexOf(c);
        if (idx < 0) continue;
        val = (val << 5) | idx;
        bits += 5;
        if (bits >= 8) { bytes.push((val >>> (bits - 8)) & 255); bits -= 8; }
    }
    return new Uint8Array(bytes);
}

async function hmacSHA1(key, data) {
    const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', k, data);
    return new Uint8Array(sig);
}

async function generateTOTP(secret, timeStep) {
    const counter = Math.floor(Date.now() / 1000 / 30) + (timeStep || 0);
    const ctr = new Uint8Array(8);
    let c = counter;
    for (let i = 7; i >= 0; i--) { ctr[i] = c & 0xff; c >>= 8; }
    const key = base32Decode(secret);
    const hash = await hmacSHA1(key, ctr);
    const off = hash[19] & 0xf;
    const code = ((hash[off] & 0x7f) << 24 | hash[off+1] << 16 | hash[off+2] << 8 | hash[off+3]) % 1000000;
    return code.toString().padStart(6, '0');
}

async function verifyTOTP(secret, input) {
    for (const step of [-1, 0, 1]) {
        if (await generateTOTP(secret, step) === input.trim()) return true;
    }
    return false;
}

function generateSecret() {
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    return base32Encode(bytes);
}

function getTOTPUri(secret) {
    const issuer = 'HybridVault';
    const account = 'vault%40hybrid';
    return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

// Load saved state
(function loadTOTPState() {
    const saved = localStorage.getItem('vault-totp');
    if (saved) {
        try {
            const d = JSON.parse(saved);
            TOTP_STATE.secret  = d.secret;
            TOTP_STATE.enabled = d.enabled;
            if (d.enabled) document.getElementById('totp-status-badge').style.display = '';
        } catch(e) {}
    }
})();

function saveTOTPState() {
    localStorage.setItem('vault-totp', JSON.stringify({
        secret: TOTP_STATE.secret,
        enabled: TOTP_STATE.enabled
    }));
}

function open2FASetup() {
    // Generate a new secret if none exists
    if (!TOTP_STATE.secret) TOTP_STATE.secret = generateSecret();

    const secret = TOTP_STATE.secret;
    const uri    = getTOTPUri(secret);
    const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(uri)}&bgcolor=ffffff&color=000000`;

    document.getElementById('totp-qr-img').src = qrUrl;
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
        TOTP_STATE.enabled = true;
        saveTOTPState();
        status.style.color = 'var(--success)';
        status.textContent = '✓ 2FA enabled successfully';
        document.getElementById('totp-status-badge').style.display = '';
        document.getElementById('totp-disable-btn').style.display = '';
        if (window.gsap) gsap.fromTo('#totp-status-badge', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' });
    } else {
        status.style.color = 'var(--danger)';
        status.textContent = '✕ Invalid code — check your authenticator app';
        animatePanelShake();
    }
}

function disableTOTP() {
    if (!confirm('Disable 2FA? This reduces vault security.')) return;
    TOTP_STATE.enabled = false;
    saveTOTPState();
    document.getElementById('totp-status-badge').style.display = 'none';
    document.getElementById('totp-setup-status').style.color = 'var(--warning)';
    document.getElementById('totp-setup-status').textContent = '2FA disabled';
    document.getElementById('totp-disable-btn').style.display = 'none';
}

// TOTP Timer animation
let totpTimerInterval;
function startTOTPTimer() {
    const path = document.getElementById('totp-timer-path');
    if (!path) return;
    clearInterval(totpTimerInterval);
    totpTimerInterval = setInterval(() => {
        const rem = 30 - (Math.floor(Date.now() / 1000) % 30);
        const dashOffset = 157 * (1 - rem / 30);
        path.style.strokeDashoffset = dashOffset;
        const pct = rem / 30;
        path.style.stroke = pct > 0.4 ? 'var(--neon-cyan)' : pct > 0.2 ? 'var(--warning)' : 'var(--danger)';
    }, 1000);
}

function requestTOTPVerify(callback, context) {
    TOTP_STATE.pendingCallback = callback;
    TOTP_STATE.pendingContext  = context;
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
        if (TOTP_STATE.pendingCallback) {
            const cb = TOTP_STATE.pendingCallback;
            TOTP_STATE.pendingCallback = null;
            cb(TOTP_STATE.pendingContext);
        }
    } else {
        status.textContent = '✕ Invalid code — try again';
        document.getElementById('totp-verify-code').value = '';
        if (window.gsap) gsap.to('#totpVerifyModal .modal-box', { x: [-5,5,-4,4,0], duration: 0.3 });
    }
}

function cancelTOTPVerify() {
    clearInterval(totpTimerInterval);
    TOTP_STATE.pendingCallback = null;
    document.getElementById('totpVerifyModal').classList.remove('open');
}


/* ===============================================================
   TEXT ENCRYPT / DECRYPT
=============================================================== */
async function processText(mode) {
    const msg = document.getElementById('message').value;
    const key = document.getElementById('text-key').value;
    if (!msg || !key) { alert('Input + key required'); return; }

    // Gate decrypt behind TOTP if enabled
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

    // Animate the lock icon
    if (mode === 'encrypt') animateLockEncrypt('lock-text-encrypt');
    else                    animateLockDecrypt('lock-text-decrypt');

    const out = document.getElementById('text-output');
    out.textContent = mode === 'encrypt' ? 'Encrypting stream...' : 'Decrypting stream...';
    out.style.color = 'var(--text-muted)';
    document.getElementById('qr-container').style.display = 'none';

    try {
        const res  = await fetch(BACKEND, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, key, mode })
        });
        clearTimeout(hudSafe);
        hideHUD();
        const data = await res.json();
        const result = data.result || data.error || 'Unknown error';
        animateOutputReveal(result, 'text-output');
        const isError = !!data.error || !data.result;
        out.style.color = isError ? 'var(--danger)' : 'var(--neon-cyan)';
        if (!isError) saveToHistory(data.result, mode);
        fetchLogs();
    } catch(e) {
        clearTimeout(hudSafe);
        hideHUD();
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

    // Animate the lock icon
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
            out.textContent = '✓ Done — download starting'; out.style.color = 'var(--success)';
            // Offer share link after encrypt
            if (mode === 'encrypt') {
                out.innerHTML = '✓ Done — download starting.' +
                    ' <button onclick="generateFileShareLink(_lastEncBlob,_lastEncName)" ' +
                    'style="background:none;border:none;color:var(--neon-cyan);font-family:inherit;' +
                    'font-size:11px;letter-spacing:1px;cursor:pointer;text-decoration:underline;' +
                    'padding:0;margin-left:6px">&#x1F517; Get share link</button>';
                window._lastEncBlob = blob;
                window._lastEncName = fname;
            }
        } else {
            const err = await res.json();
            out.textContent = '✕ ' + (err.error || 'Failed'); out.style.color = 'var(--danger)';
            animatePanelShake();
        }
        fetchLogs();
    } catch(e) {
        hideHUD();
        out.textContent = 'Connection error'; out.style.color = 'var(--danger)';
    }
}


/* ===============================================================
   THREAT MAP — Holographic Radar & Attack Vectors
=============================================================== */
let threatMapData = [];
let threatAnimFrame = null;
let threatPings = [];
let radarAngle = 0;
let pingInterval;

// Country code → [lon, lat] (degrees) for Mercator
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
    // Clamp latitude to prevent infinity drawing errors at the poles
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

// Fetch high-resolution real world map geometry
let worldGeoJSON = null;
fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
    .then(res => res.json())
    .then(data => { worldGeoJSON = data; });

function drawWorldMap(ctx, W, H, dark) {
    // 1. Deep Cyber Radial Background
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W);
    grad.addColorStop(0, dark ? '#041424' : '#eaf0ff');
    grad.addColorStop(1, dark ? '#01050a' : '#cdd8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 2. Holographic Grid Overlay
    ctx.strokeStyle = dark ? 'rgba(0, 243, 255, 0.05)' : 'rgba(0, 85, 204, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x=0; x<=W; x+=40) { ctx.moveTo(x,0); ctx.lineTo(x,H); }
    for(let y=0; y<=H; y+=40) { ctx.moveTo(0,y); ctx.lineTo(W,y); }
    ctx.stroke();

    // 3. Real GeoJSON Map Render
    if (!worldGeoJSON) {
        ctx.fillStyle = dark ? 'rgba(0, 243, 255, 0.6)' : '#0055cc';
        ctx.font = '12px "Share Tech Mono"';
        ctx.fillText("CALIBRATING SATELLITE IMAGERY...", 20, 30);
        return;
    }

    ctx.fillStyle   = dark ? 'rgba(0, 40, 60, 0.4)' : 'rgba(255, 255, 255, 0.6)';
    ctx.strokeStyle = dark ? 'rgba(0, 243, 255, 0.5)' : 'rgba(0, 85, 204, 0.7)';
    ctx.lineWidth = 0.8;
    
    ctx.setLineDash([2, 3]);
    if(dark) { ctx.shadowColor = '#00f3ff'; ctx.shadowBlur = 4; }

    worldGeoJSON.features.forEach(feature => {
        if (!feature.geometry) return;
        const type = feature.geometry.type;
        const coords = feature.geometry.coordinates;

        ctx.beginPath();
        if (type === 'Polygon') {
            coords.forEach(ring => drawRing(ring, ctx, W, H));
        } else if (type === 'MultiPolygon') {
            coords.forEach(poly => poly.forEach(ring => drawRing(ring, ctx, W, H)));
        }
        ctx.fill();
        ctx.stroke();
    });

    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
}

function drawRing(ring, ctx, W, H) {
    ring.forEach((coord, i) => {
        const pos = mercatorXY(coord[0], coord[1], W, H);
        if (i === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
    });
    ctx.closePath();
}

// Spawns continuous dynamic attacks instead of static pulses
function spawnRandomPing(W, H) {
    if (!threatMapData.length || !document.getElementById('threatModal').classList.contains('open')) return;

    const log = threatMapData[Math.floor(Math.random() * threatMapData.length)];
    const rawCC  = (log.location || '').split(',')[1]?.trim() || 'Unknown';
    const cc     = COUNTRY_COORDS[rawCC] ? rawCC : 'Unknown';
    const isFail = log.status.includes('FAIL') || log.status.includes('ERROR');
    const isFile = log.action.includes('FILE');
    const isPanic= log.action.includes('PURGE') || log.action.includes('PANIC');

    const {x, y} = countryToXY(cc, W, H);
    
    // Spread pings out slightly
    const jx = (Math.random()-0.5)*20;
    const jy = (Math.random()-0.5)*20;

    const color = isFail ? '#ff3333' : isPanic ? '#7b68ee' : isFile ? '#00f3ff' : '#39ff14';

    // Random edge origin for the attack vector laser
    const startX = Math.random() > 0.5 ? -20 : W + 20;
    const startY = Math.random() * H;

    threatPings.push({
        x: x+jx, y: y+jy,
        startX, startY,
        color,
        maxR: 20 + Math.random()*15,
        born: Date.now(),
        label: isFail ? 'THREAT BLOCKED' : 'DATA SECURED'
    });
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
        const rawCC  = (log.location || '').split(',')[1]?.trim() || 'Unknown';
        if(COUNTRY_COORDS[rawCC]) countries.add(rawCC);
        if(log.status.includes('FAIL') || log.status.includes('ERROR')) totalFails++;
    });

    document.getElementById('stat-total').textContent     = logs.length;
    document.getElementById('stat-fail').textContent      = totalFails;
    document.getElementById('stat-countries').textContent = countries.size;

    const feed = document.getElementById('threat-feed');
    feed.innerHTML = '';
    logs.slice(0, 25).forEach(log => {
        const row = document.createElement('div');
        const isFail = log.status.includes('FAIL') || log.status.includes('ERROR');
        const isPanic = log.action.includes('PURGE');
        row.className = 'threat-event ' + (isFail ? 'fail' : isPanic ? 'warn' : 'ok');
        row.innerHTML = `<span>${log.time}</span><span>${log.action}</span><span>${log.location||'Unknown'}</span><span>${log.status}</span>`;
        feed.appendChild(row);
    });

    threatPings = [];
    clearInterval(pingInterval);
    // Fires a new active ping every 700ms to keep the map constantly alive
    pingInterval = setInterval(() => spawnRandomPing(W, H), 700);

    if (threatAnimFrame) cancelAnimationFrame(threatAnimFrame);
    animatePings(ctx, W, H, dark);
}

function animatePings(ctx, W, H, dark) {
    if (!document.getElementById('threatModal').classList.contains('open')) return;

    drawWorldMap(ctx, W, H, dark);
    const now = Date.now();

    // 1. Spinning Radar Sweep
    radarAngle += 0.015;
    ctx.save();
    ctx.translate(W/2, H/2);
    ctx.rotate(radarAngle);
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0, 0, W, 0, 0.4);
    ctx.lineTo(0,0);
    const radarGrad = ctx.createLinearGradient(0,0, W,0);
    radarGrad.addColorStop(0, dark ? 'rgba(0, 243, 255, 0.15)' : 'rgba(0, 85, 204, 0.1)');
    radarGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radarGrad;
    ctx.fill();
    ctx.restore();

    // 2. Draw Vector Lines and Impact Ripples
    threatPings.forEach(p => {
        const age = now - p.born;
        const lifespan = 2500;
        if (age > lifespan) return;

        const t = age / lifespan; 
        const alpha = 1 - Math.pow(t, 2); 

        // Attack Laser (Curves from edge of map to the target country)
        if (t < 0.6) {
            const lineAlpha = 1 - (t / 0.6);
            ctx.beginPath();
            ctx.moveTo(p.startX, p.startY);
            const cpX = (p.startX + p.x)/2;
            const cpY = Math.min(p.startY, p.y) - 60; // Arch upward
            ctx.quadraticCurveTo(cpX, cpY, p.x, p.y);
            ctx.strokeStyle = p.color + Math.floor(lineAlpha * 150).toString(16).padStart(2,'0');
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Impact Ripple
        const r = t * p.maxR;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2,'0');
        ctx.lineWidth = 2;
        ctx.stroke();

        // Glowing Core Node
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Floating HUD Text Label
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

    // Fallback demo data if database is empty
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
/* ===============================================================
   LOGS
=============================================================== */
async function fetchLogs() {
    try {
        // We added ?personal=true so the user only sees their own IP's activity in the table
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
            row.innerHTML = `
                <span style="color:var(--text-muted)">${l.time}</span>
                <span>${l.ip}</span>
                <span>${l.location || 'Unknown'}</span>
                <span>${l.device || 'Unknown'}</span>
                <span>${l.action}</span>
                <span class="${statusClass}">${l.status}</span>`;
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
    document.querySelectorAll('input[type="text"],textarea').forEach(el => el.value = '');
    document.getElementById('text-output').textContent = 'System wiped.';
    document.getElementById('text-output').style.color = 'var(--text-muted)';
    document.getElementById('qr-container').style.display = 'none';
    if (window.gsap) gsap.to('.page-wrap', { opacity: 0, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.in' });
    setTimeout(() => alert('SECURE WIPE EXECUTED'), 300);
}
/* ===============================================================
   HISTORY
=============================================================== */
function getHistory() {
    try { return JSON.parse(localStorage.getItem('vault-history') || '[]'); } catch { return []; }
}
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
        row.innerHTML = `
            <span class="hist-result" title="${entry.result}">${entry.result}</span>
            <span style="color:var(--text-muted);font-size:11px">${entry.time}</span>
            <span><span class="badge badge-${entry.mode === 'encrypt' ? 'enc' : 'dec'}">${entry.mode}</span></span>
            <span>
                <button class="btn btn-sm btn-primary" style="padding:4px 9px;font-size:10px" onclick="copyHistoryItem(${i})">📋 Copy</button>
            </span>`;
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
function deleteHistoryItem(i) {
    const h = getHistory(); h.splice(i, 1);
    localStorage.setItem('vault-history', JSON.stringify(h)); renderHistory();
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
    const el  = document.getElementById('text-output');
    const txt = el.textContent.trim();
    const placeholders = ['Waiting for encryption...','Encrypting stream...','Decrypting stream...','System wiped.'];
    if (!txt || placeholders.includes(txt)) { alert('Nothing to copy yet.'); return; }

    const btn = document.getElementById('copy-btn');
    function markDone() {
        btn.textContent = '✓ Copied!';
        btn.style.borderColor = 'var(--success)';
        btn.style.color = 'var(--success)';
        setTimeout(() => { btn.textContent = '📋 Copy'; btn.style.borderColor = ''; btn.style.color = ''; }, 2200);
    }

    // Modern clipboard API (works on HTTPS)
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(txt).then(markDone).catch(() => legacyCopy(txt, markDone));
    } else {
        legacyCopy(txt, markDone);
    }
}

function legacyCopy(txt, onSuccess) {
    const ta = document.createElement('textarea');
    ta.value = txt;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;opacity:0;z-index:-1';
    document.body.appendChild(ta);
    // On iOS we need a range select
    if (navigator.userAgent.match(/ipad|iphone/i)) {
        const range = document.createRange();
        range.selectNodeContents(ta);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        ta.setSelectionRange(0, 999999);
    } else {
        ta.select();
    }
    try {
        const ok = document.execCommand('copy');
        if (ok) onSuccess(); else alert('Copy failed — please select text manually.');
    } catch(e) {
        alert('Copy failed — please select text manually.');
    }
    document.body.removeChild(ta);
}


function generateQR() {
    const txt = document.getElementById('text-output').textContent.trim();
    const placeholders = ['Waiting for encryption...','Encrypting stream...','Decrypting stream...','System wiped.'];
    if (!txt || placeholders.includes(txt)) { alert('Encrypt something first to generate a QR code.'); return; }

    const container = document.getElementById('qr-container');
    const render    = document.getElementById('qr-render');
    render.innerHTML = '';
    container.style.display = 'block';

    if (window.QRCode) {
        new QRCode(render, {
            text: txt,
            width:  180,
            height: 180,
            colorDark:  '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
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
    if (id === 'threatModal' && threatAnimFrame) {
        cancelAnimationFrame(threatAnimFrame);
        threatAnimFrame = null;
    }
}
window.addEventListener('click', e => {
    ['logModal','historyModal','threatModal','totpModal','totpVerifyModal'].forEach(id => {
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
   BRUTE FORCE SIMULATION
=============================================================== */
let bruteIv = null;
let bruteRunning = false;

function startBruteForce() {
    const pw = document.getElementById('text-key').value;
    if (!pw) return alert('Enter a password first');
    if (bruteRunning) closeBrute();

    bruteRunning = true;
    const overlay = document.getElementById('brute-overlay');
    const consoleDiv = document.getElementById('brute-console');
    const resultDiv  = document.getElementById('brute-result');
    overlay.style.display = 'block';
    consoleDiv.innerHTML = '';
    resultDiv.innerHTML  = '';
    resultDiv.style.display = 'none';

    // Weak = short OR no uppercase/numbers/symbols
    const hasUpper   = /[A-Z]/.test(pw);
    const hasDigit   = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    const isWeak = pw.length < 8 || (!hasUpper && !hasDigit) || (!hasDigit && !hasSpecial);
    const stopAt = isWeak ? 60 : 180;
    let c = 0;

    bruteIv = setInterval(() => {
        if (!bruteRunning) { clearInterval(bruteIv); bruteIv = null; return; }

        const hex  = Math.random().toString(16).substr(2, 8).toUpperCase();
        const att  = Math.random().toString(36).substr(2, 8);
        const line = document.createElement('div');
        line.style.cssText = 'margin:1px 0;line-height:1.4';
        line.innerHTML = `<span style="color:#1a4a1a">[0x${hex}]</span> TESTING: <span style="color:#44ff44">${att}</span>... <span style="color:#ff2222">DENIED</span>`;
        consoleDiv.appendChild(line);
        // Keep only last 200 lines for perf
        while (consoleDiv.children.length > 200) consoleDiv.removeChild(consoleDiv.firstChild);
        consoleDiv.scrollTop = 999999;
        c++;

        if (c >= stopAt) {
            clearInterval(bruteIv);
            bruteIv = null;
            bruteRunning = false;
            resultDiv.style.display = 'block';
            if (isWeak) {
                resultDiv.innerHTML = `<div class="crack-success-msg">⚠️ PASSWORD CRACKED ⚠️<br><span style="font-size:16px;margin-top:8px;display:block">KEY: <strong>${pw}</strong></span><span style="font-size:14px">TIME: ${(pw.length * 0.05).toFixed(2)}s</span></div>`;
            } else {
                resultDiv.innerHTML = `<div class="crack-fail-msg">🛡️ BRUTE FORCE FAILED 🛡️<br><span style="font-size:14px;margin-top:8px;display:block">ENCRYPTION TOO STRONG</span><span style="font-size:12px;opacity:0.7">EST. CRACK TIME: 4,000,000 YEARS</span></div>`;
            }
        }
    }, 25);
}

function closeBrute() {
    clearInterval(bruteIv);
    bruteIv = null;
    bruteRunning = false;
    document.getElementById('brute-overlay').style.display = 'none';
    document.getElementById('brute-console').innerHTML = '';
    document.getElementById('brute-result').innerHTML = '';
    document.getElementById('brute-result').style.display = 'none';
}


/* ===============================================================
   BOOT SEQUENCE + PAGE LOAD
=============================================================== */
(function runBoot() {
    if (!window.gsap) {
        document.getElementById('boot-overlay').classList.add('done');
        return;
    }

    const overlay  = document.getElementById('boot-overlay');
    const logo     = document.getElementById('boot-logo');
    const lines    = [0,1,2,3,4,5].map(i => document.getElementById('bl'+i));
    const barWrap  = document.getElementById('boot-bar-wrap');
    const barFill  = document.getElementById('boot-bar-fill');
    const barPct   = document.getElementById('boot-pct');
    const pageWrap = document.querySelector('.page-wrap');

    // Hide main content during boot
    gsap.set(pageWrap, { opacity: 0 });

    const tl = gsap.timeline({ onComplete: finishBoot });

    // Logo fades in
    tl.to(logo, { opacity: 1, duration: 0.5, ease: 'power2.out' });

    // Lines type in one by one
    lines.forEach((line, i) => {
        tl.to(line, { opacity: 1, duration: 0.15, ease: 'none' }, `+=${i === 0 ? 0.1 : 0.22}`);
    });

    // Progress bar fills after lines
    tl.to(barWrap, { opacity: 1, duration: 0.2 }, '+=0.1');
    tl.to({}, {
        duration: 0.8,
        onUpdate: function() {
            const pct = Math.round(this.progress() * 100);
            barFill.style.width = pct + '%';
            barPct.textContent  = pct + '%';
        }
    });

    // Flash and wipe
    tl.to(overlay, { opacity: 0, duration: 0.4, delay: 0.15, ease: 'power2.in' });

    function finishBoot() {
        overlay.classList.add('done');
        // Reveal main content
        gsap.fromTo(pageWrap,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', clearProps: 'all' }
        );
        gsap.from('.glitch-title',  { opacity: 0, y: -12, duration: 0.5, ease: 'power3.out', clearProps: 'all' });
        gsap.from('.subtitle',      { opacity: 0, duration: 0.4, delay: 0.15, clearProps: 'all' });
        gsap.from('.panel',         { opacity: 0, y: 20, duration: 0.5, delay: 0.2, ease: 'power2.out', clearProps: 'all' });
        gsap.from('.header-controls .icon-btn', {
            opacity: 0, scale: 0.7, stagger: 0.07, duration: 0.35, delay: 0.25,
            ease: 'back.out(2)', clearProps: 'all'
        });
        gsap.fromTo('.security-bar',
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4, delay: 0.5, ease: 'power2.out', clearProps: 'all' }
        );
    }
})();


/* ===============================================================
   ANIMATED LOCK ICON HELPERS
=============================================================== */
function animateLockEncrypt(lockId) {
    const lock = document.getElementById(lockId);
    if (!lock) return;
    // Start open, snap shut with spring
    lock.classList.remove('lock-unlocked', 'lock-spinning');
    lock.classList.add('lock-spinning');
    setTimeout(() => lock.classList.remove('lock-spinning'), 500);
}

function animateLockDecrypt(lockId) {
    const lock = document.getElementById(lockId);
    if (!lock) return;
    // Quickly close then open
    lock.classList.remove('lock-unlocked');
    setTimeout(() => lock.classList.add('lock-unlocked'), 300);
}

function resetLocks() {
    ['lock-text-encrypt','lock-file-encrypt'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.remove('lock-unlocked','lock-spinning'); }
    });
    ['lock-text-decrypt','lock-file-decrypt'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('lock-unlocked');
    });
}

/* Auto-refresh logs every 5s */
setInterval(fetchLogs, 5000);


/* ===============================================================
   AUTO-LOCK ON INACTIVITY
=============================================================== */
/* ===============================================================
   AUTO-LOCK ON INACTIVITY
   — Only activates after user explicitly enables it via the
     lock settings. Never silently captures keys.
=============================================================== */
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes (configurable)
let lockTimer        = null;
let lockDeadline     = null;
let _lockEnabled     = false;   // must be opt-in, never automatic
let _lockHash        = null;    // SHA-256 of PIN, memory only

async function hashKey(key) {
    const enc = new TextEncoder().encode(key);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// Called when user explicitly sets up auto-lock from settings modal
async function enableAutoLock(pin) {
    if (!pin || pin.length < 4) return false;
    _lockHash    = await hashKey(pin);
    _lockEnabled = true;
    resetLockTimer();
    return true;
}

function disableAutoLock() {
    _lockEnabled = false;
    _lockHash    = null;
    clearTimeout(lockTimer);
    lockDeadline = null;
    document.getElementById('lock-overlay').classList.remove('active');
    showToast('Auto-lock disabled');
}

function resetLockTimer() {
    if (!_lockEnabled) return;
    clearTimeout(lockTimer);
    lockDeadline = Date.now() + LOCK_TIMEOUT_MS;
    lockTimer    = setTimeout(triggerLock, LOCK_TIMEOUT_MS);
}

function triggerLock() {
    if (!_lockEnabled) return;
    document.getElementById('lock-overlay').classList.add('active');
    document.getElementById('lock-password-input').value = '';
    document.getElementById('lock-error').textContent = '';
    document.getElementById('lock-screen-sub').textContent =
        'Session locked after 5 minutes of inactivity. Enter your lock PIN to resume.';
    document.getElementById('lock-timer-display').textContent =
        'Locked at ' + new Date().toLocaleTimeString();
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
    errEl.textContent = '';
    resetLockTimer();
}

// Reset timer on any user interaction (only if lock is enabled)
['click','keydown','mousemove','touchstart'].forEach(evt => {
    document.addEventListener(evt, () => { if (_lockEnabled && lockDeadline) resetLockTimer(); }, { passive: true });
});

/* ---------------------------------------------------------------
   LOCK SETTINGS MODAL — open/close
--------------------------------------------------------------- */
function openLockSettings() {
    document.getElementById('lockSettingsModal').classList.add('open');
    animateModalOpen('lockSettingsModal');
    // Show current state
    const statusEl = document.getElementById('lock-current-status');
    statusEl.textContent = _lockEnabled ? 'Auto-lock is ON' : 'Auto-lock is OFF';
    statusEl.style.color = _lockEnabled ? 'var(--success)' : 'var(--text-muted)';
    document.getElementById('lock-pin-input').value = '';
    document.getElementById('lock-pin-confirm').value = '';
    document.getElementById('lock-setup-error').textContent = '';
}

async function saveLockSettings() {
    const pin     = document.getElementById('lock-pin-input').value;
    const confirm = document.getElementById('lock-pin-confirm').value;
    const errEl   = document.getElementById('lock-setup-error');

    if (!pin) {
        // Empty PIN = disable auto-lock
        disableAutoLock();
        closeModal('lockSettingsModal');
        return;
    }
    if (pin.length < 4) {
        errEl.textContent = 'PIN must be at least 4 characters.'; return;
    }
    if (pin !== confirm) {
        errEl.textContent = '✕ PINs do not match.'; return;
    }
    const ok = await enableAutoLock(pin);
    if (ok) {
        closeModal('lockSettingsModal');
        showToast('Auto-lock enabled — vault locks after 5 min inactivity');
    }
}

/* ---------------------------------------------------------------
   TOAST NOTIFICATION
--------------------------------------------------------------- */
function showToast(msg, duration = 3000) {
    let toast = document.getElementById('vault-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'vault-toast';
        toast.style.cssText = [
            'position:fixed','bottom:24px','left:50%','transform:translateX(-50%) translateY(20px)',
            'background:rgba(8,14,26,0.95)','border:1px solid rgba(78,201,232,0.3)',
            'color:#4ec9e8','font-family:"Share Tech Mono",monospace','font-size:12px',
            'letter-spacing:1.5px','padding:10px 20px','border-radius:4px',
            'z-index:9999','opacity:0','transition:all 0.3s ease',
            'pointer-events:none','backdrop-filter:blur(10px)',
            'box-shadow:0 0 20px rgba(78,201,232,0.1)'
        ].join(';');
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
    }, duration);
}


/* ===============================================================
   STATS DASHBOARD
=============================================================== */
function switchTab(mode, el) {
    document.querySelectorAll('.mode-content').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(e => e.classList.remove('active'));
    document.getElementById(mode + '-mode').classList.add('active');
    el.classList.add('active');
    if (window.gsap) {
        gsap.fromTo('#' + mode + '-mode',
            { opacity: 0, x: 10 },
            { opacity: 1, x: 0, duration: 0.25, ease: 'power2.out' }
        );
    }
}

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

    // Compute stats from logs
    const total      = logs.length;
    const encrypts   = logs.filter(l => l.action && l.action.includes('ENCRYPT')).length;
    const decrypts   = logs.filter(l => l.action && l.action.includes('DECRYPT')).length;
    const failures   = logs.filter(l => l.status && (l.status.includes('FAIL') || l.status.includes('ERROR'))).length;
    const fileOps    = logs.filter(l => l.action && l.action.includes('FILE')).length;
    const successRate = total ? Math.round(((total - failures) / total) * 100) : 0;

    // Hour distribution from logs
    const hourBuckets = new Array(24).fill(0);
    logs.forEach(l => {
        if (!l.time) return;
        const match = l.time.match(/(\d{2}):/);
        if (match) hourBuckets[parseInt(match[1])]++;
    });
    const maxHour = Math.max(...hourBuckets, 1);
    const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets));

    // Action breakdown
    const actionCounts = {};
    logs.forEach(l => {
        if (!l.action) return;
        const key = l.action.replace(/\(.*?\)/g, '').trim();
        actionCounts[key] = (actionCounts[key] || 0) + 1;
    });
    const topActions = Object.entries(actionCounts).sort((a,b) => b[1]-a[1]).slice(0,5);
    const maxAction = topActions[0]?.[1] || 1;

    const actionColors = ['#4ec9e8','#7b68ee','#3de8a0','#ffaa00','#ff3333'];

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card cyan">
                <div class="stat-num" id="sn-total">0</div>
                <div class="stat-label">Total Ops</div>
            </div>
            <div class="stat-card green">
                <div class="stat-num" id="sn-enc">0</div>
                <div class="stat-label">Encryptions</div>
            </div>
            <div class="stat-card purple">
                <div class="stat-num" id="sn-dec">0</div>
                <div class="stat-label">Decryptions</div>
            </div>
            <div class="stat-card teal">
                <div class="stat-num" id="sn-rate">0%</div>
                <div class="stat-label">Success Rate</div>
            </div>
            <div class="stat-card amber">
                <div class="stat-num" id="sn-file">0</div>
                <div class="stat-label">File Ops</div>
            </div>
            <div class="stat-card red">
                <div class="stat-num" id="sn-fail">0</div>
                <div class="stat-label">Failed Attempts</div>
            </div>
        </div>

        <div class="stats-chart-wrap">
            <div class="stats-chart-title">Activity by Hour (last 50 ops)</div>
            <div class="stats-activity-grid" id="activity-grid"></div>
            <div class="activity-hours">
                ${Array.from({length:24},(_,i)=>`<div class="activity-hour-label">${i%6===0?i:''}</div>`).join('')}
            </div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:6px;letter-spacing:1px">
                Peak hour: <span style="color:var(--neon-cyan)">${peakHour}:00 – ${peakHour+1}:00</span>
            </div>
        </div>

        <div class="stats-chart-wrap">
            <div class="stats-chart-title">Operations Breakdown</div>
            <div class="stats-bar-chart">
                ${topActions.map(([action, count], i) => `
                    <div class="stats-bar-row">
                        <div class="stats-bar-label">${action.length > 12 ? action.slice(0,12)+'…' : action}</div>
                        <div class="stats-bar-track">
                            <div class="stats-bar-fill" style="width:0%;background:${actionColors[i]};box-shadow:0 0 6px ${actionColors[i]}40" data-target="${Math.round(count/maxAction*100)}"></div>
                        </div>
                        <div class="stats-bar-val">${count}</div>
                    </div>`).join('')}
            </div>
        </div>

        <div class="stats-chart-wrap">
            <div class="stats-chart-title">Session History (${history.length} items)</div>
            <div class="stats-bar-chart">
                <div class="stats-bar-row">
                    <div class="stats-bar-label">Encrypt</div>
                    <div class="stats-bar-track">
                        <div class="stats-bar-fill" style="width:0%;background:#3de8a0;box-shadow:0 0 6px #3de8a040"
                             data-target="${history.length ? Math.round(history.filter(h=>h.mode==='encrypt').length/history.length*100) : 0}"></div>
                    </div>
                    <div class="stats-bar-val">${history.filter(h=>h.mode==='encrypt').length}</div>
                </div>
                <div class="stats-bar-row">
                    <div class="stats-bar-label">Decrypt</div>
                    <div class="stats-bar-track">
                        <div class="stats-bar-fill" style="width:0%;background:#7b68ee;box-shadow:0 0 6px #7b68ee40"
                             data-target="${history.length ? Math.round(history.filter(h=>h.mode==='decrypt').length/history.length*100) : 0}"></div>
                    </div>
                    <div class="stats-bar-val">${history.filter(h=>h.mode==='decrypt').length}</div>
                </div>
            </div>
        </div>
    `;

    // Animate stat numbers counting up
    const targets = { total, encrypts, decrypts, successRate, fileOps, failures };
    const els = {
        total: document.getElementById('sn-total'),
        encrypts: document.getElementById('sn-enc'),
        decrypts: document.getElementById('sn-dec'),
        successRate: document.getElementById('sn-rate'),
        fileOps: document.getElementById('sn-file'),
        failures: document.getElementById('sn-fail'),
    };
    const duration = 800;
    const start = performance.now();
    function countUp(ts) {
        const p = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        if (els.total) els.total.textContent = Math.round(targets.total * ease);
        if (els.encrypts) els.encrypts.textContent = Math.round(targets.encrypts * ease);
        if (els.decrypts) els.decrypts.textContent = Math.round(targets.decrypts * ease);
        if (els.successRate) els.successRate.textContent = Math.round(targets.successRate * ease) + '%';
        if (els.fileOps) els.fileOps.textContent = Math.round(targets.fileOps * ease);
        if (els.failures) els.failures.textContent = Math.round(targets.failures * ease);
        if (p < 1) requestAnimationFrame(countUp);
    }
    requestAnimationFrame(countUp);

    // Draw activity grid
    const grid = document.getElementById('activity-grid');
    if (grid) {
        hourBuckets.forEach(count => {
            const cell = document.createElement('div');
            cell.className = 'activity-cell' +
                (count === 0 ? '' : count < maxHour * 0.25 ? ' l1' :
                 count < maxHour * 0.5 ? ' l2' : count < maxHour * 0.75 ? ' l3' : ' l4');
            grid.appendChild(cell);
        });
    }

    // Animate bar fills with a small delay
    setTimeout(() => {
        document.querySelectorAll('.stats-bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.target + '%';
        });
    }, 100);
}


/* ===============================================================
   BATCH FILE ENCRYPTION
=============================================================== */
let batchFiles  = [];
let batchMode   = 'encrypt'; // 'encrypt' | 'decrypt'
let batchZipFile = null;     // the .zip file selected for batch decrypt

/* ===============================================================
   FILE SUB-TAB SWITCH (Single / Batch)
=============================================================== */
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
    ['dragenter','dragover'].forEach(ev =>
        zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('drag-over'); }));
    ['dragleave','drop'].forEach(ev =>
        zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('drag-over'); }));
    zone.addEventListener('drop', e => {
        const files = Array.from(e.dataTransfer.files);
        if (batchMode === 'decrypt') {
            handleZipSelect(files);
        } else {
            handleBatchFiles(files);
        }
    });
}

/* ===============================================================
   STATS PANEL — opened from security bar
=============================================================== */
function openStatsPanel() {
    document.querySelectorAll('.mode-content').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(e => e.classList.remove('active'));
    document.getElementById('stats-mode').classList.add('active');
    if (window.gsap) gsap.fromTo('#stats-mode', { opacity:0, y:10 }, { opacity:1, y:0, duration:0.3, ease:'power2.out' });
    renderStats();
    document.getElementById('main-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------------------------------------------------------------
   BATCH MODE TOGGLE — Encrypt vs Decrypt
--------------------------------------------------------------- */
function setBatchMode(mode) {
    batchMode     = mode;
    batchFiles    = [];
    batchZipFile  = null;

    const encBtn  = document.getElementById('bmode-enc');
    const decBtn  = document.getElementById('bmode-dec');
    const dzIcon  = document.getElementById('batch-dz-icon');
    const dzText  = document.getElementById('batch-dz-text');
    const fileInp = document.getElementById('batch-file-input');
    const keyLbl  = document.getElementById('batch-key-label');
    const actBtn  = document.getElementById('batch-action-btn');
    const list    = document.getElementById('batch-file-list');
    const summary = document.getElementById('batch-summary');
    const prog    = document.getElementById('batch-progress');
    const fill    = document.getElementById('batch-progress-fill');

    // Reset state
    list.innerHTML = '';
    list.style.display = 'none';
    summary.textContent = '';
    summary.style.color = '';
    prog.style.display  = 'none';
    fill.style.width    = '0%';

    if (mode === 'encrypt') {
        encBtn.classList.add('active');
        encBtn.classList.remove('decrypt-active');
        decBtn.classList.remove('active', 'decrypt-active');
        dzIcon.textContent  = '📁';
        dzText.innerHTML    = 'Drop multiple files here or <strong>click to browse</strong>';
        fileInp.removeAttribute('accept');
        fileInp.multiple    = true;
        keyLbl.textContent  = 'Encryption Key (applied to all files)';
        actBtn.innerHTML    = '🔒 Encrypt All &amp; Download ZIP';
        actBtn.onclick      = runBatchEncrypt;
        actBtn.className    = 'btn btn-primary';
    } else {
        decBtn.classList.add('active', 'decrypt-active');
        encBtn.classList.remove('active');
        dzIcon.textContent  = '📦';
        dzText.innerHTML    = 'Drop your <strong>vault-encrypted-*.zip</strong> here or <strong>click to browse</strong>';
        fileInp.setAttribute('accept', '.zip');
        fileInp.multiple    = false;
        keyLbl.textContent  = 'Decryption Key (used for all files in the ZIP)';
        actBtn.innerHTML    = '🔓 Decrypt ZIP &amp; Download Files';
        actBtn.onclick      = runBatchDecrypt;
        actBtn.className    = 'btn btn-secondary';
    }
}

/* ---------------------------------------------------------------
   ENCRYPT MODE — select individual files
--------------------------------------------------------------- */
function handleBatchSelect(input) {
    const files = Array.from(input.files);
    if (batchMode === 'decrypt') {
        handleZipSelect(files);
    } else {
        handleBatchFiles(files);
    }
}

function handleBatchFiles(files) {
    // Filter out zip files in encrypt mode
    const valid = files.filter(f => !f.name.endsWith('.zip'));
    if (valid.length !== files.length) {
        showToast('ZIP files skipped — use Decrypt mode to process a ZIP');
    }
    batchFiles = valid;
    renderBatchList(valid.map(f => ({ name: f.name, size: f.size })));
    document.getElementById('batch-summary').textContent =
        `${valid.length} file${valid.length !== 1 ? 's' : ''} selected`;
}

/* ---------------------------------------------------------------
   DECRYPT MODE — select a single ZIP
--------------------------------------------------------------- */
function handleZipSelect(files) {
    const zip = files.find(f => f.name.endsWith('.zip'));
    if (!zip) {
        showToast('Please select a .zip file from a previous batch encrypt');
        return;
    }
    batchZipFile = zip;
    if (!window.JSZip) {
        document.getElementById('batch-summary').textContent = 'JSZip not loaded.';
        return;
    }
    // Peek inside the zip and list files
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const z = await JSZip.loadAsync(e.target.result);
            const names = Object.keys(z.files).filter(n => !z.files[n].dir);
            renderBatchList(names.map(n => {
                const entry = z.files[n];
                return { name: n, size: entry._data ? entry._data.uncompressedSize : 0 };
            }));
            document.getElementById('batch-summary').textContent =
                `${names.length} encrypted file${names.length !== 1 ? 's' : ''} found in ZIP`;
        } catch(err) {
            document.getElementById('batch-summary').textContent = 'Could not read ZIP: ' + err.message;
        }
    };
    reader.readAsArrayBuffer(zip);
}

function renderBatchList(items) {
    const list = document.getElementById('batch-file-list');
    list.innerHTML = '';
    list.style.display = items.length ? 'block' : 'none';
    items.forEach(item => {
        const row  = document.createElement('div');
        row.className = 'batch-file-item';
        const size = !item.size ? '' :
                     item.size < 1024 ? item.size + ' B' :
                     item.size < 1048576 ? (item.size / 1024).toFixed(1) + ' KB' :
                     (item.size / 1048576).toFixed(1) + ' MB';
        const safeId = item.name.replace(/\W/g, '_');
        row.innerHTML = `<span class="batch-file-name" title="${item.name}">${item.name}</span>
                         <span class="batch-file-size">${size}</span>
                         <span class="batch-file-status" id="bs-${safeId}"></span>`;
        list.appendChild(row);
    });
}

/* ---------------------------------------------------------------
   RUN BATCH ENCRYPT
--------------------------------------------------------------- */
async function runBatchEncrypt() {
    if (!batchFiles.length) { alert('Select at least one file first.'); return; }
    const key = document.getElementById('batch-key').value;
    if (!key) { alert('Enter an encryption key.'); return; }

    const progressWrap = document.getElementById('batch-progress');
    const progressFill = document.getElementById('batch-progress-fill');
    const summary      = document.getElementById('batch-summary');
    progressWrap.style.display = 'block';
    progressFill.style.width   = '0%';
    summary.style.color = '';

    if (!window.JSZip) { summary.textContent = 'JSZip not loaded.'; return; }
    const zip  = new JSZip();
    let done   = 0;
    let errors = 0;

    for (const file of batchFiles) {
        const safeId   = file.name.replace(/\W/g, '_');
        const statusEl = document.getElementById('bs-' + safeId);
        if (statusEl) { statusEl.textContent = '⟳'; statusEl.style.color = 'var(--text-muted)'; }
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('key', key);
            formData.append('mode', 'encrypt');
            formData.append('format', 'original');
            const res = await fetch(BACKEND + 'file', { method: 'POST', body: formData });
            if (res.ok) {
                const arrBuf = await res.arrayBuffer();
                zip.file(file.name + '.enc', arrBuf);
                if (statusEl) { statusEl.textContent = '✓'; statusEl.style.color = 'var(--success)'; }
            } else {
                errors++;
                if (statusEl) { statusEl.textContent = '✕'; statusEl.style.color = 'var(--danger)'; }
            }
        } catch(e) {
            errors++;
            if (statusEl) { statusEl.textContent = '✕'; statusEl.style.color = 'var(--danger)'; }
        }
        done++;
        progressFill.style.width = Math.round((done / batchFiles.length) * 100) + '%';
        summary.textContent = `Encrypting ${done} / ${batchFiles.length}...`;
    }

    summary.textContent = 'Generating ZIP archive...';
    try {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a   = document.createElement('a');
        a.href = url;
        a.download = 'vault-encrypted-' + Date.now() + '.zip';
        document.body.appendChild(a); a.click(); a.remove();
        const ok = done - errors;
        summary.textContent = `✓ ${ok} file${ok !== 1 ? 's' : ''} encrypted` +
            (errors ? ` · ${errors} failed` : '') + ' — ZIP downloaded.';
        summary.style.color = errors ? 'var(--warning)' : 'var(--success)';
    } catch(e) {
        summary.textContent = 'ZIP error: ' + e.message;
        summary.style.color = 'var(--danger)';
    }
}

/* ---------------------------------------------------------------
   RUN BATCH DECRYPT — reads zip, decrypts each .enc, re-zips results
--------------------------------------------------------------- */
async function runBatchDecrypt() {
    if (!batchZipFile) { alert('Drop a vault-encrypted ZIP file first.'); return; }
    const key = document.getElementById('batch-key').value;
    if (!key) { alert('Enter the decryption key.'); return; }
    if (!window.JSZip) { alert('JSZip not loaded.'); return; }

    const progressWrap = document.getElementById('batch-progress');
    const progressFill = document.getElementById('batch-progress-fill');
    const summary      = document.getElementById('batch-summary');
    progressWrap.style.display = 'block';
    progressFill.style.width   = '0%';
    summary.style.color = '';
    summary.textContent = 'Reading ZIP...';

    // Load the source ZIP
    let sourceZip;
    try {
        const buf = await batchZipFile.arrayBuffer();
        sourceZip = await JSZip.loadAsync(buf);
    } catch(e) {
        summary.textContent = 'Could not open ZIP: ' + e.message;
        summary.style.color = 'var(--danger)';
        return;
    }

    const entries = Object.keys(sourceZip.files).filter(n => !sourceZip.files[n].dir);
    const outZip  = new JSZip();
    let done = 0, errors = 0;

    for (const entryName of entries) {
        const safeId   = entryName.replace(/\W/g, '_');
        const statusEl = document.getElementById('bs-' + safeId);
        if (statusEl) { statusEl.textContent = '⟳'; statusEl.style.color = 'var(--text-muted)'; }

        try {
            // Extract .enc bytes from the zip
            const encBytes = await sourceZip.files[entryName].async('arraybuffer');
            const encBlob  = new Blob([encBytes]);

            // Determine original filename (strip .enc suffix if present)
            const origName = entryName.endsWith('.enc') ? entryName.slice(0, -4) : entryName;

            // Send to backend for decryption
            const formData = new FormData();
            formData.append('file', new File([encBlob], entryName));
            formData.append('key', key);
            formData.append('mode', 'decrypt');
            formData.append('format', 'original');

            const res = await fetch(BACKEND + 'file', { method: 'POST', body: formData });
            if (res.ok) {
                const decBuf = await res.arrayBuffer();
                // Try to get the original filename from Content-Disposition header
                let fname = origName;
                const disp = res.headers.get('Content-Disposition');
                if (disp && disp.includes('filename=')) {
                    fname = disp.split('filename=')[1].replace(/"/g, '');
                }
                outZip.file(fname, decBuf);
                if (statusEl) { statusEl.textContent = '✓'; statusEl.style.color = 'var(--success)'; }
            } else {
                errors++;
                if (statusEl) { statusEl.textContent = '✕'; statusEl.style.color = 'var(--danger)'; }
            }
        } catch(e) {
            errors++;
            if (statusEl) { statusEl.textContent = '✕'; statusEl.style.color = 'var(--danger)'; }
        }

        done++;
        progressFill.style.width = Math.round((done / entries.length) * 100) + '%';
        summary.textContent = `Decrypting ${done} / ${entries.length}...`;
    }

    if (done - errors === 0) {
        summary.textContent = '✕ All files failed — wrong key?';
        summary.style.color = 'var(--danger)';
        return;
    }

    summary.textContent = 'Generating decrypted ZIP...';
    try {
        const outBlob = await outZip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(outBlob);
        const a   = document.createElement('a');
        a.href = url;
        a.download = 'vault-decrypted-' + Date.now() + '.zip';
        document.body.appendChild(a); a.click(); a.remove();
        const ok = done - errors;
        summary.textContent = `✓ ${ok} file${ok !== 1 ? 's' : ''} decrypted` +
            (errors ? ` · ${errors} failed` : '') + ' — ZIP downloaded.';
        summary.style.color = errors ? 'var(--warning)' : 'var(--success)';
    } catch(e) {
        summary.textContent = 'ZIP error: ' + e.message;
        summary.style.color = 'var(--danger)';
    }
}


/* ===============================================================
   SHAREABLE ENCRYPTED LINKS
=============================================================== */
function generateShareLink() {
    const txt = document.getElementById('text-output').textContent.trim();
    const placeholders = ['Waiting for encryption...','Encrypting stream...','Decrypting stream...','System wiped.'];
    if (!txt || placeholders.includes(txt)) {
        alert('Encrypt something first to generate a shareable link.');
        return;
    }
    const encoded = encodeURIComponent(txt);
    const shareUrl = window.location.origin + window.location.pathname + '#vault=' + encoded;
    document.getElementById('share-link-content').textContent = shareUrl;
    document.getElementById('share-file-section').style.display = 'none';
    document.getElementById('shareModal').classList.add('open');
    animateModalOpen('shareModal');
}

// Share an encrypted FILE via base64 URL fragment (practical for files < ~500KB)
async function generateFileShareLink(encBlob, filename) {
    if (encBlob.size > 512 * 1024) {
        // Too large for URL — show the "send the .enc file directly" guidance
        document.getElementById('share-link-content').textContent =
            'File too large for a URL link (' + (encBlob.size / 1024).toFixed(0) + ' KB). ' +
            'Share the downloaded .enc file directly via email, WhatsApp, or Google Drive, ' +
            'and send the password separately.';
        document.getElementById('share-file-section').style.display = 'none';
        document.getElementById('shareModal').classList.add('open');
        animateModalOpen('shareModal');
        return;
    }
    // Convert blob to base64
    const reader = new FileReader();
    reader.onload = () => {
        const b64 = reader.result.split(',')[1];
        const encoded = encodeURIComponent(b64);
        const meta = encodeURIComponent(filename || 'file.enc');
        const shareUrl = window.location.origin + window.location.pathname +
                         '#vault-file=' + encoded + '&vfn=' + meta;
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
            setTimeout(() => { btn.textContent = '&#x1F4CB; Copy Link'; }, 2000);
        });
    } else {
        legacyCopy(url, () => {
            btn.textContent = '✓ Copied!';
            setTimeout(() => { btn.textContent = '&#x1F4CB; Copy Link'; }, 2000);
        });
    }
}

// On page load — handle both #vault= (text) and #vault-file= (file) fragments
(function checkShareFragment() {
    const hash = window.location.hash;
    if (!hash.startsWith('#vault')) return;
    setTimeout(() => {
        try {
            if (hash.startsWith('#vault-file=')) {
                // File share — decode base64, offer download
                const params = new URLSearchParams(hash.slice(1));
                const b64  = decodeURIComponent(params.get('vault-file') || '');
                const fname = decodeURIComponent(params.get('vfn') || 'shared.enc');
                if (!b64) return;
                const byteChars = atob(b64);
                const bytes = new Uint8Array(byteChars.length);
                for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
                const blob = new Blob([bytes]);
                const url  = URL.createObjectURL(blob);
                // Switch to file tab and show a hint
                const fileTab = document.querySelectorAll('.tab')[1];
                if (fileTab) switchTab('file', fileTab);
                const out = document.getElementById('file-output');
                out.style.color = 'var(--neon-cyan)';
                out.innerHTML = '&#x1F517; Shared encrypted file loaded from link.<br>' +
                    '<small style="color:var(--text-muted)">Download it first, then use it in the decrypt form.</small>';
                // Auto-trigger download of the .enc file
                const a = document.createElement('a');
                a.href = url; a.download = fname;
                document.body.appendChild(a); a.click(); a.remove();
                showToast('Shared file downloaded — enter password and decrypt');
            } else if (hash.startsWith('#vault=')) {
                // Text share
                const ciphertext = decodeURIComponent(hash.slice(7));
                const textTab = document.querySelector('.tab');
                if (textTab) switchTab('text', textTab);
                document.getElementById('message').value = ciphertext;
                document.getElementById('text-output').textContent =
                    'Shared ciphertext loaded — enter the password and click Decrypt.';
                document.getElementById('text-output').style.color = 'var(--neon-cyan)';
            }
            history.replaceState(null, '', window.location.pathname);
        } catch(e) {}
    }, 3500);
})();

/* Auto-refresh logs every 5s */
setInterval(fetchLogs, 5000);