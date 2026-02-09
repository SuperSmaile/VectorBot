const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');
const aiManager = require('../utils/aiManager');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aistyle')
        .setDescription('Изменить стиль AI')
        .addStringOption(o => o
            .setName('style')
            .setDescription('Новый стиль')
            .setRequired(false)
            .addChoices(
                { name: '😊 Mommy', value: 'friendly' },
                { name: '📚 Готка', value: 'formal' },
                { name: '📚 Prisoner', value: 'prisoner' },
                { name: '📚 Femboy', value: 'femboy' },
                { name: '😄 Цундере', value: 'funny' },
                { name: '🎯 Нетраннерша', value: 'brief' },
                { name: '🎲 Случайный', value: 'random' }
            )
        ),
    
    hidden: true,
    
    async execute(interaction) {
        if (!hasAdminRole(interaction.member)) {
            return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        let style = interaction.options.getString('style');
        
        if (!style) {
            const currentStyle = aiManager.getCurrentStyle();
            const styleInfo = aiManager.getStyleInfo();
            const allStyles = aiManager.getAllStyles();
            
            const stylesList = Object.entries(allStyles)
                .map(([key, val]) => `${key === currentStyle ? '▸' : '•'} ${val.name}`)
                .join('\n');
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.ai)
                .setAuthor({ name: '🎨 AI Стили' })
                .setDescription([
                    `**Текущий стиль:** ${styleInfo.name}`,
                    '',
                    '**Доступные стили:**',
                    stylesList,
                    '',
                    `*Используй \`/aistyle style:\` для смены*`
                ].join('\n'));
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (style === 'random') {
            style = aiManager.getRandomStyle();
        }
        
        const success = aiManager.setStyle(style);
        
        if (!success) {
            return interaction.reply({
                content: `${e.error} Неизвестный стиль!`,
                ephemeral: true
            });
        }
        
        const styleInfo = aiManager.getStyleInfo(style);
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription([
                `${e.success} **Стиль AI изменён!**`,
                '',
                `${e.ai} Новый стиль: **${styleInfo.name}**`
            ].join('\n'));
        
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
