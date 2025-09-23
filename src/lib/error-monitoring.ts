import { log } from './logger';

export interface ErrorReport {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context: {
    userId?: string;
    requestId?: string;
    url?: string;
    userAgent?: string;
    component?: string;
    action?: string;
  };
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByComponent: Record<string, number>;
  recentErrors: ErrorReport[];
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurred: string;
  }>;
}

class ErrorMonitoring {
  private static instance: ErrorMonitoring;
  private errorReports: Map<string, ErrorReport> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private maxReports = 1000;

  public static getInstance(): ErrorMonitoring {
    if (!ErrorMonitoring.instance) {
      ErrorMonitoring.instance = new ErrorMonitoring();
    }
    return ErrorMonitoring.instance;
  }

  // Report an error
  reportError(
    error: Error,
    context: Partial<ErrorReport['context']> = {},
    metadata?: Record<string, any>
  ): string {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();

    const errorReport: ErrorReport = {
      id: errorId,
      timestamp,
      level: 'error',
      message: error.message,
      stack: error.stack,
      context: {
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        ...context
      },
      metadata,
      resolved: false
    };

    // Store the error report
    this.errorReports.set(errorId, errorReport);
    
    // Update error counts
    const errorKey = this.getErrorKey(error);
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Clean up old reports if we exceed the limit
    if (this.errorReports.size > this.maxReports) {
      this.cleanupOldReports();
    }

    // Log the error
    log.error(
      `Error reported: ${error.message}`,
      error,
      context.component || 'ErrorMonitoring',
      { errorId, ...metadata },
      context.userId,
      context.requestId
    );

    // Send to external monitoring service if configured
    this.sendToExternalService(errorReport);

    return errorId;
  }

  // Report a warning
  reportWarning(
    message: string,
    context: Partial<ErrorReport['context']> = {},
    metadata?: Record<string, any>
  ): string {
    const warningId = this.generateErrorId();
    const timestamp = new Date().toISOString();

    const warningReport: ErrorReport = {
      id: warningId,
      timestamp,
      level: 'warning',
      message,
      context: {
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        ...context
      },
      metadata,
      resolved: false
    };

    this.errorReports.set(warningId, warningReport);

    log.warn(
      `Warning reported: ${message}`,
      context.component || 'ErrorMonitoring',
      { warningId, ...metadata },
      context.userId,
      context.requestId
    );

    return warningId;
  }

  // Mark an error as resolved
  resolveError(errorId: string, resolvedBy?: string): boolean {
    const errorReport = this.errorReports.get(errorId);
    if (!errorReport) {
      return false;
    }

    errorReport.resolved = true;
    errorReport.resolvedAt = new Date().toISOString();
    errorReport.resolvedBy = resolvedBy;

    log.info(
      `Error resolved: ${errorReport.message}`,
      'ErrorMonitoring',
      { errorId, resolvedBy }
    );

    return true;
  }

