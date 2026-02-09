require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Channel,
        Partials.Message
    ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            console.log(`✅ Loaded command: ${command.data.name}`);
        }
    } catch (error) {
        console.error(`❌ Error loading ${file}:`, error.message);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    try {
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`✅ Loaded event: ${event.name}`);
    } catch (error) {
        console.error(`❌ Error loading ${file}:`, error.message);
    }
}

const rest = new REST({ timeout: 30000 }).setToken(process.env.DISCORD_TOKEN);

async function registerCommands(retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`🔄 Регистрация команд... (${i + 1}/${retries})`);
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
            console.log('✅ Команды зарегистрированы!');
            return true;
        } catch (error) {
            console.error(`❌ Попытка ${i + 1}:`, error.message);
            if (i < retries - 1) await new Promise(r => setTimeout(r, 5000));
        }
    }
    return false;
}

async function connectBot(retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`🔄 Подключение... (${i + 1}/${retries})`);
            await client.login(process.env.DISCORD_TOKEN);
            return true;
        } catch (error) {
            console.error(`❌ Попытка ${i + 1}:`, error.message);
            if (i < retries - 1) await new Promise(r => setTimeout(r, 5000));
        }
    }
    return false;
}

async function start() {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║         🤖 Discord Info Bot            ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    
    await registerCommands();
    await connectBot();
}

process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error.message);
});

start();
