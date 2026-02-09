const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Забанить пользователя')
        .addUserOption(o => o.setName('user').setDescription('Пользователь').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Причина'))
        .addIntegerOption(o => o.setName('days').setDescription('Удалить сообщения за X дней (0-7)').setMinValue(0).setMaxValue(7)),
    
    async execute(interaction) {
        if (!hasAdminRole(interaction.member)) {
            return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Причина не указана';
        const days = interaction.options.getInteger('days') || 0;
        
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        
        if (target.id === interaction.user.id) {
            return interaction.reply({ content: `${e.error} Нельзя забанить себя!`, ephemeral: true });
        }
        
        if (target.id === interaction.guild.ownerId) {
            return interaction.reply({ content: `${e.error} Нельзя забанить владельца!`, ephemeral: true });
        }
        
        if (member && member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: `${e.error} Недостаточно прав!`, ephemeral: true });
        }
        
        try {
            // DM before ban
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.colors.error)
                    .setAuthor({ name: '🔨 Вы были забанены' })
                    .setDescription([
                        e.line,
                        '',
                        `${e.folder} **Сервер:** ${interaction.guild.name}`,
                        `${e.rules} **Причина:** ${reason}`,
                        '',
                        e.line
                    ].join('\n'))
                    .setTimestamp();
                await target.send({ embeds: [dmEmbed] });
            } catch {}
            
            await interaction.guild.members.ban(target, { 
                deleteMessageDays: days, 
                reason: `${reason} | Модератор: ${interaction.user.tag}` 
            });
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setAuthor({ name: '🔨 Пользователь забанен' })
                .setDescription([
                    e.line,
                    '',
                    `${e.member} **Пользователь:** ${target.tag}`,
                    `${e.id} **ID:** \`${target.id}\``,
                    `${e.rules} **Причина:** ${reason}`,
                    `${e.broom} **Удалено сообщений:** ${days} дней`,
                    `${e.shield} **Модератор:** ${interaction.user}`,
                    '',
                    e.line
                ].join('\n'))
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Ban error:', error);
            await interaction.reply({ content: `${e.error} Не удалось забанить!`, ephemeral: true });
        }
    }
};
