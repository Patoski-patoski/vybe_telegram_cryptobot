# Contributing to Vybe Telegram Bot

Thank you for your interest in contributing to the Vybe Telegram Bot! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git
- Telegram Bot Token
- Vybe Network API Key

### Setting Up the Development Environment

1. Fork and clone the repository

```bash
git clone https://github.com/yourusername/vybe-telegram-bot.git
cd vybe-telegram-bot
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file

```
TELEGRAM_BOT_TOKEN=your_development_bot_token
VYBE_API_KEY=your_development_api_key
```

4. Start the development server

```bash
npm run dev
```

## Project Structure

```
src/
├── bots/                 # Bot handlers
│   ├── baseHandler.ts    # Base handler class
│   ├── whaleWatchHandler.ts
│   └── walletTrackerHandler.ts
├── config/              # Configuration files
│   └── logger.ts
├── interfaces/          # TypeScript interfaces
│   └── vybeApiInterface.ts
├── services/           # Core services
│   ├── vybeAPI.ts
│   └── walletAnalysisService.ts
├── utils/              # Utility functions
│   ├── messageTemplates.ts
│   ├── solana.ts
│   └── time.ts
└── data/               # Data storage
    ├── whale-alerts.json
    └── wallet-alerts.json
```

## Code Style

### TypeScript Guidelines

- Use TypeScript strict mode
- Define interfaces for all data structures
- Use type annotations for function parameters and return values
- Avoid using `any` type
- Use enums for fixed sets of values

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use UPPER_SNAKE_CASE for constants
- Prefix private members with underscore

### Documentation

- Document all public methods and classes
- Use JSDoc comments for complex functions
- Keep comments up to date with code changes
- Document API endpoints and responses

## Adding New Features

### 1. Create a New Handler

```typescript
import { BaseHandler } from "./baseHandler";

export class NewFeatureHandler extends BaseHandler {
  constructor(bot: TelegramBot, api: VybeApiService) {
    super(bot, api);
  }

  // Add command handlers
  async handleNewCommand(msg: TelegramBot.Message) {
    // Implementation
  }
}
```

### 2. Add Command Registration

Update `src/bot.ts` to register new commands:

```typescript
const newFeatureHandler = new NewFeatureHandler(bot, api);
bot.onText(/\/newcommand/, (msg) => newFeatureHandler.handleNewCommand(msg));
```

### 3. Add Message Templates

Update `src/utils/messageTemplates.ts`:

```typescript
export const BOT_MESSAGES = {
  // ... existing messages
  NEW_COMMAND_HELP: `...`,
};
```

### 4. Add Tests

Create test file in `src/__tests__/`:

```typescript
describe("NewFeatureHandler", () => {
  // Test implementation
});
```

## Testing

### Running Tests

```bash
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

### Writing Tests

- Test both success and error cases
- Mock external API calls
- Test edge cases
- Include integration tests for complex features

## Pull Request Process

1. Create a feature branch

```bash
git checkout -b feature/new-feature
```

2. Make your changes
3. Run tests
4. Update documentation
5. Create a pull request

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests are added/updated
- [ ] Documentation is updated
- [ ] All tests pass
- [ ] No linting errors
- [ ] Changes are backward compatible

## Code Review Process

1. PR is assigned to reviewers
2. Reviewers check code quality and functionality
3. Address review comments
4. PR is merged after approval

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release tag
4. Deploy to production

## Support

For questions or issues:

1. Check existing documentation
2. Search existing issues
3. Create a new issue if needed
4. Join the development chat

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
