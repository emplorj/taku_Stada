// common.js (最終版)

// ==========================================================================
// 1. グローバルスコープの関数と定数
// ==========================================================================

// TRPGシステム共通の色定義
const TRPG_SYSTEM_COLORS = {
    'CoC': '#93c47d',
    'CoC-㊙': '#6aa84f',
    'SW': '#ea9999',
    'SW2.5': '#ea9999',
    'DX3': '#cc4125',
    'サタスペ': '#e69138',
    'マモブル': '#ffe51f',
    '銀剣': '#0788bb',
    'ネクロニカ': '#505050',
    'ウマ娘': '#ffa1d8',
    'シノビガミ': '#8e7cc3',
    'AR': '#ffd966', // アリアンロッドと仮定
    'default': '#007bff' // 未定義システム用のデフォルト色
};

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}
function copyCodeToClipboard(elementId) {
    const codeElement = document.getElementById(elementId);
    if (codeElement) {
        const codeToCopy = codeElement.querySelector('code').innerText;
        navigator.clipboard.writeText(codeToCopy).then(() => {
            alert('コピーしました！');
        }).catch(err => {
            console.error('コピーに失敗しました: ', err);
            alert('コピーに失敗しました。');
        });
    }
}

// ==========================================================================
// 2. DOMContentLoaded イベントリスナー（共通機能のみ）
// ==========================================================================
document.addEventListener('DOMContentLoaded', function() {

    // A. ロゴの動的挿入
    const placeholder = document.getElementById('home-logo-placeholder');
    if (placeholder) {
        placeholder.innerHTML = `<a href="index.html" class="home-logo-link"><img src="img/卓スタダロゴ.png" alt="トップページに戻る" class="home-logo"></a>`;
    }

    // B. Back to Top ボタンのスクロール制御
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

    // C. ハンバーガーメニューの制御
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
        sideMenu.querySelectorAll('a').forEach(link => { // ★セレクタを 'a' に変更
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    const targetElement = document.getElementById(href.substring(1));
                    if (targetElement) {
                        e.preventDefault();
                        const offsetTop = targetElement.offsetTop - 80;
                        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                    }
                }
                // ページ遷移の邪魔にならないよう、少し待ってからメニューを閉じる
                setTimeout(() => toggleMenu(false), 150);
            });
        });
    }
    
    // D. 目次アクティブ状態の更新
    const sideMenuLinks = document.querySelectorAll('#tableOfContents a[href^="#"]');
    if (sideMenuLinks.length > 0) {
        const sections = Array.from(sideMenuLinks).map(link => document.getElementById(link.getAttribute('href').substring(1))).filter(Boolean);
        if (sections.length > 0) {
            const scrollHandlerForToc = () => {
                let currentSectionId = '';
                const scrollPosition = window.scrollY;
                sections.forEach(section => {
                    if (scrollPosition >= section.offsetTop - 100) {
                        currentSectionId = section.id;
                    }
                });
                sideMenuLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${currentSectionId}`);
                });
            };
            window.addEventListener('scroll', scrollHandlerForToc);
            scrollHandlerForToc();
        }
    }
});

// ==========================================================================
// 3. パーティクルアニメーション（DOM読み込みとは独立して実行）
// ==========================================================================
const canvas = document.getElementById('particleCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const particleCount = 80;
    const particleSize = 1.5;
    const particleColor = 'rgba(255, 255, 255, 0.4)';
    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initParticles(); }
    class Particle { constructor() { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.size = Math.random() * (particleSize * 2 - particleSize / 2) + particleSize / 2; this.speedX = Math.random() * 0.4 - 0.2; this.speedY = Math.random() * 0.4 - 0.2; } update() { this.x += this.speedX; this.y += this.speedY; if (this.x > canvas.width + this.size) this.x = -this.size; if (this.x < -this.size) this.x = canvas.width + this.size; if (this.y > canvas.height + this.size) this.y = -this.size; if (this.y < -this.size) this.y = canvas.height + this.size; } draw() { ctx.fillStyle = particleColor; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); } }
    function initParticles() { particles = []; for (let i = 0; i < particleCount; i++) { particles.push(new Particle()); } }
    function animateParticles() { requestAnimationFrame(animateParticles); ctx.clearRect(0, 0, canvas.width, canvas.height); for (let i = 0; i < particles.length; i++) { particles[i].update(); particles[i].draw(); } }
    window.addEventListener('load', () => { resizeCanvas(); animateParticles(); });
    window.addEventListener('resize', resizeCanvas);
}