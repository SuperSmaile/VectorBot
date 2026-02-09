const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasModRole, noModPermissionEmbed } = require('../utils/permissions');
const warnManager = require('../utils/warnManager');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Посмотреть предупреждения пользователя')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Пользователь')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        if (!hasModRole(interaction.member)) {
            return interaction.reply({ embeds: [noModPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const target = interaction.options.getUser('user');
        
        const warnings = warnManager.getUserWarnings(interaction.guild.id, target.id);
        
        if (warnings.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setDescription(`${e.success} У ${target} нет предупреждений`)
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        }
        
        let warningsList = '';
        for (const warn of warnings.slice(-10)) {
            const time = Math.floor(warn.time / 1000);
            warningsList += `\`${warn.id}\` • <t:${time}:R>\n`;
            warningsList += `> ${warn.reason}\n\n`;
        }
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setAuthor({ 
                name: `${e.warning} Предупреждения пользователя`,
                iconURL: target.displayAvatarURL({ dynamic: true })
            })
            .setDescription([
                e.line,
                '',
                `${e.member} **Пользователь:** ${target}`,
                `${e.info} **Всего:** ${warnings.length}`,
                '',
                e.line,
                '',
                warningsList,
                e.line,
                '',
                `*Используйте \`/unwarn ${target.id} <ID>\` для удаления*`
            ].join('\n'))
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
