const { 
    SlashCommandBuilder, 
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');
const { hasModRole, noModPermissionEmbed } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Создать опрос')
        .addStringOption(o => o
            .setName('duration')
            .setDescription('Длительность')
            .setRequired(true)
            .addChoices(
                { name: '5 минут', value: '5' },
                { name: '15 минут', value: '15' },
                { name: '30 минут', value: '30' },
                { name: '1 час', value: '60' },
                { name: '3 часа', value: '180' },
                { name: '6 часов', value: '360' },
                { name: '12 часов', value: '720' },
                { name: '24 часа', value: '1440' },
                { name: '3 дня', value: '4320' },
                { name: '7 дней', value: '10080' },
                { name: 'Своя (минуты)', value: 'custom' }
            ))
        .addIntegerOption(o => o
            .setName('max_choices')
            .setDescription('Макс. вариантов для выбора (1 = один выбор)')
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(false))
        .addBooleanOption(o => o
            .setName('anonymous')
            .setDescription('Анонимное голосование? (скрыть кто голосовал)')
            .setRequired(false))
        .addChannelOption(o => o
            .setName('channel')
            .setDescription('Канал для опроса')
            .setRequired(false))
        .addBooleanOption(o => o
            .setName('ping')
            .setDescription('Пинговать @everyone?')
            .setRequired(false))
        .addIntegerOption(o => o
            .setName('custom_minutes')
            .setDescription('Своя длительность в минутах')
            .setMinValue(1)
            .setMaxValue(43200)
            .setRequired(false)),
    
    async execute(interaction) {
        if (!hasModRole(interaction.member)) {
            return interaction.reply({ embeds: [noModPermissionEmbed()], ephemeral: true });
        }
        
        let duration = interaction.options.getString('duration');
        const customMinutes = interaction.options.getInteger('custom_minutes');
        
        if (duration === 'custom') {
            if (!customMinutes) {
                return interaction.reply({ 
                    content: '❌ Укажите длительность в `custom_minutes`!', 
                    ephemeral: true 
                });
            }
            duration = customMinutes.toString();
        }
        
        const maxChoices = interaction.options.getInteger('max_choices') || 1;
        const anonymous = interaction.options.getBoolean('anonymous') ?? false;
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const ping = interaction.options.getBoolean('ping') ?? false;
        
        const modal = new ModalBuilder()
            .setCustomId(`poll_${duration}_${maxChoices}_${anonymous}_${channel.id}_${ping}`)
            .setTitle('Создать опрос');
        
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('poll_question')
                    .setLabel('Вопрос')
                    .setPlaceholder('Что вы хотите спросить?')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(256)
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('poll_description')
                    .setLabel('Описание (необязательно)')
                    .setPlaceholder('Дополнительная информация...')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('poll_options')
                    .setLabel('Варианты (каждый с новой строки, макс. 10)')
                    .setPlaceholder('Вариант 1\nВариант 2\nВариант 3')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setRequired(true)
            )
        );
        
        await interaction.showModal(modal);
    }
};
