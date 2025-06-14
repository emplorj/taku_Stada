// common.js (現在の完全版・変更不要)

// ==========================================================================
// 1. グローバルスコープの関数と定数
// ==========================================================================
const TRPG_SYSTEM_COLORS = { 'CoC': '#93c47d', 'CoC-㊙': '#6aa84f', 'SW': '#ea9999', 'SW2.5': '#ea9999', 'DX3': '#cc4125', 'サタスペ': '#e69138', 'マモブル': '#ffe51f', '銀剣': '#0788bb', 'ネクロニカ': '#505050', 'ウマ娘': '#ffa1d8', 'シノビガミ': '#8e7cc3', 'AR': '#ffd966', 'default': '#007bff' };
function topFunction() { document.body.scrollTop = 0; document.documentElement.scrollTop = 0; }
function copyCodeToClipboard(elementId) { const codeElement = document.getElementById(elementId); if (codeElement) { const codeToCopy = codeElement.querySelector('code').innerText; navigator.clipboard.writeText(codeToCopy).then(() => { alert('コピーしました！'); }).catch(err => { console.error('コピーに失敗しました: ', err); alert('コピーに失敗しました。'); }); } }

// ==========================================================================
// 2. ページ読み込み時の共通処理
// ==========================================================================
document.addEventListener('DOMContentLoaded', function() {
    
    const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    const basePath = isLocal ? '' : '/taku_Stada';

    async function loadHeader() {
        const placeholder = document.getElementById('header-placeholder');
        if (!placeholder) return;
        try {
            const response = await fetch(`${basePath}/header.html`);
            if (response.ok) {
                const html = await response.text();
                placeholder.innerHTML = html;
                
                const sideMenu = document.getElementById('tableOfContents');
                if (sideMenu) {
                    const links = sideMenu.querySelectorAll('a');
                    links.forEach(link => {
                        const originalHref = link.getAttribute('href');
                        if (originalHref.startsWith('http')) return;
                        
                        // 絶対パスに変換
                        const url = new URL(originalHref, window.location.href);
                        // GitHub Pages用のパスに書き換え
                        if (!isLocal) {
                            const pathSegments = url.pathname.split('/').filter(Boolean);
                            const newPath = `/${pathSegments.join('/')}`;
                            link.href = `${basePath}${newPath}${url.hash}`;
                        } else {
                             link.href = url.href;
                        }
                    });
                }
                initializeLogo();
                initializeHamburgerMenu();
            } else { console.error('Failed to fetch header.html:', response.statusText); }
        } catch (error) { console.error('Error fetching header.html:', error); }
    }

    function initializeLogo() {
        const logoPlaceholder = document.getElementById('home-logo-placeholder');
        if (logoPlaceholder) {
            logoPlaceholder.innerHTML = `<a href="${basePath}/" class="home-logo-link"><img src="${basePath}/img/卓スタダロゴ.png" alt="トップページに戻る" class="home-logo"></a>`;
        }
    }

    function initializeHamburgerMenu() {
        const hamburger = document.getElementById('hamburger-menu');
        const sideMenu = document.getElementById('tableOfContents');
        const overlay = document.getElementById('menu-overlay');
        if (hamburger && sideMenu && overlay) {
            const toggleMenu = (isOpen) => {
                sideMenu.classList.toggle('is-open', isOpen);
                overlay.classList.toggle('is-open', isOpen);
                document.body.classList.toggle('no-scroll', isOpen);
            };
            hamburger.addEventListener('click', () => toggleMenu(!sideMenu.classList.contains('is-open')));
            overlay.addEventListener('click', () => toggleMenu(false));
            sideMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => setTimeout(() => toggleMenu(false), 150));
            });
        }
    }

    const backToTopBtn = document.getElementById("backToTopBtn");
    if (backToTopBtn) {
        const scrollHandlerForBackToTop = () => {
            if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
                if (!backToTopBtn.classList.contains('show')) backToTopBtn.classList.add('show');
            } else {
                if (backToTopBtn.classList.contains('show')) backToTopBtn.classList.remove('show');
            }
        };
        window.addEventListener('scroll', scrollHandlerForBackToTop);
        scrollHandlerForBackToTop();
    }

    loadHeader();
});

