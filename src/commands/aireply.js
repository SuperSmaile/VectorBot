const { SlashCommandBuilder } = require('discord.js');
const { hasModRole, noModPermissionEmbed } = require('../utils/permissions');
const aiManager = require('../utils/aiManager');
const dmManager = require('../utils/dmManager');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aireply')
        .setDescription('ИИ ответит пользователю в DM треде')
        .addStringOption(o => o
            .setName('context')
            .setDescription('Дополнительный контекст для ИИ')
            .setRequired(false)
        )
        .addStringOption(o => o
            .setName('style')
            .setDescription('Стиль ответа')
            .setRequired(false)
            .addChoices(
                { name: '😊 Mommy', value: 'friendly' },
                { name: '📚 Готка', value: 'formal' },
                { name: '😄 Цундере', value: 'funny' },
                { name: '📚 Зечка', value: 'prisoner' },
                { name: '📚 Феминный мальчик', value: 'femboy' },
                { name: '🎯 Нетраннерша', value: 'brief' }
            )
        ),
    
    async execute(interaction) {
        if (!hasModRole(interaction.member)) {
            return interaction.reply({ embeds: [noModPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const dmConfig = config.dmSystems;
        
        if (interaction.channel.parentId !== dmConfig.forumChannelId) {
            return interaction.reply({
                content: `${e.error} Эта команда работает только в DM тредах!`,
                ephemeral: true
            });
        }
        
        const userId = dmManager.getUserByThread(interaction.channel.id);
        if (!userId) {
            return interaction.reply({
                content: `${e.error} Это не DM тред!`,
                ephemeral: true
            });
        }
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const style = interaction.options.getString('style') || aiManager.getCurrentStyle();
            
            const messages = await interaction.channel.messages.fetch({ limit: 10 });
            
            const context = messages
                .reverse()
                .filter(m => m.embeds.length > 0 || m.content)
                .map(m => {
                    if (m.embeds.length > 0 && m.embeds[0].author) {
                        return `Пользователь: ${m.embeds[0].description || '[медиа]'}`;
                    }
                    return `Поддержка: ${m.content}`;
                })
                .join('\n');
            
            const additionalContext = interaction.options.getString('context') || '';
            const fullContext = additionalContext ? `${additionalContext}\n\n${context}` : context;
            
            const lastUserMsg = messages
                .filter(m => m.embeds.length > 0 && m.embeds[0].author)
                .first();
            
            const userMessage = lastUserMsg?.embeds[0]?.description || 'Привет';
            
            const response = await aiManager.generateWithStyle(userMessage, style, fullContext);
            
            if (!response) {
                return interaction.editReply(`${e.error} Не удалось сгенерировать ответ.`);
            }
            
            const user = await interaction.client.users.fetch(userId);
            await user.send(response);
            
            await interaction.channel.send({
                content: `🤖 **AI ответ (${aiManager.getStyleInfo(style).name}):**\n${response}`
            });
            
            await interaction.editReply(`${e.success} ИИ ответ отправлен пользователю!`);
            
        } catch (error) {
            console.error('AI Reply error:', error);
            await interaction.editReply(`${e.error} Ошибка: ${error.message}`);
        }
    }
};
