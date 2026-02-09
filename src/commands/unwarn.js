const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasModRole, noModPermissionEmbed } = require('../utils/permissions');
const warnManager = require('../utils/warnManager');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Снять предупреждение')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Пользователь')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('warn_id')
                .setDescription('ID предупреждения (или "all" для удаления всех)')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        if (!hasModRole(interaction.member)) {
            return interaction.reply({ embeds: [noModPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const target = interaction.options.getUser('user');
        const warnId = interaction.options.getString('warn_id');
        
        if (warnId.toLowerCase() === 'all') {
            const count = warnManager.clearUserWarnings(interaction.guild.id, target.id);
            
            if (count === 0) {
                return interaction.reply({ 
                    content: `${e.error} У ${target} нет предупреждений!`, 
                    ephemeral: true 
                });
            }
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setDescription([
                    `${e.success} **Все предупреждения сняты**`,
                    '',
                    `${e.member} **Пользователь:** ${target}`,
                    `${e.broom} **Удалено:** ${count} предупреждений`,
                    `${e.shield} **Модератор:** ${interaction.user}`
                ].join('\n'))
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const removed = warnManager.removeWarning(interaction.guild.id, target.id, warnId);
        
        if (!removed) {
            return interaction.reply({ 
                content: `${e.error} Предупреждение с ID \`${warnId}\` не найдено!`, 
                ephemeral: true 
            });
        }
        
        const remaining = warnManager.getUserWarnings(interaction.guild.id, target.id);
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription([
                `${e.success} **Предупреждение снято**`,
                '',
                `${e.member} **Пользователь:** ${target}`,
                `${e.id} **ID:** \`${warnId}\``,
                `${e.info} **Осталось:** ${remaining.length}`,
                `${e.shield} **Модератор:** ${interaction.user}`
            ].join('\n'))
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
