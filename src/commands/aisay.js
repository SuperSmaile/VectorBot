const { SlashCommandBuilder } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');
const aiManager = require('../utils/aiManager');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aisay')
        .setDescription('ИИ напишет сообщение (скрытая команда)')
        .addStringOption(o => o
            .setName('topic')
            .setDescription('Тема или вопрос для ИИ')
            .setRequired(false)
        )
        .addStringOption(o => o
            .setName('message_id')
            .setDescription('ID сообщения для ответа')
            .setRequired(false)
        )
        .addStringOption(o => o
            .setName('style')
            .setDescription('Стиль ответа')
            .setRequired(false)
            .addChoices(
                { name: '😊 Mommy', value: 'friendly' },
                { name: '📚 Готка', value: 'formal' },
                { name: '📚 Зечка', value: 'prisoner' },
                { name: '📚 Филипинский мальчик', value: 'femboy' },
                { name: '😄 Цундере', value: 'funny' },
                { name: '🎯 Нетраннерша', value: 'brief' }
            )
        ),
    
    hidden: true,
    
    async execute(interaction) {
        if (!hasAdminRole(interaction.member)) {
            return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const topic = interaction.options.getString('topic');
        const messageId = interaction.options.getString('message_id');
        const style = interaction.options.getString('style') || aiManager.getCurrentStyle();
        
        if (!topic && !messageId) {
            return interaction.reply({
                content: `${e.error} Укажите тему (\`topic\`) или ID сообщения (\`message_id\`)!`,
                ephemeral: true
            });
        }
        
        await interaction.deferReply({ ephemeral: true });
        
        const customPrompt = `${config.ai.systemPrompt} ${aiManager.getStylePrompt(style)}`;
        
        let userMessage = topic;
        let replyTo = null;
        
        if (messageId) {
            try {
                const targetMsg = await interaction.channel.messages.fetch(messageId);
                userMessage = targetMsg.content;
                replyTo = targetMsg;
            } catch {
                return interaction.editReply(`${e.error} Сообщение не найдено!`);
            }
        }
        
        const response = await aiManager.generateResponse(userMessage, customPrompt);
        
        if (!response) {
            return interaction.editReply(`${e.error} Не удалось сгенерировать ответ. Проверьте API ключ.`);
        }
        
        try {
            if (replyTo) {
                await replyTo.reply(response);
            } else {
                await interaction.channel.send(response);
            }
            
            await interaction.editReply(`${e.success} Сообщение отправлено!`);
        } catch (error) {
            await interaction.editReply(`${e.error} Ошибка отправки: ${error.message}`);
        }
    }
};
