const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Объявление')
        .addStringOption(o => o.setName('type').setDescription('Тип').setRequired(true).addChoices(
            { name: '📢 Информация', value: 'info' },
            { name: '🚀 Обновление', value: 'update' },
            { name: '✨ Событие', value: 'event' },
            { name: '🔥 Важно', value: 'important' },
            { name: '💎 Розыгрыш', value: 'giveaway' },
            { name: '📜 Правила', value: 'rules' },
            { name: '👋 Приветствие', value: 'welcome' }
        ))
        .addChannelOption(o => o.setName('channel').setDescription('Канал'))
        .addStringOption(o => o.setName('ping').setDescription('Пинг').addChoices(
            { name: 'Никого', value: 'none' },
            { name: '@everyone', value: 'everyone' },
            { name: '@here', value: 'here' }
        ))
        .addRoleOption(o => o.setName('ping_role').setDescription('Пинг роли'))
        .addUserOption(o => o.setName('ping_user').setDescription('Пинг юзера')),
    
    async execute(interaction) {
        if (!hasAdminRole(interaction.member)) {
            return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true });
        }
        
        const type = interaction.options.getString('type');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const ping = interaction.options.getString('ping') || 'none';
        const pingRole = interaction.options.getRole('ping_role');
        const pingUser = interaction.options.getUser('ping_user');
        
        let pingStr = '';
        if (ping === 'everyone') pingStr = '@everyone';
        else if (ping === 'here') pingStr = '@here';
        if (pingRole) pingStr += ` ${pingRole}`;
        if (pingUser) pingStr += ` ${pingUser}`;
        
        const modal = new ModalBuilder()
            .setCustomId(`announce_${type}_${channel.id}_${encodeURIComponent(pingStr)}`)
            .setTitle('Объявление');
        
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('announce_title').setLabel('Заголовок').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('announce_content').setLabel('Содержание').setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        
        await interaction.showModal(modal);
    }
};
