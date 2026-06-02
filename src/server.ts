import app from './app';
import { ENV } from '#configs/environment';
import { connectDB } from '#configs/database';

const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Start Express
    const server = app.listen(ENV.PORT, () => {
      console.log(`🚀 Server running on port ${ENV.PORT}`);
      console.log(`🔧 Environment: ${ENV.NODE_ENV}`);
      console.log(`📖 Swagger API Docs: http://localhost:${ENV.PORT}/api-docs`);
    });

    // 3. Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // 4. Unhandled errors
    process.on('unhandledRejection', (err: Error) => {
      console.error('❌ Unhandled Rejection:', err.message);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err: Error) => {
      console.error('❌ Uncaught Exception:', err.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
