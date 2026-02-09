const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Задай вопрос магическому шару')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Ваш вопрос')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const e = config.emojis;
        const question = interaction.options.getString('question');
        
        const responses = [
            { text: 'Бесспорно', type: 'positive' },
            { text: 'Предрешено', type: 'positive' },
            { text: 'Никаких сомнений', type: 'positive' },
            { text: 'Определённо да', type: 'positive' },
            { text: 'Можешь быть уверен в этом', type: 'positive' },
            { text: 'Мне кажется — да', type: 'positive' },
            { text: 'Вероятнее всего', type: 'positive' },
            { text: 'Хорошие перспективы', type: 'positive' },
            { text: 'Знаки говорят — да', type: 'positive' },
            { text: 'Да', type: 'positive' },
            { text: 'Пока не ясно, попробуй снова', type: 'neutral' },
            { text: 'Спроси позже', type: 'neutral' },
            { text: 'Лучше не рассказывать', type: 'neutral' },
            { text: 'Сейчас нельзя предсказать', type: 'neutral' },
            { text: 'Сконцентрируйся и спроси опять', type: 'neutral' },
            { text: 'Даже не думай', type: 'negative' },
            { text: 'Мой ответ — нет', type: 'negative' },
            { text: 'По моим данным — нет', type: 'negative' },
            { text: 'Перспективы не очень хорошие', type: 'negative' },
            { text: 'Весьма сомнительно', type: 'negative' }
        ];
        
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        const colors = {
            positive: config.colors.success,
            neutral: config.colors.warning,
            negative: config.colors.error
        };
        
        const emojis = {
            positive: '✅',
            neutral: '🤔',
            negative: '❌'
        };
        
        const embed = new EmbedBuilder()
            .setColor(colors[response.type])
            .setAuthor({ name: '🎱 Магический шар' })
            .setDescription([
                e.line,
                '',
                `${e.member} **Вопрос:**`,
                `> ${question}`,
                '',
                `${emojis[response.type]} **Ответ:**`,
                `> ${response.text}`,
                '',
                e.line
            ].join('\n'))
            .setFooter({ text: `Спросил ${interaction.user.tag}` })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
