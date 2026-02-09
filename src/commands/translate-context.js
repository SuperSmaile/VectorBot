const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

let translate;
try {
    translate = require('translate-google-api');
} catch {
    translate = null;
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Перевести')
        .setType(ApplicationCommandType.Message),
    
    async execute(interaction) {
        const e = config.emojis;
        
        if (!translate) {
            return interaction.reply({ 
                content: `${e.error} Модуль перевода не установлен!`, 
                ephemeral: true 
            });
        }
        
        const message = interaction.targetMessage;
        const text = message.content;
        
        if (!text || text.length === 0) {
            return interaction.reply({ 
                content: `${e.error} Сообщение не содержит текста!`, 
                ephemeral: true 
            });
        }
        
        await interaction.deferReply();
        
        try {
            const result = await translate(text, { to: 'ru' });
            const translated = Array.isArray(result) ? result.join('') : result;
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: '🌐 Перевод' })
                .setDescription([
                    e.line,
                    '',
                    `${e.folder} **Оригинал:**`,
                    `> ${text.length > 500 ? text.substring(0, 500) + '...' : text}`,
                    '',
                    `${e.success} **Перевод:**`,
                    `> ${translated.length > 500 ? translated.substring(0, 500) + '...' : translated}`,
                    '',
                    e.line
                ].join('\n'))
                .setFooter({ text: `Сообщение от ${message.author.tag}` })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Translation error:', error);
            await interaction.editReply(`${e.error} Ошибка при переводе.`);
        }
    }
};
