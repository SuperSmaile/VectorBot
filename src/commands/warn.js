const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasModRole, noModPermissionEmbed } = require('../utils/permissions');
const warnManager = require('../utils/warnManager');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Выдать предупреждение пользователю')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Пользователь')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Причина предупреждения')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        if (!hasModRole(interaction.member)) {
            return interaction.reply({ embeds: [noModPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        
        if (!member) {
            return interaction.reply({ 
                content: `${e.error} Пользователь не найден!`, 
                ephemeral: true 
            });
        }
        
        if (target.id === interaction.user.id) {
            return interaction.reply({ 
                content: `${e.error} Вы не можете предупредить себя!`, 
                ephemeral: true 
            });
        }
        
        if (target.bot) {
            return interaction.reply({ 
                content: `${e.error} Нельзя предупредить бота!`, 
                ephemeral: true 
            });
        }
        
        const result = warnManager.addWarning(
            interaction.guild.id,
            target.id,
            interaction.user.id,
            reason
        );
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setAuthor({ name: `${e.warning} Предупреждение выдано` })
            .setDescription([
                e.line,
                '',
                `${e.member} **Пользователь:** ${target}`,
                `${e.rules} **Причина:** ${reason}`,
                `${e.shield} **Модератор:** ${interaction.user}`,
                `${e.info} **Всего предупреждений:** ${result.total}`,
                '',
                e.line
            ].join('\n'))
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `ID: ${result.warning.id}` })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setAuthor({ name: `${e.warning} Вы получили предупреждение` })
                .setDescription([
                    e.line,
                    '',
                    `${e.folder} **Сервер:** ${interaction.guild.name}`,
                    `${e.rules} **Причина:** ${reason}`,
                    `${e.info} **Всего предупреждений:** ${result.total}`,
                    '',
                    e.line
                ].join('\n'))
                .setTimestamp();
            
            await target.send({ embeds: [dmEmbed] });
        } catch {}
        
        if (result.total === 3) {
            try {
                await member.timeout(60 * 60 * 1000, 'Авто: 3 предупреждения');
                await interaction.followUp({ 
                    content: `${e.timeout} ${target} получил тайм-аут на 1 час (3 предупреждения)` 
                });
            } catch {}
        } else if (result.total === 5) {
            try {
                await member.timeout(24 * 60 * 60 * 1000, 'Авто: 5 предупреждений');
                await interaction.followUp({ 
                    content: `${e.timeout} ${target} получил тайм-аут на 24 часа (5 предупреждений)` 
                });
            } catch {}
        }
    }
};
