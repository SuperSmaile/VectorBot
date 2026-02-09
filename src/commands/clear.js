const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasModRole, noModPermissionEmbed } = require('../utils/permissions');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete messages from channel')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Only delete messages from this user')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        if (!hasModRole(interaction.member)) {
            return interaction.reply({ embeds: [noModPermissionEmbed()], ephemeral: true });
        }
        
        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');
        const e = config.emojis;
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            let messages = await interaction.channel.messages.fetch({ limit: 100 });
            
            // Filter by user if specified
            if (targetUser) {
                messages = messages.filter(m => m.author.id === targetUser.id);
            }
            
            // Filter messages older than 14 days (Discord limitation)
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            messages = messages.filter(m => m.createdTimestamp > twoWeeksAgo);
            
            // Limit to requested amount
            const toDelete = Array.from(messages.values()).slice(0, amount);
            
            if (toDelete.length === 0) {
                return interaction.editReply({ 
                    content: `${e.warning} No messages found to delete!` 
                });
            }
            
            await interaction.channel.bulkDelete(toDelete, true);
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setDescription([
                    `${e.broom} **Messages Cleared**`,
                    '',
                    `> Deleted **${toDelete.length}** messages`,
                    targetUser ? `> From: ${targetUser}` : ''
                ].join('\n'))
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Clear error:', error);
            await interaction.editReply({ 
                content: `${e.error} Failed to delete messages!` 
            });
        }
    }
};
