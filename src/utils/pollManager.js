const fs = require('fs');
const path = require('path');

const pollsFile = path.join(__dirname, '../../data/polls.json');
const dataDir = path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(pollsFile)) fs.writeFileSync(pollsFile, '{}');

function getPolls() {
    try { return JSON.parse(fs.readFileSync(pollsFile, 'utf8')); } 
    catch { return {}; }
}

function savePoll(id, data) {
    const p = getPolls();
    p[id] = data;
    fs.writeFileSync(pollsFile, JSON.stringify(p, null, 2));
}

function getPoll(id) {
    return getPolls()[id] || null;
}

function deletePoll(id) {
    const p = getPolls();
    delete p[id];
    fs.writeFileSync(pollsFile, JSON.stringify(p, null, 2));
}

function addVote(msgId, oderId, optIdx) {
    const polls = getPolls();
    if (!polls[msgId]) return { success: false, error: 'not_found' };
    
    const poll = polls[msgId];
    const maxChoices = poll.maxChoices || 1;
    
    let userVoteCount = 0;
    let userVotedOptions = [];
    poll.votes.forEach((arr, i) => {
        if (arr.includes(oderId)) {
            userVoteCount++;
            userVotedOptions.push(i);
        }
    });
    
    const alreadyVoted = poll.votes[optIdx].includes(oderId);
    
    if (alreadyVoted) {
        const idx = poll.votes[optIdx].indexOf(oderId);
        poll.votes[optIdx].splice(idx, 1);
    } else {
        if (userVoteCount >= maxChoices) {
            if (maxChoices === 1) {
                userVotedOptions.forEach(oi => {
                    const idx = poll.votes[oi].indexOf(oderId);
                    if (idx > -1) poll.votes[oi].splice(idx, 1);
                });
                poll.votes[optIdx].push(oderId);
            } else {
                return { success: false, error: 'max_reached', max: maxChoices };
            }
        } else {
            poll.votes[optIdx].push(oderId);
        }
    }
    
    polls[msgId] = poll;
    fs.writeFileSync(pollsFile, JSON.stringify(polls, null, 2));
    return { success: true, poll };
}

module.exports = { getPolls, savePoll, getPoll, deletePoll, addVote };
