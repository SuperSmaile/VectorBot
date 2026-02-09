const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { hasModRole, noModPermissionEmbed } = require('../utils/permissions');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock or unlock a channel')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Lock or unlock')
                .setRequired(true)
                .addChoices(
                    { name: '🔒 Lock', value: 'lock' },
                    { name: '🔓 Unlock', value: 'unlock' }
                )
        )
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to lock/unlock')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for lock/unlock')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        if (!hasModRole(interaction.member)) {
            return interaction.reply({ embeds: [noModPermissionEmbed()], ephemeral: true });
        }
        
        const action = interaction.options.getString('action');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const e = config.emojis;
        
        try {
            const everyone = interaction.guild.roles.everyone;
            
            if (action === 'lock') {
                await channel.permissionOverwrites.edit(everyone, {
                    SendMessages: false
                });
                
                const embed = new EmbedBuilder()
                    .setColor(config.colors.error)
                    .setDescription([
                        `${e.lock} **Channel Locked**`,
                        '',
                        `> Channel: ${channel}`,
                        `> Reason: ${reason}`,
                        `> By: ${interaction.user}`
                    ].join('\n'))
                    .setTimestamp();
                
                await channel.send({ embeds: [embed] });
                await interaction.reply({ content: `${e.success} Channel locked!`, ephemeral: true });
                
            } else {
                await channel.permissionOverwrites.edit(everyone, {
                    SendMessages: null
                });
                
                const embed = new EmbedBuilder()
                    .setColor(config.colors.success)
                    .setDescription([
                        `${e.unlock} **Channel Unlocked**`,
                        '',
                        `> Channel: ${channel}`,
                        `> By: ${interaction.user}`
                    ].join('\n'))
                    .setTimestamp();
                
                await channel.send({ embeds: [embed] });
                await interaction.reply({ content: `${e.success} Channel unlocked!`, ephemeral: true });
            }
            
        } catch (error) {
            console.error('Lock error:', error);
            await interaction.reply({ 
                content: `${e.error} Failed to ${action} channel!`, 
                ephemeral: true 
            });
        }
    }
};
