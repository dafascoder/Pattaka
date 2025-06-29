import { registerGlobalMiddleware } from '@tanstack/react-start'
import { authMiddleware } from './lib/auth-middleware'

// Register global middleware that runs for all server functions
registerGlobalMiddleware({
  middleware: [authMiddleware],
}) 