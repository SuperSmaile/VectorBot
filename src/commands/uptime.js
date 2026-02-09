const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');
const config = require('../../config.json');

const startTime = Date.now();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Время работы бота'),
    
    async execute(interaction) {
        if (!hasAdminRole(interaction.member)) {
            return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const uptime = Date.now() - startTime;
        
        const days = Math.floor(uptime / 86400000);
        const hours = Math.floor((uptime % 86400000) / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        const seconds = Math.floor((uptime % 60000) / 1000);
        
        let uptimeStr = '';
        if (days > 0) uptimeStr += `${days}д `;
        if (hours > 0) uptimeStr += `${hours}ч `;
        if (minutes > 0) uptimeStr += `${minutes}м `;
        uptimeStr += `${seconds}с`;
        
        const startTimestamp = Math.floor(startTime / 1000);
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setAuthor({ name: '⏱️ Время работы' })
            .setDescription([
                e.line,
                '',
                `${e.arrow} **Аптайм:** \`${uptimeStr}\``,
                `${e.arrow} **Запущен:** <t:${startTimestamp}:F>`,
                `${e.arrow} **Серверов:** \`${interaction.client.guilds.cache.size}\``,
                `${e.arrow} **Память:** \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``,
                '',
                e.line
            ].join('\n'))
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
