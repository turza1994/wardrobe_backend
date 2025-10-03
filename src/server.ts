import app from './app';
import { env, validateEnv } from './config/env';

async function startServer() {
  try {
    validateEnv();

    const PORT = env.PORT;
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📦 Environment: ${env.NODE_ENV}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
