const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');
const aiManager = require('../utils/aiManager');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aitoggle')
        .setDescription('Управление автоматическими AI ответами')
        .addSubcommand(sub => sub
            .setName('enable')
            .setDescription('Включить авто-ответы')
        )
        .addSubcommand(sub => sub
            .setName('disable')
            .setDescription('Выключить авто-ответы')
        )
        .addSubcommand(sub => sub
            .setName('status')
            .setDescription('Статус авто-ответов')
        )
        .addSubcommand(sub => sub
            .setName('channel')
            .setDescription('Добавить/удалить канал для авто-ответов')
            .addChannelOption(o => o
                .setName('target')
                .setDescription('Канал')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
            .addStringOption(o => o
                .setName('action')
                .setDescription('Действие')
                .setRequired(true)
                .addChoices(
                    { name: 'Добавить', value: 'add' },
                    { name: 'Удалить', value: 'remove' }
                )
            )
        ),
    
    hidden: true,
    
    async execute(interaction) {
        if (!hasAdminRole(interaction.member)) {
            return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const sub = interaction.options.getSubcommand();
        
        if (sub === 'enable') {
            aiManager.setAutoReply(true);
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setDescription([
                    `${e.success} **Авто-ответы включены!**`,
                    '',
                    `${e.ai} Текущий стиль: **${aiManager.getStyleInfo().name}**`,
                    `${e.info} Стиль будет меняться каждый день в 00:00`
                ].join('\n'));
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (sub === 'disable') {
            aiManager.setAutoReply(false);
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription(`${e.success} **Авто-ответы выключены!**`);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (sub === 'status') {
            const settings = aiManager.getSettings();
            const channels = settings.autoReplyChannels;
            
            const channelList = channels.length > 0 
                ? channels.map(id => `<#${id}>`).join('\n') 
                : '*Все каналы (где упоминают бота)*';
            
            const embed = new EmbedBuilder()
                .setColor(settings.autoReplyEnabled ? config.colors.success : config.colors.error)
                .setAuthor({ name: '🤖 AI Авто-ответы' })
                .setDescription([
                    `**Статус:** ${settings.autoReplyEnabled ? '🟢 Включено' : '🔴 Выключено'}`,
                    `**Текущий стиль:** ${aiManager.getStyleInfo().name}`,
                    `**Последняя смена:** ${settings.lastStyleChange}`,
                    '',
                    `**Каналы:**`,
                    channelList
                ].join('\n'))
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (sub === 'channel') {
            const channel = interaction.options.getChannel('target');
            const action = interaction.options.getString('action');
            
            if (action === 'add') {
                const channels = aiManager.addAutoReplyChannel(channel.id);
                return interaction.reply({
                    content: `${e.success} Канал ${channel} добавлен для авто-ответов! Всего каналов: ${channels.length}`,
                    ephemeral: true
                });
            } else {
                const channels = aiManager.removeAutoReplyChannel(channel.id);
                return interaction.reply({
                    content: `${e.success} Канал ${channel} удалён из авто-ответов! Осталось каналов: ${channels.length}`,
                    ephemeral: true
                });
            }
        }
    }
};
