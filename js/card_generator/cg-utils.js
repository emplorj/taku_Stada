// js/cg-utils.js

(function () {
  if (window.CG) return; // すでに定義済みの場合は何もしない

  const CG_UTILS = {
    // HTML特殊文字をエスケープする
    escapeHtml: (s) => {
      return (s ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
    },

    // 句読点を半角に置換する
    replacePunctuation: (text) => {
      if (!text) return "";
      return text.replace(/、/g, "､").replace(/。/g, "｡");
    },

    // DOMテキスト用の字詰めはCanvas化により不要
    // カスタムアラートを表示する
    showCustomAlert: (message) => {
      const alertModal = document.createElement("div");
      alertModal.className = "custom-modal-overlay";
      alertModal.innerHTML = `
        <div class="custom-modal-content">
            <p>${message.replace(/\n/g, "<br>")}</p>
            <button id="custom-alert-ok-btn" class="primary-button">OK</button>
        </div>`;
      document.body.appendChild(alertModal);
      const okBtn = document.getElementById("custom-alert-ok-btn");
      okBtn.focus();
      const removeModal = () => document.body.removeChild(alertModal);
      okBtn.addEventListener("click", removeModal);
      alertModal.addEventListener("click", (e) => {
        if (e.target === alertModal) removeModal();
      });
    },

    // カスタム確認ダイアログを表示する
    showCustomConfirm: (message) => {
      return new Promise((resolve) => {
        const confirmModal = document.createElement("div");
        confirmModal.className = "custom-modal-overlay";
        confirmModal.innerHTML = `
          <div class="custom-modal-content">
              <p>${message.replace(/\n/g, "<br>")}</p>
              <div class="custom-modal-actions">
                  <button id="custom-confirm-ok-btn" class="primary-button">はい</button>
                  <button id="custom-confirm-cancel-btn" class="secondary-button">いいえ</button>
              </div>
          </div>`;
        document.body.appendChild(confirmModal);
        const okBtn = document.getElementById("custom-confirm-ok-btn");
        const cancelBtn = document.getElementById("custom-confirm-cancel-btn");
        const removeModal = (value) => {
          document.body.removeChild(confirmModal);
          resolve(value);
        };
        okBtn.addEventListener("click", () => removeModal(true));
        cancelBtn.addEventListener("click", () => removeModal(false));
        confirmModal.addEventListener("click", (e) => {
          if (e.target === confirmModal) removeModal(false);
        });
        okBtn.focus();
      });
    },

    // CSVをパースする
    parseCsv: (csvText) => {
      const results = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });
      return results.data;
    },

    parseDatabaseCsv: (csvText) => {
      const results = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });
      return results.data.reverse();
    },

    // HEXからRGBへ変換
    hexToRgb: (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    },

    // 輝度を取得
    getLuminance: (hex) => {
      if (!hex || !hex.startsWith("#")) return 0;
      const rgb = CG_UTILS.hexToRgb(hex);
      if (!rgb) return 0;
      return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
    },
  };

  window.CG_UTILS = CG_UTILS;
})();