// ==========================================================================
// 3. パーティクルアニメーション
// ==========================================================================
const canvas = document.getElementById('particleCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const particleCount = 80, particleSize = 1.5, particleColor = 'rgba(255, 255, 255, 0.4)';
    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initParticles(); }
    class Particle { constructor() { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.size = Math.random() * (2 * particleSize - particleSize / 2) + particleSize / 2; this.speedX = .4 * Math.random() - .2; this.speedY = .4 * Math.random() - .2; } update() { this.x += this.speedX; this.y += this.speedY; this.x > canvas.width + this.size ? this.x = -this.size : this.x < -this.size && (this.x = canvas.width + this.size); this.y > canvas.height + this.size ? this.y = -this.size : this.y < -this.size && (this.y = canvas.height + this.size); } draw() { ctx.fillStyle = particleColor; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI); ctx.fill(); } }
    function initParticles() { particles = []; for (let i = 0; i < particleCount; i++) particles.push(new Particle()); }
    function animateParticles() { requestAnimationFrame(animateParticles); ctx.clearRect(0, 0, canvas.width, canvas.height); for (let i = 0; i < particles.length; i++) particles[i].update(), particles[i].draw(); }
    window.addEventListener('load', () => { resizeCanvas(); animateParticles(); });
    window.addEventListener('resize', resizeCanvas);
}

// ==========================================================================
// 5. 共通カスタムプルダウン機能
// ==========================================================================
function initializeAllCustomSelects() {
    document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
        const originalSelect = wrapper.querySelector('select');
        if (!originalSelect) return;
        if (wrapper.querySelector('.custom-select-trigger')) return;

        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        trigger.innerHTML = `<span></span><div class="arrow"></div>`;
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-select-options';

        Array.from(originalSelect.options).forEach(optionEl => {
            const customOption = document.createElement('div');
            customOption.className = 'custom-option';
            customOption.textContent = optionEl.textContent;
            customOption.dataset.value = optionEl.value;
            if(optionEl.dataset.font) {
                customOption.style.fontFamily = `'${optionEl.dataset.font}', sans-serif`;
            }

            customOption.addEventListener('click', (e) => {
                e.stopPropagation();
                originalSelect.value = optionEl.value;
                originalSelect.dispatchEvent(new Event('change', { bubbles: true }));
                wrapper.classList.remove('open');
            });
            optionsContainer.appendChild(customOption);
        });

        wrapper.prepend(trigger);
        wrapper.appendChild(optionsContainer);
        originalSelect.style.display = 'none';

        originalSelect.addEventListener('change', () => updateCustomSelectDisplay(originalSelect));
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select-wrapper.open').forEach(w => {
                if (w !== wrapper) w.classList.remove('open');
            });
            const rect = trigger.getBoundingClientRect();
            optionsContainer.style.top = `${rect.bottom}px`;
            optionsContainer.style.left = `${rect.left}px`;
            optionsContainer.style.width = `${rect.width}px`;
            wrapper.classList.toggle('open');
        });
        
        updateCustomSelectDisplay(originalSelect);
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-wrapper.open').forEach(wrapper => {
            wrapper.classList.remove('open');
        });
    });

    window.updateCustomSelectDisplay = (selectElement) => {
        const wrapper = selectElement.closest('.custom-select-wrapper');
        if (!wrapper) return;
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        
        if (trigger && selectedOption) {
            trigger.querySelector('span').textContent = selectedOption.textContent;
            const font = selectedOption.dataset.font || selectElement.value;
            trigger.style.fontFamily = font === 'HigashiOme-Gothic-C' ? '' : `'${font}', sans-serif`;
        }
        
        const optionsContainer = wrapper.querySelector('.custom-select-options');
        if (optionsContainer) {
            optionsContainer.querySelectorAll('.custom-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.value === selectElement.value);
            });
        }
    };
}
document.addEventListener('DOMContentLoaded', initializeAllCustomSelects);