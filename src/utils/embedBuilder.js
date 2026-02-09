const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config.json');

class AestheticEmbed {
    
    // ═══════════════════════════════════════════════════════════
    // 🎨 BASE EMBED CREATOR
    // ═══════════════════════════════════════════════════════════
    
    static create(options = {}) {
        const embed = new EmbedBuilder()
            .setColor(options.color || config.colors.aesthetic)
            .setTimestamp();
        
        if (options.title) {
            embed.setTitle(options.title);
        }
        
        if (options.description) {
            embed.setDescription(options.description);
        }
        
        if (options.thumbnail) {
            embed.setThumbnail(options.thumbnail);
        }
        
        if (options.image) {
            embed.setImage(options.image);
        }
        
        if (options.footer !== false) {
            embed.setFooter({ 
                text: options.footer || config.branding.footer,
                iconURL: options.footerIcon
            });
        }
        
        if (options.author) {
            embed.setAuthor(options.author);
        }
        
        if (options.fields) {
            embed.addFields(options.fields);
        }
        
        return embed;
    }

    // ═══════════════════════════════════════════════════════════
    // ✨ WELCOME / INFO PANEL
    // ═══════════════════════════════════════════════════════════
    
    static welcomePanel(guild) {
        const { emojis, colors, branding } = config;
        
        const description = `
${emojis.line}

${emojis.sparkle} **Welcome to ${guild.name}!** ${emojis.sparkle}

> *Your journey begins here. Explore, connect,*
> *and become part of our amazing community!*

${emojis.line}

${emojis.arrow} **Quick Navigation**

${emojis.folder} <#RULES_CHANNEL_ID> ─ Community Guidelines
${emojis.announcement} <#ANNOUNCEMENTS_ID> ─ Latest Updates  
${emojis.member} <#INTRODUCTIONS_ID> ─ Say Hello!
${emojis.link} <#LINKS_ID> ─ Useful Resources

${emojis.line}

${emojis.gem} **What We Offer**

\`\`\`yaml
✦ Active & Friendly Community
✦ Regular Events & Giveaways
✦ Exclusive Content & Roles
✦ 24/7 Support & Assistance
\`\`\`

${emojis.line}
        `;
        
        return this.create({
            color: colors.aesthetic,
            author: {
                name: `${emojis.crown} ${branding.name}`,
                iconURL: guild.iconURL({ dynamic: true })
            },
            description: description,
            thumbnail: guild.iconURL({ dynamic: true, size: 512 }),
            image: branding.banner,
            footer: `${emojis.heart} Thank you for joining! • Member #${guild.memberCount}`
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 📜 RULES PANEL
    // ═══════════════════════════════════════════════════════════
    
    static rulesPanel() {
        const { emojis, colors } = config;
        
        const rules = [
            {
                emoji: '💬',
                title: 'Be Respectful',
                desc: 'Treat everyone with kindness and respect. No harassment, hate speech, or discrimination.'
            },
            {
                emoji: '🚫',
                title: 'No Spam',
                desc: 'Avoid excessive messages, caps, emojis, or promotional content without permission.'
            },
            {
                emoji: '🔞',
                title: 'Keep it Clean',
                desc: 'No NSFW content, explicit material, or inappropriate discussions.'
            },
            {
                emoji: '🎭',
                title: 'No Impersonation',
                desc: 'Don\'t pretend to be staff, other members, or public figures.'
            },
            {
                emoji: '📢',
                title: 'Use Correct Channels',
                desc: 'Keep discussions relevant to each channel\'s purpose.'
            },
            {
                emoji: '🛡️',
                title: 'Follow Discord ToS',
                desc: 'Adhere to Discord\'s Terms of Service and Community Guidelines.'
            }
        ];
        
        let rulesText = `${emojis.line}\n\n`;
        rulesText += `> ${emojis.shield} *Please read and follow these rules to ensure*\n`;
        rulesText += `> *a positive experience for everyone!*\n\n`;
        rulesText += `${emojis.line}\n\n`;
        
        rules.forEach((rule, index) => {
            rulesText += `${rule.emoji} **Rule ${index + 1}: ${rule.title}**\n`;
            rulesText += `> ${rule.desc}\n\n`;
        });
        
        rulesText += `${emojis.line}\n\n`;
        rulesText += `\`\`\`diff\n+ Breaking rules may result in warnings, mutes, or bans.\n`;
        rulesText += `+ Staff decisions are final. Appeal in tickets if needed.\`\`\``;
        
        return this.create({
            color: colors.warning,
            author: {
                name: `${emojis.rules} Server Rules`,
            },
            description: rulesText,
            footer: `${emojis.verified} By staying here, you agree to these rules`
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 📊 SERVER INFO PANEL
    // ═══════════════════════════════════════════════════════════
    
    static serverInfo(guild) {
        const { emojis, colors } = config;
        
        // Get member statistics
        const totalMembers = guild.memberCount;
        const onlineMembers = guild.members.cache.filter(m => m.presence?.status === 'online').size;
        const boostLevel = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount || 0;
        
        // Get channel counts
        const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const categories = guild.channels.cache.filter(c => c.type === 4).size;
        const roles = guild.roles.cache.size;
        
        const createdAt = Math.floor(guild.createdTimestamp / 1000);
        
        const description = `
${emojis.line}

${emojis.sparkle} **About This Server**

> ${guild.description || '*No description set*'}

${emojis.line}

${emojis.member} **Member Statistics**
\`\`\`yaml
Total Members  : ${totalMembers.toLocaleString()}
Online Now     : ${onlineMembers.toLocaleString()}
Boost Level    : ${boostLevel} (${boostCount} boosts)
\`\`\`

${emojis.folder} **Server Structure**
\`\`\`yaml
Text Channels  : ${textChannels}
Voice Channels : ${voiceChannels}
Categories     : ${categories}
Roles          : ${roles}
\`\`\`

${emojis.info} **Additional Info**
\`\`\`yaml
Server ID      : ${guild.id}
Owner          : ${guild.members.cache.get(guild.ownerId)?.user.tag || 'Unknown'}
Created        : <t:${createdAt}:R>
Region         : Automatic
\`\`\`

${emojis.line}
        `;
        
        const verificationLevels = {
            0: 'None',
            1: 'Low',
            2: 'Medium',
            3: 'High',
            4: 'Very High'
        };
        
        return this.create({
            color: colors.primary,
            author: {
                name: guild.name,
                iconURL: guild.iconURL({ dynamic: true })
            },
            description: description,
            thumbnail: guild.iconURL({ dynamic: true, size: 512 }),
            fields: [
                {
                    name: `${emojis.shield} Verification`,
                    value: `\`${verificationLevels[guild.verificationLevel]}\``,
                    inline: true
                },
                {
                    name: `${emojis.gem} Boosts`,
                    value: `\`Level ${boostLevel}\``,
                    inline: true
                },
                {
                    name: `${emojis.star} Created`,
                    value: `<t:${createdAt}:D>`,
                    inline: true
                }
            ]
        });
    }

    // ═══════════════════════════════════════════════════════════
    // ❓ HELP PANEL
    // ═══════════════════════════════════════════════════════════
    
    static helpPanel() {
        const { emojis, colors, branding } = config;
        
        const description = `
${emojis.line}

${emojis.rocket} **Available Commands**

> *Here's everything I can do for you!*

${emojis.line}

${emojis.arrow} **Information Commands**

\`/info\` ${emojis.dot} Display the welcome panel
\`/rules\` ${emojis.dot} Show server rules
\`/serverinfo\` ${emojis.dot} Server statistics
\`/help\` ${emojis.dot} This help menu

${emojis.arrow} **Admin Commands** ${emojis.crown}

\`/announce\` ${emojis.dot} Create announcement
\`/embed\` ${emojis.dot} Custom embed creator
\`/setup\` ${emojis.dot} Setup info channels

${emojis.line}

${emojis.gem} **Pro Tips**
\`\`\`yaml
• Use Tab to autocomplete commands
• Click buttons for quick actions
• Hover embeds for more info
\`\`\`

${emojis.line}
        `;
        
        return this.create({
            color: colors.info,
            author: {
                name: `${emojis.info} Help Center`,
            },
            description: description,
            footer: `${branding.footer} • Need help? Contact staff!`
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 📢 ANNOUNCEMENT PANEL
    // ═══════════════════════════════════════════════════════════
    
    static announcement(title, content, author, type = 'info') {
        const { emojis, colors } = config;
        
        const typeConfig = {
            info: { color: colors.info, emoji: emojis.info, label: 'INFORMATION' },
            update: { color: colors.success, emoji: emojis.rocket, label: 'UPDATE' },
            event: { color: colors.aesthetic, emoji: emojis.sparkle, label: 'EVENT' },
            important: { color: colors.error, emoji: emojis.fire, label: 'IMPORTANT' },
            giveaway: { color: colors.warning, emoji: emojis.gem, label: 'GIVEAWAY' }
        };
        
        const config_type = typeConfig[type] || typeConfig.info;
        
        const description = `
${emojis.line}

${config_type.emoji} **${config_type.label}**

# ${title}

${content}

${emojis.line}
        `;
        
        return this.create({
            color: config_type.color,
            description: description,
            author: {
                name: `📢 Server Announcement`,
            },
            footer: `Announced by ${author}`,
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 🔘 BUTTON ROWS
    // ═══════════════════════════════════════════════════════════
    
    static getInfoButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_rules')
                    .setLabel('Rules')
                    .setEmoji('📜')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('btn_serverinfo')
                    .setLabel('Server Info')
                    .setEmoji('📊')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('btn_help')
                    .setLabel('Help')
                    .setEmoji('❓')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel('Website')
                    .setEmoji('🌐')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://your-website.com')
            );
    }

    static getAnnouncementButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_react_fire')
                    .setEmoji('🔥')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('btn_react_heart')
                    .setEmoji('💜')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('btn_react_star')
                    .setEmoji('⭐')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('btn_react_rocket')
                    .setEmoji('🚀')
                    .setStyle(ButtonStyle.Secondary)
            );
    }
}

module.exports = AestheticEmbed;
