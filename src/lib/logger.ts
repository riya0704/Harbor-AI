export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxLogSize?: number;
}

class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 1000;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      maxLogSize: 10000,
      ...config
    };

    // Set log level from environment
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLevel && envLevel in LogLevel) {
      this.config.level = LogLevel[envLevel as keyof typeof LogLevel];
    }

    // Enable remote logging in production
    if (process.env.NODE_ENV === 'production' && process.env.LOG_ENDPOINT) {
      this.config.enableRemote = true;
      this.config.remoteEndpoint = process.env.LOG_ENDPOINT;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = LogLevel[entry.level].padEnd(5);
    const context = entry.context ? `[${entry.context}]` : '';
    const userId = entry.userId ? `[User:${entry.userId}]` : '';
    const requestId = entry.requestId ? `[Req:${entry.requestId}]` : '';
    
    let message = `${timestamp} ${level} ${context}${userId}${requestId} ${entry.message}`;
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      message += ` | Metadata: ${JSON.stringify(entry.metadata)}`;
    }
    
    if (entry.error) {
      message += ` | Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack && this.config.level >= LogLevel.DEBUG) {
        message += `\nStack: ${entry.error.stack}`;
      }
    }
    
    return message;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    error?: Error,
    userId?: string,
    requestId?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId,
      requestId,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      } : undefined
    };
  }

  private writeLog(entry: LogEntry): void {
    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift(); // Remove oldest entry
    }

    // Console logging
    if (this.config.enableConsole) {
      const formattedMessage = this.formatMessage(entry);
      
      switch (entry.level) {
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
      }
    }

    // Remote logging (async, don't block)
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.sendToRemote(entry).catch(err => {
        console.error('Failed to send log to remote endpoint:', err);
      });
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // Silently fail remote logging to avoid infinite loops
    }
  }

  // Public logging methods
  error(
    message: string,
    error?: Error,
    context?: string,
    metadata?: Record<string, any>,
    userId?: string,
    requestId?: string
  ): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(
      LogLevel.ERROR,
      message,
      context,
      metadata,
      error,
      userId,
      requestId
    );
    
    this.writeLog(entry);
  }

  warn(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    userId?: string,
    requestId?: string
  ): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(
      LogLevel.WARN,
      message,
      context,
      metadata,
      undefined,
      userId,
      requestId
    );
    
    this.writeLog(entry);
  }

  info(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    userId?: string,
    requestId?: string
  ): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(
      LogLevel.INFO,
      message,
      context,
      metadata,
      undefined,
      userId,
      requestId
    );
    
    this.writeLog(entry);
  }

  debug(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    userId?: string,
    requestId?: string
  ): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(
      LogLevel.DEBUG,
      message,
      context,
      metadata,
      undefined,
      userId,
      requestId
    );
    
    this.writeLog(entry);
  }

  // Specialized logging methods
  apiRequest(
    method: string,
    url: string,
    userId?: string,
    requestId?: string,
    metadata?: Record<string, any>
  ): void {
    this.info(
      `API Request: ${method} ${url}`,
      'API',
      { method, url, ...metadata },
      userId,
      requestId
    );
  }

  apiResponse(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
    requestId?: string
  ): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const message = `API Response: ${method} ${url} - ${statusCode} (${duration}ms)`;
    
    if (level === LogLevel.WARN) {
      this.warn(message, 'API', { method, url, statusCode, duration }, userId, requestId);
    } else {
      this.info(message, 'API', { method, url, statusCode, duration }, userId, requestId);
    }
  }

  socialMediaAction(
    action: string,
    platform: string,
    success: boolean,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    const message = `Social Media ${action}: ${platform} - ${success ? 'Success' : 'Failed'}`;
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    
    if (level === LogLevel.ERROR) {
      this.error(message, undefined, 'SocialMedia', { action, platform, ...metadata }, userId);
    } else {
      this.info(message, 'SocialMedia', { action, platform, ...metadata }, userId);
    }
  }

  aiInteraction(
    action: string,
    success: boolean,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    const message = `AI ${action}: ${success ? 'Success' : 'Failed'}`;
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    
    if (level === LogLevel.ERROR) {
      this.error(message, undefined, 'AI', { action, ...metadata }, userId);
    } else {
      this.info(message, 'AI', { action, ...metadata }, userId);
    }
  }

  schedulerAction(
    action: string,
    postId: string,
    success: boolean,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    const message = `Scheduler ${action}: Post ${postId} - ${success ? 'Success' : 'Failed'}`;
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    
    if (level === LogLevel.ERROR) {
      this.error(message, undefined, 'Scheduler', { action, postId, ...metadata }, userId);
    } else {
      this.info(message, 'Scheduler', { action, postId, ...metadata }, userId);
    }
  }

  // Utility methods
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  getLogsByLevel(level: LogLevel, count: number = 100): LogEntry[] {
    return this.logBuffer
      .filter(entry => entry.level === level)
      .slice(-count);
  }

  getLogsByContext(context: string, count: number = 100): LogEntry[] {
    return this.logBuffer
      .filter(entry => entry.context === context)
      .slice(-count);
  }

  getLogsByUser(userId: string, count: number = 100): LogEntry[] {
    return this.logBuffer
      .filter(entry => entry.userId === userId)
      .slice(-count);
  }

  clearLogs(): void {
    this.logBuffer = [];
  }

  // Performance monitoring
  startTimer(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`Timer ${label}: ${duration}ms`, 'Performance', { label, duration });
      return duration;
    };
  }
}

// Create singleton logger instance
const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production'
});

export default logger;

// Export convenience functions
export const log = {
  error: (message: string, error?: Error, context?: string, metadata?: Record<string, any>, userId?: string, requestId?: string) =>
    logger.error(message, error, context, metadata, userId, requestId),
  
  warn: (message: string, context?: string, metadata?: Record<string, any>, userId?: string, requestId?: string) =>
    logger.warn(message, context, metadata, userId, requestId),
  
  info: (message: string, context?: string, metadata?: Record<string, any>, userId?: string, requestId?: string) =>
    logger.info(message, context, metadata, userId, requestId),
  
  debug: (message: string, context?: string, metadata?: Record<string, any>, userId?: string, requestId?: string) =>
    logger.debug(message, context, metadata, userId, requestId),
  
  apiRequest: (method: string, url: string, userId?: string, requestId?: string, metadata?: Record<string, any>) =>
    logger.apiRequest(method, url, userId, requestId, metadata),
  
  apiResponse: (method: string, url: string, statusCode: number, duration: number, userId?: string, requestId?: string) =>
    logger.apiResponse(method, url, statusCode, duration, userId, requestId),
  
  socialMedia: (action: string, platform: string, success: boolean, userId?: string, metadata?: Record<string, any>) =>
    logger.socialMediaAction(action, platform, success, userId, metadata),
  
  ai: (action: string, success: boolean, userId?: string, metadata?: Record<string, any>) =>
    logger.aiInteraction(action, success, userId, metadata),
  
  scheduler: (action: string, postId: string, success: boolean, userId?: string, metadata?: Record<string, any>) =>
    logger.schedulerAction(action, postId, success, userId, metadata),
  
  timer: (label: string) => logger.startTimer(label)
};