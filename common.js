// common.js (完全版)

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

    // --- 共通ヘッダーを読み込み、リンクを修正する ---
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
                        link.href = `${basePath}/${originalHref}`;
                    });
                }
                
                initializeLogo();
                initializeHamburgerMenu();
            } else { console.error('Failed to fetch header.html:', response.statusText); }
        } catch (error) { console.error('Error fetching header.html:', error); }
    }

    // --- ロゴの動的挿入 (リンクを修正) ---
    function initializeLogo() {
        const logoPlaceholder = document.getElementById('home-logo-placeholder');
        if (logoPlaceholder) {
            logoPlaceholder.innerHTML = `<a href="${basePath}/" class="home-logo-link"><img src="${basePath}/img/卓スタダロゴ.png" alt="トップページに戻る" class="home-logo"></a>`;
        }
    }

    // --- ハンバーガーメニューの制御 ---
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

    // --- 初期化の実行 ---
    loadHeader();
});

// (パーティクルアニメーションのコードは変更なし)
const canvas=document.getElementById("particleCanvas");if(canvas){const ctx=canvas.getContext("2d");let particles=[];const particleCount=80,particleSize=1.5,particleColor="rgba(255, 255, 255, 0.4)";function resizeCanvas(){canvas.width=window.innerWidth,canvas.height=window.innerHeight,initParticles()}class Particle{constructor(){this.x=Math.random()*canvas.width,this.y=Math.random()*canvas.height,this.size=Math.random()*(2*particleSize-particleSize/2)+particleSize/2,this.speedX=.4*Math.random()-.2,this.speedY=.4*Math.random()-.2}update(){this.x+=this.speedX,this.y+=this.speedY,this.x>canvas.width+this.size?this.x=-this.size:this.x<-this.size&&(this.x=canvas.width+this.size),this.y>canvas.height+this.size?this.y=-this.size:this.y<-this.size&&(this.y=canvas.height+this.size)}draw(){ctx.fillStyle=particleColor,ctx.beginPath(),ctx.arc(this.x,this.y,this.size,0,2*Math.PI),ctx.fill()}}function initParticles(){particles=[];for(let i=0;i<particleCount;i++)particles.push(new Particle)}function animateParticles(){requestAnimationFrame(animateParticles),ctx.clearRect(0,0,canvas.width,canvas.height);for(let i=0;i<particles.length;i++)particles[i].update(),particles[i].draw()}window.addEventListener("load",()=>{resizeCanvas(),animateParticles()}),window.addEventListener("resize",resizeCanvas)}