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
      'link[rel="stylesheet"][href^="../"]',
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
      'a[href^="../"], a[href^="./"], a[href$="index.html"]',
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
  let facilityHighlightTimer = null;
  const smoothScrollTo = (targetId, options = {}) => {
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const isFacility = targetElement.classList.contains("facility-item");
      const updateHash = options.updateHash !== false;
      const headerOffset = document.querySelector(".page-header").offsetHeight; // ヘッダーの高さを取得
      const elementPosition =
        targetElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerOffset - 20; // ヘッダーと少し余白を考慮

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      if (updateHash && window.location.hash !== targetId) {
        window.history.pushState(null, "", targetId);
      } else if (!updateHash && window.location.hash) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
      }

      if (isFacility) {
        if (facilityHighlightTimer) {
          window.clearTimeout(facilityHighlightTimer);
        }
        document
          .querySelectorAll(".facility-item.anchor-highlight")
          .forEach((item) => item.classList.remove("anchor-highlight"));
        targetElement.classList.remove("anchor-highlight");
        window.requestAnimationFrame(() => {
          targetElement.classList.add("anchor-highlight");
        });
        facilityHighlightTimer = window.setTimeout(() => {
          targetElement.classList.remove("anchor-highlight");
          facilityHighlightTimer = null;
        }, 2400);
      }
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
      hamburger.setAttribute("aria-expanded", "false");
    };

    // ハンバーガーボタンクリックでメニューを開閉
    hamburger.addEventListener("click", function () {
      const willOpen = !body.classList.contains("side-menu-open");
      hamburger.classList.toggle("is-open", willOpen);
      body.classList.toggle("side-menu-open", willOpen);
      hamburger.setAttribute("aria-expanded", String(willOpen));
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

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && body.classList.contains("side-menu-open")) {
        closeMenu();
        hamburger.focus();
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
    let lastModalTrigger = null;

    // モーダルを開く共通関数
    const openModal = (imageElement) => {
      if (imageElement) {
        lastModalTrigger = imageElement.closest(".map-container-clickable");
        mapModal.style.display = "block";
        modalImg.src = imageElement.src;
        modalImg.alt = `${imageElement.alt}の拡大表示`;
        body.classList.add("modal-open");
        closeModal.focus();
      }
    };

    // モーダルを閉じる共通関数
    const closeMapModal = () => {
      mapModal.style.display = "none";
      body.classList.remove("modal-open");
      if (lastModalTrigger) {
        lastModalTrigger.focus();
      }
    };

    // クリック可能な全てのコンテナ (地図と見取り図) にイベントリスナーを設定
    const clickableContainers = document.querySelectorAll(
      ".map-container-clickable",
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
            smoothScrollTo(hotspotLink.getAttribute("href"), {
              updateHash: false,
            });
          } else if (window.innerWidth <= 768) {
            // ホットスポット以外がクリックされ、かつスマホ表示の場合のみ拡大
            openModal(imageToZoom);
          }
        } else if (container.id === "map-container") {
          // 地図の場合のクリック処理
          if (hotspotLink) {
            event.preventDefault();
            smoothScrollTo(hotspotLink.getAttribute("href"), {
              updateHash: false,
            });
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
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && body.classList.contains("modal-open")) {
        closeMapModal();
      }
    });
  }

  /* ===================================================
     現代的なページナビゲーションとスクロール演出
     =================================================== */
  const progressBar = document.querySelector(".scroll-progress span");
  let scrollUpdateQueued = false;

  const updateScrollUi = () => {
    const scrollableHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollRatio =
      scrollableHeight > 0 ? Math.min(window.scrollY / scrollableHeight, 1) : 0;

    if (progressBar) {
      progressBar.style.transform = `scaleX(${scrollRatio})`;
    }
    scrollUpdateQueued = false;
  };

  const requestScrollUiUpdate = () => {
    if (!scrollUpdateQueued) {
      scrollUpdateQueued = true;
      window.requestAnimationFrame(updateScrollUi);
    }
  };

  window.addEventListener("scroll", requestScrollUiUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUiUpdate);
  updateScrollUi();

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("has-reveal-motion");
    const revealTargets = document.querySelectorAll(
      ".service-guide-card, .request-card, .member-card, .facility-item, .location-item, .guild-history-note, .guild-exterior",
    );

    revealTargets.forEach((target, index) => {
      target.classList.add("reveal-item");
      target.style.setProperty("--reveal-order", String(index % 4));
    });

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
      },
    );

    revealTargets.forEach((target) => revealObserver.observe(target));
  }

  const sectionLinks = Array.from(
    document.querySelectorAll('.page-nav a[href^="#"]'),
  );
  const sectionLinkMap = new Map(
    sectionLinks.map((link) => [link.getAttribute("href").slice(1), link]),
  );
  const observedSections = Array.from(sectionLinkMap.keys())
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ("IntersectionObserver" in window && observedSections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;
        sectionLinks.forEach((link) => {
          link.classList.remove("active");
          link.removeAttribute("aria-current");
        });
        const activeLink = sectionLinkMap.get(visibleEntry.target.id);
        if (activeLink) {
          activeLink.classList.add("active");
          activeLink.setAttribute("aria-current", "location");
        }
      },
      {
        rootMargin: "-22% 0px -62% 0px",
        threshold: [0, 0.1, 0.35],
      },
    );

    observedSections.forEach((section) => sectionObserver.observe(section));
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
  // ヒドラ討伐ソロ！の画像パスリストとランキングデータをJSONから取得
  fetch("data/hydra_ranking.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      const hydraImagePaths = data.imagePaths; // JSONから画像パスを取得
      const hydraRanking = data.ranking; // JSONからランキングデータを取得

      // ランキングデータをIDでグループ化するマップを作成
      const hydraRankingMap = hydraRanking.reduce((acc, player) => {
        if (!acc[player.id]) {
          acc[player.id] = [];
        }
        acc[player.id].push(player);
        return acc;
      }, {});

      // Swiper スライドを動的に生成
      const swiperWrapper = document.querySelector(
        ".hydra-swiper .swiper-wrapper",
      );
      if (swiperWrapper && hydraImagePaths) {
        hydraImagePaths.forEach((path) => {
          const slide = document.createElement("div");
          slide.classList.add("swiper-slide");

          const img = document.createElement("img");
          img.src = path;
          const imageId = parseInt(path.split("/").pop().split(".")[0]); // ファイル名からIDを抽出
          img.alt = `ヒドラ討伐ソロ！挑戦者ID: ${imageId}`;
          img.loading = "lazy";
          slide.appendChild(img);

          // 画像IDをデータ属性として追加
          slide.dataset.hydraId = imageId;

          // ホバーイベントリスナーを追加
          slide.addEventListener("mouseenter", (event) => {
            const id = parseInt(event.currentTarget.dataset.hydraId);
            const players = hydraRankingMap[id];

            if (players && players.length > 0) {
              let tooltip = document.createElement("div");
              tooltip.classList.add("hydra-tooltip");

              players.forEach((player) => {
                const playerInfo = document.createElement("p");
                playerInfo.innerHTML = `
                  <strong>${player.name}</strong><br>
                  ターン数: ${player.turns === 99 ? "失敗" : player.turns}<br>
                  討伐本数: ${player.kills}<br>
                  ステータス: ${player.status}
                `;
                tooltip.appendChild(playerInfo);
              });

              // ツールチップをスライドの上に配置
              event.currentTarget.appendChild(tooltip);
            }
          });

          slide.addEventListener("mouseleave", (event) => {
            const tooltip = event.currentTarget.querySelector(".hydra-tooltip");
            if (tooltip) {
              tooltip.remove();
            }
          });

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
    })
    .catch((error) => console.error("Error loading hydra data:", error));
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
            nameElement.textContent.trim(),
          );
        }
      }
    }
  });
}

