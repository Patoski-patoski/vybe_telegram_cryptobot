# Contributing to Vybe Telegram Bot

Thank you for your interest in contributing to the Vybe Telegram Bot! This document provides guidelines and instructions to help you contribute effectively to the project.

## 🌟 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please report unacceptable behavior to the project maintainers.

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git
- Telegram Bot Token (from [BotFather](https://t.me/botfather))
- Vybe Network API Key

### Development Environment Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/patoski-patoski/vybe-telegram-cryptobot.git
cd vybe-telegram-bot
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:

```
TELEGRAM_BOT_TOKEN=your_development_bot_token
VYBE_API_KEY=your_development_api_key
REDIS_URL=redis://localhost:6379 # Optional
```

4. **Start the development server**

```bash
npm run dev
```

## 📂 Project Structure

```
src/
├── bots/                 # Bot handlers
│   ├── baseHandler.ts    # Base handler class
│   ├── whaleWatchHandler.ts
│   ├── walletTrackerHandler.ts
│   ├── priceHandler.ts
│   └── nftPortfolioHandler.ts
├── config/              # Configuration files
│   └── logger.ts
├── interfaces/          # TypeScript interfaces
│   └── vybeApiInterface.ts
├── services/           # Core services
│   ├── vybeApiService.ts
│   └── walletAnalysisService.ts
├── utils/              # Utility functions
│   ├── messageTemplates.ts
│   ├── solana.ts
│   └── time.ts
├── data/               # Data storage
│   ├── whale-alerts.json
│   └── wallet-alerts.json
└── index.ts            # Entry point
```

## 🛠️ Development Workflow

### 1. Choose an Issue

- Browse existing issues or create a new one
- Comment on the issue to express your interest
- Wait for assignment or feedback

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names like:
- `feature/nft-analytics`
- `bugfix/price-alert-issue`
- `docs/improve-readme`

### 3. Coding Standards

#### TypeScript Guidelines

- Use TypeScript strict mode
- Define interfaces for all data structures
- Use type annotations for function parameters and return values
- Avoid using `any` type when possible
- Use enums for fixed sets of values

#### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use UPPER_SNAKE_CASE for constants
- Prefix private members with underscore

#### Code Formatting

This project uses Prettier and ESLint for code formatting and linting:

```bash
# Check code style
npm run lint

# Fix code style issues
npm run lint:fix

# Format code
npm run format
```

### 4. Documentation

- Document all public methods and classes
- Use JSDoc comments for complex functions
- Keep comments up to date with code changes
- Document API endpoints and responses

### 5. Testing

Write tests for your code:

```bash
# Run tests
npm test

# Check test coverage
npm run test:coverage
```

Ensure your tests cover:
- Success cases
- Error handling
- Edge cases
- Integration with other components

### 6. Commit Changes

Use conventional commit messages:

```bash
feat: add whale alert notification system
fix: correct price calculation error
docs: update installation instructions
test: add unit tests for wallet tracker
refactor: optimize API request handling
```

### 7. Submit a Pull Request

1. Push your branch to your fork
```bash
git push origin feature/your-feature-name
```

2. Create a pull request from your fork to the main repository
3. Fill in the PR template with details about your changes
4. Link the PR to any relevant issues

## 🧩 Adding New Features

### 1. Create a New Handler

```typescript
import { BaseHandler } from "./baseHandler";

export class NewFeatureHandler extends BaseHandler {
  constructor(bot: TelegramBot, api: VybeApiService) {
    super(bot, api);
  }

  // Add command handlers
  async handleNewCommand(msg: TelegramBot.Message): Promise<void> {
    // Implementation
  }
}
```

### 2. Add Command Registration

Update `src/index.ts` to register new commands:

```typescript
const newFeatureHandler = new NewFeatureHandler(bot, api);
bot.onText(/\/newcommand/, (msg) => newFeatureHandler.handleNewCommand(msg));
```

### 3. Add Message Templates

Update `src/utils/messageTemplates.ts`:

```typescript
export const BOT_MESSAGES = {
  // ... existing messages
  NEW_COMMAND_HELP: `*New Command Help*\n\n...`,
  NEW_COMMAND_SUCCESS: `✅ Command executed successfully! ...`,
  NEW_COMMAND_ERROR: `❌ Error: ...`,
};
```

### 4. Add Tests

Create test file in `src/__tests__/`:

```typescript
describe("NewFeatureHandler", () => {
  let handler: NewFeatureHandler;
  let mockBot: any;
  let mockApi: any;

  beforeEach(() => {
    mockBot = { sendMessage: jest.fn() };
    mockApi = { someMethod: jest.fn() };
    handler = new NewFeatureHandler(mockBot, mockApi);
  });

  test("should handle new command correctly", async () => {
    // Test implementation
  });
});
```

## 🔍 Pull Request Review Process

1. PR is assigned to reviewers
2. Reviewers check:
   - Code quality and style
   - Test coverage
   - Documentation
   - Performance
   - Security concerns
3. Address review comments
4. PR is merged after approval from at least one maintainer

## 🚢 Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a release tag
4. Deploy to production

## 📝 Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Vybe Network API Documentation](API.md)

## 🤝 Getting Help

If you need assistance:

1. Check existing documentation
2. Search for similar issues
3. Create a new issue with the 'question' label
4. Reach out in the Vybe Network community: [Telegram Group](https://t.me/VybeNetwork_Official)

## 📜 License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).

Thank you for contributing to the Vybe Telegram Bot project! 🙏