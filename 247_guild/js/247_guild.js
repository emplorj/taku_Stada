document.addEventListener("DOMContentLoaded", function () {
  // --- ヘッダーのスクロールエフェクト ---
  const header = document.querySelector(".page-header");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    });
  }

  // --- 「戻る」リンクのパスを修正 (GitHub Pages対応) ---
  // common.jsで定義されたbasePathを利用
  const backLink = document.querySelector('.page-nav a[href="../index.html"]');
  if (backLink && typeof basePath !== "undefined") {
    backLink.href = basePath; // プロジェクトのルートURLに直接リンク (basePathに末尾スラッシュがあるのでこれでOK)
  }

  // --- 247_guild/index.html内のパスを修正 (GitHub Pages対応) ---
  if (typeof basePath !== "undefined") {
    // CSSリンクの修正
    const cssLinks = document.querySelectorAll(
      'link[rel="stylesheet"][href^="../"]'
    );
    cssLinks.forEach((link) => {
      const originalHref = link.getAttribute("href");
      if (originalHref) {
        link.href = basePath + originalHref.replace("../", "");
      }
    });

    // 画像パスの修正
    const images = document.querySelectorAll('img[src^="../"]');
    images.forEach((img) => {
      const originalSrc = img.getAttribute("src");
      if (originalSrc) {
        img.src = basePath + originalSrc.replace("../", "");
      }
    });

    // リンクの修正 (a[href^="../"] または a[href^="."])
    const links = document.querySelectorAll(
      'a[href^="../"], a[href^="./"], a[href$="index.html"]'
    ); // index.htmlで終わるリンクも対象に
    links.forEach((link) => {
      const originalHref = link.getAttribute("href");
      if (originalHref) {
        const url = new URL(link.href); // ブラウザが解決した絶対URLを取得
        const pathname = url.pathname; // パス名部分を取得

        if (pathname.endsWith("index.html")) {
          // index.htmlへのリンクはbasePathのみにする
          link.href = basePath;
        } else if (originalHref.startsWith("../")) {
          link.href = basePath + originalHref.replace("../", "");
        } else if (originalHref.startsWith("./")) {
          link.href = basePath + "247_guild/" + originalHref.replace("./", "");
        }
      }
    });
  }

  // スムーズスクロール関数
  const smoothScrollTo = (targetId) => {
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const headerOffset = document.querySelector(".page-header").offsetHeight; // ヘッダーの高さを取得
      const elementPosition =
        targetElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerOffset - 20; // ヘッダーと少し余白を考慮

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  /* ===================================================
     ギルドサイト専用ハンバーガーメニュー機能
     =================================================== */
  const hamburger = document.querySelector(".hamburger-menu");
  const nav = document.querySelector(".page-nav");
  const body = document.body;

  if (hamburger && nav) {
    // メニューを閉じる共通関数
    const closeMenu = () => {
      hamburger.classList.remove("is-open");
      body.classList.remove("side-menu-open");
    };

    // ハンバーガーボタンクリックでメニューを開閉
    hamburger.addEventListener("click", function () {
      hamburger.classList.toggle("is-open");
      body.classList.toggle("side-menu-open");
    });

    // ナビゲーションリンククリックでメニューを閉じる & スムーズスクロール
    const navLinks = nav.querySelectorAll("a");
    navLinks.forEach((link) => {
      link.addEventListener("click", function (event) {
        const href = this.getAttribute("href");
        // ページ内リンクの場合のみスムーズスクロール
        if (href && href.startsWith("#")) {
          event.preventDefault(); // デフォルトのアンカーリンク動作をキャンセル
          const targetId = href;
          smoothScrollTo(targetId);
        }
        // どのリンクをクリックしてもメニューは閉じる
        closeMenu();
      });
    });

    // メニュー外をクリックでメニューを閉じる
    document.addEventListener("click", function (event) {
      // メニューが開いている場合、かつ、クリックされた要素が
      // ナビゲーションメニュー内でもハンバーガーボタン内でもない場合
      if (
        body.classList.contains("side-menu-open") &&
        !nav.contains(event.target) &&
        !hamburger.contains(event.target)
      ) {
        closeMenu();
      }
    });
  }

  /* ===================================================
     地図モーダル機能
     =================================================== */
  const mapModal = document.getElementById("map-modal");
  if (mapModal) {
    const modalImg = document.getElementById("modal-map-image");
    const closeModal = document.querySelector(".map-modal-close");
    const body = document.body;

    // モーダルを開く共通関数
    const openModal = (imageElement) => {
      if (imageElement) {
        mapModal.style.display = "block";
        modalImg.src = imageElement.src;
        body.classList.add("modal-open");
      }
    };

    // モーダルを閉じる共通関数
    const closeMapModal = () => {
      mapModal.style.display = "none";
      body.classList.remove("modal-open");
    };

    // クリック可能な全てのコンテナ (地図と見取り図) にイベントリスナーを設定
    const clickableContainers = document.querySelectorAll(
      ".map-container-clickable"
    );
    clickableContainers.forEach((container) => {
      container.addEventListener("click", (event) => {
        // クリックされた要素がホットスポットのリンクかどうかを判定
        const hotspotLink =
          event.target.closest(".floor-plan-hotspot a") ||
          event.target.closest(".map-hotspot a");
        const imageToZoom = container.querySelector("img");

        if (container.id === "floor-plan-clickable") {
          // 見取り図の場合のクリック処理
          if (hotspotLink) {
            // ホットスポットがクリックされたら施設案内へジャンプ
            event.preventDefault();
            smoothScrollTo(hotspotLink.getAttribute("href"));
          } else if (window.innerWidth <= 768) {
            // ホットスポット以外がクリックされ、かつスマホ表示の場合のみ拡大
            openModal(imageToZoom);
          }
        } else if (container.id === "map-container") {
          // 地図の場合のクリック処理
          if (hotspotLink) {
            event.preventDefault();
            smoothScrollTo(hotspotLink.getAttribute("href"));
          } else if (window.innerWidth <= 768) {
            openModal(imageToZoom);
          }
        } else if (container.id === "sabanae-map") {
          // サバナイ地図の場合のクリック処理
          if (window.innerWidth <= 768) {
            openModal(imageToZoom);
          }
        }
      });
    });

    // 閉じるイベントの設定
    closeModal.addEventListener("click", closeMapModal);
    mapModal.addEventListener("click", (event) => {
      if (event.target === mapModal) {
        closeMapModal();
      }
    });
  }
  // 「戻る」リンクの機能
  const backToPreviousPageLink = document.getElementById("back-link");
  if (backToPreviousPageLink) {
    backToPreviousPageLink.addEventListener("click", function (event) {
      event.preventDefault(); // デフォルトのリンク動作をキャンセル
      history.back(); // 直前のページに戻る
    });
  }

  /* ===================================================
     ヒドラスライドショー初期化
     =================================================== */
  // ヒドラ討伐ソロ！の画像パスリスト
  const hydraImagePaths = [
    "img/hydra/1.png",
    "img/hydra/2.png",
    "img/hydra/3.png",
    "img/hydra/4.png",
    "img/hydra/5.png",
    "img/hydra/6.png",
    "img/hydra/7.png",
    "img/hydra/8.png",
    "img/hydra/9.png",
    "img/hydra/10.png",
    "img/hydra/11.png",
    "img/hydra/12.png",
  ];

  // Swiper スライドを動的に生成
  const swiperWrapper = document.querySelector(".hydra-swiper .swiper-wrapper");
  if (swiperWrapper) {
    hydraImagePaths.forEach((path) => {
      const slide = document.createElement("div");
      slide.classList.add("swiper-slide");
      const img = document.createElement("img");
      img.src = path;
      img.alt = path.split("/").pop().split(".")[0]; // ファイル名からaltテキストを生成
      img.loading = "lazy";
      slide.appendChild(img);
      swiperWrapper.appendChild(slide);
    });
  }

  // Swiperライブラリが読み込まれていれば、スライドショーを初期化
  if (typeof Swiper !== "undefined") {
    const hydraSwiper = new Swiper(".hydra-swiper", {
      loop: true,
      centeredSlides: true,
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: {
        640: {
          slidesPerView: 1,
          spaceBetween: 20,
        },
        768: {
          slidesPerView: 2,
          spaceBetween: 15,
        },
        1024: {
          slidesPerView: 4,
          spaceBetween: 10,
        },
      },
    });
  }
});

