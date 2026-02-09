const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { hasAdminRole, noPermissionEmbed } = require('../utils/permissions');
const config = require('../../config.json');
const fs = require('fs');
const path = require('path');

const rrFile = path.join(__dirname, '../../data/reaction-roles.json');

function getRR() {
    try { return JSON.parse(fs.readFileSync(rrFile, 'utf8')); }
    catch { return {}; }
}

function saveRR(data) {
    const dir = path.dirname(rrFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(rrFile, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reaction-role')
        .setDescription('Роли по кнопкам')
        .addSubcommand(s => s
            .setName('create')
            .setDescription('Создать панель ролей')
            .addStringOption(o => o.setName('title').setDescription('Заголовок').setRequired(true))
            .addStringOption(o => o.setName('description').setDescription('Описание'))
            .addChannelOption(o => o.setName('channel').setDescription('Канал'))
        )
        .addSubcommand(s => s
            .setName('add')
            .setDescription('Добавить роль к панели')
            .addStringOption(o => o.setName('message_id').setDescription('ID сообщения панели').setRequired(true))
            .addRoleOption(o => o.setName('role').setDescription('Роль').setRequired(true))
            .addStringOption(o => o.setName('label').setDescription('Текст кнопки').setRequired(true))
            .addStringOption(o => o.setName('emoji').setDescription('Эмодзи'))
            .addStringOption(o => o.setName('style').setDescription('Стиль').addChoices(
                { name: '🔵 Синий', value: 'Primary' },
                { name: '⚫ Серый', value: 'Secondary' },
                { name: '🟢 Зелёный', value: 'Success' },
                { name: '🔴 Красный', value: 'Danger' }
            ))
        ),
    
    async execute(interaction) {
        if (!hasAdminRole(interaction.member)) {
            return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true });
        }
        
        const e = config.emojis;
        const sub = interaction.options.getSubcommand();
        
        if (sub === 'create') {
            const title = interaction.options.getString('title');
            const desc = interaction.options.getString('description') || 'Нажмите на кнопку чтобы получить роль';
            const channel = interaction.options.getChannel('channel') || interaction.channel;
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: `🎭 ${title}` })
                .setDescription([
                    e.line,
                    '',
                    desc,
                    '',
                    e.line
                ].join('\n'))
                .setFooter({ text: 'Нажмите на кнопку ниже' })
                .setTimestamp();
            
            const msg = await channel.send({ embeds: [embed] });
            
            const rr = getRR();
            rr[msg.id] = { roles: [], channelId: channel.id, guildId: interaction.guild.id };
            saveRR(rr);
            
            await interaction.reply({ 
                content: `${e.success} Панель создана! ID: \`${msg.id}\`\nИспользуйте \`/reaction-role add\` чтобы добавить роли.`, 
                ephemeral: true 
            });
        }
        
        if (sub === 'add') {
            const msgId = interaction.options.getString('message_id');
            const role = interaction.options.getRole('role');
            const label = interaction.options.getString('label');
            const emoji = interaction.options.getString('emoji');
            const style = interaction.options.getString('style') || 'Primary';
            
            const rr = getRR();
            
            if (!rr[msgId]) {
                return interaction.reply({ content: `${e.error} Панель не найдена!`, ephemeral: true });
            }
            
            if (rr[msgId].roles.length >= 25) {
                return interaction.reply({ content: `${e.error} Максимум 25 ролей!`, ephemeral: true });
            }
            
            try {
                const channel = await interaction.client.channels.fetch(rr[msgId].channelId);
                const msg = await channel.messages.fetch(msgId);
                
                rr[msgId].roles.push({
                    roleId: role.id,
                    label,
                    emoji,
                    style
                });
                
                const rows = [];
                let currentRow = new ActionRowBuilder();
                
                for (const r of rr[msgId].roles) {
                    if (currentRow.components.length === 5) {
                        rows.push(currentRow);
                        currentRow = new ActionRowBuilder();
                    }
                    
                    const btn = new ButtonBuilder()
                        .setCustomId(`rr_${r.roleId}`)
                        .setLabel(r.label)
                        .setStyle(ButtonStyle[r.style]);
                    
                    if (r.emoji) btn.setEmoji(r.emoji);
                    
                    currentRow.addComponents(btn);
                }
                
                if (currentRow.components.length > 0) rows.push(currentRow);
                
                await msg.edit({ components: rows });
                saveRR(rr);
                
                await interaction.reply({ 
                    content: `${e.success} Роль ${role} добавлена!`, 
                    ephemeral: true 
                });
            } catch (error) {
                console.error('RR add error:', error);
                await interaction.reply({ content: `${e.error} Ошибка!`, ephemeral: true });
            }
        }
    }
};
