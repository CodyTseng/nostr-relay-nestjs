# Contributing to Nostr Relay NestJS

First off, thank you for considering contributing to Nostr Relay NestJS! It's people like you that make this project better for everyone.

## Before Contributing

### Understanding Our Architecture

Before making contributions, please familiarize yourself with our architectural decisions and project scope:

- Read our [Architecture Decisions](docs/architecture_decisions.md) document to understand:
  - Why we chose PM2 over Docker for production
  - Our performance and resource optimization priorities
  - Key technical decisions that shape the project

### Project Scope

This project maintains a focused scope to ensure reliability and maintainability:

1. **Core Features**
   - Nostr protocol implementation
   - Essential NIPs support
   - Performance optimizations
   - Security measures

2. **Outside Current Scope**
   - Features that could compromise performance
   - Implementations that conflict with our [architectural decisions](docs/architecture_decisions.md)
   - NIPs that don't align with our relay's purpose

If you're unsure whether a feature fits our scope:
1. Check our [Technical Specifications](docs/technical-specifications.md)
2. Open an issue to discuss before implementing
3. Reference relevant architectural decisions

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct (be respectful, inclusive, and professional).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include any relevant logs or error output

### Suggesting Enhancements

If you have a suggestion for the project:

1. **Review Existing Documentation**
   - Check [Technical Specifications](docs/technical-specifications.md)
   - Review [Architecture Decisions](docs/architecture_decisions.md)
   - Ensure it aligns with project scope

2. **Create an Issue**
   * Use a clear and descriptive title
   * Provide a step-by-step description of the suggested enhancement
   * Explain why this enhancement would be useful
   * Reference relevant architectural decisions or technical constraints

### Pull Requests

#### Best Practices

1. **Keep Changes Small**
   - Make small, focused changes
   - One feature or bug fix per PR
   - Aim for under 300 lines of code per PR
   - Break larger changes into smaller PRs

2. **Code Quality**
   - Follow existing code style and conventions
   - Add/update tests for your changes
   - Ensure all tests pass locally
   - Update documentation as needed

3. **Commit Messages**
   - Use conventional commits format:
     ```
     type(scope): description
     
     [optional body]
     [optional footer]
     ```
   - Types: feat, fix, docs, style, refactor, test, chore
   - Keep commits atomic and well-described

4. **Documentation**
   - Update relevant documentation
   - Add inline comments for complex logic
   - Update the README if needed
   - Document any new environment variables

#### Pull Request Process

1. **Before Starting**
   - Review [Architecture Decisions](docs/architecture_decisions.md)
   - Create an issue discussing the change (if significant)
   - Fork the repository
   - Create a new branch from `master`

2. **Development**
   ```bash
   # Setup
   git clone your-fork-url
   cd nostr-relay-nestjs
   npm install

   # Create branch
   git checkout -b feature/your-feature
   # or
   git checkout -b fix/your-fix
   ```

3. **Testing**
   - Follow our [Testing Guide](docs/testing.md)
   ```bash
   # Run tests
   npm run test:all
   
   # Run specific NIP tests
   npm run test:nips -- --nip=1
   ```

4. **Submitting**
   - Push to your fork
   - Create a Pull Request
   - Fill out the PR template
   - Link any related issues
   - Reference relevant architectural decisions

5. **Review Process**
   - Automated checks must pass
   - At least one maintainer review required
   - Address review feedback promptly
   - Keep the PR updated with master

### Development Setup

1. **Prerequisites**
   - Node.js (v18+)
   - PostgreSQL (v15+)
   - npm or yarn

2. **Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Database**
   ```bash
   # Run migrations
   npx ts-node scripts/migrate-to-latest.ts
   ```

4. **Running Locally**
   ```bash
   npm run start:dev
   ```

For detailed setup instructions, see our [Installation Guide](docs/installation.md).

## Style Guide

### Code Style

- Use TypeScript features appropriately
- Follow NestJS best practices
- Use meaningful variable and function names
- Keep functions small and focused
- Comment complex logic
- Use async/await (avoid raw promises)

### TypeScript Guidelines

```typescript
// Use interfaces for objects
interface UserConfig {
  maxConnections: number;
  timeout: number;
}

// Use enums for fixed values
enum ConnectionState {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

// Use type annotations
function processUser(user: User): Promise<void> {
  // ...
}
```

### Testing

- Write unit tests for new features
- Update existing tests when modifying features
- Include edge cases
- Mock external dependencies
- Keep tests focused and descriptive

See our [Testing Guide](docs/testing.md) for detailed testing procedures.

## Questions?

Feel free to create an issue tagged with 'question' if you need help or clarification. Before asking:

1. Check our existing documentation:
   - [Technical Specifications](docs/technical-specifications.md)
   - [Architecture Decisions](docs/architecture_decisions.md)
   - [Installation Guide](docs/installation.md)
   - [Testing Guide](docs/testing.md)

2. Search existing issues for similar questions

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.
