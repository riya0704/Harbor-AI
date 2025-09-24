import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { handleError, AppError } from './error-handler';
import { log } from './logger';
import { verifyToken } from './auth';

export interface RequestContext {
  requestId: string;
  userId?: string;
  startTime: number;
  method: string;
  url: string;
}

// Request ID middleware
export function withRequestId(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    // Add request ID to headers for client tracking
    const response = await handler(request, ...args);
    
    if (response instanceof NextResponse) {
      response.headers.set('X-Request-ID', requestId);
    }
    
    return response;
  };
}

// Logging middleware
export function withLogging(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;
    
    // Extract user ID from token if available
    let userId: string | undefined;
    try {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.split(' ')[1];
      if (token) {
        const decoded = verifyToken(token);
        userId = decoded?.userId;
      }
    } catch (error) {
      // Ignore token errors in logging middleware
    }

    // Log incoming request
    log.apiRequest(method, url, userId, requestId, {
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });

    try {
      const response = await handler(request, ...args);
      const duration = Date.now() - startTime;
      
      // Log successful response
      const statusCode = response instanceof NextResponse ? response.status : 200;
      log.apiResponse(method, url, statusCode, duration, userId, requestId);
      
      // Add request ID to response headers
      if (response instanceof NextResponse) {
        response.headers.set('X-Request-ID', requestId);
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error
      log.error(
        `API Error: ${method} ${url}`,
        error instanceof Error ? error : new Error(String(error)),
        'API',
        { method, url, duration },
        userId,
        requestId
      );
      
      // Handle and return error response
      const appError = handleError(error);
      const errorResponse = appError.toResponse();
      errorResponse.headers.set('X-Request-ID', requestId);
      
      return errorResponse;
    }
  };
}

// Enhanced auth middleware with logging
export function withAuthAndLogging(handler: Function) {
  return withLogging(async (request: NextRequest, ...args: any[]) => {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      throw new AppError(
        'UNAUTHORIZED' as any,
        'Authentication required',
        401,
        false,
        undefined,
        'Please log in to access this feature'
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AppError(
        'INVALID_TOKEN' as any,
        'Invalid or expired token',
        401,
        false,
        undefined,
        'Your session has expired. Please log in again.'
      );
    }

    // Add user context to request
    const authenticatedRequest = request as any;
    authenticatedRequest.user = { userId: decoded.userId };
    authenticatedRequest.requestContext = {
      userId: decoded.userId,
      requestId: uuidv4(),
      startTime: Date.now()
    };

    return handler(authenticatedRequest, ...args);
  });
}

// Rate limiting middleware
export function withRateLimit(
  windowMs: number = 60000, // 1 minute
  maxRequests: number = 100
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return function(handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean up old entries
      for (const [key, value] of requests.entries()) {
        if (value.resetTime < now) {
          requests.delete(key);
        }
      }
      
      // Check current request count
      const current = requests.get(ip);
      if (current && current.count >= maxRequests) {
        log.warn(
          `Rate limit exceeded for IP: ${ip}`,
          'RateLimit',
          { ip, count: current.count, maxRequests }
        );
        
        throw new AppError(
          'RATE_LIMIT_EXCEEDED' as any,
          'Too many requests',
          429,
          true,
          { resetTime: new Date(current.resetTime) },
          'Too many requests. Please try again later.'
        );
      }
      
      // Update request count
      if (current) {
        current.count++;
      } else {
        requests.set(ip, { count: 1, resetTime: now + windowMs });
      }
      
      return handler(request, ...args);
    };
  };
}

// Validation middleware
export function withValidation<T>(
  schema: any, // Zod schema or custom validator
  source: 'body' | 'query' | 'params' = 'body'
) {
  return function(handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
      try {
        let data: any;
        
        switch (source) {
          case 'body':
            data = await request.json();
            break;
          case 'query':
            data = Object.fromEntries(new URL(request.url).searchParams);
            break;
          case 'params':
            // Extract from args (route params)
            data = args[0]?.params || {};
            break;
        }
        
        // Validate using Zod schema
        if (schema.parse) {
          const validatedData = schema.parse(data);
          (request as any).validatedData = validatedData;
        }
        
        return handler(request, ...args);
      } catch (error) {
        log.warn(
          `Validation failed for ${source}`,
          'Validation',
          { source, error: error.message }
        );
        
        throw new AppError(
          'VALIDATION_ERROR' as any,
          'Validation failed',
          400,
          false,
          error,
          'Please check your input and try again'
        );
      }
    };
  };
}

// Performance monitoring middleware
export function withPerformanceMonitoring(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    const method = request.method;
    const url = new URL(request.url).pathname;
    
    try {
      const response = await handler(request, ...args);
      const duration = Date.now() - startTime;
      
      // Log slow requests
      if (duration > 5000) { // 5 seconds
        log.warn(
          `Slow request detected: ${method} ${url} took ${duration}ms`,
          'Performance',
          { method, url, duration }
        );
      }
      
      // Add performance headers
      if (response instanceof NextResponse) {
        response.headers.set('X-Response-Time', `${duration}ms`);
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error(
        `Request failed: ${method} ${url} after ${duration}ms`,
        error instanceof Error ? error : new Error(String(error)),
        'Performance',
        { method, url, duration }
      );
      throw error;
    }
  };
}

// Combine multiple middlewares
export function withMiddleware(...middlewares: Array<(handler: Function) => Function>) {
  return function(handler: Function) {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

// Common middleware combinations
export const withStandardMiddleware = withMiddleware(
  withPerformanceMonitoring,
  withLogging,
  withRequestId
);

export const withAuthMiddleware = withMiddleware(
  withPerformanceMonitoring,
  withAuthAndLogging,
  withRequestId
);

export const withRateLimitedAuth = withMiddleware(
  withPerformanceMonitoring,
  withRateLimit(60000, 100), // 100 requests per minute
  withAuthAndLogging,
  withRequestId
);

// Error boundary factory (returns component class, not JSX)
export function createErrorBoundary<T extends Record<string, any>>(
  Component: any
) {
  return class ErrorBoundaryWrapper extends Error {
    static displayName = `ErrorBoundary(${Component.displayName || Component.name})`;
    
    static wrap(props: T) {
      try {
        return Component(props);
      } catch (error) {
        log.error(
          'Component error boundary triggered',
          error instanceof Error ? error : new Error(String(error)),
          'UI'
        );
        
        // Return error state object instead of JSX
        return {
          error: true,
          message: 'Something went wrong. Please refresh the page or try again later.'
        };
      }
    }
  };
}