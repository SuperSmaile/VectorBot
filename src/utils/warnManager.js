const fs = require('fs');
const path = require('path');

const warnsFile = path.join(__dirname, '../../data/warnings.json');
const dataDir = path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(warnsFile)) fs.writeFileSync(warnsFile, '{}');

function getWarnings() {
    try { 
        return JSON.parse(fs.readFileSync(warnsFile, 'utf8')); 
    } catch { 
        return {}; 
    }
}

function saveWarnings(data) {
    fs.writeFileSync(warnsFile, JSON.stringify(data, null, 2));
}

function addWarning(guildId, oderId, modId, reason) {
    const w = getWarnings();
    const k = guildId + '_' + oderId;
    
    if (!w[k]) w[k] = [];
    
    const warn = {
        id: Date.now().toString(36),
        oderId: oderId,
        mod: modId,
        reason: reason,
        time: Date.now()
    };
    
    w[k].push(warn);
    saveWarnings(w);
    
    return { warning: warn, total: w[k].length };
}

function getUserWarnings(guildId, oderId) {
    const w = getWarnings();
    return w[guildId + '_' + oderId] || [];
}

function removeWarning(guildId, oderId, warnId) {
    const w = getWarnings();
    const k = guildId + '_' + oderId;
    
    if (!w[k]) return false;
    
    const idx = w[k].findIndex(x => x.id === warnId);
    if (idx === -1) return false;
    
    w[k].splice(idx, 1);
    saveWarnings(w);
    return true;
}

function clearUserWarnings(guildId, oderId) {
    const w = getWarnings();
    const k = guildId + '_' + oderId;
    
    const cnt = w[k]?.length || 0;
    delete w[k];
    saveWarnings(w);
    
    return cnt;
}

module.exports = { addWarning, getUserWarnings, removeWarning, clearUserWarnings };
