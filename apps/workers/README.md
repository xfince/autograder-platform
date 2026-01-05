# AutoGrader Workers

Background job processors for the AutoGrader Platform using Bull MQ.

## Workers

- **Grading Orchestrator**: Main worker that coordinates the grading pipeline
- **Git Clone**: Clones student repositories from GitHub
- **Test Execution**: Runs unit tests in Docker sandbox
- **Code Analysis**: Analyzes and summarizes code
- **GPT Evaluation**: AI-powered code evaluation with LangSmith
- **Report Generation**: Creates grading reports

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload)
npm run dev

# Build for production
npm run build

# Run production server
npm run start
```

## Configuration

See `.env` file for configuration options.

## Queue Monitoring

Workers use Bull MQ with Redis. You can monitor queues using:

- Bull Board (TODO: Add in future)
- Redis CLI: `redis-cli`
