const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Личное сообщение пользователю')
        .addUserOption(o => o.setName('user').setDescription('Пользователь').setRequired(true))
        .addBooleanOption(o => o.setName('embed').setDescription('Отправить как эмбед?')),
    
    async execute(interaction) {
        if (!hasAdminRole(interaction.member)) {
            return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true });
        }
        
        const target = interaction.options.getUser('user');
        const useEmbed = interaction.options.getBoolean('embed') || false;
        
        const modal = new ModalBuilder()
            .setCustomId(`dm_${target.id}_${useEmbed}`)
            .setTitle(`Сообщение для ${target.username}`);
        
        if (useEmbed) {
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('dm_title')
                        .setLabel('Заголовок')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('dm_content')
                        .setLabel('Сообщение')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                )
            );
        } else {
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('dm_content')
                        .setLabel('Сообщение')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                )
            );
        }
        
        await interaction.showModal(modal);
    }
};
