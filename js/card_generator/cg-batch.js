// js/card_generator/cg-batch.js (完全修正版)

(function () {
  const S = window.CG_STATE;
  const UI = window.CG_UI_ELEMENTS;
  const { showCustomAlert, parseCsv } = window.CG_UTILS;

  const BATCH = {
    handleBatchFileUpload: (event) => {
      const file = event.target.files[0];
      if (!file) return;
      UI.batchFileName.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          if (file.name.endsWith(".json")) {
            S.batchData = JSON.parse(content);
          } else if (file.name.endsWith(".csv")) {
            S.batchData = parseCsv(content).map((item) => ({
              cardName: item["カード名"],
              color: S.colorNameToIdMap[item["色"]] || "青",
              type: item["タイプ"],
              background:
                item["背景"] === "◇"
                  ? "hologram_geometric.png"
                  : item["背景"] === "☆"
                  ? "hologram_glitter.png"
                  : "",
              image: item["イラスト"],
              effect: item["効果説明"],
              flavor: item["フレーバー"],
              speaker: item["フレーバー名"],
              sparkle: (item["キラ"] || "").toLowerCase() === "true",
            }));
          } else {
            throw new Error("サポートされていないファイル形式です。");
          }
          UI.batchDownloadBtn.disabled = false;
          showCustomAlert(
            `${S.batchData.length}件のカードデータを読み込みました。`
          );
        } catch (error) {
          console.error("ファイル処理エラー:", error);
          showCustomAlert(`エラー: ${error.message}`);
          UI.batchFileName.textContent = "選択されていません";
          UI.batchDownloadBtn.disabled = true;
          S.batchData = [];
        }
      };
      reader.readAsText(file);
    },

    handleImageFolderUpload: (event) => {
      const files = event.target.files;
      if (files.length === 0) return;
      S.localImageFiles = {};
      for (const file of files) {
        S.localImageFiles[file.name] = URL.createObjectURL(file);
      }
      UI.imageFolderName.textContent = `${files.length}個の画像を選択`;
    },

    processBatchDownload: async () => {
      if (S.batchData.length === 0) return;
      const zip = new JSZip();
      UI.batchDownloadBtn.disabled = true;
      UI.batchProgress.style.display = "block";
      const originalState = S.getCurrentGeneratorState();

      // スケールを一時的に解除
      const originalTransform = UI.previewPanel.style.transform;
      UI.previewPanel.style.transform = "none";

      try {
        for (let i = 0; i < S.batchData.length; i++) {
          const cardData = S.batchData[i];
          UI.batchProgress.textContent = `処理中... (${i + 1}/${
            S.batchData.length
          })`;
          await window.CG_DB.loadCardDataIntoGenerator(cardData, false);

          await Promise.all([
            window.CG_IMAGE.waitForCardImages(),
            document.fonts.ready,
          ]);
          await new Promise((r) => setTimeout(r, 200));

          try {
            const fileName = `${(cardData.cardName || `card_${i + 1}`).replace(
              /[()`]/g,
              ""
            )}.png`;
            let imageBlob;
            if (cardData.sparkle) {
              imageBlob = await window.CG_IMAGE.createSparkleApngBlob();
            } else {
              const canvas = await html2canvas(UI.cardContainer, {
                backgroundColor: null,
                useCORS: true,
                scale: UI.highResCheckbox.checked ? 2 : 1,
              });
              imageBlob = await new Promise((resolve) =>
                canvas.toBlob(resolve, "image/png")
              );
            }
            if (imageBlob && imageBlob.size > 0) {
              zip.file(fileName, imageBlob);
            } else {
              throw new Error("Generated image blob is empty.");
            }
          } catch (err) {
            console.error(
              `カード[${cardData.cardName || i + 1}]の生成失敗:`,
              err
            );
            zip.file(
              `ERROR_${cardData.cardName || i + 1}.txt`,
              `エラー: ${err.message}`
            );
          }
        }
      } finally {
        // スケールを元に戻す
        UI.previewPanel.style.transform = originalTransform;
        await window.CG_DB.restoreGeneratorState(originalState);
      }

      UI.batchProgress.textContent = "ZIP圧縮中...";
      zip.generateAsync({ type: "blob" }).then((content) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "cards_batch.zip";
        link.click();
        URL.revokeObjectURL(link.href);
        UI.batchProgress.textContent = "完了！";
        setTimeout(() => {
          UI.batchProgress.style.display = "none";
          UI.batchDownloadBtn.disabled = false;
        }, 3000);
      });
    },
  };

  window.CG_BATCH = BATCH;
})();
