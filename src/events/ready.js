const { Events, ActivityType } = require('discord.js');
const aiManager = require('../utils/aiManager');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log('');
        console.log('╔════════════════════════════════════════╗');
        console.log(`║  🚀 Bot online: ${client.user.tag}`);
        console.log(`║  📊 Servers: ${client.guilds.cache.size}`);
        console.log('╚════════════════════════════════════════╝');
        console.log('');
        
        client.user.setActivity('Ловлю Lo-Fi Вайбы на LocalRP, Смекаешь?', { type: ActivityType.Watching });
        client.user.setStatus('online');
    },
    execute(client) {
        console.log(`✅ Logged in as ${client.user.tag}`);
        
        // ============== AI STYLE ROTATION ==============
        aiManager.checkAndRotateStyle();
        
        // Check every minute for midnight rotation
        setInterval(() => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                const rotated = aiManager.checkAndRotateStyle();
                if (rotated) {
                    console.log(`🎨 Midnight style rotation: ${aiManager.getStyleInfo().name}`);
                }
            }
        }, 60 * 1000);
    }
};
