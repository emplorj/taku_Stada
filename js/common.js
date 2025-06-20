(function(d) {
    var config = {
        kitId: 'wia6iii',
        scriptTimeout: 3000,
        async: true
    },
    h = d.documentElement,
    t = setTimeout(function() {
        h.className = h.className.replace(/\bwf-loading\b/g, "") + " wf-inactive";
    }, config.scriptTimeout),
    tk = d.createElement("script"),
    f = false,
    s = d.getElementsByTagName("script")[0],
    a;
    h.className += " wf-loading";
    tk.src = 'https://use.typekit.net/' + config.kitId + '.js';
    tk.async = true;
    tk.onload = tk.onreadystatechange = function() {
        a = this.readyState;
        if (f || a && a != "complete" && a != "loaded") return;
        f = true;
        clearTimeout(t);
        try {
            Typekit.load(config)
        } catch (e) {}
    };
    s.parentNode.insertBefore(tk, s)
})(document);
// common.js (完全版)

// ==========================================================================
// 1. グローバルスコープの関数と定数
// ==========================================================================
const TRPG_SYSTEM_COLORS = { 'CoC': '#93c47d', 'CoC-㊙': '#6aa84f', 'SW': '#ea9999', 'SW2.5': '#ea9999', 'DX3': '#cc4125', 'サタスペ': '#e69138', 'マモブル': '#ffe51f', '銀剣': '#0788bb', 'ネクロニカ': '#505050', 'ウマ娘': '#ffa1d8', 'シノビガミ': '#8e7cc3', 'AR': '#ffd966', 'default': '#007bff' };
function topFunction() { document.body.scrollTop = 0; document.documentElement.scrollTop = 0; }
function copyCodeToClipboard(elementId) { const codeElement = document.getElementById(elementId); if (codeElement) { const codeToCopy = codeElement.querySelector('code').innerText; navigator.clipboard.writeText(codeToCopy).then(() => { alert('コピーしました！'); }).catch(err => { console.error('コピーに失敗しました: ', err); alert('コピーに失敗しました。'); }); } }

/**
 * CSV文字列を解析し、行の配列として返します。
 * - ダブルクォート内のカンマや改行は無視します。
 * - 連続するダブルクォート ("") は単一のダブルクォートとして扱います。
 * @param {string} csvText 解析するCSV文字列。
 * @returns {string[][]} 各行が文字列の配列である2次元配列。
 */
function parseCsvToArray(csvText) {
    const rows = [];
    let inQuotes = false;
    let currentRow = [];
    let currentField = "";
    const text = csvText.trim().replace(/\r\n|\r/g, "\n"); // 改行コードを統一
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            if (inQuotes && text[i + 1] === '"') { // エスケープされたダブルクォート
                currentField += '"';
                i++; // 次の文字をスキップ
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            currentRow.push(currentField);
            currentField = "";
        } else if (char === "\n" && !inQuotes) {
            currentRow.push(currentField);
            rows.push(currentRow);
            currentRow = [];
            currentField = "";
        } else {
            currentField += char;
        }
    }
    currentRow.push(currentField); // 最後のフィールドを追加
    rows.push(currentRow); // 最後の行を追加
    return rows;
}

