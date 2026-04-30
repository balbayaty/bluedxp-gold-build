# Contributing to BlueDXP Platform

Thank you for your interest in contributing to BlueDXP Platform! This document provides guidelines and instructions for contributing to the project.

---

## 🎯 Code of Conduct

### Our Standards

- **Professionalism**: Maintain professional and respectful communication
- **Security First**: Never commit secrets, API keys, or credentials
- **Quality**: Write clean, maintainable, and well-documented code
- **Collaboration**: Work together to build the best platform possible

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 15 or higher
- Redis 7 or higher
- Git

### Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-org/hazalyze-asn-module.git
   cd hazalyze-asn-module
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.local.template .env.local
   # Edit .env.local with your configuration
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

---

## 📋 Development Workflow

### Branch Strategy

- **`main`**: Production-ready code
- **`develop`**: Development branch (if used)
- **`feature/feature-name`**: New features
- **`fix/bug-name`**: Bug fixes
- **`hotfix/issue-name`**: Critical fixes

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance
- `security`: Security fix

**Example:**
```
feat(wms): Add intelligent putaway algorithm

Implemented AI-powered putaway optimization using machine learning
to determine optimal storage locations.

Closes #123
```

---

## 🔒 Security Guidelines

### Never Commit:

- ❌ API keys
- ❌ Passwords
- ❌ Secrets
- ❌ Private keys
- ❌ Certificates
- ❌ `.env` files
- ❌ Database credentials

### Always:

- ✅ Use environment variables
- ✅ Fail-fast if credentials missing
- ✅ Document required env vars
- ✅ Review code before committing
- ✅ Check `.gitignore` before pushing

---

## 📝 Code Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` type - use proper types
- Add JSDoc comments for complex functions
- Follow existing code patterns

### Code Style

- Follow existing formatting
- Use meaningful variable names
- Keep functions small and focused
- Extract reusable logic to utilities

### Testing

- Write tests for new features
- Ensure tests pass before committing
- Update tests when changing functionality

---

## 🐛 Reporting Issues

### Bug Reports

Include:
- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
- Screenshots (if applicable)

### Feature Requests

Include:
- Description of the feature
- Use case and benefits
- Proposed implementation (if any)
- Related issues (if any)

---

## 🔄 Pull Request Process

### Before Submitting:

1. **Update Documentation**
   - Update README if needed
   - Add/update code comments
   - Update CHANGELOG.md

2. **Run Tests**
   ```bash
   npm test
   ```

3. **Check Code Quality**
   ```bash
   npm run lint
   npm run format:check
   ```

4. **Verify Security**
   - No secrets in code
   - No hardcoded credentials
   - Environment variables used

### Pull Request Template:

- [ ] Code follows project standards
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No secrets committed
- [ ] Security reviewed
- [ ] Ready for review

---

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Explain business logic decisions
- Update README for new features

### Architecture Documentation

- Update architecture diagrams
- Document new modules
- Update integration guides

---

## ✅ Review Process

### What We Look For:

- **Functionality**: Does it work as intended?
- **Security**: No secrets, proper validation
- **Code Quality**: Clean, maintainable code
- **Documentation**: Well-documented
- **Testing**: Adequate test coverage
- **Performance**: No performance regressions

### Review Timeline:

- **Initial Review**: Within 24-48 hours
- **Feedback**: Provided promptly
- **Approval**: After all concerns addressed

---

## 🎉 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Recognized in project documentation

---

## 📞 Questions?

- **Documentation**: Check `docs/` directory
- **Security**: See `SECURITY.md`
- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions

---

**Thank you for contributing to BlueDXP Platform!** 🚀
