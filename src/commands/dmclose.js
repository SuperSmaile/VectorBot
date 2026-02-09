const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasModRole, noModPermissionEmbed } = require('../utils/permissions');
const dmManager = require('../utils/dmManager');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dmclose')
        .setDescription('Закрыть DM тред')
        .addStringOption(o => o.setName('reason').setDescription('Причина закрытия')),
    
    async execute(interaction) {
        if (!hasModRole(interaction.member)) {
            return interaction.reply({ embeds: [noModPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        
        if (interaction.channel.parentId !== config.dmSystem.forumChannelId) {
            return interaction.reply({ 
                content: `${e.error} Эта команда работает только в DM тредах!`, 
                ephemeral: true 
            });
        }
        
        const oderId = dmManager.getUserByThread(interaction.channel.id);
        if (!oderId) {
            return interaction.reply({ 
                content: `${e.error} Это не DM тред!`, 
                ephemeral: true 
            });
        }
        
        const reason = interaction.options.getString('reason') || 'Без причины';
        
        try {
            const user = await interaction.client.users.fetch(oderId);
            
            const closeEmbed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setAuthor({ name: '📪 Обращение закрыто' })
                .setDescription([
                    e.line,
                    '',
                    `${e.info} Ваше обращение было закрыто.`,
                    `${e.rules} **Причина:** ${reason}`,
                    '',
                    '*Напишите снова, если нужна помощь*',
                    '',
                    e.line
                ].join('\n'))
                .setTimestamp();
            
            await user.send({ embeds: [closeEmbed] }).catch(() => {});
            
            dmManager.removeLink(oderId);
            
            const threadEmbed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setAuthor({ name: '📪 Тред закрыт' })
                .setDescription([
                    `${e.shield} **Закрыл:** ${interaction.user}`,
                    `${e.rules} **Причина:** ${reason}`
                ].join('\n'))
                .setTimestamp();
            
            await interaction.reply({ embeds: [threadEmbed] });
            
            await interaction.channel.setArchived(true);
            await interaction.channel.setLocked(true);
            
        } catch (error) {
            console.error('DM Close error:', error);
            await interaction.reply({ content: `${e.error} Ошибка!`, ephemeral: true });
        }
    }
};
