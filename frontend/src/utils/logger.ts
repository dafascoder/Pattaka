import pino from "pino";

// Create logger instance
const logger = pino({
	level: process.env.NODE_ENV === "production" ? "info" : "debug",
	transport:
		process.env.NODE_ENV === "development"
			? {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "SYS:standard",
						ignore: "pid,hostname",
						singleLine: false,
					},
				}
			: undefined,
	base: {
		env: process.env.NODE_ENV,
	},
});

// Create child loggers for different parts of the application
export const authLogger = logger.child({ module: "auth" });
export const apiLogger = logger.child({ module: "api" });
export const routerLogger = logger.child({ module: "router" });
export const componentLogger = logger.child({ module: "component" });

// Export default logger
export default logger;

// Export log levels for convenience
export const logLevels = {
	fatal: 60,
	error: 50,
	warn: 40,
	info: 30,
	debug: 20,
	trace: 10,
} as const;

// Helper functions for common logging patterns
export const loggers = {
	// API request/response logging
	logApiRequest: (method: string, url: string, data?: any) => {
		apiLogger.info({ method, url, data }, "API Request");
	},

	logApiResponse: (method: string, url: string, status: number, data?: any) => {
		apiLogger.info({ method, url, status, data }, "API Response");
	},

	logApiError: (method: string, url: string, error: any) => {
		apiLogger.error(
			{ method, url, error: error.message || error },
			"API Error"
		);
	},

	// Authentication logging
	logAuthSuccess: (action: string, userId?: string) => {
		authLogger.info({ action, userId }, "Auth Success");
	},

	logAuthError: (action: string, error: any) => {
		authLogger.error({ action, error: error.message || error }, "Auth Error");
	},

	// Component lifecycle logging
	logComponentMount: (componentName: string, props?: any) => {
		componentLogger.debug({ componentName, props }, "Component Mounted");
	},

	logComponentUnmount: (componentName: string) => {
		componentLogger.debug({ componentName }, "Component Unmounted");
	},

	// Router logging
	logRouteChange: (from: string, to: string) => {
		routerLogger.info({ from, to }, "Route Changed");
	},

	logRouteError: (route: string, error: any) => {
		routerLogger.error({ route, error: error.message || error }, "Route Error");
	},
};
