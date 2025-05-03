import express from "express";
import dotenv from "dotenv";
import { BotHandler } from "./bots/botHandler";
import config from "./config/config";
import { RedisService } from "./services/redisService";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    { name: 'TELEGRAM_BOT_TOKEN', configValue: config.bot.botToken },
    { name: 'VYBE_API_KEY', configValue: config.vybe.apiKey },
    { name: 'WEBHOOK_URL', configValue: config.bot.webhookUrl }
];

for (const envVar of requiredEnvVars) {
    if (!envVar.configValue) {
        console.warn(`Warning: ${envVar.name} is not set in environment variables`);
    }
}

class App {
    private bot: BotHandler;
    private app: express.Application;
    private readonly port: number;

    constructor() {
        const redisService = new RedisService();
        this.bot = new BotHandler(redisService);
        this.app = express();
        // Render sets PORT environment variable, use that
        this.port = parseInt(process.env.PORT || '3000', 10);
        this.setupExpress();
    }

    private setupExpress() {
        this.app.use(express.json());

        // Health check endpoint
        this.app.get('/', (req, res) => {
            res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
        });

        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'HEALTH OK', timestamp: new Date().toISOString() });
        });

        // Set up the webhook endpoint
        const bot = this.bot.getBot();
        const webhookPath = `/telegram-webhook/${config.bot.botToken}`;

        console.log(`Setting up webhook endpoint at ${webhookPath}`);

        this.app.post(webhookPath, (req, res) => {
            bot.processUpdate(req.body);
            res.sendStatus(200);
        });
    }

    async start() {
        // Start express server first
        this.app.listen(this.port, () => {
            console.log(`Server is running on port ${this.port}`);
        });

        console.log('Vybe Telegram Bot is starting...');

        // Set webhook
        await this.setupWebhook();
        this.setupBotErrorHandling();

        console.log('Vybe Telegram Bot is running!');
    }

    private async setupWebhook() {
        try {
            const bot = this.bot.getBot();
            // Use the configured webhook URL
            const webhookUrl = config.bot.webhookUrl;

            console.log(`Setting webhook to: ${webhookUrl}`);
            await bot.setWebHook(webhookUrl);
            console.log('Webhook set successfully');
        } catch (error) {
            console.error('Failed to set webhook:', error);
        }
    }

    private setupBotErrorHandling() {
        const bot = this.bot.getBot();

        bot.on('webhook_error', (error) => {
            console.error('Webhook error:', error.message);
        });

        bot.on('error', (error) => {
            console.error('Bot error:', error);
        });
    }
}

// Create and start the application
const app = new App();
app.start();

export default App;