document.addEventListener('DOMContentLoaded', function() {

  // --- ヘッダーのスクロールエフェクト ---
  const header = document.querySelector('.page-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // --- 「戻る」リンクのパスを修正 (GitHub Pages対応) ---
  // common.jsで定義されたbasePathを利用
  const backLink = document.querySelector('.page-nav a[href="../index.html"]');
  if (backLink && typeof basePath !== 'undefined') {
    backLink.href = basePath; // プロジェクトのルートURLに直接リンク (basePathに末尾スラッシュがあるのでこれでOK)
  }

  // --- 247_guild/index.html内のパスを修正 (GitHub Pages対応) ---
  if (typeof basePath !== 'undefined') {
    // CSSリンクの修正
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"][href^="../"]');
    cssLinks.forEach(link => {
      const originalHref = link.getAttribute('href');
      if (originalHref) {
        link.href = basePath + originalHref.replace('../', '');
      }
    });

    // 画像パスの修正
    const images = document.querySelectorAll('img[src^="../"]');
    images.forEach(img => {
      const originalSrc = img.getAttribute('src');
      if (originalSrc) {
        img.src = basePath + originalSrc.replace('../', '');
      }
    });

    // リンクの修正 (a[href^="../"] または a[href^="."])
    const links = document.querySelectorAll('a[href^="../"], a[href^="./"], a[href$="index.html"]'); // index.htmlで終わるリンクも対象に
    links.forEach(link => {
      const originalHref = link.getAttribute('href');
      if (originalHref) {
        const url = new URL(link.href); // ブラウザが解決した絶対URLを取得
        const pathname = url.pathname; // パス名部分を取得

        if (pathname.endsWith('index.html')) { // index.htmlへのリンクはbasePathのみにする
          link.href = basePath;
        } else if (originalHref.startsWith('../')) {
          link.href = basePath + originalHref.replace('../', '');
        } else if (originalHref.startsWith('./')) {
          link.href = basePath + '247_guild/' + originalHref.replace('./', '');
        }
      }
    });
  }

  // --- 注目の冒険者さん 機能 (REVISED) ---
  const setupFeaturedAdventurers = async () => {
    const container = document.querySelector('#members .member-list');
    if (!container) return;
    container.innerHTML = '<p>読み込み中...</p>';

    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=1134936986&single=true&output=csv';

    try {
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(csvUrl)}`);
      if (!response.ok) throw new Error(`CSVの取得に失敗: ${response.statusText}`);
      const csvText = await response.text();

      // Use a simple split-based parser, assuming no newlines within fields.
      const allRows = csvText.trim().split('\n').map(row => row.split(','));
      const dataRows = allRows.slice(2); // Skip first two rows

      const adventurers = dataRows.map(row => ({
        name:        row[5] ? row[5].trim() : '',
        appearances: row[6] ? row[6].trim() : '',
        pl:          row[4] ? row[4].trim() : '',
        race:        row[7] ? row[7].trim() : '',
        birth:       row[11] ? row[11].trim() : '', // '生まれ'
        cl:          row[8] ? row[8].trim() : '', // CL (AL)
      })).filter(adv => adv.name && adv.appearances && !isNaN(parseInt(adv.appearances, 10)));

      const featuredCandidates = adventurers.filter(adv => parseInt(adv.appearances, 10) >= 1);

      if (featuredCandidates.length === 0) {
        container.innerHTML = '<p>注目の冒険者さんは現在いません。</p>';
        return;
      }

      const shuffled = featuredCandidates.sort(() => 0.5 - Math.random());
      const selectedAdventurers = shuffled.slice(0, Math.min(3, shuffled.length));

      container.innerHTML = '';
      selectedAdventurers.forEach(adv => {
        const card = createAdventurerCard(adv);
        container.appendChild(card);
      });

    } catch (error) {
      console.error('注目の冒険者さん機能でエラー:', error);
      container.innerHTML = '<p>情報の読み込みに失敗しました。</p>';
    }
  };

  const createAdventurerCard = (adventurer) => {
    const card = document.createElement('div');
    card.className = 'member-card adventurer-feature-card';

    const name = adventurer.name || '名前不明';
    const plName = adventurer.pl || 'PL不明';
    const race = adventurer.race || '種族不明';
    const birth = adventurer.birth || '生まれ不明';
    const cl = adventurer.cl || '?';

    card.innerHTML = `
        <div class="adventurer-level">Lv${cl}</div>
        <h3>${name}</h3>
        <p class="member-spec">${race} / ${birth}</p>
        <p class="pl-name">PL: ${plName}</p>
    `;
    return card;
  };

  setupFeaturedAdventurers();
  /* ===================================================
     ギルドサイト専用ハンバーガーメニュー機能
     =================================================== */
  const hamburger = document.querySelector('.hamburger-menu');
  const nav = document.querySelector('.page-nav');
  const body = document.body;

  if (hamburger && nav) {
    // メニューを閉じる共通関数
    const closeMenu = () => {
      hamburger.classList.remove('is-open');
      body.classList.remove('side-menu-open');
    };

    // ハンバーガーボタンクリックでメニューを開閉
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('is-open');
      body.classList.toggle('side-menu-open');
    });

    // ナビゲーションリンククリックでメニューを閉じる
    const navLinks = nav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // メニュー外をクリックでメニューを閉じる
    document.addEventListener('click', function(event) {
      // メニューが開いている場合、かつ、クリックされた要素が
      // ナビゲーションメニュー内でもハンバーガーボタン内でもない場合
      if (body.classList.contains('side-menu-open') &&
          !nav.contains(event.target) &&
          !hamburger.contains(event.target)) {
        closeMenu();
      }
    });
  }

  /* ===================================================
     地図モーダル機能
     =================================================== */
  const mapModal = document.getElementById('map-modal');
  if (mapModal) {
    const modalImg = document.getElementById('modal-map-image');
    const closeModal = document.querySelector('.map-modal-close');
    const body = document.body;
    
    // スムーズスクロール関数
    const smoothScrollTo = (targetId) => {
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        console.log('Target Element:', targetElement);
        const headerOffset = document.querySelector('.page-header').offsetHeight; // ヘッダーの高さを取得
        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset - 20; // ヘッダーと少し余白を考慮
        console.log('Calculated Offset Position:', offsetPosition);

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    };

    // モーダルを開く共通関数
    const openModal = (imageElement) => {
      if (imageElement) {
        mapModal.style.display = 'block';
        modalImg.src = imageElement.src;
        body.classList.add('modal-open');
      }
    };

    // モーダルを閉じる共通関数
    const closeMapModal = () => {
      mapModal.style.display = 'none';
      body.classList.remove('modal-open');
    };

    // クリック可能な全てのコンテナ (地図と見取り図) にイベントリスナーを設定
    const clickableContainers = document.querySelectorAll('.map-container-clickable');
    clickableContainers.forEach(container => {
      container.addEventListener('click', (event) => {
        // クリックされた要素がホットスポットのリンクかどうかを判定
        // floor-plan-hotspot と map-hotspot の両方に対応
        const hotspotLink = event.target.closest('.floor-plan-hotspot a') || event.target.closest('.map-hotspot a');
        const imageToZoom = container.querySelector('img');

        if (container.id === 'floor-plan-clickable') {
          // 見取り図の場合のクリック処理
          if (hotspotLink) {
            // ホットスポットがクリックされたら施設案内へジャンプ
            //event.preventDefault(); // デフォルトのリンク動作をキャンセル
            // CSS側でスクロールを制御するため、JSでの処理は不要に。
            // smoothScrollTo(hotspotLink.getAttribute('href'));
          } else if (window.innerWidth <= 768) {
            // ホットスポット以外がクリックされ、かつスマホ表示の場合のみ拡大
            openModal(imageToZoom);
          }
        } else if (container.id === 'map-container') {
          // 地図の場合のクリック処理
          if (hotspotLink) {
            event.preventDefault();
            // CSS側でスクロールを制御するため、JSでの処理は不要に。
            // smoothScrollTo(hotspotLink.getAttribute('href'));
          } else if (window.innerWidth <= 768) {
            // ホットスポット以外がクリックされ、かつスマホ表示の場合のみ拡大
            openModal(imageToZoom);
          }
        } else if (container.id === 'sabanae-map') {
          // サバナイ地図の場合のクリック処理
          if (window.innerWidth <= 768) {
            openModal(imageToZoom);
          }
        }
       });
     });

    // 閉じるイベントの設定
    closeModal.addEventListener('click', closeMapModal);
    mapModal.addEventListener('click', (event) => {
      if (event.target === mapModal) {
        closeMapModal();
      }
    });
  }
});

/* ===================================================
   ヒドラスライドショー初期化
   =================================================== */
document.addEventListener('DOMContentLoaded', function() {
  // Swiperライブラリが読み込まれているか確認
  if (typeof Swiper !== 'undefined') {
    const hydraSwiper = new Swiper('.hydra-swiper', {
      // --- 基本設定 ---
      loop: true,           // ループ再生を有効に
      centeredSlides: true, // アクティブなスライドを中央に配置
      
      // --- 自動再生 ---
      autoplay: {
        delay: 2000,                  // 4秒ごとにスライド
        disableOnInteraction: false,  // ユーザーが操作した後も自動再生を続ける
        pauseOnMouseEnter: true,      // マウスが乗ったら停止
      },
      
      // --- ページネーション（下部の丸いボタン） ---
      pagination: {
        el: '.swiper-pagination',
        clickable: true, // クリックでそのスライドに飛べるように
      },

      // --- ナビゲーション（左右の矢印） ---
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },

      // --- 画面サイズごとの設定（レスポンシブ） ---
      breakpoints: {
        // 画面幅が640px以上の場合
        640: {
          slidesPerView: 1,
          spaceBetween: 20 // スライド間の余白
        },
        // 画面幅が768px以上の場合
        768: {
          slidesPerView: 2,
          spaceBetween: 15
        },
        // 画面幅が1024px以上の場合
        1024: {
          slidesPerView: 4,
          spaceBetween: 10 // ★間隔を少し詰めました
        }
      }
    });
  }
});