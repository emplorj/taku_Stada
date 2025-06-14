// q_and_a.js (完全修正版)

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('qa-main-container')) return;
    document.body.classList.add('qa-page-body');

    // --- 定数定義 ---
    const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwEsQe3onyMVVRJxdl_4wrE_VzFgpfs6HBe46eczo1yv3MhKLMK-Ic1A-a44mKtWUT8vQ/exec';
    const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT3Q8zZ9pdnw0UkcF3sZ3XFQr4g8ZrgRBNPBzzUT0RmulLMzhgJN4st3fa5h0Gkhqr4gZrt2TxYHaMc/pub?gid=0&single=true&output=csv';
    const PULLDOWN_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT3Q8zZ9pdnw0UkcF3sZ3XFQr4g8ZrgRBNPBzzUT0RmulLMzhgJN4st3fa5h0Gkhqr4gZrt2TxYHaMc/pub?gid=1509960675&single=true&output=csv';
    const CHAR_CATALOG_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=1980715564&single=true&output=csv';
    const SCENARIO_ARCHIVE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=620166307&single=true&output=csv';

    // --- グローバル変数 ---
    let allCharacters = [], questions = [], formData = {}, answers = {};
    let currentQuestionIndex = 0;
    let editingState = { isEditing: false, questionIndex: null, bubbleElement: null };
    let characterCatalog = [], scenarioArchive = [];

    // --- DOM要素の取得 ---
    const dom = {
        characterList: document.getElementById('character-list'),
        qaDetails: document.getElementById('qa-details-view'),
        plFilter: document.getElementById('pl-filter'),
        systemFilter: document.getElementById('system-filter'),
        pcSearch: document.getElementById('pc-search'),
        modal: document.getElementById('add-character-modal'),
        openModalBtn: document.getElementById('open-modal-button'),
        closeModalBtn: document.querySelector('.modal-close-button'),
        wizard: document.getElementById('wizard-container'),
        steps: document.querySelectorAll('[data-step]'),
        pcNameInput: document.getElementById('form-pcName'),
        plNameInput: document.getElementById('form-plName'),
        systemInput: document.getElementById('form-system'),
        firstScenarioInput: document.getElementById('form-firstScenario'),
        imageUrlInput: document.getElementById('form-imageUrl'),
        chatContainer: document.getElementById('chat-container'),
        chatInput: document.getElementById('chat-input'),
        chatImageContainer: document.getElementById('chat-character-image'),
        spoilerTip: document.querySelector('.spoiler-tip'),
        btnStep1Next: document.getElementById('btn-step1-next'),
        btnStep2Prev: document.getElementById('btn-step2-prev'),
        btnStep2Next: document.getElementById('btn-step2-next'),
        btnStep3Prev: document.getElementById('btn-step3-prev'),
        btnSendAnswer: document.getElementById('btn-send-answer'),
        btnFinish: document.getElementById('btn-finish'),
    };

    // --- ヘルパー関数 ---
    const applySpoilerFormatting = text => {
        if (!text) return '';
        const escaped = text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
        return escaped.replace(/\|\|(.*?)\|\|/g, '<span class="spoiler-text">$1</span>').replace(/\n/g, '<br>');
    };
    const addSpoilerClickListeners = container => {
        container.querySelectorAll('.spoiler-text:not(.listener-added)').forEach(spoiler => {
            spoiler.classList.add('listener-added');
            spoiler.addEventListener('click', e => { e.stopPropagation(); spoiler.classList.add('is-revealed'); }, { once: true });
        });
    };
    const autoResizeTextarea = () => {
        dom.chatInput.style.height = 'auto';
        dom.chatInput.style.height = (dom.chatInput.scrollHeight) + 'px';
    };

    // --- メイン関数 ---
    function renderQaDetails(character) {
        if (!dom.qaDetails) return;
        let backgroundDivHtml = character.imageUrl ? `<div class="details-view-background" style="background-image: url('${character.imageUrl}');"></div>` : '';
        
        const editButtonHtml = `<button class="edit-character-button" title="このキャラクターを編集する"><i class="fas fa-edit"></i></button>`;
        
        const contentHtml = `
            <div class="details-view-content">
                <div class="qa-header">
                    <h2>${character.pcName} ${editButtonHtml}</h2>
                    <p><strong>PL:</strong> ${character.plName} / <strong>システム:</strong> ${character.system}</p>
                    <p><strong>初登場シナリオ:</strong> ${character.firstScenario || 'N/A'}</p>
                </div>
                <div class="qa-body">
                    ${questions.map((q, i) => `<div class="qa-item"><p class="question">${q.replace(/\n/g, '<br>')}</p><p class="answer">${applySpoilerFormatting(character.answers[i] || '（無回答）')}</p></div>`).join('')}
                </div>
            </div>`;
        dom.qaDetails.innerHTML = backgroundDivHtml + contentHtml;
        addSpoilerClickListeners(dom.qaDetails);
        dom.qaDetails.querySelector('.edit-character-button')?.addEventListener('click', () => openEditModal(character));
    }
    // (以降の関数定義は省略)
    
    function addChatMessage(message, type, questionIndexForAnswer = null) {
        const row = document.createElement('div');
        row.className = 'chat-message-row';
        const bubbleContainer = document.createElement('div');
        bubbleContainer.className = 'chat-bubble-container';
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}`;
        bubble.innerHTML = applySpoilerFormatting(message);
        addSpoilerClickListeners(bubble);
        bubbleContainer.appendChild(bubble);
        if (type === 'answer' && questionIndexForAnswer !== null) {
            const editButton = document.createElement('button');
            editButton.className = 'edit-answer-button';
            editButton.innerHTML = '<i class="fa-solid fa-pen"></i>';
            editButton.title = 'この回答を編集する';
            editButton.onclick = () => enterEditMode(questionIndexForAnswer, bubble);
            bubbleContainer.appendChild(editButton);
        }
        row.appendChild(bubbleContainer);
        dom.chatContainer.appendChild(row);
        dom.chatContainer.scrollTop = dom.chatContainer.scrollHeight;
    }
    function parseCSV(csvText,requiredHeaders){const rows=[];let inQuotes=!1,currentRow=[],currentField="";const text=csvText.trim().replace(/\r/g,"");for(let i=0;i<text.length;i++){const char=text[i];if('"'===char)inQuotes&&'"'===text[i+1]?(currentField+='"',i++):inQuotes=!inQuotes;else if(","===char&&!inQuotes)currentRow.push(currentField),currentField="";else if("\n"===char&&!inQuotes)currentRow.push(currentField),rows.push(currentRow),currentRow=[],currentField="";else currentField+=char}currentRow.push(currentField),rows.push(currentRow);const headerIndex=rows.findIndex(row=>requiredHeaders.every(h=>row.includes(h)));if(-1===headerIndex)throw new Error(`ヘッダー行（${requiredHeaders.join(", ")} を含む行）が見つかりません。`);const header=rows[headerIndex],dataRows=rows.slice(headerIndex+1);return{header,dataRows}}
    function getContrastYIQ(hexcolor){if(!hexcolor)return"black";hexcolor=hexcolor.replace("#","");if(6!==hexcolor.length)return"black";const r=parseInt(hexcolor.substr(0,2),16),g=parseInt(hexcolor.substr(2,2),16),b=parseInt(hexcolor.substr(4,2),16);return(299*r+587*g+114*b)/1e3>=128?"black":"white"}
    function renderCharacterList(characters){if(!dom.characterList)return;dom.characterList.innerHTML="";if(0===characters.length)return void(dom.characterList.innerHTML='<p class="no-results">該当するキャラクターがいません。</p>');characters.forEach(char=>{const card=document.createElement("div");card.className="character-card",card.dataset.id=char.id;const systemColor="undefined"!=typeof TRPG_SYSTEM_COLORS&&TRPG_SYSTEM_COLORS[char.system]?TRPG_SYSTEM_COLORS[char.system]:"#007bff";card.innerHTML=`<div class="card-system" style="background-color: ${systemColor};"></div><div class="card-info"><h4 class="card-pc-name">${char.pcName}</h4><p class="card-pl-name">PL: ${char.plName}</p><p class="card-system-name">System: ${char.system}</p></div>`,card.addEventListener("click",()=>{renderQaDetails(char),document.querySelectorAll(".character-card").forEach(c=>{c.classList.remove("active"),c.style.backgroundColor="";const info=c.querySelector(".card-info");if(info){info.style.color="";const pcName=info.querySelector(".card-pc-name");pcName&&(pcName.style.color="")}
    }),card.classList.add("active"),card.style.backgroundColor=systemColor;const infoText=card.querySelector(".card-info");if(infoText){const contrastColor=getContrastYIQ(systemColor);infoText.style.color=contrastColor;const pcNameText=infoText.querySelector(".card-pc-name");pcNameText&&(pcNameText.style.color=contrastColor)}}),dom.characterList.appendChild(card)})}
    function openEditModal(character){if(dom.modal){formData={isEditing:!0,id:character.id,pcName:character.pcName,plName:character.plName,system:character.system,firstScenario:character.firstScenario,imageUrl:character.imageUrl},dom.pcNameInput.value=character.pcName,dom.plNameInput.value=character.plName,dom.systemInput.value=character.system,dom.firstScenarioInput.value=character.firstScenario,dom.imageUrlInput.value=character.imageUrl,answers={},questions.forEach((q,index)=>{const questionKey=`Q${index+1}`;answers[questionKey]=character.answers[index]||"（無回答）"}),dom.chatContainer.innerHTML="",questions.forEach((question,index)=>{const questionKey=`Q${index+1}`;addChatMessage(question,"question"),addChatMessage(answers[questionKey],"answer",index)}),currentQuestionIndex=questions.length;const inputArea=document.querySelector(".chat-input-area");inputArea.classList.add("inactive"),dom.btnFinish.disabled=!1,dom.chatImageContainer&&(dom.chatImageContainer.innerHTML=formData.imageUrl?`<img src="${formData.imageUrl}" alt="Character Image">`:""),document.body.classList.add("modal-open"),dom.modal.style.display="flex",goToStep(3)}}
    function applyFilters(){const plValue=dom.plFilter.value,systemValue=dom.systemFilter.value,searchValue=dom.pcSearch.value.trim().toLowerCase();let filtered=allCharacters;"all"!==plValue&&(filtered=filtered.filter(char=>char.plName===plValue)),"all"!==systemValue&&(filtered=filtered.filter(char=>char.system===systemValue)),searchValue&&(filtered=filtered.filter(char=>char.pcName.toLowerCase().includes(searchValue))),renderCharacterList(filtered),dom.qaDetails&&(dom.qaDetails.innerHTML='<div class="qa-placeholder"><p>左のリストからキャラクターを選択してください。</p></div>')}
    function setupFilters(){if(dom.plFilter&&dom.systemFilter){const plNames=[...new Set(allCharacters.map(char=>char.plName))].filter(Boolean),systems=[...new Set(allCharacters.map(char=>char.system))].filter(Boolean);plNames.sort().forEach(name=>{dom.plFilter.innerHTML+=`<option value="${name}">${name}</option>`}),systems.sort().forEach(name=>{dom.systemFilter.innerHTML+=`<option value="${name}">${name}</option>`}),dom.plFilter.addEventListener("change",applyFilters),dom.systemFilter.addEventListener("change",applyFilters),dom.pcSearch.addEventListener("input",applyFilters)}}
    function goToStep(stepNumber){if(dom.wizard){dom.steps.forEach(step=>step.classList.remove("active"));const targetStep=dom.wizard.querySelector(`[data-step="${stepNumber}"]`);targetStep&&targetStep.classList.add("active")}}
    function enterEditMode(qIndex,bubbleEl){editingState.isEditing&&exitEditMode(),editingState={isEditing:!0,questionIndex:qIndex,bubbleElement:bubbleEl};let existingAnswer="（無回答）"===answers[`Q${qIndex+1}`]?"":answers[`Q${qIndex+1}`];existingAnswer.startsWith("「")&&existingAnswer.endsWith("」")&&(existingAnswer=existingAnswer.slice(1,-1)),dom.chatInput.value=`「${existingAnswer}」`,dom.btnSendAnswer.textContent="更新";const inputArea=document.querySelector(".chat-input-area");inputArea.classList.remove("inactive"),dom.wizard.classList.add("editing-active"),dom.chatInput.focus();const cursorPos=dom.chatInput.value.length-1;dom.chatInput.setSelectionRange(cursorPos,cursorPos),autoResizeTextarea()}
    function exitEditMode(){editingState.isEditing&&(editingState={isEditing:!1,questionIndex:null,bubbleElement:null},dom.chatInput.value="",dom.btnSendAnswer.textContent="送信",dom.wizard.classList.remove("editing-active"),currentQuestionIndex>=questions.length&&document.querySelector(".chat-input-area").classList.add("inactive"),autoResizeTextarea())}
    function askNextQuestion(){editingState.isEditing&&exitEditMode(),dom.btnFinish.disabled=!1,currentQuestionIndex<questions.length?(addChatMessage(questions[currentQuestionIndex],"question"),dom.chatInput.value="「」",dom.chatInput.focus(),dom.chatInput.setSelectionRange(1,1),document.querySelector(".chat-input-area").classList.remove("inactive")):(addChatMessage("全ての質問が完了しました！<br>内容を確認・編集し、よろしければ下の「完了」ボタンを押してください。","question"),document.querySelector(".chat-input-area").classList.add("inactive"),dom.chatInput.value=""),autoResizeTextarea()}
    function finishAndSubmit(){const finalStatusContainer=document.querySelector('[data-step="4"] .final-status-container');if(finalStatusContainer){goToStep(4);const finalData={pcName:dom.pcNameInput.value,plName:dom.plNameInput.value,system:dom.systemInput.value,firstScenario:dom.firstScenarioInput.value,imageUrl:dom.imageUrlInput.value,...answers};formData.isEditing?(finalData.id=formData.id,finalData.action="update"):(finalData.id=allCharacters.reduce((max,char)=>Math.max(max,parseInt(char.id)||0),0)+1,finalData.action="append"),finalStatusContainer.innerHTML='<div class="loader"></div><h2>登録処理中...</h2><p>データを書き込んでいます...</p>',fetch(GAS_WEB_APP_URL,{method:"POST",mode:"no-cors",cache:"no-cache",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify(finalData)}).then(()=>{console.log("GASへの送信リクエストが完了しました。"),finalStatusContainer.innerHTML='<p class="success" style="font-size: 2.5em; margin: 0;">✔️</p><h2 class="success">登録リクエストを送信しました！</h2><p>数秒後にデータが反映されます。ページをリロードして確認してください。</p>',formData.isEditing=!1}).catch(error=>{console.error("GASへの送信でネットワークエラー:",error),finalStatusContainer.innerHTML='<p class="error" style="font-size: 2.5em; margin: 0;">❌</p><h2 class="error">ネットワークエラー</h2><p>サーバーに接続できませんでした。インターネット接続を確認してください。</p>',formData.isEditing=!1})}}
    function parseQandA(csvText){const{header,dataRows}=parseCSV(csvText,["ID","システム","PL名","PC名"]),idIndex=header.indexOf("ID"),systemIndex=header.indexOf("システム"),plNameIndex=header.indexOf("PL名"),pcNameIndex=header.indexOf("PC名"),firstScenarioIndex=header.indexOf("初登場シナリオ"),imageUrlIndex=header.indexOf("画像URL"),q1Index=header.findIndex(h=>h&&h.trim().startsWith("Q1")),remarksIndex=header.findIndex(h=>h&&h.trim().startsWith("※備考")),qEndIndex=-1!==remarksIndex?remarksIndex:header.length;return questions=header.slice(q1Index,qEndIndex),dataRows.map(values=>values[pcNameIndex]&&""!==values[pcNameIndex].trim()?{id:values[idIndex],system:values[systemIndex],plName:values[plNameIndex],pcName:values[pcNameIndex],firstScenario:values[firstScenarioIndex],imageUrl:(values[imageUrlIndex]||"").trim(),answers:values.slice(q1Index,qEndIndex)}:null).filter(Boolean)}
    function parseCharacterCatalog(csvText){const{header,dataRows}=parseCSV(csvText,["PL","PC名","卓名"]),plIndex=header.indexOf("PL"),pcIndex=header.indexOf("PC名"),takuIndex=header.indexOf("卓名");if([-1].includes(plIndex,pcIndex,takuIndex))throw new Error("キャラ名鑑の必須ヘッダー(PL, PC名, 卓名)が見つかりません。");return dataRows.map(values=>values.length>Math.max(plIndex,pcIndex,takuIndex)&&values[plIndex]&&values[pcIndex]?{plName:values[plIndex].trim(),pcName:values[pcIndex].trim(),systemName:values[takuIndex].trim()}:null).filter(Boolean)}
    function parseScenarioArchive(csvText){const{header,dataRows}=parseCSV(csvText,["シナリオ名","PL","PC","システム"]),scenarioIndex=header.indexOf("シナリオ名"),plIndex=header.indexOf("PL"),pcIndex=header.indexOf("PC"),systemIndex=header.indexOf("システム"),archive=[];return dataRows.forEach(values=>{if(values.length>Math.max(scenarioIndex,plIndex,pcIndex,systemIndex)){const pls=(values[plIndex]||"").split(",").map(p=>p.trim()),pcs=(values[pcIndex]||"").split(",").map(p=>p.trim());pls.forEach((pl,index)=>{pl&&pcs[index]&&archive.push({scenarioName:values[scenarioIndex].trim(),plName:pl,pcName:pcs[index],systemName:values[systemIndex].trim()})})}}),archive}
    function setupFormAutofillListeners(){const pcNameSuggestions=document.getElementById("pc-name-suggestions"),scenarioSuggestions=document.getElementById("scenario-suggestions"),originalSystemOptions=Array.from(dom.systemInput.options).map(opt=>opt.cloneNode(!0));let debounceTimeout;function debounce(func,wait){return function(...args){clearTimeout(debounceTimeout),debounceTimeout=setTimeout(()=>func.apply(this,args),wait)}}
    function handlePcInput(){const pcValue=dom.pcNameInput.value.trim();if(""===pcValue)return resetFormSelections(),void dom.pcNameInput.classList.remove("invalid");if(resetSuggestions(!0),pcValue.length<1)return;const possibleChars=characterCatalog.filter(c=>c.pcName===pcValue);possibleChars.length>0?(dom.pcNameInput.classList.remove("invalid"),""===dom.plNameInput.value.trim()&&(dom.plNameInput.value=possibleChars[0].plName),updateSystemSuggestions(possibleChars)):dom.pcNameInput.classList.add("invalid")}
    function handlePlInput(){updatePcSuggestions()}
    function handleSystemChange(){updatePcSuggestions(),updateScenarioSuggestions(),updateSystemColor()}
    function updateSystemColor(){const systemValue=dom.systemInput.value;systemValue&&"undefined"!=typeof TRPG_SYSTEM_COLORS?(dom.systemInput.style.backgroundColor=TRPG_SYSTEM_COLORS[systemValue]||TRPG_SYSTEM_COLORS.default,dom.systemInput.style.color=getContrastYIQ(dom.systemInput.style.backgroundColor)):(dom.systemInput.style.backgroundColor="",dom.systemInput.style.color="")}
    function updatePcSuggestions(){const plValue=dom.plNameInput.value.trim(),systemValue=dom.systemInput.value;pcNameSuggestions.innerHTML="",dom.pcNameInput.classList.remove("invalid");if(plValue){let filteredPcs=characterCatalog.filter(c=>c.plName===plValue);systemValue&&(filteredPcs=filteredPcs.filter(c=>c.systemName.startsWith(systemValue)));const uniquePcs=[...new Set(filteredPcs.map(p=>p.pcName))];0===uniquePcs.length&&systemValue?dom.pcNameInput.classList.add("invalid"):uniquePcs.forEach(pc=>{pcNameSuggestions.appendChild(Object.assign(document.createElement("option"),{value:pc}))})}}
    function updateSystemSuggestions(possibleChars){const systemsForPc=[...new Set(possibleChars.map(c=>c.systemName.split("-")[0].trim()))];dom.systemInput.innerHTML="",systemsForPc.forEach(system=>{dom.systemInput.appendChild(Object.assign(document.createElement("option"),{value:system,textContent:system}))}),systemsForPc.length>0&&(dom.systemInput.value=systemsForPc[0]),updateScenarioSuggestions(),updateSystemColor()}
    function updateScenarioSuggestions(){scenarioSuggestions.innerHTML="",dom.firstScenarioInput.value="";const plValue=dom.plNameInput.value.trim(),pcValue=dom.pcNameInput.value.trim(),systemValue=dom.systemInput.value;if(plValue&&pcValue&&systemValue){const scenarios=[...new Set(scenarioArchive.filter(s=>s.plName===plValue&&s.pcName===pcValue&&s.systemName===systemValue).map(s=>s.scenarioName))];scenarios.length>0&&(dom.firstScenarioInput.value=scenarios[0],scenarios.forEach(scenario=>{scenarioSuggestions.appendChild(Object.assign(document.createElement("option"),{value:scenario}))}))}}
    function resetFormSelections(){pcNameSuggestions.innerHTML="",scenarioSuggestions.innerHTML="",dom.firstScenarioInput.value="",dom.pcNameInput.classList.remove("invalid"),dom.systemInput.innerHTML="",originalSystemOptions.forEach(option=>dom.systemInput.appendChild(option.cloneNode(!0))),dom.systemInput.value="",updateSystemColor()}
    function resetSuggestions(keepPcSuggestions=!1){keepPcSuggestions||(pcNameSuggestions.innerHTML=""),scenarioSuggestions.innerHTML="",dom.firstScenarioInput.value=""}
    dom.pcNameInput.addEventListener("input",debounce(handlePcInput,300)),dom.plNameInput.addEventListener("input",debounce(handlePlInput,300)),dom.systemInput.addEventListener("change",debounce(handleSystemChange,100))}
    function setupFormOptions(csvText){try{const lines=csvText.trim().replace(/\r/g,"").split("\n"),plDataList=document.getElementById("pl-name-suggestions"),systemSelect=document.getElementById("form-system");if(plDataList&&systemSelect){plDataList.innerHTML="",systemSelect.innerHTML='<option value="">システムを選択してください</option>';const plNames=new Set,systems=new Set,excludedSystems=["CoC-㊙"];for(let i=1;i<lines.length;i++){const values=lines[i].split(",");if(!(values.length<3)){values[0].trim()&&plNames.add(values[0].trim());let systemName=values[2].trim();systemName&&(("ｻﾀｽﾍﾟ"===systemName.toLowerCase()||"サタスペ"===systemName.toLowerCase())&&(systemName="サタスペ"),excludedSystems.includes(systemName)||systems.add(systemName))}}[...plNames].sort().forEach(name=>{plDataList.appendChild(Object.assign(document.createElement("option"),{value:name}))}),[...systems].sort().forEach(name=>{systemSelect.appendChild(Object.assign(document.createElement("option"),{value:name,textContent:name}))}),console.log("フォームのPL名とシステムの候補を更新しました。")}}catch(error){console.error("フォームオプションの設定中にエラー:",error)}}
    
    // --- イベントリスナー設定 ---
    dom.openModalBtn?.addEventListener("click",()=>{dom.modal&&(formData={},document.body.classList.add("modal-open"),dom.modal.style.display="flex",goToStep(1),answers={},currentQuestionIndex=0,[dom.pcNameInput,dom.plNameInput,dom.systemInput,dom.firstScenarioInput,dom.imageUrlInput,dom.chatInput].forEach(input=>{input&&(input.value="")}),dom.chatContainer&&(dom.chatContainer.innerHTML=""),dom.chatInput&&document.querySelector(".chat-input-area").classList.remove("inactive"),dom.btnSendAnswer&&(dom.btnSendAnswer.style.display="block"),dom.btnFinish&&(dom.btnFinish.disabled=!0),dom.chatImageContainer&&(dom.chatImageContainer.innerHTML=""),resetFormSelections())});
    dom.closeModalBtn?.addEventListener("click",()=>dom.modal.style.display="none");
    dom.modal?.addEventListener("click",e=>{e.target===dom.modal&&(dom.modal.style.display="none")});
    dom.btnStep1Next?.addEventListener("click",()=>{formData.pcName=dom.pcNameInput.value,formData.plName=dom.plNameInput.value,formData.system=dom.systemInput.value,formData.firstScenario=dom.firstScenarioInput.value,goToStep(2)});
    dom.btnStep2Prev?.addEventListener("click",()=>goToStep(1));
    dom.btnStep2Next?.addEventListener("click",()=>{formData.imageUrl=dom.imageUrlInput.value,dom.chatImageContainer&&(dom.chatImageContainer.innerHTML=formData.imageUrl?`<img src="${formData.imageUrl}" alt="Character Image">`:""),goToStep(3),""===dom.chatContainer.innerHTML.trim()&&askNextQuestion()});
    dom.btnStep3Prev?.addEventListener("click",()=>goToStep(2));
    dom.btnSendAnswer?.addEventListener("click",()=>{let answer=dom.chatInput.value.trim();"「」"===answer&&(answer="");const answerToStore=answer||"（無回答）";editingState.isEditing?(answers[`Q${editingState.questionIndex+1}`]=answerToStore,editingState.bubbleElement.innerHTML=applySpoilerFormatting(answerToStore),addSpoilerClickListeners(editingState.bubbleElement),exitEditMode()):(answers[`Q${currentQuestionIndex+1}`]=answerToStore,addChatMessage(answerToStore,"answer",currentQuestionIndex),currentQuestionIndex++,dom.chatInput.value="",askNextQuestion())});
    dom.chatInput?.addEventListener("keydown",e=>{e.key&&"Enter"===e.key&&!e.shiftKey&&(e.preventDefault(),dom.btnSendAnswer.click())});
    dom.btnFinish?.addEventListener("click",finishAndSubmit);
    dom.chatInput?.addEventListener('input', autoResizeTextarea); // テキストボックスの高さ自動調整

    // ★★★ Tips内のサンプルにもネタバレ機能を適用 ★★★
    if(dom.spoilerTip) {
        addSpoilerClickListeners(dom.spoilerTip);
    }
    
    // --- 初期化処理 ---
    async function initialize(){
        console.log("Q&Aスクリプトの初期化を開始します。");
        try{
            const[qandaResponse,catalogResponse,archiveResponse,pulldownResponse]=await Promise.all([fetch(SPREADSHEET_URL,{cache:"no-cache"}),fetch(CHAR_CATALOG_URL,{cache:"no-cache"}),fetch(SCENARIO_ARCHIVE_URL,{cache:"no-cache"}),fetch(PULLDOWN_SHEET_URL,{cache:"no-cache"})]);
            if(!qandaResponse.ok)throw new Error(`Q&Aデータの取得に失敗: ${qandaResponse.status}`);
            if(!catalogResponse.ok)throw new Error(`キャラ名鑑データの取得に失敗: ${catalogResponse.status}`);
            if(!archiveResponse.ok)throw new Error(`シナリオアーカイブの取得に失敗: ${archiveResponse.status}`);
            if(!pulldownResponse.ok)throw new Error(`プルダウン用データの取得に失敗: ${pulldownResponse.status}`);
            const[qandaCsv,catalogCsv,archiveCsv,pulldownCsv]=await Promise.all([qandaResponse.text(),catalogResponse.text(),archiveResponse.text(),pulldownResponse.text()]);
            
            allCharacters=parseQandA(qandaCsv);
            console.log(`Q&Aデータ: ${allCharacters.length}件`);
            
            // ★★★★★ ここがエラーの原因でした ★★★★★
            characterCatalog=parseCharacterCatalog(catalogCsv); // `csvText` を `catalogCsv` に修正
            
            console.log(`キャラ名鑑データ: ${characterCatalog.length}件`);
            scenarioArchive=parseScenarioArchive(archiveCsv);
            console.log(`シナリオアーカイブデータ: ${scenarioArchive.length}件`);
            renderCharacterList(allCharacters);
            setupFilters();
            setupFormOptions(pulldownCsv);
            setupFormAutofillListeners();
            console.log("初期化が正常に完了しました。");
        } catch(error) {
            console.error('初期化処理中にエラーが発生しました:',error);
            if(dom.characterList) {
                dom.characterList.innerHTML=`<p class="error" style="padding: 15px; font-size: 0.9em;"><strong>データの読み込みに失敗しました</strong><br><br><strong>エラー詳細:</strong><br>${error.message}</p>`;
            }
        }
    }
    initialize();
});