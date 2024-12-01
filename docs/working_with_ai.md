# Working with AI on the Nostr Relay Project

## Best Practices for AI-Human Collaboration

### Setup and Environment

1. **IDE Configuration**
   - Keep your IDE open during the entire session
   - Enable TypeScript error checking
   - Watch the Problems panel for immediate feedback
   - Keep relevant files open for context

2. **Terminal Access**
   - Always have a terminal window ready
   - Run `npm run build` before commits to catch compilation errors
   - Keep deployment terminal accessible for quick server updates

### Development Workflow

1. **Iterative Development**
   - Make small, focused changes
   - Commit frequently with descriptive messages
   - Test changes locally before deployment
   - Monitor logs after deployment

2. **Error Handling**
   - Address TypeScript errors immediately
   - Check build errors before committing
   - Review deployment logs for runtime issues
   - Share error messages with AI for faster debugging

3. **Code Quality**
   - Run linter checks regularly
   - Review AI-suggested changes before committing
   - Ensure type safety in TypeScript
   - Maintain consistent code style

### Communication Tips

1. **Sharing Context**
   - Share relevant error messages
   - Provide log outputs
   - Mention any related files or components
   - Describe what you're seeing in the UI/client

2. **Effective Requests**
   - Be specific about what you want to achieve
   - Share your thoughts and concerns
   - Ask for clarification when needed
   - Provide feedback on suggested solutions

### Deployment Process

1. **Pre-Deployment**
   - Build locally: `npm run build`
   - Check for TypeScript errors
   - Review changes in source control
   - Run tests if available

2. **Deployment**
   - Use the deployment script: `./deploy.sh`
   - Monitor deployment logs
   - Check server status after deployment
   - Verify changes in production

3. **Post-Deployment**
   - Monitor application logs
   - Test functionality
   - Share results with AI
   - Address any issues immediately

### Version Control

1. **Git Best Practices**
   - Make atomic commits (one logical change per commit)
   - Use descriptive commit messages
   - Push changes promptly
   - Keep feature branches up to date

2. **Code Review**
   - Review AI-suggested changes carefully
   - Check for unintended side effects
   - Ensure proper error handling
   - Verify type safety

### Documentation

1. **Code Documentation**
   - Document significant changes
   - Update README when needed
   - Keep API documentation current
   - Document configuration changes

2. **Problem Solving**
   - Document solutions to complex problems
   - Note any workarounds implemented
   - Keep track of known issues
   - Document deployment-specific details

## Tips for Success

1. **Be Proactive**
   - Check for errors frequently
   - Address issues as they arise
   - Keep the AI informed of your observations
   - Share both successes and failures

2. **Stay Organized**
   - Keep related files open
   - Use clear naming conventions
   - Maintain a clean working directory
   - Document important decisions

3. **Maintain Context**
   - Keep track of the current task
   - Reference previous changes when relevant
   - Share the bigger picture with AI
   - Document complex workflows

4. **Continuous Improvement**
   - Learn from each interaction
   - Document effective patterns
   - Share feedback with the AI
   - Refine the collaboration process

Remember that AI is a powerful tool but works best with human oversight and validation. Regular checking of types, builds, and runtime behavior helps catch issues early and ensures high-quality code output.
