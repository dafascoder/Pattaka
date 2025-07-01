import { registerGlobalMiddleware } from '@tanstack/react-start'
import { authMiddleware } from './lib/auth-middleware'
import { loggingMiddleware } from './middleware/logging'

// Register global middleware that runs for all server functions
registerGlobalMiddleware({
  middleware: [authMiddleware, loggingMiddleware],
}) 