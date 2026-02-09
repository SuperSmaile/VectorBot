const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasModRole, noModPermissionEmbed } = require('../utils/permissions');
const warnManager = require('../utils/warnManager');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Информация о пользователе')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Пользователь')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        if (!hasModRole(interaction.member)) {
            return interaction.reply({ embeds: [noModPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const target = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        
        const createdAt = Math.floor(target.createdTimestamp / 1000);
        
        const statusEmoji = {
            online: e.online,
            idle: e.idle,
            dnd: e.dnd,
            offline: e.offline
        };
        
        const statusText = {
            online: 'В сети',
            idle: 'Неактивен',
            dnd: 'Не беспокоить',
            offline: 'Не в сети'
        };
        
        // Get warnings
        const warnings = warnManager.getUserWarnings(interaction.guild.id, target.id);
        
        let description = [
            e.line,
            '',
            `${e.member} **Основная информация**`,
            '',
            `> ${e.id} **ID:** \`${target.id}\``,
            `> ${e.star} **Имя:** ${target.username}`,
            `> ${e.info} **Дисплей:** ${target.displayName}`,
            `> ${e.bot} **Бот:** ${target.bot ? 'Да' : 'Нет'}`,
            `> ${e.calendar} **Создан:** <t:${createdAt}:D> (<t:${createdAt}:R>)`,
            ''
        ];
        
        if (member) {
            const joinedAt = Math.floor(member.joinedTimestamp / 1000);
            const status = member.presence?.status || 'offline';
            const boostingSince = member.premiumSince 
                ? Math.floor(member.premiumSinceTimestamp / 1000) 
                : null;
            
            const roles = member.roles.cache
                .filter(r => r.id !== interaction.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(r => r.toString())
                .slice(0, 10);
            
            const rolesText = roles.length > 0 
                ? roles.join(', ') + (member.roles.cache.size > 11 ? ` +${member.roles.cache.size - 11}` : '')
                : 'Нет ролей';
            
            description.push(
                `${e.shield} **На сервере**`,
                '',
                `> ${statusEmoji[status]} **Статус:** ${statusText[status]}`,
                `> ${e.calendar} **Присоединился:** <t:${joinedAt}:D> (<t:${joinedAt}:R>)`,
                `> ${e.crown} **Высшая роль:** ${member.roles.highest}`,
                boostingSince ? `> ${e.gem} **Бустит с:** <t:${boostingSince}:D>` : '',
                '',
                `${e.folder} **Роли [${member.roles.cache.size - 1}]**`,
                '',
                `> ${rolesText}`,
                ''
            );
            
            // Timeout info
            if (member.communicationDisabledUntil) {
                const timeoutEnd = Math.floor(member.communicationDisabledUntilTimestamp / 1000);
                description.push(
                    `${e.timeout} **Тайм-аут**`,
                    '',
                    `> Истекает: <t:${timeoutEnd}:R>`,
                    ''
                );
            }
        }
        
        // Warnings section
        description.push(
            `${e.warning} **Предупреждения [${warnings.length}]**`,
            ''
        );
        
        if (warnings.length > 0) {
            const recentWarns = warnings.slice(-3);
            for (const warn of recentWarns) {
                const time = Math.floor(warn.time / 1000);
                description.push(`> \`${warn.id}\` • ${warn.reason.substring(0, 30)}${warn.reason.length > 30 ? '...' : ''} • <t:${time}:R>`);
            }
            if (warnings.length > 3) {
                description.push(`> *...и ещё ${warnings.length - 3}*`);
            }
        } else {
            description.push('> Нет предупреждений');
        }
        
        description.push('', e.line);
        
        const embed = new EmbedBuilder()
            .setColor(member?.displayHexColor || config.colors.primary)
            .setAuthor({ 
                name: `${e.member} Информация о пользователе`, 
                iconURL: target.displayAvatarURL({ dynamic: true }) 
            })
            .setDescription(description.filter(Boolean).join('\n'))
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
            .setFooter({ text: config.branding.footer })
            .setTimestamp();
        
        const user = await target.fetch().catch(() => null);
        if (user?.banner) {
            embed.setImage(user.bannerURL({ dynamic: true, size: 512 }));
        }
        
        await interaction.reply({ embeds: [embed] });
    }
};
