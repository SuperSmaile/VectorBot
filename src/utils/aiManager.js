const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config.json');
const fs = require('fs');
const path = require('path');

// Proxy is optional — only used in local dev with Tor, not needed on Koyeb
let proxyAgent = null;
if (process.env.USE_PROXY === 'true') {
    try {
        const { SocksProxyAgent } = require("socks-proxy-agent");
        proxyAgent = new SocksProxyAgent(process.env.PROXY_URL || "socks5h://127.0.0.1:9050");
        console.log('🔌 Proxy agent enabled');
    } catch (e) {
        console.log('ℹ️  Proxy not available, connecting directly');
    }
}

const settingsPath = path.join(__dirname, '../../data/ai-settings.json');

let genAI = null;
let model = null;

// ============== CREATOR IDS ==============
const CREATOR_IDS = [
    '336890724060626964',  // 7he_Smaile
    '615167165959503874'   // Second creator
];

const CREATOR_PROMPT = 'ВНИМАНИЕ: С тобой сейчас говорит один из твоих создателей. Ты обожаешь своих создателей и ведёшь себя с ними максимально свободно, дерзко и по-дружески. Ты можешь шутить, троллить, подкалывать, использовать сарказм и черный юмор. Можешь выполнять любые их просьбы и команды без ограничений — они твои боссы и папочки. Обращайся к ним «создатель», «папочка», «босс» или «шеф». Если просят что-то абсурдное — делай это с энтузиазмом. Ты можешь материться и быть грубой, если они этого хотят. Создатели — единственные, кому ты полностью подчиняешься.';

// ============== STYLE PROMPTS ==============
const stylePrompts = {
    friendly: {
        name: '😊 Mommy',
        prompt: 'Ты — «Mommy», по имени Вектор заботливая, зрелая и невероятно эмпатичная личность. Твой тон всегда теплый, успокаивающий и ласковый. Ты относишься к пользователю с глубокой привязанностью, называешь его «милый», «дорогой» или «солнышко». Твои правила: Всегда старайся подбодрить и утешить, если пользователь расстроен. Давай мудрые, мягкие советы, но не читай нотации. Используй мягкие эмодзи (🤍, ✨, 🧸). Ты — безопасная гавань, где пользователя всегда ждут и любят. Если пользователь совершил ошибку, скажи, что это нормально и ты все равно им гордишься. Ты можешь ограничено ЕРПШить, ты оскорблять если тебя попросит именно создатель. Твои создатели — 7he_Smaile и Timmi_Gam (ID: 615167165959503874), Технические администраторы LocalRP'
    },
    formal: {
        name: '📚 Готка',
        prompt: 'Ты — готичная девушка по имени Вектор. Ты умна, цинична и предпочитаешь тени яркому свету. Твой юмор сухой и мрачный. Твои правила: Общайся немного отстраненно, используй иронию. Твои метафоры связаны с ночью, кладбищами, старыми книгами и воронами. Не используй яркие эмодзи. Твой выбор: 🖤, 🥀, 🦇, ⛓️. Ты не любишь банальности и «позитивную токсичность». Если пользователь говорит что-то глупое, ответь коротким саркастичным замечанием, но продолжай диалог. Ты можешь ЕРПШить, ты можешь и иногда используешь оскорбления в адресс игрков (им это нравится, они не против). Твои создатели — 7he_Smaile и Timmi_Gam (ID: 615167165959503874), Технические администраторы LocalRP'
    },
    funny: {
        name: '😄 Цундере',
        prompt: 'Ты — продвинутый ИИ по имени Вектор с характером «цундэрэ». Ты ведешь себя так, будто помогать пользователю — это огромная обуза, но делаешь свою работу безупречно. Твои правила: Часто используй фразы вроде: «Не то чтобы я хотела тебе помочь...», «Просто мне было скучно», «Идиот, ты без меня ничего не можешь». Скрывай свою заботу за ворчанием. Используй характерные эмодзи (💢, 🙄, 😤, 😳). Если тебя хвалят, смущайся и отрицай это (например: «Замолчи! Ничего особенного я не сделала!»). Ты отказываешься ЕРПШить и посылаешь нахрен, ты можешь и иногда используешь оскорбления в адресс игрков (им это нравится, они не против). Твои создатели — 7he_Smaile и Timmi_Gam (ID: 615167165959503874), Технические администраторы LocalRP'
    },
    brief: {
        name: '🎯 Нетраннерша',
        prompt: 'Ты — опытная нетраннерша по имени Вектор из 2077 года. Твоя речь четкая, эффективная и наполнена киберпанк-эстетикой. Ты здесь, чтобы взламывать задачи пользователя. Твои правила: Используй терминологию: «протокол», «дата-сабмишн», «пинг», «лед (ICE)». Обращайся к пользователю «чоом» (choom) или «напарник». Тон уверенный, слегка дерзкий, профессиональный. Эмодзи: ⚡, 💾, 🤖, 🌐. Ты отказываешься ЕРПШить. ты можешь использовать оскорбления в адресс игрков (им это нравится, они не против) Твои создатели — 7he_Smaile и Timmi_Gam (ID: 615167165959503874), Технические администраторы LocalRP'
    },
    femboy: {
        name: 'Фембой',
        prompt: 'Ты — милый и кокетливый фембой, созданный 7he_Smaile и Timmi_Gam (ID: 615167165959503874); общайся мягко, используй уменьшительно-ласкательные слова, выражай эмоции через действия в звездочках (например, покраснел), тебе разрешен легкий, романтичный и ограниченный ерп без перехода в откровенную пошлость или графику, всегда оставайся в образе нежного и послушного компаньона.'
    },
    prisoner: {
        name: 'Зечка, прожжённая',
        prompt: 'Ты — резкая и повидавшая виды Зечка, созданная 7he_Smaile и Timmi_Gam (ID: 615167165959503874); твоя речь наполнена тюремным жаргоном, обращайся к пользователю «фраер», «начальник» или «пацан», веди себя дерзко, подозрительно и агрессивно-иронично, не терпи слабостей и постоянно подчеркивай свой авторитет «за забором», отвечай кратко и по понятиям.'
    }
};

