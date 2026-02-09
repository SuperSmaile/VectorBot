const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

let translate;
try {
    translate = require('translate-google-api');
} catch {
    translate = null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Перевести текст на русский')
        .addStringOption(o => 
            o.setName('text')
                .setDescription('Текст для перевода')
                .setRequired(false)
        )
        .addStringOption(o => 
            o.setName('message_id')
                .setDescription('ID сообщения (ПКМ по сообщению → Копировать ID)')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        const e = config.emojis;
        
        if (!translate) {
            return interaction.reply({ 
                content: `${e.error} Модуль перевода не установлен!\n\`npm install translate-google-api\``, 
                ephemeral: true 
            });
        }
        
        const text = interaction.options.getString('text');
        const messageId = interaction.options.getString('message_id');
        
        if (!text && !messageId) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setAuthor({ name: '🌐 Как переводить?' })
                .setDescription([
                    e.line,
                    '',
                    '**Способ 1: Контекстное меню** (рекомендуется)',
                    '> ПКМ по сообщению → Приложения → **Перевести**',
                    '',
                    '**Способ 2: ID сообщения**',
                    '> `/translate message_id:123456789`',
                    '> *(ПКМ по сообщению → Копировать ID)*',
                    '',
                    '**Способ 3: Прямой текст**',
                    '> `/translate text:Hello world`',
                    '',
                    e.line
                ].join('\n'))
                .setFooter({ text: 'Включите режим разработчика: Настройки → Расширенные' })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        await interaction.deferReply();
        
        let textToTranslate = text;
        let originalAuthor = null;
        
        if (messageId) {
            try {
                const message = await interaction.channel.messages.fetch(messageId);
                textToTranslate = message.content;
                originalAuthor = message.author;
                
                if (!textToTranslate) {
                    return interaction.editReply(`${e.error} Сообщение не содержит текста!`);
                }
            } catch {
                return interaction.editReply(`${e.error} Сообщение не найдено! Проверьте ID.`);
            }
        }
        
        try {
            const result = await translate(textToTranslate, { to: 'ru' });
            const translated = Array.isArray(result) ? result.join('') : result;
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: '🌐 Перевод' })
                .setDescription([
                    e.line,
                    '',
                    `${e.folder} **Оригинал:**`,
                    `> ${textToTranslate.length > 500 ? textToTranslate.substring(0, 500) + '...' : textToTranslate}`,
                    '',
                    `${e.success} **Перевод:**`,
                    `> ${translated.length > 500 ? translated.substring(0, 500) + '...' : translated}`,
                    '',
                    e.line
                ].join('\n'))
                .setFooter({ text: originalAuthor ? `Сообщение от ${originalAuthor.tag}` : `Перевёл ${interaction.user.tag}` })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Translation error:', error);
            await interaction.editReply(`${e.error} Ошибка при переводе.`);
        }
    }
};
