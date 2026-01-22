document.addEventListener("DOMContentLoaded", () => {
  fetch("data/hydra_ranking.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      const rankingData = data.ranking; // JSONからランキングデータを取得

      // 同じ名前のプレイヤーがいる場合、最も良い成績のみを残す
      const bestRecords = {};
      rankingData.forEach((player) => {
        const existingPlayer = bestRecords[player.name];
        if (!existingPlayer) {
          bestRecords[player.name] = player;
        } else {
          // 比較ロジック
          const isNewPlayerBetter = (() => {
            // 1. ステータス比較 (成功を優先)
            if (player.status === "成功" && existingPlayer.status !== "成功") {
              return true;
            }
            if (player.status !== "成功" && existingPlayer.status === "成功") {
              return false;
            }
            // 2. ターン数比較 (少ない方を優先)
            if (player.turns < existingPlayer.turns) {
              return true;
            }
            if (player.turns > existingPlayer.turns) {
              return false;
            }
            // 3. 討伐本数比較 (多い方を優先)
            if (player.kills > existingPlayer.kills) {
              return true;
            }
            return false;
          })();

          if (isNewPlayerBetter) {
            bestRecords[player.name] = player;
          }
        }
      });

      const filteredRankingData = Object.values(bestRecords);

      // 成功したものを優先し、その中でターン数で昇順にソート
      filteredRankingData.sort((a, b) => {
        // 失敗したものを優先
        if (a.status === "失敗" && b.status !== "失敗") return 1;
        if (a.status !== "失敗" && b.status === "失敗") return -1;

        // ターン数で昇順
        if (a.turns !== b.turns) {
          return a.turns - b.turns;
        }

        // ターン数が同じ場合、討伐本数で降順 (多い方が上位)
        return b.kills - a.kills;
      });

      const tableBody = document.querySelector("#hydra-ranking-details tbody");
      if (tableBody) {
        let currentRank = 1;
        let prevTurns = null; // 最初の比較のためにnull

        filteredRankingData.forEach((player, index) => {
          const row = document.createElement("tr");
          let turnsDisplay = player.turns;
          let rowClass = "";
          let rankDisplay = "";

          if (player.status === "失敗") {
            turnsDisplay = "-";
            rowClass = "failed-attempt";
            rankDisplay = "-"; // 失敗した場合は順位も表示しない
          } else {
            if (index > 0 && player.turns === prevTurns) {
              // 同一ターン数の場合は前のプレイヤーと同じ順位
              rankDisplay = filteredRankingData[index - 1].calculatedRank;
            } else {
              rankDisplay = currentRank;
            }
            player.calculatedRank = rankDisplay; // 計算された順位を保存
            prevTurns = player.turns;
            currentRank++;
          }

          row.className = rowClass;
          row.innerHTML = `
            <td>${rankDisplay}</td>
            <td>${player.name}</td>
            <td class="center-text">${turnsDisplay}</td>
            <td class="center-text">${player.kills}</td>
          `;
          tableBody.appendChild(row);
        });
      }
    })
    .catch((error) => console.error("Error loading ranking data:", error));
});
