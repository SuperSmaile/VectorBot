const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Создать эмбед')
        .addChannelOption(o => o.setName('channel').setDescription('Канал'))
        .addStringOption(o => o.setName('color').setDescription('Цвет').addChoices(
            { name: '🔵 Синий', value: '5865F2' },
            { name: '🟢 Зелёный', value: '57F287' },
            { name: '🟡 Жёлтый', value: 'FEE75C' },
            { name: '🔴 Красный', value: 'ED4245' },
            { name: '🟣 Фиолетовый', value: 'E879F9' }
        ))
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
        
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const color = interaction.options.getString('color') || '5865F2';
        const ping = interaction.options.getString('ping') || 'none';
        const pingRole = interaction.options.getRole('ping_role');
        const pingUser = interaction.options.getUser('ping_user');
        
        let pingStr = '';
        if (ping === 'everyone') pingStr = '@everyone';
        else if (ping === 'here') pingStr = '@here';
        if (pingRole) pingStr += ` ${pingRole}`;
        if (pingUser) pingStr += ` ${pingUser}`;
        
        const modal = new ModalBuilder()
            .setCustomId(`embed_${channel.id}_${color}_${encodeURIComponent(pingStr)}`)
            .setTitle('Эмбед');
        
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('embed_title').setLabel('Заголовок').setStyle(TextInputStyle.Short).setRequired(false)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('embed_description').setLabel('Описание').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('embed_image').setLabel('Картинка (URL)').setStyle(TextInputStyle.Short).setRequired(false)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('embed_footer').setLabel('Футер').setStyle(TextInputStyle.Short).setRequired(false))
        );
        
        await interaction.showModal(modal);
    }
};
