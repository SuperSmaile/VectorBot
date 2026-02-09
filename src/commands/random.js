const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Случайный выбор из вариантов')
        .addStringOption(option =>
            option.setName('choices')
                .setDescription('Варианты через запятую (пример: пицца, суши, бургер)')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const e = config.emojis;
        const input = interaction.options.getString('choices');
        
        const choices = input.split(',').map(c => c.trim()).filter(c => c.length > 0);
        
        if (choices.length < 2) {
            return interaction.reply({ 
                content: `${e.error} Нужно минимум 2 варианта! Разделяйте запятой.`, 
                ephemeral: true 
            });
        }
        
        await interaction.deferReply();
        
        // Animation
        const thinkEmbed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setDescription('🎲 Выбираю...')
            .setTimestamp();
        
        await interaction.editReply({ embeds: [thinkEmbed] });
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const winner = choices[Math.floor(Math.random() * choices.length)];
        
        let choicesText = '';
        choices.forEach((choice, i) => {
            const isWinner = choice === winner;
            choicesText += `${isWinner ? '▸' : '•'} ${isWinner ? `**${choice}**` : choice}\n`;
        });
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setAuthor({ name: '🎲 Случайный выбор' })
            .setDescription([
                e.line,
                '',
                `${e.folder} **Варианты:**`,
                choicesText,
                '',
                `${e.star} **Выбор пал на:**`,
                `# ${winner}`,
                '',
                e.line
            ].join('\n'))
            .setFooter({ text: `Выбирал ${interaction.user.tag}` })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};
