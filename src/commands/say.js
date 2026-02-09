const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Бот отправит сообщение')
        .addChannelOption(o => o.setName('channel').setDescription('Канал'))
        .addStringOption(o => o.setName('reply_to').setDescription('ID сообщения для ответа'))
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
        const replyTo = interaction.options.getString('reply_to') || '';
        const ping = interaction.options.getString('ping') || 'none';
        const pingRole = interaction.options.getRole('ping_role');
        const pingUser = interaction.options.getUser('ping_user');
        
        let pingStr = '';
        if (ping === 'everyone') pingStr = '@everyone';
        else if (ping === 'here') pingStr = '@here';
        if (pingRole) pingStr += ` ${pingRole}`;
        if (pingUser) pingStr += ` ${pingUser}`;
        
        const modal = new ModalBuilder()
            .setCustomId(`say_${channel.id}_${encodeURIComponent(pingStr)}_${replyTo}`)
            .setTitle('Сообщение');
        
        modal.addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('say_message')
                .setLabel('Текст')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(2000)
                .setRequired(true)
        ));
        
        await interaction.showModal(modal);
    }
};
