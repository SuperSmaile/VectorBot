const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ghost')
        .setDescription('Самоудаляющееся сообщение')
        .addIntegerOption(o => o.setName('seconds').setDescription('Удалить через X секунд (5-60)').setMinValue(5).setMaxValue(60))
        .addChannelOption(o => o.setName('channel').setDescription('Канал')),
    
    async execute(interaction) {
        if (!hasAdminRole(interaction.member)) {
            return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true });
        }
        
        const seconds = interaction.options.getInteger('seconds') || 10;
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        
        const modal = new ModalBuilder()
            .setCustomId(`ghost_${channel.id}_${seconds}`)
            .setTitle('Призрачное сообщение');
        
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('ghost_message')
                    .setLabel(`Сообщение (удалится через ${seconds} сек)`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(2000)
                    .setRequired(true)
            )
        );
        
        await interaction.showModal(modal);
    }
};
