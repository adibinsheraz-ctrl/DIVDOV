// DIVDOV Engine & App Controller
let data = [];
let fuse = null;

// Global Element References
let searchInput, viewCategories, viewResults, viewPrivacy, resultsList, resultsTitle;

// Three.js Particle Engine (Upgraded to Plexus Style)
function init3D() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const count = 250;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 1000;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;

        velocities[i * 3] = (Math.random() - 0.5) * 0.5;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ 
        color: 0xbfff00, 
        size: 3, 
        transparent: true, 
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    group.add(particles);

    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xbfff00, 
        transparent: true, 
        opacity: 0.2,
        blending: THREE.AdditiveBlending 
    });
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    group.add(lineMesh);

    camera.position.z = 600;

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.1;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.1;
    });

    function animate() {
        requestAnimationFrame(animate);
        
        const posArray = geometry.attributes.position.array;
        const linePositions = [];
        
        for (let i = 0; i < count; i++) {
            posArray[i * 3] += velocities[i * 3];
            posArray[i * 3 + 1] += velocities[i * 3 + 1];
            posArray[i * 3 + 2] += velocities[i * 3 + 2];

            if (Math.abs(posArray[i * 3]) > 500) velocities[i * 3] *= -1;
            if (Math.abs(posArray[i * 3 + 1]) > 500) velocities[i * 3 + 1] *= -1;
            if (Math.abs(posArray[i * 3 + 2]) > 500) velocities[i * 3 + 2] *= -1;

            for (let j = i + 1; j < count; j++) {
                const dx = posArray[i * 3] - posArray[j * 3];
                const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
                const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < 150) {
                    linePositions.push(posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2]);
                    linePositions.push(posArray[j * 3], posArray[j * 3 + 1], posArray[j * 3 + 2]);
                }
            }
        }

        geometry.attributes.position.needsUpdate = true;
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

        group.rotation.y += 0.001;
        group.rotation.x += (mouseY * 0.0005);
        group.rotation.z += (mouseX * 0.0005);
        
        camera.position.x += (mouseX - camera.position.x) * 0.05;
        camera.position.y += (-mouseY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
        
        renderer.render(scene, camera);
    }
    animate();
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// App Logic
async function init() {
    // Select Elements safely inside init
    searchInput = document.getElementById('search-input');
    viewCategories = document.getElementById('view-categories');
    viewResults = document.getElementById('view-results');
    viewPrivacy = document.getElementById('view-privacy');
    resultsList = document.getElementById('results-list');
    resultsTitle = document.getElementById('results-title');

    if (!searchInput) {
        console.error("Search input not found!");
        return;
    }

    try {
        const res = await fetch('src/data/data.json');
        if (!res.ok) throw new Error("Data load failed");
        data = await res.json();
        
        fuse = new Fuse(data, {
            keys: ['title', 'description', 'category', 'subcategory'],
            threshold: 0.3,
            distance: 100
        });

        init3D();
        renderCategories();
        
        // Input Listener
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.length > 2) {
                if (!fuse) return;
                const results = fuse.search(query).slice(0, 50).map(r => r.item);
                showResults(results, `Searching: ${query}`);
            } else if (query.length === 0) {
                showHome();
            }
        });

        // Enter Key Support
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value;
                if (query.length > 0 && fuse) {
                    const results = fuse.search(query).slice(0, 50).map(r => r.item);
                    showResults(results, `Search: ${query}`);
                }
            }
        });

    } catch (e) { 
        console.error("Init Error:", e);
        // Show fallback categories even if search data fails
        init3D();
    }
}