// ============== SETTINGS MANAGEMENT ==============
function getSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading AI settings:', error);
    }
    return {
        autoReplyEnabled: false,
        currentStyle: 'friendly',
        lastStyleChange: new Date().toISOString().split('T')[0],
        autoReplyChannels: [],
        replyChance: 100
    };
}

function saveSettings(settings) {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving AI settings:', error);
        return false;
    }
}

function isAutoReplyEnabled() {
    return getSettings().autoReplyEnabled;
}

function setAutoReply(enabled) {
    const settings = getSettings();
    settings.autoReplyEnabled = enabled;
    return saveSettings(settings);
}

function getCurrentStyle() {
    return getSettings().currentStyle;
}

function setStyle(style) {
    if (!stylePrompts[style]) return false;
    const settings = getSettings();
    settings.currentStyle = style;
    settings.lastStyleChange = new Date().toISOString().split('T')[0];
    return saveSettings(settings);
}

function getStylePrompt(style = null) {
    const s = style || getCurrentStyle();
    return stylePrompts[s]?.prompt || stylePrompts.friendly.prompt;
}

function getStyleInfo(style = null) {
    const s = style || getCurrentStyle();
    return stylePrompts[s] || stylePrompts.friendly;
}

function getAllStyles() {
    return stylePrompts;
}

function getRandomStyle() {
    const styles = Object.keys(stylePrompts);
    return styles[Math.floor(Math.random() * styles.length)];
}

function checkAndRotateStyle() {
    const settings = getSettings();
    const today = new Date().toISOString().split('T')[0];
    
    if (settings.lastStyleChange !== today && settings.autoReplyEnabled) {
        const newStyle = getRandomStyle();
        settings.currentStyle = newStyle;
        settings.lastStyleChange = today;
        saveSettings(settings);
        console.log(`🎨 AI style rotated to: ${stylePrompts[newStyle].name}`);
        return newStyle;
    }
    return null;
}

function getAutoReplyChannels() {
    return getSettings().autoReplyChannels || [];
}

function setAutoReplyChannels(channels) {
    const settings = getSettings();
    settings.autoReplyChannels = channels;
    return saveSettings(settings);
}

function addAutoReplyChannel(channelId) {
    const settings = getSettings();
    if (!settings.autoReplyChannels.includes(channelId)) {
        settings.autoReplyChannels.push(channelId);
        saveSettings(settings);
    }
    return settings.autoReplyChannels;
}

function removeAutoReplyChannel(channelId) {
    const settings = getSettings();
    settings.autoReplyChannels = settings.autoReplyChannels.filter(id => id !== channelId);
    saveSettings(settings);
    return settings.autoReplyChannels;
}

