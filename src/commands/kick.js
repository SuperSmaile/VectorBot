const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Выгнать пользователя')
        .addUserOption(o => o.setName('user').setDescription('Пользователь').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Причина')),
    
    async execute(interaction) {
        if (!hasAdminRole(interaction.member)) {
            return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Причина не указана';
        
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        
        if (!member) {
            return interaction.reply({ content: `${e.error} Пользователь не на сервере!`, ephemeral: true });
        }
        
        if (target.id === interaction.user.id) {
            return interaction.reply({ content: `${e.error} Нельзя выгнать себя!`, ephemeral: true });
        }
        
        if (target.id === interaction.guild.ownerId) {
            return interaction.reply({ content: `${e.error} Нельзя выгнать владельца!`, ephemeral: true });
        }
        
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: `${e.error} Недостаточно прав!`, ephemeral: true });
        }
        
        try {
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.colors.warning)
                    .setAuthor({ name: '👢 Вы были выгнаны' })
                    .setDescription([
                        e.line,
                        '',
                        `${e.folder} **Сервер:** ${interaction.guild.name}`,
                        `${e.rules} **Причина:** ${reason}`,
                        '',
                        e.line
                    ].join('\n'))
                    .setTimestamp();
                await target.send({ embeds: [dmEmbed] });
            } catch {}
            
            await member.kick(`${reason} | Модератор: ${interaction.user.tag}`);
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setAuthor({ name: '👢 Пользователь выгнан' })
                .setDescription([
                    e.line,
                    '',
                    `${e.member} **Пользователь:** ${target.tag}`,
                    `${e.rules} **Причина:** ${reason}`,
                    `${e.shield} **Модератор:** ${interaction.user}`,
                    '',
                    e.line
                ].join('\n'))
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Kick error:', error);
            await interaction.reply({ content: `${e.error} Не удалось выгнать!`, ephemeral: true });
        }
    }
};
