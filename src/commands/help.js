const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Список команд'),
    
    async execute(interaction) {
        const e = config.emojis;
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setAuthor({ name: `${e.info} Список команд` })
            .setDescription([
                e.line,
                '',
                `${e.crown} **Администратор**`,
                '',
                '`/announce` `/embed` `/say` `/ghost`',
                '`/dm` `/massevent` `/reaction-role`',
                '`/ban` `/kick` `/ping` `/uptime`',
                '',
                e.line,
                '',
                `${e.shield} **Модератор**`,
                '',
                '`/poll` `/clear` `/purge` `/slowmode`',
                '`/lock` `/timeout` `/warn` `/warnings`',
                '`/unwarn` `/userinfo` `/dmclose`',
                '',
                e.line,
                '',
                `${e.member} **Для всех**`,
                '',
                '`/help` `/avatar` `/translate`',
                '`/8ball` `/coinflip` `/random` `/math`',
                '',
                e.line
            ].join('\n'))
            .setFooter({ text: config.branding.footer })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
