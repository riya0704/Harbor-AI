import { NextResponse } from 'next/server';

export enum ErrorCode {
  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Social Media API Errors
  SOCIAL_API_ERROR = 'SOCIAL_API_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  PLATFORM_ERROR = 'PLATFORM_ERROR',
  
  // Content Errors
  CONTENT_TOO_LONG = 'CONTENT_TOO_LONG',
  INVALID_MEDIA = 'INVALID_MEDIA',
  CONTENT_POLICY_VIOLATION = 'CONTENT_POLICY_VIOLATION',
  
  // Scheduling Errors
  INVALID_SCHEDULE_TIME = 'INVALID_SCHEDULE_TIME',
  SCHEDULE_CONFLICT = 'SCHEDULE_CONFLICT',
  POST_NOT_FOUND = 'POST_NOT_FOUND',
  
  // AI Errors
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  CONTEXT_INCOMPLETE = 'CONTEXT_INCOMPLETE',
  GENERATION_FAILED = 'GENERATION_FAILED',
  
  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  
  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Business Logic Errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED'
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: any;
  retryable: boolean;
  userMessage?: string;
  suggestions?: string[];
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly details?: any;
  public readonly userMessage?: string;
  public readonly suggestions?: string[];
  public readonly timestamp: Date;
  public readonly requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    retryable: boolean = false,
    details?: any,
    userMessage?: string,
    suggestions?: string[]
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.details = details;
    this.userMessage = userMessage;
    this.suggestions = suggestions;
    this.timestamp = new Date();
    
    // Capture stack trace
    Error.captureStackTrace(this, AppError);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.userMessage || this.message,
        details: this.details,
        retryable: this.retryable,
        suggestions: this.suggestions
      },
      timestamp: this.timestamp.toISOString(),
      requestId: this.requestId
    };
  }

  toResponse(): NextResponse {
    return NextResponse.json(this.toJSON(), { status: this.statusCode });
  }
}

