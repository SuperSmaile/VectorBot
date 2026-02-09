const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Получить аватар пользователя')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Пользователь (по умолчанию - вы)')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('server')
                .setDescription('Показать серверный аватар?')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        const e = config.emojis;
        const target = interaction.options.getUser('user') || interaction.user;
        const serverAvatar = interaction.options.getBoolean('server') ?? false;
        
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        
        let avatarURL;
        let title;
        
        if (serverAvatar && member?.avatar) {
            avatarURL = member.displayAvatarURL({ dynamic: true, size: 4096 });
            title = `${e.avatar} Серверный аватар`;
        } else {
            avatarURL = target.displayAvatarURL({ dynamic: true, size: 4096 });
            title = `${e.avatar} Аватар пользователя`;
        }
        
        const embed = new EmbedBuilder()
            .setColor(member?.displayHexColor || config.colors.primary)
            .setAuthor({ name: title })
            .setDescription([
                e.line,
                '',
                `${e.member} **Пользователь:** ${target}`,
                `${e.link} **Ссылка:** [Открыть](${avatarURL})`,
                '',
                e.line
            ].join('\n'))
            .setImage(avatarURL)
            .setFooter({ text: config.branding.footer })
            .setTimestamp();
        
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('PNG')
                .setStyle(ButtonStyle.Link)
                .setURL(target.displayAvatarURL({ format: 'png', size: 4096 })),
            new ButtonBuilder()
                .setLabel('JPG')
                .setStyle(ButtonStyle.Link)
                .setURL(target.displayAvatarURL({ format: 'jpg', size: 4096 })),
            new ButtonBuilder()
                .setLabel('WEBP')
                .setStyle(ButtonStyle.Link)
                .setURL(target.displayAvatarURL({ format: 'webp', size: 4096 }))
        );
        
        // Add GIF button if animated
        if (target.avatar?.startsWith('a_')) {
            buttons.addComponents(
                new ButtonBuilder()
                    .setLabel('GIF')
                    .setStyle(ButtonStyle.Link)
                    .setURL(target.displayAvatarURL({ format: 'gif', size: 4096 }))
            );
        }
        
        await interaction.reply({ embeds: [embed], components: [buttons] });
    }
};
