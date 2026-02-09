const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Показать задержку бота'),
    
    async execute(interaction) {
        if (!hasAdminRole(interaction.member)) {
            return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const sent = await interaction.deferReply({ fetchReply: true });
        
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        
        let status, color;
        if (latency < 100) {
            status = '🟢 Отлично';
            color = config.colors.success;
        } else if (latency < 200) {
            status = '🟡 Нормально';
            color = config.colors.warning;
        } else {
            status = '🔴 Медленно';
            color = config.colors.error;
        }
        
        const embed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({ name: '🏓 Понг!' })
            .setDescription([
                e.line,
                '',
                `${e.arrow} **Задержка бота:** \`${latency}ms\``,
                `${e.arrow} **API Discord:** \`${apiLatency}ms\``,
                `${e.arrow} **Статус:** ${status}`,
                '',
                e.line
            ].join('\n'))
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};
