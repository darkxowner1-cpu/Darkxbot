const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const chalk = require('chalk');
const gradient = require('gradient-string');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { color, getBuffer, runtime } = require('./lib/functions');

// Import command handlers
const downloaderCommands = require('./commands/downloader');
const funCommands = require('./commands/fun');
const groupCommands = require('./commands/group');
const aiCommands = require('./commands/ai');
const ownerCommands = require('./commands/owner');

// Console Banner
console.log(gradient.rainbow(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              DARKX OFFICIAL BOT                ┃
┃              By MrX Developer                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
`));

class DarkXBot {
    constructor() {
        this.sock = null;
        this.startTime = new Date();
        this.isConnected = false;
        this.commands = new Map();
        this.loadCommands();
    }

    loadCommands() {
        // Register all commands
        Object.entries(downloaderCommands).forEach(([name, handler]) => this.commands.set(name, handler));
        Object.entries(funCommands).forEach(([name, handler]) => this.commands.set(name, handler));
        Object.entries(groupCommands).forEach(([name, handler]) => this.commands.set(name, handler));
        Object.entries(aiCommands).forEach(([name, handler]) => this.commands.set(name, handler));
        Object.entries(ownerCommands).forEach(([name, handler]) => this.commands.set(name, handler));
        
        console.log(color(`✓ Loaded ${this.commands.size} commands`, 'green'));
    }

    async connect() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState(config.sessionPath);
            const { version } = await fetchLatestBaileysVersion();
            
            this.sock = makeWASocket({
                version,
                printQRInTerminal: true,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, {
                        log: console.log
                    }),
                },
                logger: {
                    level: 'silent'
                }
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                if (qr) {
                    console.log(color('📱 Scan the QR code above to connect', 'yellow'));
                }
                
                if (connection === 'open') {
                    this.isConnected = true;
                    console.log(color('✅ Connected to WhatsApp successfully!', 'green'));
                    await this.updateStatus();
                    setInterval(() => this.updateStatus(), config.statusUpdateInterval * 60 * 1000);
                }
                
                if (connection === 'close') {
                    this.isConnected = false;
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log(color(`Connection closed. Reconnecting: ${shouldReconnect}`, 'yellow'));
                    
                    if (shouldReconnect) {
                        setTimeout(() => this.connect(), 5000);
                    }
                }
            });

            this.sock.ev.on('creds.update', saveCreds);
            this.sock.ev.on('messages.upsert', async (m) => {
                await this.handleMessage(m);
            });

        } catch (error) {
            console.log(color(`Connection error: ${error.message}`, 'red'));
            setTimeout(() => this.connect(), 5000);
        }
    }

    async handleMessage(m) {
        try {
            const message = m.messages[0];
            if (!message.message || message.key.remoteJid === 'status@broadcast') return;
            
            const text = (message.message.conversation || message.message.extendedTextMessage?.text || '').toLowerCase();
            const from = message.key.remoteJid;
            const sender = message.key.participant || from;
            const isGroup = from.endsWith('@g.us');
            const isOwner = sender.replace(/@s\.whatsapp\.net/g, '') === config.ownerNumber;
            
            // Auto read messages
            if (config.autoReadMessages) {
                await this.sock.readMessages([message.key]);
            }
            
            // Handle commands
            if (text.startsWith(config.prefix)) {
                const command = text.slice(config.prefix.length).split(' ')[0];
                const args = text.slice(config.prefix.length + command.length).trim();
                
                console.log(color(`Command: ${command} from ${sender}`, 'cyan'));
                
                if (this.commands.has(command)) {
                    const handler = this.commands.get(command);
                    await handler(this.sock, message, args, { isGroup, isOwner, sender, from });
                }
            }
            
            // AI Chat (reply to any message)
            if (config.enableAI && !text.startsWith(config.prefix) && message.message) {
                const aiHandler = this.commands.get('ai');
                if (aiHandler) {
                    await aiHandler(this.sock, message, text, { isGroup, isOwner, sender, from });
                }
            }
            
        } catch (error) {
            console.log(color(`Message handling error: ${error.message}`, 'red'));
        }
    }

    async updateStatus() {
        try {
            const uptime = runtime(process.uptime());
            const status = `🤖 ${config.botName} | Online: ${uptime} | By ${config.ownerName}`;
            
            await this.sock.updateProfileStatus(status);
            console.log(color(`Status updated: ${status}`, 'blue'));
        } catch (error) {
            console.log(color('Failed to update status', 'red'));
        }
    }
}

// Start the bot
const bot = new DarkXBot();
bot.connect();

// Handle process events
process.on('uncaughtException', (err) => {
    console.log(color(`Uncaught Exception: ${err}`, 'red'));
});

process.on('unhandledRejection', (reason, promise) => {
    console.log(color(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'red'));
});