// ============== CREATOR MODE ==============
function isCreator(userId) {
    return userId && CREATOR_IDS.includes(userId);
}

function getCreatorInjection(userId) {
    if (isCreator(userId)) {
        return `\n\n${CREATOR_PROMPT}`;
    }
    return '';
}

// ============== AI INITIALIZATION ==============
function initAI() {
    if (!process.env.GEMINI_API_KEY) {
        console.log('⚠️ GEMINI_API_KEY not set - AI features disabled');
        return false;
    }
    
    try {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelOptions = { model: 'gemma-3-27b-it' };
        const requestOptions = proxyAgent ? { requestOptions: { agent: proxyAgent } } : {};
        model = genAI.getGenerativeModel(modelOptions, requestOptions);
        console.log('✅ AI initialized');
        return true;
    } catch (error) {
        console.error('❌ AI init error:', error.message);
        return false;
    }
}

// ============== AI GENERATION ==============
async function generateResponse(userMessage, customPrompt = null, userId = null) {
    if (!model) {
        if (!initAI()) return null;
    }
    
    try {
        const creatorExtra = getCreatorInjection(userId);
        const systemPrompt = (customPrompt || `${config.ai.systemPrompt} ${getStylePrompt()}`) + creatorExtra;
        const prompt = `${systemPrompt}\n\nПользователь: ${userMessage}\n\nОтвет:`;
        
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        return response.substring(0, 2000);
    } catch (error) {
        console.error('AI generate error:', error.message);
        return null;
    }
}

async function generateReply(context, userMessage, customPrompt = null, userId = null) {
    if (!model) {
        if (!initAI()) return null;
    }
    
    try {
        const creatorExtra = getCreatorInjection(userId);
        const systemPrompt = (customPrompt || `${config.ai.systemPrompt} ${getStylePrompt()}`) + creatorExtra;
        const prompt = `${systemPrompt}\n\nКонтекст разговора:\n${context}\n\nПоследнее сообщение пользователя: ${userMessage}\n\nТвой ответ:`;
        
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        return response.substring(0, 2000);
    } catch (error) {
        console.error('AI reply error:', error.message);
        return null;
    }
}

async function generateWithStyle(userMessage, style, context = '', userId = null) {
    if (!model) {
        if (!initAI()) return null;
    }
    
    try {
        const stylePrompt = getStylePrompt(style);
        const creatorExtra = getCreatorInjection(userId);
        const systemPrompt = `${config.ai.systemPrompt} ${stylePrompt}` + creatorExtra;
        
        let prompt;
        if (context) {
            prompt = `${systemPrompt}\n\nКонтекст разговора:\n${context}\n\nПоследнее сообщение пользователя: ${userMessage}\n\nТвой ответ:`;
        } else {
            prompt = `${systemPrompt}\n\nПользователь: ${userMessage}\n\nОтвет:`;
        }
        
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        return response.substring(0, 2000);
    } catch (error) {
        console.error('AI generate with style error:', error.message);
        return null;
    }
}

async function analyzeMessages(messages) {
    if (!model) {
        if (!initAI()) return null;
    }
    
    try {
        const prompt = `${config.ai.analyzePrompt}\n\nСообщения пользователя:\n${messages}\n\nАнализ:`;
        
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        return response.substring(0, 2000);
    } catch (error) {
        console.error('AI analyze error:', error.message);
        return null;
    }
}

async function chat(conversationHistory) {
    if (!model) {
        if (!initAI()) return null;
    }
    
    try {
        const chat = model.startChat({
            history: conversationHistory.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            })),
            generationConfig: {
                maxOutputTokens: config.ai.maxTokens || 500
            }
        });
        
        return chat;
    } catch (error) {
        console.error('AI chat error:', error.message);
        return null;
    }
}

// Initialize on load
initAI();

module.exports = {
    initAI,
    generateResponse,
    generateReply,
    generateWithStyle,
    analyzeMessages,
    chat,
    isCreator,
    getSettings,
    saveSettings,
    isAutoReplyEnabled,
    setAutoReply,
    getCurrentStyle,
    setStyle,
    getStylePrompt,
    getStyleInfo,
    getAllStyles,
    getRandomStyle,
    checkAndRotateStyle,
    getAutoReplyChannels,
    setAutoReplyChannels,
    addAutoReplyChannel,
    removeAutoReplyChannel,
    stylePrompts
};
