const { 
    ContextMenuCommandBuilder, 
    ApplicationCommandType, 
    ActionRowBuilder,
    StringSelectMenuBuilder 
} = require('discord.js');
const { hasAdminRole } = require('../utils/permissions');
const aiManager = require('../utils/aiManager');
const config = require('../../config.json');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('AI Ответ')
        .setType(ApplicationCommandType.Message),
    
    async execute(interaction) {
        if (!hasAdminRole(interaction.member)) {
            return interaction.reply({ 
                content: `${config.emojis.error} Недостаточно прав!`, 
                ephemeral: true 
            });
        }
        
        const e = config.emojis;
        const targetMessage = interaction.targetMessage;
        
        if (!targetMessage.content) {
            return interaction.reply({
                content: `${e.error} Сообщение не содержит текста!`,
                ephemeral: true
            });
        }
        
        const styleSelect = new StringSelectMenuBuilder()
            .setCustomId(`ai_style_select_${targetMessage.id}`)
            .setPlaceholder('Выберите стиль ответа...')
            .addOptions([
                {
                    label: 'Mommy',
                    description: 'Заботливый и тёплый стиль',
                    value: 'friendly',
                    emoji: '😊'
                },
                {
                    label: 'Готка',
                    description: 'Мрачный и ироничный стиль',
                    value: 'formal',
                    emoji: '📚'
                },
                {
                    label: 'Цундере',
                    description: 'Ворчливый, но заботливый',
                    value: 'funny',
                    emoji: '😄'
                },
                {
                    label: 'Нетраннерша',
                    description: 'Киберпанк стиль',
                    value: 'brief',
                    emoji: '🎯'
                },
                {
                    label: 'Фембой',
                    description: 'Пиздец',
                    value: 'femboy',
                    emoji: '🎯'
                },
                {
                    label: 'Зечка',
                    description: 'Пиздец',
                    value: 'prisoner',
                    emoji: '🎯'
                },
                {
                    label: 'Текущий стиль',
                    description: `Использовать: ${aiManager.getStyleInfo().name}`,
                    value: 'current',
                    emoji: '🔄'
                }
            ]);
        
        const row = new ActionRowBuilder().addComponents(styleSelect);
        
        await interaction.reply({
            content: `${e.ai} Выберите стиль для AI ответа:`,
            components: [row],
            ephemeral: true
        });
    }
};
