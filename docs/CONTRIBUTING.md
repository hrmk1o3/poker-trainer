# Contributing to Poker Trainer

Thank you for your interest in contributing to the Poker Trainer project! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/poker-trainer.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### Frontend
```bash
cd frontend
npm install
```

## Code Style

### Python (Backend)
- Follow PEP 8 style guide
- Use type hints where possible
- Run `black` for code formatting: `black .`
- Run `flake8` for linting: `flake8 .`
- Use meaningful variable and function names

### TypeScript/React (Frontend)
- Follow standard TypeScript conventions
- Use functional components with hooks
- Run `npm run lint` before committing
- Use meaningful component and variable names

## Testing

### Backend Tests
```bash
cd backend
source venv/bin/activate
pytest tests/
```

### Frontend Tests (when available)
```bash
cd frontend
npm test
```

## Making Changes

1. **Write tests** for new features or bug fixes
2. **Update documentation** if you change functionality
3. **Test your changes** thoroughly
4. **Commit with clear messages**:
   - Use present tense ("Add feature" not "Added feature")
   - Use imperative mood ("Move cursor to..." not "Moves cursor to...")
   - Limit first line to 72 characters
   - Reference issues: "Fix #123: Description"

## Pull Request Process

1. **Update the README.md** with details of changes if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Update documentation** as necessary
5. **Create a pull request** with a clear title and description

### PR Checklist
- [ ] Code follows the project's style guidelines
- [ ] Tests have been added/updated
- [ ] Documentation has been updated
- [ ] All tests pass
- [ ] No merge conflicts
- [ ] Branch is up to date with main

## Feature Requests

Open an issue with:
- Clear description of the feature
- Use cases and examples
- Why this feature would be useful

## Bug Reports

Open an issue with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Python/Node version)
- Screenshots if applicable

## Areas for Contribution

### High Priority
- [ ] Improve hand evaluation algorithm
- [ ] Advanced AI strategies
- [ ] Mobile responsive design
- [ ] Player statistics and analytics
- [ ] Sound effects and animations

### Medium Priority
- [ ] Multi-table tournaments
- [ ] Hand history replay
- [ ] Chat functionality
- [ ] Customizable avatars
- [ ] Accessibility improvements

### Good First Issues
- [ ] Add more unit tests
- [ ] Improve error messages
- [ ] Update documentation
- [ ] Fix UI/UX issues
- [ ] Add code comments

## Code Review Process

All submissions require review. We use GitHub pull requests for this purpose.

### What We Look For
- Code quality and readability
- Test coverage
- Documentation
- Performance considerations
- Security implications

## Community

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn
- Share knowledge

## Questions?

Feel free to open an issue for any questions or concerns.

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

Thank you for contributing! 🎉
