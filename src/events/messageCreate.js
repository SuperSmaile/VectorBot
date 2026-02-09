const { Events, EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config.json');
const dmManager = require('../utils/dmManager');
const aiManager = require('../utils/aiManager');

let warnManager;
try {
    warnManager = require('../utils/warnManager');
} catch {
    warnManager = null;
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;
        
        const e = config.emojis;
        const dmConfig = config.dmSystems;
        
        // ============== AI AUTO-REPLY ==============
        if (message.guild && aiManager.isAutoReplyEnabled()) {
            const autoChannels = aiManager.getAutoReplyChannels();
            const shouldReply = autoChannels.length === 0 
                ? message.mentions.has(message.client.user)
                : autoChannels.includes(message.channel.id);
            
            if (shouldReply && message.content) {
                try {
                    let context = '';
                    try {
                        const messages = await message.channel.messages.fetch({ limit: 5, before: message.id });
                        context = messages
                            .reverse()
                            .map(m => `${m.author.username}: ${m.content}`)
                            .join('\n');
                    } catch {}
                    
                    const cleanContent = message.content
                        .replace(new RegExp(`<@!?${message.client.user.id}>`, 'g'), '')
                        .trim();
                    
                    if (cleanContent) {
                        await message.channel.sendTyping();
                        
                        const response = await aiManager.generateWithStyle(
                            cleanContent, 
                            aiManager.getCurrentStyle(),
                            context
                        );
                        
                        if (response) {
                            await message.reply(response);
                        }
                    }
                } catch (error) {
                    console.error('AI auto-reply error:', error);
                }
            }
        }
        
        // ============== DM SYSTEM ==============
        if (!dmConfig || !dmConfig.guildId || !dmConfig.forumChannelId) return;
        
        // DM TO BOT
        if (message.channel.type === ChannelType.DM) {
            try {
                const guild = message.client.guilds.cache.get(dmConfig.guildId);
                if (!guild) return;
                
                const forumChannel = guild.channels.cache.get(dmConfig.forumChannelId);
                if (!forumChannel) return;
                
                const userId = message.author.id;
                let threadInfo = dmManager.getThreadByUser(userId);
                let thread;
                
                let member = null;
                try {
                    member = await guild.members.fetch(userId);
                } catch {}
                
                if (threadInfo) {
                    try {
                        thread = await forumChannel.threads.fetch(threadInfo.threadId);
                        if (thread && thread.archived) {
                            await thread.setArchived(false);
                        }
                    } catch {
                        threadInfo = null;
                        thread = null;
                    }
                }
                
                if (!thread) {
                    let warnings = [];
                    if (warnManager) {
                        warnings = warnManager.getUserWarnings(dmConfig.guildId, userId);
                    }
                    
                    let rolesText = '*Не на сервере*';
                    let joinedAt = '*Неизвестно*';
                    let nickname = '*Нет*';
                    
                    if (member) {
                        const roles = member.roles.cache
                            .filter(r => r.id !== guild.id)
                            .sort((a, b) => b.position - a.position)
                            .map(r => r.toString())
                            .slice(0, 10);
                        
                        rolesText = roles.length > 0 ? roles.join(' ') : '*Нет ролей*';
                        joinedAt = `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`;
                        nickname = member.nickname || '*Нет*';
                    }
                    
                    const startEmbed = new EmbedBuilder()
                        .setColor(config.colors.primary)
                        .setAuthor({ 
                            name: message.author.tag, 
                            iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                        })
                        .setDescription([
                            e.line,
                            '',
                            `${e.mail || '📬'} **Новое обращение**`,
                            '',
                            `${e.member || '👤'} **Пользователь:** ${message.author}`,
                            `${e.id || '🆔'} **ID:** \`${userId}\``,
                            `${e.star || '⭐'} **Никнейм:** ${nickname}`,
                            `${e.calendar || '📅'} **На сервере:** ${joinedAt}`,
                            `${e.warning || '⚠️'} **Предупреждений:** ${warnings.length}`,
                            '',
                            `${e.folder || '📁'} **Роли:**`,
                            rolesText,
                            '',
                            e.line
                        ].join('\n'))
                        .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
                        .setTimestamp();
                    
                    thread = await forumChannel.threads.create({
                        name: `📬 ${message.author.username}`,
                        message: { embeds: [startEmbed] }
                    });
                    
                    dmManager.createLink(userId, thread.id, message.author.tag);
                }
                
                const msgEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setAuthor({ 
                        name: message.author.username, 
                        iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                    })
                    .setDescription(message.content || '*[Без текста]*')
                    .setTimestamp();
                
                if (message.attachments.size > 0) {
                    const firstAtt = message.attachments.first();
                    if (firstAtt.contentType && firstAtt.contentType.startsWith('image/')) {
                        msgEmbed.setImage(firstAtt.url);
                    } else {
                        msgEmbed.addFields({ name: '📎 Вложение', value: firstAtt.url });
                    }
                }
                
                const buttons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ai_reply_${message.id}`)
                        .setLabel('AI Ответ')
                        .setEmoji('🤖')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`ai_reply_style_${message.id}`)
                        .setLabel('Выбрать стиль')
                        .setEmoji('🎨')
                        .setStyle(ButtonStyle.Secondary)
                );
                
                const sentMsg = await thread.send({ embeds: [msgEmbed], components: [buttons] });
                dmManager.updateLastMessage(userId, message.id, sentMsg.id);
                
            } catch (error) {
                console.error('DM to Forum error:', error);
            }
            return;
        }
        
        // FORUM THREAD REPLY
        if (message.channel.type === ChannelType.PublicThread || message.channel.type === ChannelType.PrivateThread) {
            if (message.channel.parentId !== dmConfig.forumChannelId) return;
            
            const userId = dmManager.getUserByThread(message.channel.id);
            if (!userId) return;
            
            try {
                const user = await message.client.users.fetch(userId);
                const dmChannel = await user.createDM();
                
                const sendOptions = {};
                
                if (message.content) {
                    sendOptions.content = message.content;
                }
                
                if (message.attachments.size > 0) {
                    sendOptions.files = message.attachments.map(att => ({
                        attachment: att.url,
                        name: att.name
                    }));
                }
                
                if (message.reference && message.reference.messageId) {
                    const dmMsgId = dmManager.getMessageLink(userId, message.reference.messageId);
                    if (dmMsgId) {
                        sendOptions.reply = { messageReference: dmMsgId, failIfNotExists: false };
                    }
                }
                
                if (sendOptions.content || sendOptions.files) {
                    await dmChannel.send(sendOptions);
                    await message.react('📨').catch(() => {});
                }
                
            } catch (error) {
                console.error('Forum to DM error:', error);
                await message.react('❌').catch(() => {});
            }
        }
    }
};
