const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('massevent')
        .setDescription('Массовая рассылка в ЛС')
        .addStringOption(o => o.setName('target').setDescription('Кому отправить').setRequired(true).addChoices(
            { name: '👥 Всем участникам', value: 'all' },
            { name: '🟢 Только онлайн', value: 'online' },
            { name: '👤 Одному пользователю', value: 'user' }
        ))
        .addUserOption(o => o.setName('user').setDescription('Пользователь (если выбран "Одному")')),
    
    async execute(interaction) {
        if (!hasAdminRole(interaction.member)) {
            return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const target = interaction.options.getString('target');
        const user = interaction.options.getUser('user');
        
        if (target === 'user' && !user) {
            return interaction.reply({ content: `${e.error} Укажите пользователя!`, ephemeral: true });
        }
        
        const modal = new ModalBuilder()
            .setCustomId(`massevent_${target}_${user?.id || 'none'}`)
            .setTitle('Массовая рассылка');
        
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('mass_title')
                    .setLabel('Заголовок')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('mass_content')
                    .setLabel('Сообщение')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
            )
        );
        
        await interaction.showModal(modal);
    }
};
