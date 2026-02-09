const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasModRole, noModPermissionEmbed } = require('../utils/permissions');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Удалить сообщения пользователя')
        .addUserOption(o => o.setName('user').setDescription('Пользователь').setRequired(true))
        .addIntegerOption(o => o.setName('amount').setDescription('Количество (1-100)').setMinValue(1).setMaxValue(100).setRequired(true)),
    
    async execute(interaction) {
        if (!hasModRole(interaction.member)) {
            return interaction.reply({ embeds: [noModPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const target = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            
            const userMessages = messages
                .filter(m => m.author.id === target.id)
                .filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000)
                .first(amount);
            
            if (userMessages.length === 0) {
                return interaction.editReply(`${e.error} Сообщения не найдены!`);
            }
            
            const deleted = await interaction.channel.bulkDelete(userMessages, true);
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setDescription([
                    `${e.broom} **Удалено сообщений:** ${deleted.size}`,
                    `${e.member} **Пользователь:** ${target}`,
                    `${e.shield} **Модератор:** ${interaction.user}`
                ].join('\n'))
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Purge error:', error);
            await interaction.editReply(`${e.error} Ошибка при удалении!`);
        }
    }
};
