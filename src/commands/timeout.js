const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasModRole, noModPermissionEmbed } = require('../utils/permissions');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Выдать тайм-аут пользователю')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Пользователь')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Длительность (или "снять")')
                .setRequired(true)
                .addChoices(
                    { name: '60 секунд', value: '60' },
                    { name: '5 минут', value: '300' },
                    { name: '10 минут', value: '600' },
                    { name: '30 минут', value: '1800' },
                    { name: '1 час', value: '3600' },
                    { name: '3 часа', value: '10800' },
                    { name: '6 часов', value: '21600' },
                    { name: '12 часов', value: '43200' },
                    { name: '1 день', value: '86400' },
                    { name: '3 дня', value: '259200' },
                    { name: '7 дней', value: '604800' },
                    { name: 'Снять тайм-аут', value: '0' },
                    { name: 'Своя длительность', value: 'custom' }
                )
        )
        .addIntegerOption(option =>
            option.setName('custom_minutes')
                .setDescription('Своя длительность в минутах (1-40320)')
                .setMinValue(1)
                .setMaxValue(40320)
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Причина')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        if (!hasModRole(interaction.member)) {
            return interaction.reply({ embeds: [noModPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const target = interaction.options.getUser('user');
        let duration = interaction.options.getString('duration');
        const customMinutes = interaction.options.getInteger('custom_minutes');
        const reason = interaction.options.getString('reason') || 'Причина не указана';
        
        if (duration === 'custom') {
            if (!customMinutes) {
                return interaction.reply({ 
                    content: `${e.error} Укажите длительность в параметре \`custom_minutes\`!`, 
                    ephemeral: true 
                });
            }
            duration = (customMinutes * 60).toString();
        }
        
        duration = parseInt(duration);
        
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        
        if (!member) {
            return interaction.reply({ 
                content: `${e.error} Пользователь не найден!`, 
                ephemeral: true 
            });
        }
        
        if (member.id === interaction.user.id) {
            return interaction.reply({ 
                content: `${e.error} Вы не можете выдать тайм-аут себе!`, 
                ephemeral: true 
            });
        }
        
        if (member.id === interaction.guild.ownerId) {
            return interaction.reply({ 
                content: `${e.error} Нельзя выдать тайм-аут владельцу!`, 
                ephemeral: true 
            });
        }
        
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ 
                content: `${e.error} Вы не можете выдать тайм-аут этому пользователю!`, 
                ephemeral: true 
            });
        }
        
        try {
            if (duration === 0) {
                await member.timeout(null, reason);
                
                const embed = new EmbedBuilder()
                    .setColor(config.colors.success)
                    .setAuthor({ name: `${e.success} Тайм-аут снят` })
                    .setDescription([
                        e.line,
                        '',
                        `${e.member} **Пользователь:** ${target}`,
                        `${e.shield} **Модератор:** ${interaction.user}`,
                        '',
                        e.line
                    ].join('\n'))
                    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
            } else {
                await member.timeout(duration * 1000, reason);
                
                const endTime = Math.floor((Date.now() + duration * 1000) / 1000);
                const durationText = getDurationText(duration);
                
                const embed = new EmbedBuilder()
                    .setColor(config.colors.warning)
                    .setAuthor({ name: `${e.timeout} Тайм-аут выдан` })
                    .setDescription([
                        e.line,
                        '',
                        `${e.member} **Пользователь:** ${target}`,
                        `${e.timeout} **Длительность:** ${durationText}`,
                        `${e.calendar} **Истекает:** <t:${endTime}:R>`,
                        `${e.rules} **Причина:** ${reason}`,
                        `${e.shield} **Модератор:** ${interaction.user}`,
                        '',
                        e.line
                    ].join('\n'))
                    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
                
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(config.colors.warning)
                        .setAuthor({ name: `${e.timeout} Вам выдан тайм-аут` })
                        .setDescription([
                            e.line,
                            '',
                            `${e.folder} **Сервер:** ${interaction.guild.name}`,
                            `${e.timeout} **Длительность:** ${durationText}`,
                            `${e.calendar} **Истекает:** <t:${endTime}:R>`,
                            `${e.rules} **Причина:** ${reason}`,
                            '',
                            e.line
                        ].join('\n'))
                        .setTimestamp();
                    
                    await target.send({ embeds: [dmEmbed] });
                } catch {}
            }
        } catch (error) {
            console.error('Timeout error:', error);
            await interaction.reply({ 
                content: `${e.error} Не удалось выдать тайм-аут!`, 
                ephemeral: true 
            });
        }
    }
};

function getDurationText(seconds) {
    if (seconds < 60) return `${seconds} сек.`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин.`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч.`;
    return `${Math.floor(seconds / 86400)} дн.`;
}
