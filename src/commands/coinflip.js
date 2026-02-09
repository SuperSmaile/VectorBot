const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Подбросить монетку'),
    
    async execute(interaction) {
        const e = config.emojis;
        
        await interaction.deferReply();
        
        // Animation effect
        const flipEmbed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setDescription('🪙 Монетка крутится...')
            .setTimestamp();
        
        await interaction.editReply({ embeds: [flipEmbed] });
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const isHeads = Math.random() < 0.5;
        const result = isHeads ? 'Орёл' : 'Решка';
        const emoji = isHeads ? '🦅' : '👑';
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setAuthor({ name: '🪙 Подбрасывание монетки' })
            .setDescription([
                e.line,
                '',
                `# ${emoji} ${result}!`,
                '',
                e.line
            ].join('\n'))
            .setFooter({ text: `Подбросил ${interaction.user.tag}` })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};