  // Get error statistics
  getErrorStats(timeRange?: { start: Date; end: Date }): ErrorStats {
    let reports = Array.from(this.errorReports.values());

    // Filter by time range if provided
    if (timeRange) {
      reports = reports.filter(report => {
        const reportTime = new Date(report.timestamp);
        return reportTime >= timeRange.start && reportTime <= timeRange.end;
      });
    }

    // Calculate statistics
    const totalErrors = reports.filter(r => r.level === 'error').length;
    
    const errorsByType: Record<string, number> = {};
    const errorsByComponent: Record<string, number> = {};
    const messageCounts: Map<string, { count: number; lastOccurred: string }> = new Map();

    reports.forEach(report => {
      // Count by type (error/warning)
      errorsByType[report.level] = (errorsByType[report.level] || 0) + 1;

      // Count by component
      if (report.context.component) {
        errorsByComponent[report.context.component] = 
          (errorsByComponent[report.context.component] || 0) + 1;
      }

      // Count by message for top errors
      const existing = messageCounts.get(report.message);
      if (existing) {
        existing.count++;
        if (report.timestamp > existing.lastOccurred) {
          existing.lastOccurred = report.timestamp;
        }
      } else {
        messageCounts.set(report.message, {
          count: 1,
          lastOccurred: report.timestamp
        });
      }
    });

    // Get top errors
    const topErrors = Array.from(messageCounts.entries())
      .map(([message, data]) => ({
        message,
        count: data.count,
        lastOccurred: data.lastOccurred
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get recent errors
    const recentErrors = reports
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return {
      totalErrors,
      errorsByType,
      errorsByComponent,
      recentErrors,
      topErrors
    };
  }

  // Get specific error report
  getErrorReport(errorId: string): ErrorReport | undefined {
    return this.errorReports.get(errorId);
  }

  // Get all unresolved errors
  getUnresolvedErrors(): ErrorReport[] {
    return Array.from(this.errorReports.values())
      .filter(report => !report.resolved)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Search errors by criteria
  searchErrors(criteria: {
    message?: string;
    component?: string;
    userId?: string;
    level?: 'error' | 'warning' | 'info';
    resolved?: boolean;
  }): ErrorReport[] {
    return Array.from(this.errorReports.values()).filter(report => {
      if (criteria.message && !report.message.toLowerCase().includes(criteria.message.toLowerCase())) {
        return false;
      }
      if (criteria.component && report.context.component !== criteria.component) {
        return false;
      }
      if (criteria.userId && report.context.userId !== criteria.userId) {
        return false;
      }
      if (criteria.level && report.level !== criteria.level) {
        return false;
      }
      if (criteria.resolved !== undefined && report.resolved !== criteria.resolved) {
        return false;
      }
      return true;
    });
  }

  // Clear all error reports
  clearErrors(): void {
    this.errorReports.clear();
    this.errorCounts.clear();
    log.info('All error reports cleared', 'ErrorMonitoring');
  }

  // Export error reports for analysis
  exportErrors(format: 'json' | 'csv' = 'json'): string {
    const reports = Array.from(this.errorReports.values());
    
    if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'Level', 'Message', 'Component', 'User ID', 'Resolved'];
      const rows = reports.map(report => [
        report.id,
        report.timestamp,
        report.level,
        report.message.replace(/,/g, ';'), // Escape commas
        report.context.component || '',
        report.context.userId || '',
        report.resolved ? 'Yes' : 'No'
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(reports, null, 2);
  }

  // Private helper methods
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getErrorKey(error: Error): string {
    // Create a key based on error type and message for counting
    return `${error.name}:${error.message}`;
  }

  private cleanupOldReports(): void {
    const reports = Array.from(this.errorReports.entries())
      .sort(([, a], [, b]) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Remove oldest 20% of reports
    const toRemove = Math.floor(reports.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.errorReports.delete(reports[i][0]);
    }
  }

  private async sendToExternalService(errorReport: ErrorReport): Promise<void> {
    // Only send in production and if endpoint is configured
    if (process.env.NODE_ENV !== 'production' || !process.env.ERROR_REPORTING_ENDPOINT) {
      return;
    }

    try {
      await fetch(process.env.ERROR_REPORTING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ERROR_REPORTING_TOKEN}`
        },
        body: JSON.stringify(errorReport)
      });
    } catch (error) {
      // Silently fail external reporting to avoid infinite loops
      console.error('Failed to send error to external service:', error);
    }
  }
}

// Global error handlers
if (typeof window !== 'undefined') {
  const errorMonitoring = ErrorMonitoring.getInstance();

  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    errorMonitoring.reportError(
      new Error(event.message),
      {
        component: 'GlobalErrorHandler',
        url: event.filename,
      },
      {
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }
    );
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    errorMonitoring.reportError(
      error,
      {
        component: 'UnhandledPromiseRejection'
      }
    );
  });
}

// Export singleton instance and convenience functions
const errorMonitoring = ErrorMonitoring.getInstance();

export default errorMonitoring;

export const reportError = (
  error: Error,
  context?: Partial<ErrorReport['context']>,
  metadata?: Record<string, any>
) => errorMonitoring.reportError(error, context, metadata);

export const reportWarning = (
  message: string,
  context?: Partial<ErrorReport['context']>,
  metadata?: Record<string, any>
) => errorMonitoring.reportWarning(message, context, metadata);

export const resolveError = (errorId: string, resolvedBy?: string) =>
  errorMonitoring.resolveError(errorId, resolvedBy);

export const getErrorStats = (timeRange?: { start: Date; end: Date }) =>
  errorMonitoring.getErrorStats(timeRange);