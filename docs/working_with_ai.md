# Working with AI on the Nostr Relay Project

## Overview

This guide outlines best practices for collaborating with AI tools in the Nostr Relay project. The goal is to maintain high code quality while leveraging AI assistance effectively.

## Development Environment

### IDE Setup
- Keep your IDE open during the entire session
- Enable TypeScript error checking
- Watch the Problems panel for immediate feedback
- Maintain relevant files open for context

### Terminal Access
- Keep a terminal window ready for commands
- Run `npm run build` before commits
- Keep deployment terminal accessible

## Key Considerations

### Code Quality
- Make small, focused changes
- Run linter checks regularly
- Ensure type safety in TypeScript
- Maintain consistent code style
- Review AI-suggested changes thoroughly

### Version Control
- Make atomic commits (one logical change per commit)
- Use descriptive commit messages
- Push changes promptly
- Keep feature branches up to date
- Save all files before git operations
- Verify successful pushes

### Deployment Process
1. **Pre-Deployment**
   - Build locally: `npm run build`
   - Check for TypeScript errors
   - Review changes in source control

2. **Deployment**
   - Use `./deploy.sh` and modify as needed
   - Monitor deployment logs
   - Verify changes in production

3. **Post-Deployment**
   - Monitor application logs
   - Test functionality
   - Address issues immediately

### Effective AI Collaboration
- Be specific in requests
- Share relevant error messages and logs
- Provide context about related components
- Review AI suggestions before implementing
- Share feedback on solutions
- Document complex solutions and workarounds

### Documentation
- Update documentation for significant changes
- Keep API documentation current
- Document configuration changes
- Note known issues and workarounds

## Best Practices

### Workspace Management
- Close editor tabs after completing edits
- Save files frequently (Cmd+S / Ctrl+S)
- Maintain a clean working directory
- Keep related files accessible

### Problem Solving
- Address issues as they arise
- Monitor logs for runtime issues
- Share both successes and failures with AI
- Document solutions to complex problems

Remember: AI is a powerful tool but works best with human oversight. Regular checking of types, builds, and runtime behavior helps catch issues early and ensures high-quality code output.
