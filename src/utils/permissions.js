const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

function hasAdminRole(member) {
    if (member.guild.ownerId === member.id) return true;
    if (member.permissions.has('Administrator')) return true;
    
    const memberRoles = member.roles.cache.map(r => r.name.toLowerCase());
    const adminRoles = config.permissions.adminRoles.map(r => r.toLowerCase());
    
    return adminRoles.some(role => memberRoles.includes(role));
}

function hasModRole(member) {
    if (hasAdminRole(member)) return true;
    if (member.permissions.has('ModerateMembers')) return true;
    if (member.permissions.has('ManageMessages')) return true;
    
    const memberRoles = member.roles.cache.map(r => r.name.toLowerCase());
    const modRoles = config.permissions.modRoles.map(r => r.toLowerCase());
    
    return modRoles.some(role => memberRoles.includes(role));
}

function noPermissionEmbed() {
    return new EmbedBuilder()
        .setColor(config.colors.error)
        .setDescription([
            `${config.emojis.error} **Доступ запрещён**`,
            '',
            '> У вас нет прав для использования этой команды.',
            '',
            `Требуемые роли: \`${config.permissions.adminRoles.join('`, `')}\``
        ].join('\n'))
        .setTimestamp();
}

function noModPermissionEmbed() {
    return new EmbedBuilder()
        .setColor(config.colors.error)
        .setDescription([
            `${config.emojis.error} **Доступ запрещён**`,
            '',
            '> У вас нет прав для использования этой команды.',
            '',
            `Требуемые роли: \`${[...config.permissions.adminRoles, ...config.permissions.modRoles].join('`, `')}\``
        ].join('\n'))
        .setTimestamp();
}

module.exports = {
    hasAdminRole,
    hasModRole,
    noPermissionEmbed,
    noModPermissionEmbed
};