// Predefined error creators
export const ErrorFactory = {
  // Authentication Errors
  unauthorized: (message = 'Authentication required') =>
    new AppError(
      ErrorCode.UNAUTHORIZED,
      message,
      401,
      false,
      undefined,
      'Please log in to access this feature',
      ['Check your login credentials', 'Try logging in again']
    ),

  invalidToken: (message = 'Invalid or expired token') =>
    new AppError(
      ErrorCode.INVALID_TOKEN,
      message,
      401,
      false,
      undefined,
      'Your session has expired',
      ['Please log in again', 'Clear your browser cache']
    ),

  // Validation Errors
  validationError: (details: any, message = 'Validation failed') =>
    new AppError(
      ErrorCode.VALIDATION_ERROR,
      message,
      400,
      false,
      details,
      'Please check your input and try again',
      ['Review the highlighted fields', 'Ensure all required fields are filled']
    ),

  missingField: (field: string) =>
    new AppError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      `Missing required field: ${field}`,
      400,
      false,
      { field },
      `${field} is required`,
      [`Please provide a value for ${field}`]
    ),

  // Social Media Errors
  socialApiError: (platform: string, originalError: any) =>
    new AppError(
      ErrorCode.SOCIAL_API_ERROR,
      `${platform} API error: ${originalError.message}`,
      502,
      true,
      { platform, originalError },
      `Unable to connect to ${platform}`,
      [
        `Check your ${platform} account connection`,
        'Try reconnecting your account',
        'Contact support if the issue persists'
      ]
    ),

  rateLimit: (platform: string, resetTime?: Date) =>
    new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded for ${platform}`,
      429,
      true,
      { platform, resetTime },
      `Too many requests to ${platform}`,
      [
        'Wait a few minutes before trying again',
        'Consider scheduling posts with more time between them'
      ]
    ),

  // Content Errors
  contentTooLong: (platform: string, maxLength: number, currentLength: number) =>
    new AppError(
      ErrorCode.CONTENT_TOO_LONG,
      `Content exceeds ${platform} limit of ${maxLength} characters`,
      400,
      false,
      { platform, maxLength, currentLength },
      `Your post is too long for ${platform}`,
      [
        `Reduce content to ${maxLength} characters or less`,
        'Consider splitting into multiple posts',
        'Use abbreviations or remove unnecessary words'
      ]
    ),

  // Scheduling Errors
  invalidScheduleTime: (message = 'Invalid schedule time') =>
    new AppError(
      ErrorCode.INVALID_SCHEDULE_TIME,
      message,
      400,
      false,
      undefined,
      'Please select a valid future date and time',
      ['Choose a time at least 5 minutes in the future', 'Check your timezone settings']
    ),

  postNotFound: (postId: string) =>
    new AppError(
      ErrorCode.POST_NOT_FOUND,
      `Post not found: ${postId}`,
      404,
      false,
      { postId },
      'The requested post could not be found',
      ['Check if the post was deleted', 'Refresh the page and try again']
    ),

  // AI Errors
  aiServiceError: (originalError: any) =>
    new AppError(
      ErrorCode.AI_SERVICE_ERROR,
      `AI service error: ${originalError.message}`,
      502,
      true,
      { originalError },
      'AI service is temporarily unavailable',
      ['Try again in a few moments', 'Use manual content creation as an alternative']
    ),

  contextIncomplete: () =>
    new AppError(
      ErrorCode.CONTEXT_INCOMPLETE,
      'Business context is incomplete',
      400,
      false,
      undefined,
      'Please complete your business setup first',
      ['Go to AI Assistant to set up your business context', 'Provide more information about your business']
    ),

  // Database Errors
  databaseError: (originalError: any) =>
    new AppError(
      ErrorCode.DATABASE_ERROR,
      `Database error: ${originalError.message}`,
      500,
      true,
      { originalError },
      'A temporary system error occurred',
      ['Please try again', 'Contact support if the issue persists']
    ),

  recordNotFound: (resource: string, id: string) =>
    new AppError(
      ErrorCode.RECORD_NOT_FOUND,
      `${resource} not found: ${id}`,
      404,
      false,
      { resource, id },
      `The requested ${resource.toLowerCase()} was not found`,
      ['Check if the item was deleted', 'Refresh the page']
    ),

  // System Errors
  internalError: (originalError?: any) =>
    new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Internal server error',
      500,
      true,
      { originalError },
      'An unexpected error occurred',
      ['Please try again', 'Contact support if the issue continues']
    ),

  serviceUnavailable: (service: string) =>
    new AppError(
      ErrorCode.SERVICE_UNAVAILABLE,
      `${service} service is unavailable`,
      503,
      true,
      { service },
      `${service} is temporarily unavailable`,
      ['Please try again later', 'Check system status page']
    )
};

// Error handler middleware
export function handleError(error: unknown): AppError {
  // If it's already an AppError, return as is
  if (error instanceof AppError) {
    return error;
  }

  // Handle specific error types
  if (error instanceof Error) {
    // MongoDB/Mongoose errors
    if (error.name === 'ValidationError') {
      return ErrorFactory.validationError(error.message);
    }
    
    if (error.name === 'CastError') {
      return ErrorFactory.validationError('Invalid ID format');
    }
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return ErrorFactory.databaseError(error);
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return ErrorFactory.invalidToken();
    }
    
    if (error.name === 'TokenExpiredError') {
      return ErrorFactory.invalidToken('Token has expired');
    }

    // Network errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      return ErrorFactory.serviceUnavailable('External service');
    }

    // Generic error
    return ErrorFactory.internalError(error);
  }

  // Unknown error type
  return ErrorFactory.internalError({ unknownError: error });
}

// Response helper
export function errorResponse(error: unknown): NextResponse {
  const appError = handleError(error);
  return appError.toResponse();
}