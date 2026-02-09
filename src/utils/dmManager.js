const fs = require('fs');
const path = require('path');

const dmFile = path.join(__dirname, '../../data/dm-threads.json');
const dataDir = path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dmFile)) fs.writeFileSync(dmFile, '{}');

function getData() {
    try { return JSON.parse(fs.readFileSync(dmFile, 'utf8')); }
    catch { return {}; }
}

function saveData(data) {
    fs.writeFileSync(dmFile, JSON.stringify(data, null, 2));
}

function getThreadByUser(oderId) {
    const data = getData();
    return data[oderId] || null;
}

function getUserByThread(threadId) {
    const data = getData();
    for (const [oderId, info] of Object.entries(data)) {
        if (info.threadId === threadId) return oderId;
    }
    return null;
}

function createLink(oderId, threadId, username) {
    const data = getData();
    data[oderId] = {
        threadId,
        username,
        createdAt: Date.now(),
        messages: {}
    };
    saveData(data);
}

function removeLink(oderId) {
    const data = getData();
    delete data[oderId];
    saveData(data);
}

function updateLastMessage(oderId, dmMsgId, forumMsgId) {
    const data = getData();
    if (!data[oderId]) return;
    if (!data[oderId].messages) data[oderId].messages = {};
    data[oderId].messages[forumMsgId] = dmMsgId;
    saveData(data);
}

function getMessageLink(oderId, forumMsgId) {
    const data = getData();
    if (!data[oderId] || !data[oderId].messages) return null;
    return data[oderId].messages[forumMsgId] || null;
}

module.exports = { 
    getThreadByUser, 
    getUserByThread, 
    createLink, 
    removeLink, 
    updateLastMessage, 
    getMessageLink 
};