// ページ読み込み時にギルドスタッフのカードにもフォントサイズ調整を適用
adjustStaffCardFontSizes();

// --- 長い一覧を「すべて見る」で段階表示する機能 ---
document.querySelectorAll(".content-expand-button").forEach((button) => {
  const contentId = button.getAttribute("aria-controls");
  const content = contentId ? document.getElementById(contentId) : null;
  const label = button.querySelector("span");

  if (!content || !label) {
    return;
  }

  button.addEventListener("click", () => {
    const willExpand = button.getAttribute("aria-expanded") !== "true";
    content.classList.toggle("is-expanded", willExpand);
    button.setAttribute("aria-expanded", String(willExpand));
    label.textContent = willExpand
      ? button.dataset.collapseLabel
      : button.dataset.expandLabel;
  });
});

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
          Math.floor(Math.random() * glitchChars.length),
        );
        levelElement.textContent = `Lv${glitchChar}`;
      }, 150);
    } else {
      levelElement.textContent = `Lv${level}`;
    }

    card.insertBefore(levelElement, card.firstChild);
  }
});

// --- ギルドスタッフの詳しい紹介ダイアログ ---
const staffDialog = document.getElementById("staff-profile-dialog");
if (staffDialog) {
  const dialogImage = staffDialog.querySelector(".staff-dialog-image");
  const dialogName = staffDialog.querySelector("#staff-dialog-name");
  const dialogJob = staffDialog.querySelector(".staff-dialog-job");
  const dialogLevel = staffDialog.querySelector(".staff-dialog-level");
  const dialogDescription = staffDialog.querySelector(
    ".staff-dialog-description",
  );
  const dialogClose = staffDialog.querySelector(".staff-dialog-close");
  let lastStaffDialogTrigger = null;

  memberCards.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "staff-profile-button";
    button.innerHTML =
      '<span>詳しい紹介を見る</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';

    button.addEventListener("click", () => {
      const image = card.querySelector("img");
      const name = card.querySelector(".character-name");
      const job = card.querySelector(".character-job");
      const level = card.querySelector(".adventurer-level");
      const description = card.querySelector(".member-desc");

      dialogImage.src = image?.src || "";
      dialogImage.alt = image?.alt || "";
      dialogName.textContent = name?.textContent.trim() || "";
      dialogJob.textContent = job?.textContent.trim() || "";
      dialogLevel.textContent = level?.textContent.trim() || "";
      dialogDescription.replaceChildren();

      const sectionTitles = (card.dataset.profileSections || "紹介").split(
        "|",
      );
      const descriptionParts = (description?.innerHTML || "")
        .split(/<br\s*\/?>/gi)
        .map((part) => part.trim())
        .filter(Boolean);

      descriptionParts.forEach((descriptionHtml, index) => {
        const section = document.createElement("section");
        section.className = "staff-dialog-section";

        const heading = document.createElement("h4");
        heading.textContent =
          sectionTitles[index] || `補足 ${String(index + 1)}`;

        const paragraph = document.createElement("p");
        paragraph.innerHTML = descriptionHtml;

        section.append(heading, paragraph);
        dialogDescription.appendChild(section);
      });

      lastStaffDialogTrigger = button;
      document.body.classList.add("staff-dialog-open");
      staffDialog.showModal();
    });

    card.appendChild(button);
  });

  const closeStaffDialog = () => {
    staffDialog.close();
  };

  dialogClose.addEventListener("click", closeStaffDialog);
  staffDialog.addEventListener("click", (event) => {
    if (event.target === staffDialog) {
      closeStaffDialog();
    }
  });
  staffDialog.addEventListener("close", () => {
    document.body.classList.remove("staff-dialog-open");
    lastStaffDialogTrigger?.focus();
  });
}