function getCategoryStyle(c) {
    const l = c.toLowerCase();
    if (l.includes('ai') || l.includes('intelligence')) return { theme: 'theme-ai', icon: 'zap' };
    if (l.includes('audio') || l.includes('video') || l.includes('media') || l.includes('streaming')) return { theme: 'theme-media', icon: 'play' };
    if (l.includes('dev') || l.includes('code') || l.includes('programming') || l.includes('web')) return { theme: 'theme-dev', icon: 'code' };
    if (l.includes('game') || l.includes('steam') || l.includes('emulator')) return { theme: 'theme-games', icon: 'gamepad-2' };
    if (l.includes('android') || l.includes('apk')) return { theme: 'theme-android', icon: 'smartphone' };
    if (l.includes('ios') || l.includes('mac') || l.includes('apple')) return { theme: 'theme-apple', icon: 'apple' };
    if (l.includes('social') || l.includes('discord') || l.includes('reddit') || l.includes('twitter')) return { theme: 'theme-social', icon: 'share-2' };
    if (l.includes('privacy') || l.includes('security') || l.includes('vpn') || l.includes('antivirus')) return { theme: 'theme-security', icon: 'shield-check' };
    if (l.includes('tool') || l.includes('system') || l.includes('file')) return { theme: 'theme-dev', icon: 'wrench' };
    if (l.includes('download') || l.includes('torrent')) return { theme: 'theme-media', icon: 'download-cloud' };
    return { theme: '', icon: 'box' };
}

function renderCategories() {
    if (!data.length) return;
    const cats = [...new Set(data.map(i => i.category))].sort();
    viewCategories.innerHTML = cats.map((c, i) => {
        const { theme, icon } = getCategoryStyle(c);
        return `
            <div class="card ${theme}" onclick="showCategory('${c}')" style="animation-delay: ${i * 0.05}s">
                <div class="icon-box">
                    <i data-lucide="${icon}"></i>
                </div>
                <h3>${c}</h3>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function showCategory(c) {
    const results = data.filter(i => i.category === c);
    showResults(results, c);
}

function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m];
    });
}

function showResults(results, title) {
    resultsTitle.innerText = title;
    viewCategories.style.display = 'none';
    viewResults.style.display = 'block';
    resultsList.innerHTML = results.map(r => `
        <div class="res-item fade-in">
            <div style="flex: 1;">
                <h4 style="font-family: 'Syne', sans-serif; margin-bottom: 4px; background: var(--gradient-2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; width: fit-content;">${escapeHTML(r.title)}</h4>
                <p style="font-size: 0.8rem; color: #888; margin-bottom: 8px;">${escapeHTML(r.description) || 'Secure tool.'}</p>
                <div style="font-size: 0.65rem; color: var(--accent); font-weight: 800;" class="mono">${escapeHTML(r.subcategory) || 'General'}</div>
            </div>
            <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="uiverse" style="text-decoration: none;">
                <div class="wrapper">
                    <span>VISIT</span>
                    <div class="circle circle-12"></div>
                    <div class="circle circle-11"></div>
                    <div class="circle circle-10"></div>
                    <div class="circle circle-9"></div>
                    <div class="circle circle-8"></div>
                    <div class="circle circle-7"></div>
                    <div class="circle circle-6"></div>
                    <div class="circle circle-5"></div>
                    <div class="circle circle-4"></div>
                    <div class="circle circle-3"></div>
                    <div class="circle circle-2"></div>
                    <div class="circle circle-1"></div>
                </div>
            </a>
        </div>
    `).join('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showHome() {
    viewCategories.style.display = 'grid';
    viewResults.style.display = 'none';
    viewPrivacy.style.display = 'none';
    searchInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPrivacy() {
    viewCategories.style.display = 'none';
    viewResults.style.display = 'none';
    viewPrivacy.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function quickSearch(q) {
    if (!fuse) return;
    searchInput.value = q;
    const results = fuse.search(q).slice(0, 50).map(r => r.item);
    showResults(results, `Quick Search: ${q}`);
}

// Export to window for HTML onclicks
window.showCategory = showCategory;
window.showHome = showHome;
window.showPrivacy = showPrivacy;
window.quickSearch = quickSearch;

// Run Init
init();

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW Registered'))
            .catch(err => console.log('SW Failed', err));
    });
}

// PWA Install Logic
let deferredPrompt;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'block';
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBtn.style.display = 'none';
        }
        deferredPrompt = null;
    });
}

window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.style.display = 'none';
    deferredPrompt = null;
});
