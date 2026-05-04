const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'AR2E_skillinfo.csv');
const jsonPath = path.join(__dirname, 'AR2E_skillinfo.json');

const csvContent = fs.readFileSync(csvPath, 'utf-8');

const skillsSet = new Set();

// Extract from 《...》 anywhere in the text
const regex = /《([^》]+)》/g;
let match;
while ((match = regex.exec(csvContent)) !== null) {
    let name = match[1].trim();
    if (name) {
        skillsSet.add(`《${name}》`);
    }
}

// Extract from column 2 (index 2)
const lines = csvContent.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // basic CSV split handling quotes (very basic, but sufficient for this file)
    let inQuote = false;
    let cols = [];
    let cur = "";
    for (let c = 0; c < line.length; c++) {
        if (line[c] === '"') {
            inQuote = !inQuote;
        } else if (line[c] === ',' && !inQuote) {
            cols.push(cur);
            cur = "";
        } else {
            cur += line[c];
        }
    }
    cols.push(cur);

    if (cols.length > 2) {
        let nameCol = cols[2].trim();
        if (nameCol && nameCol !== "名前" && nameCol !== "内訳" && !nameCol.startsWith("スーパーマスター用")) {
            // Remove " Lv", " Lv[1-5]", etc.
            nameCol = nameCol.replace(/\s+Lv(?:\[[^\]]*\])?/g, '').trim();
            // Remove " Lv" if it's right next to the name without space
            nameCol = nameCol.replace(/Lv(?:\[[^\]]*\])?$/g, '').trim();
            if (nameCol) {
                skillsSet.add(`《${nameCol}》`);
            }
        }
    }
}

const skillsArray = Array.from(skillsSet).sort();
console.log(`Found ${skillsArray.length} skills.`);

const outputObj = {
    skills: skillsArray
};

fs.writeFileSync(jsonPath, JSON.stringify(outputObj, null, 4), 'utf-8');
console.log("Updated AR2E_skillinfo.json");
