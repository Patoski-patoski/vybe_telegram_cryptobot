//app.ts
import express from "express";
import dotenv from "dotenv";
import { BotHandler } from "./bots/botHandler";
import config  from "../src/config/config";


dotenv.config();

if (config.bot.botToken === '') {
    throw new Error('BOT_TOKEN is required in the environment variables');
}
if (config.vybe.apiKey === '') {
    throw new Error('VYBE_API_KEY is required in the environment variables');
}
if (config.bot.webhookUrl === '') { 
    throw new Error('WEBHOOK_URL is required in the environment variables');
}

class App {
    private bot: BotHandler;
    private app: express.Application;
    private readonly port: number;

    constructor() {
        this.bot = new BotHandler();
        this.app = express();
        // Render sets PORT environment variable, fallback to 3000 if not set
        this.port = parseInt(process.env.PORT || '3000', 10);
        this.setupExpress();
    }

    private setupExpress() {
        // Add body parser middleware for webhook
        this.app.use(express.json());

        // Health check endpoint
        this.app.get('/', (req, res) => {
            res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
        });

        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
        });

        // Set up the webhook endpoint
        const bot = this.bot.getBot();
        const webhookPath = `/telegram-webhook/${config.bot.botToken}`;

        this.app.post(webhookPath, (req, res) => {
            bot.processUpdate(req.body);
            res.sendStatus(200);
        });
    }

    async start() {
        // Start express server first
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`Server is running on port ${this.port}`);
        });

        console.log('Vybe Telegram Bot is running...');
        console.log(`Environment: ${config.server.environment}`);

        // Set webhook
        await this.setupWebhook();
        this.setupBotErrorHandling();
    }

    private async setupWebhook() {
        try {
            const bot = this.bot.getBot();
            // If you're using a service like Render or Heroku, use their provided URL
            const webhookUrl = config.bot.webhookUrl
                || `https://your-app-domain.com/telegram-webhook/${config.bot.botToken}`;

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