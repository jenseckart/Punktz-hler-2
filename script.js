let gameState = { players: [], round: 1, targetScore: null };

/* --- STORAGE --- */
function saveGame() { localStorage.setItem('cardGameDataV3', JSON.stringify(gameState)); }
function loadGame() {
    const data = localStorage.getItem('cardGameDataV3');
    if (data) { gameState = JSON.parse(data); return true; }
    return false;
}
function checkStorageAndLoad() {
    if (loadGame()) { renderScoreboard(); showScreen('game-screen'); } 
    else { alert("Kein Spielstand gefunden."); }
}
function hardReset() {
    if(confirm("Spielstand wirklich löschen?")) {
        localStorage.removeItem('cardGameDataV3'); location.reload();
    }
}

/* --- NAVIGATION --- */
function showScreen(id) {
    document.querySelectorAll('.container').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

window.onload = function() {
    if(localStorage.getItem('cardGameDataV3')) { loadGame(); renderScoreboard(); showScreen('game-screen'); }
}

/* --- SETUP --- */
function goToNames() {
    const count = parseInt(document.getElementById('playerCount').value);
    gameState.targetScore = document.getElementById('targetScore').value;
    const container = document.getElementById('names-inputs');
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        container.innerHTML += `<div class="form-group"><input type="text" class="name-input" value="Spieler ${i+1}"></div>`;
    }
    showScreen('names-screen');
}

function startGame() {
    gameState.players = [];
    document.querySelectorAll('.name-input').forEach((inp, index) => {
        gameState.players.push({ id: index, name: inp.value.trim() || `P${index+1}`, score: 0, history: [] });
    });
    gameState.round = 1;
    saveGame(); renderScoreboard(); showScreen('game-screen');
}

/* --- CORE LOGIC --- */
function renderScoreboard() {
    const board = document.getElementById('scoreboard');
    board.innerHTML = '';
    document.getElementById('round-display').innerText = gameState.round;

    const dealerIndex = (gameState.round - 1) % gameState.players.length;
    const dealerName = gameState.players[dealerIndex].name;
    document.getElementById('dealer-info').innerHTML = `Geber: <span style="color:${'var(--dealer-color)'}">${dealerName}</span>`;

    let rankedList = [...gameState.players].sort((a, b) => a.score - b.score);
    
    gameState.players.forEach(p => {
        const rank = rankedList.findIndex(x => x.id === p.id) + 1;
        const isLeader = (rank === 1);
        const isDealer = (p.id === gameState.players[dealerIndex].id);

        board.innerHTML += `
            <div class="player-row ${isLeader ? 'is-leader' : ''} ${isDealer ? 'is-dealer' : ''}">
                <div class="rank-badge">${rank}</div>
                <div class="p-name-container">
                    <span class="p-name">${p.name}</span>
                    <span class="dealer-icon">🃏</span>
                </div>
                <input type="number" class="score-input" data-id="${p.id}" placeholder="0">
                <div class="p-total">${p.score}</div>
            </div>
        `;
    });
}

function commitRound() {
    const inputs = document.querySelectorAll('.score-input');
    let updates = [];
    let zeroCount = 0;

    for (let inp of inputs) {
        let rawVal = inp.value.trim();
        let val = rawVal === "" ? 0 : parseInt(rawVal);
        
        if(isNaN(val)) val = 0; 

        if (val === 0) zeroCount++;
        updates.push({ id: parseInt(inp.getAttribute('data-id')), val: val });
    }

    if (zeroCount > 1) {
        alert(`⚠️ Regelverstoß: Es gibt ${zeroCount} Spieler mit 0 Punkten (bzw. leeren Feldern). Es darf nur einen geben!`);
        return;
    }

    updates.forEach(u => {
        const pl = gameState.players.find(p => p.id === u.id);
        pl.score += u.val;
        pl.history.push(u.val);
    });

    gameState.round++;
    saveGame();
    renderScoreboard();
}

/* --- STATS --- */
function showStats() {
    const container = document.getElementById('fun-facts-container');
    container.innerHTML = '';

    let sorted = [...gameState.players].sort((a,b) => a.score - b.score);
    let winner = sorted[0];
    let loser = sorted[sorted.length - 1];
    
    let mostZeros = gameState.players.reduce((prev, curr) => 
        (curr.history.filter(v => v===0).length > prev.history.filter(v => v===0).length) ? curr : prev
    );
    
    let worstRoundPlayer = gameState.players[0];
    let maxPoints = -1;
    gameState.players.forEach(p => {
        let localMax = Math.max(...(p.history.length ? p.history : [0]));
        if(localMax > maxPoints) { maxPoints = localMax; worstRoundPlayer = p; }
    });

    const facts = [
        { t: "🏆 Gewinner", v: `${winner.name} (${winner.score})`, c: "var(--accent)" },
        { t: "🍂 Verlierer", v: `${loser.name} (${loser.score})`, c: "var(--danger)" },
        { t: "⭕ Null-König", v: `${mostZeros.name}`, c: "#2196F3" },
        { t: "💣 Max Punkte/Runde", v: `${worstRoundPlayer.name} (${maxPoints})`, c: "#ff9800" }
    ];

    facts.forEach(f => {
        container.innerHTML += `<div class="stat-box"><div class="stat-title">${f.t}</div><div class="stat-value" style="color:${f.c}">${f.v}</div></div>`;
    });
    
    let html = '<h3 style="margin-top:20px;">Verlauf</h3><div style="overflow-x:auto;"><table style="width:100%; font-size:0.8rem; text-align:center; border-collapse: collapse;"><tr><th>#</th>';
    gameState.players.forEach(p => html += `<th>${p.name.substring(0,3)}</th>`);
    html += '</tr>';
    for(let r=0; r < gameState.round -1; r++) {
        html += `<tr><td style="border-bottom:1px solid #444; padding:5px;">${r+1}</td>`;
        gameState.players.forEach(p => html += `<td style="border-bottom:1px solid #444;">${p.history[r]}</td>`);
        html += '</tr>';
    }
    html += '</table></div>';
    container.innerHTML += html;
    
    showScreen('stats-screen');
}
