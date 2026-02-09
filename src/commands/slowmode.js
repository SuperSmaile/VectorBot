const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasModRole, noModPermissionEmbed } = require('../utils/permissions');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set channel slowmode')
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Slowmode delay (0 to disable)')
                .setMinValue(0)
                .setMaxValue(21600)
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to set slowmode')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        if (!hasModRole(interaction.member)) {
            return interaction.reply({ embeds: [noModPermissionEmbed()], ephemeral: true });
        }
        
        const seconds = interaction.options.getInteger('seconds');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const e = config.emojis;
        
        try {
            await channel.setRateLimitPerUser(seconds);
            
            let timeText;
            if (seconds === 0) {
                timeText = 'Disabled';
            } else if (seconds < 60) {
                timeText = `${seconds} seconds`;
            } else if (seconds < 3600) {
                timeText = `${Math.floor(seconds / 60)} minutes`;
            } else {
                timeText = `${Math.floor(seconds / 3600)} hours`;
            }
            
            const embed = new EmbedBuilder()
                .setColor(seconds > 0 ? config.colors.warning : config.colors.success)
                .setDescription([
                    seconds > 0 ? `${e.warning} **Slowmode Enabled**` : `${e.success} **Slowmode Disabled**`,
                    '',
                    `> Channel: ${channel}`,
                    `> Duration: **${timeText}**`
                ].join('\n'))
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Slowmode error:', error);
            await interaction.reply({ 
                content: `${e.error} Failed to set slowmode!`, 
                ephemeral: true 
            });
        }
    }
};