// --- 名前の長さに応じてフォントサイズを調整する機能 ---
// （featured-character.jsのグローバル関数 `getCharacterNameClass` を利用します）
function adjustStaffCardFontSizes() {
  const staffCards = document.querySelectorAll("#staff .member-card");
  staffCards.forEach((card) => {
    const nameElement = card.querySelector("h3.character-name");
    if (nameElement) {
      // ラズヒェル・リリベラードはインラインスタイルで処理されるため、ここでは何もしない
      if (nameElement.textContent.trim() !== "ラズヒェル・リリベラード") {
        // windowオブジェクト経由でグローバル関数を呼び出す
        if (typeof window.getCharacterNameClass === "function") {
          nameElement.className = window.getCharacterNameClass(
            nameElement.textContent.trim()
          );
        }
      }
    }
  });
}

// ページ読み込み時にギルドスタッフのカードにもフォントサイズ調整を適用
adjustStaffCardFontSizes();

// --- ギルドスタッフにも冒険者レベルを表示する機能 ---
const memberCards = document.querySelectorAll("#staff .member-card");
memberCards.forEach((card) => {
  const level = card.dataset.adventurerLevel;
  if (level) {
    const levelElement = document.createElement("div");
    levelElement.className = "adventurer-level";

    if (level === "???") {
      const glitchChars =
        "█縲繝繧繝輔ぃ繧ｮ繧ｹ繝√繧ク繝ュ繝ォ繝｡繧｢繧ｨ繧ｪ繧ｶ繧ｷ繧ｹ繧ｾ繧ｿ繝√ヂ繝・繝ヱ繝セ繝";
      setInterval(() => {
        const glitchChar = glitchChars.charAt(
          Math.floor(Math.random() * glitchChars.length)
        );
        levelElement.textContent = `Lv${glitchChar}`;
      }, 150);
    } else {
      levelElement.textContent = `Lv${level}`;
    }

    card.insertBefore(levelElement, card.firstChild);
  }
});
