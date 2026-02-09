const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');
const aiManager = require('../utils/aiManager');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aianalyze')
        .setDescription('ИИ анализ сообщений пользователя')
        .addUserOption(o => o
            .setName('user')
            .setDescription('Пользователь для анализа')
            .setRequired(true)
        )
        .addIntegerOption(o => o
            .setName('count')
            .setDescription('Количество сообщений (10-100)')
            .setMinValue(10)
            .setMaxValue(100)
        ),
    
    async execute(interaction) {
        if (!hasAdminRole(interaction.member)) {
            return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const target = interaction.options.getUser('user');
        const count = interaction.options.getInteger('count') || 50;
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            // Fetch messages from current channel
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            
            // Filter by user
            const userMessages = messages
                .filter(m => m.author.id === target.id && m.content)
                .first(count);
            
            if (userMessages.length < 5) {
                return interaction.editReply(`${e.error} Недостаточно сообщений для анализа (найдено: ${userMessages.length})`);
            }
            
            // Prepare messages for analysis
            const messagesText = userMessages
                .map(m => `[${new Date(m.createdTimestamp).toLocaleString('ru')}] ${m.content}`)
                .join('\n');
            
            // Analyze
            const analysis = await aiManager.analyzeMessages(messagesText);
            
            if (!analysis) {
                return interaction.editReply(`${e.error} Не удалось провести анализ.`);
            }
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.ai)
                .setAuthor({ 
                    name: `${e.ai} Анализ пользователя`, 
                    iconURL: target.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription([
                    e.line,
                    '',
                    `${e.member} **Пользователь:** ${target}`,
                    `${e.folder} **Сообщений проанализировано:** ${userMessages.length}`,
                    '',
                    e.line,
                    '',
                    analysis,
                    '',
                    e.line
                ].join('\n'))
                .setFooter({ text: 'Анализ выполнен с помощью ИИ' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('AI Analyze error:', error);
            await interaction.editReply(`${e.error} Ошибка при анализе.`);
        }
    }
};
