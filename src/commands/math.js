const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

let mathjs;
try {
    mathjs = require('mathjs');
} catch {
    mathjs = null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('math')
        .setDescription('Калькулятор')
        .addStringOption(o => o.setName('expression').setDescription('Выражение (например: 2+2*2)').setRequired(true)),
    
    async execute(interaction) {
        const e = config.emojis;
        const expr = interaction.options.getString('expression');
        
        if (!mathjs) {
            return interaction.reply({ content: `${e.error} Модуль mathjs не установлен!`, ephemeral: true });
        }
        
        try {
            const result = mathjs.evaluate(expr);
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: '🔢 Калькулятор' })
                .setDescription([
                    e.line,
                    '',
                    `📝 **Выражение:**`,
                    `\`\`\`${expr}\`\`\``,
                    `✅ **Результат:**`,
                    `\`\`\`${result}\`\`\``,
                    '',
                    e.line
                ].join('\n'))
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ 
                content: `${e.error} Ошибка вычисления! Проверьте выражение.`, 
                ephemeral: true 
            });
        }
    }
};
