// Load .env file only if it exists (not needed on Koyeb — env vars are injected by the platform)
const dotenv = require('dotenv');
const envResult = dotenv.config();
if (envResult.error) {
    console.log('ℹ️  No .env file found — using platform environment variables');
}

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('   Set them in your Koyeb service settings under "Environment variables".');
    process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set — AI features will be disabled');
}
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

// Minimal HTTP server for Koyeb health checks
const http = require('http');
const PORT = process.env.PORT || 8000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
}).listen(PORT, () => {
    console.log(`🩺 Health check server running on port ${PORT}`);
});

start();