// ==========================================================================
// 2. ページ読み込み時の共通処理
// ==========================================================================
document.addEventListener('DOMContentLoaded', function() {

    const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    const basePath = isLocal ? '' : '/taku_Stada';

   // --- Faviconを動的に挿入する ---
   function injectFaviconLinks() {
       const head = document.head;
       const favicons = [
           { rel: 'icon', href: `${basePath}/img/favicon.ico` },
           { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${basePath}/img/favicon-32x32.png` },
           { rel: 'icon', type: 'image/png', sizes: '16x16', href: `${basePath}/img/favicon-16x16.png` },
           { rel: 'apple-touch-icon', sizes: '180x180', href: `${basePath}/img/apple-touch-icon.png` }
       ];

       favicons.forEach(faviconInfo => {
           const link = document.createElement('link');
           Object.keys(faviconInfo).forEach(key => {
               link.setAttribute(key, faviconInfo[key]);
           });
           head.appendChild(link);
       });
   }

    // --- 共通ヘッダーを読み込み、リンクを修正する ---
    async function loadHeader() {
        const placeholder = document.getElementById('header-placeholder');
        if (!placeholder) return;
        try {
            const response = await fetch(`${basePath}/header.html`);
            if (response.ok) {
                const html = await response.text();
                placeholder.innerHTML = html;

                // DOMの準備が整うのを待ってから初期化処理を実行
                setTimeout(() => {
                    const sideMenu = document.getElementById('tableOfContents');
                    if (sideMenu) {
                        const links = sideMenu.querySelectorAll('a');
                        links.forEach(link => {
                            const originalHref = link.getAttribute('href');
                            if (originalHref && !originalHref.startsWith('http') && !originalHref.startsWith('#')) {
                                const url = new URL(link.href);
                                if(url.pathname.endsWith('.html')) {
                                   link.href = `${basePath}/${originalHref}`;
                                }
                            }
                        });
                    }
                    initializeHamburgerMenu();
                    initializeSubMenu();
                }, 0);

            } else { console.error('Failed to fetch header.html:', response.statusText); }
        } catch (error) { console.error('Error fetching header.html:', error); }
    }

    // --- ハンバーガーメニューの制御 ---
    function initializeHamburgerMenu() {
        const hamburger = document.getElementById('hamburger-menu');
        const sideMenu = document.getElementById('tableOfContents');
        const overlay = document.getElementById('menu-overlay');

        if (hamburger && sideMenu && overlay) {
            const toggleMenu = (isOpen) => {
                hamburger.classList.toggle('is-open', isOpen);
                sideMenu.classList.toggle('is-open', isOpen);
                overlay.classList.toggle('is-open', isOpen);
                document.body.classList.toggle('no-scroll', isOpen);
            };
            hamburger.addEventListener('click', () => toggleMenu(!sideMenu.classList.contains('is-open')));
            overlay.addEventListener('click', () => toggleMenu(false));
        }
    }

    // --- サブメニューの制御 ---
    function initializeSubMenu() {
        const submenuTriggers = document.querySelectorAll('.submenu-trigger');
        submenuTriggers.forEach(trigger => {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                this.classList.toggle('active');
                const submenu = this.nextElementSibling;
                if (submenu && submenu.classList.contains('submenu')) {
                    if (submenu.style.maxHeight) {
                        submenu.style.maxHeight = null;
                    } else {
                        submenu.style.maxHeight = submenu.scrollHeight + "px";
                    }
                }
            });
        });
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

    // --- Swiperスライダーの初期化 ---
    function initializeSwiperSlider() {
        const worksLists = document.querySelectorAll('.works-list-container'); // 親コンテナを対象にする
        if (worksLists.length === 0) return;

        let swiperInstances = [];

        const setupSwiper = () => {
            const isMobile = window.innerWidth <= 1080;

            if (isMobile) {
                // スマホ表示: スライダーを初期化
                if (swiperInstances.length > 0) return; // 既に初期化済みなら何もしない

                worksLists.forEach(container => {
                    const list = container.querySelector('ul');
                    if (!list) return;
                    
                    list.classList.add('swiper');
                    const items = Array.from(list.children);
                    const wrapper = document.createElement('div');
                    wrapper.className = 'swiper-wrapper';
                    items.forEach(item => {
                        item.classList.add('swiper-slide');
                        wrapper.appendChild(item);
                    });
                    list.appendChild(wrapper);

                    const swiper = new Swiper(list, {
                        loop: true,
                        slidesPerView: 'auto',
                        spaceBetween: 15,
                        centeredSlides: true,
                        autoplay: {
                            delay: 2500,
                            disableOnInteraction: false,
                        },
                    });
                    swiperInstances.push(swiper);
                });
            } else {
                // PC表示: スライダーを破棄
                if (swiperInstances.length === 0) return; // 破棄済みなら何もしない

                swiperInstances.forEach(swiper => swiper.destroy(true, true));
                swiperInstances = [];
            }
        };

        // Swiperライブラリの読み込み（一度だけ）
        if (!document.querySelector('script[src*="swiper"]')) {
            const swiperCss = document.createElement('link');
            swiperCss.rel = 'stylesheet';
            swiperCss.href = 'https://unpkg.com/swiper/swiper-bundle.min.css';
            document.head.appendChild(swiperCss);

            const swiperJs = document.createElement('script');
            swiperJs.src = 'https://unpkg.com/swiper/swiper-bundle.min.js';
            document.head.appendChild(swiperJs);
            
            swiperJs.onload = setupSwiper;
        } else {
            setupSwiper();
        }

        window.addEventListener('resize', setupSwiper);
    }

    // --- 初期化の実行 ---
    loadHeader();
    injectFaviconLinks();
    initializeSwiperSlider();
});

// (パーティクルアニメーションのコードは変更なし)
const canvas=document.getElementById("particleCanvas");if(canvas){const ctx=canvas.getContext("2d");let particles=[];const particleCount=80,particleSize=1.5,particleColor="rgba(255, 255, 255, 0.4)";function resizeCanvas(){canvas.width=window.innerWidth,canvas.height=window.innerHeight,initParticles()}class Particle{constructor(){this.x=Math.random()*canvas.width,this.y=Math.random()*canvas.height,this.size=Math.random()*(2*particleSize-particleSize/2)+particleSize/2,this.speedX=.4*Math.random()-.2,this.speedY=.4*Math.random()-.2}update(){this.x+=this.speedX,this.y+=this.speedY,this.x>canvas.width+this.size?this.x=-this.size:this.x<-this.size&&(this.x=canvas.width+this.size),this.y>canvas.height+this.size?this.y=-this.size:this.y<-this.size&&(this.y=canvas.height+this.size)}draw(){ctx.fillStyle=particleColor,ctx.beginPath(),ctx.arc(this.x,this.y,this.size,0,2*Math.PI),ctx.fill()}}function initParticles(){particles=[];for(let i=0;i<particleCount;i++)particles.push(new Particle)}function animateParticles(){requestAnimationFrame(animateParticles),ctx.clearRect(0,0,canvas.width,canvas.height);for(let i=0;i<particles.length;i++)particles[i].update(),particles[i].draw()}window.addEventListener("load",()=>{resizeCanvas(),animateParticles()}),window.addEventListener("resize",resizeCanvas)}