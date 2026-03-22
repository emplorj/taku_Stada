const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(process.cwd(), "enemies.txt");
const AUTHOR = "公式";
const API_URL =
  "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec?action=saveNechronicaEnemy";

const PART_TYPES = new Set(["頭", "腕", "胴", "脚"]);

function nowText() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}:${s}`;
}

function parseManeuvers(commandsText = "") {
  const lines = String(commandsText || "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  const out = [];
  let currentPart = "胴";

  for (const raw of lines) {
    const line = String(raw || "").trim();
    if (!line) continue;
    if (line.startsWith("👧")) {
      currentPart = "頭";
      continue;
    }
    if (line.startsWith("💪")) {
      currentPart = "腕";
      continue;
    }
    if (line.startsWith("🧍")) {
      currentPart = "胴";
      continue;
    }
    if (line.startsWith("🦵")) {
      currentPart = "脚";
      continue;
    }
    if (!line.includes("【") || !line.includes("《")) continue;

    const normalized = line.replace(/^[⭕✅❌]\s*/, "");
    const m = normalized.match(
      /^【([^】]+)】《([^/]*)\/([^/]*)\/([^》]*)》\s*(.*)$/,
    );
    if (!m) continue;

    const [, name, timing, cost, range, effect] = m;
    out.push({
      id: `man_${out.length + 1}`,
      status: "無事",
      name: String(name || "").trim(),
      kindName: String(name || "").trim(),
      displayName: String(name || "").trim(),
      partType: PART_TYPES.has(currentPart) ? currentPart : "胴",
      timing: String(timing || "").trim(),
      cost: String(cost || "").trim(),
      range: String(range || "").trim(),
      initiative: 0,
      malice: 0,
      effect: String(effect || "").trim(),
      brokenEffect: "",
      masterId: "",
      source: "",
      partId: "",
      broken: "",
      use: true,
      reportChecked: false,
    });
  }

  return out;
}

function toEnemyObject(characterJson) {
  const data = (characterJson && characterJson.data) || {};
  const status = Array.isArray(data.status) ? data.status : [];

  const isServant = status.some((s) =>
    PART_TYPES.has(String((s && s.label) || "")),
  );
  const parts = status.length
    ? status.map((s, idx) => {
        const label = String((s && s.label) || "").trim();
        return {
          id: `part_${idx + 1}`,
          type: PART_TYPES.has(label) ? label : "胴",
          name: label || "パーツ",
          max: Number((s && s.max) || 0),
          current: Number((s && s.value) || 0),
          use: true,
        };
      })
    : [
        {
          id: "part_1",
          type: "胴",
          name: "パーツ",
          max: 0,
          current: 0,
          use: true,
        },
      ];

  return {
    ID: "",
    author: AUTHOR,
    name: String(data.name || "").trim(),
    class_type: isServant ? "サヴァント" : "ホラー",
    place: "煉獄",
    unit_count: 1,
    summary_slots: [],
    is_public: true,
    memo: String(data.memo || ""),
    data: {
      parts,
      maneuvers: parseManeuvers(String(data.commands || "")),
    },
    icon_url: String(data.iconUrl || "").trim(),
    time: nowText(),
  };
}

async function saveEnemy(enemy) {
  const payload = {
    tool: "nechronica",
    action: "saveNechronicaEnemy",
    author: AUTHOR,
    enemy,
  };
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json || json.status !== "success") {
    const msg = (json && (json.message || json.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

async function main() {
  const raw = fs.readFileSync(INPUT_PATH, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

  let ok = 0;
  let ng = 0;
  const failed = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    try {
      const obj = JSON.parse(line);
      const enemy = toEnemyObject(obj);
      await saveEnemy(enemy);
      ok += 1;
      console.log(`[OK] ${i + 1}: ${enemy.name}`);
    } catch (e) {
      ng += 1;
      const message = e && e.message ? e.message : String(e);
      failed.push({ line: i + 1, message });
      console.log(`[NG] ${i + 1}: ${message}`);
    }
  }

  console.log("\n=== RESULT ===");
  console.log(`total=${lines.length} ok=${ok} ng=${ng}`);
  if (failed.length) {
    console.log("--- failed lines ---");
    failed.forEach((f) => console.log(`line ${f.line}: ${f.message}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
