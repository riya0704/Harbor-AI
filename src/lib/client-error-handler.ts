import { toast } from '@/hooks/use-toast';

export interface ClientError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  suggestions?: string[];
}

export interface ErrorResponse {
  error: ClientError;
  timestamp: string;
  requestId?: string;
}

// Client-side error handler
export class ClientErrorHandler {
  private static instance: ClientErrorHandler;
  
  public static getInstance(): ClientErrorHandler {
    if (!ClientErrorHandler.instance) {
      ClientErrorHandler.instance = new ClientErrorHandler();
    }
    return ClientErrorHandler.instance;
  }

  // Handle API response errors
  async handleApiError(response: Response): Promise<never> {
    let errorData: ErrorResponse;
    
    try {
      errorData = await response.json();
    } catch (parseError) {
      // If we can't parse the error response, create a generic error
      errorData = {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred',
          retryable: true
        },
        timestamp: new Date().toISOString()
      };
    }

    // Show user-friendly toast notification
    this.showErrorToast(errorData.error);
    
    // Log error for debugging
    console.error('API Error:', {
      status: response.status,
      url: response.url,
      error: errorData,
      requestId: response.headers.get('X-Request-ID')
    });

    // Throw error for component handling
    throw new Error(errorData.error.message);
  }

  // Handle network errors
  handleNetworkError(error: Error): void {
    const networkError: ClientError = {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed',
      retryable: true,
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Contact support if the issue persists'
      ]
    };

    this.showErrorToast(networkError);
    console.error('Network Error:', error);
  }

  // Handle validation errors
  handleValidationError(errors: Record<string, string[]>): void {
    const validationError: ClientError = {
      code: 'VALIDATION_ERROR',
      message: 'Please check your input',
      details: errors,
      retryable: false,
      suggestions: ['Review the highlighted fields', 'Ensure all required fields are filled']
    };

    // Show specific field errors
    Object.entries(errors).forEach(([field, messages]) => {
      messages.forEach(message => {
        toast({
          title: `${field} Error`,
          description: message,
          variant: 'destructive'
        });
      });
    });

    console.error('Validation Error:', errors);
  }

  // Handle authentication errors
  handleAuthError(): void {
    const authError: ClientError = {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      retryable: false,
      suggestions: ['Please log in again', 'Check your credentials']
    };

    this.showErrorToast(authError);
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }

  // Show user-friendly error toast
  private showErrorToast(error: ClientError): void {
    const title = this.getErrorTitle(error.code);
    const description = error.message;
    
    toast({
      title,
      description,
      variant: 'destructive',
      action: error.retryable ? {
        altText: 'Retry',
        onClick: () => window.location.reload()
      } : undefined
    });

    // Show suggestions if available
    if (error.suggestions && error.suggestions.length > 0) {
      setTimeout(() => {
        toast({
          title: 'Suggestions',
          description: error.suggestions!.join(' • '),
          variant: 'default'
        });
      }, 2000);
    }
  }

  // Get user-friendly error titles
  private getErrorTitle(code: string): string {
    const titles: Record<string, string> = {
      'UNAUTHORIZED': 'Authentication Required',
      'VALIDATION_ERROR': 'Invalid Input',
      'NETWORK_ERROR': 'Connection Error',
      'RATE_LIMIT_EXCEEDED': 'Too Many Requests',
      'SOCIAL_API_ERROR': 'Social Media Error',
      'AI_SERVICE_ERROR': 'AI Service Error',
      'CONTENT_TOO_LONG': 'Content Too Long',
      'INVALID_SCHEDULE_TIME': 'Invalid Schedule Time',
      'POST_NOT_FOUND': 'Post Not Found',
      'DATABASE_ERROR': 'System Error',
      'INTERNAL_SERVER_ERROR': 'Server Error',
      'SERVICE_UNAVAILABLE': 'Service Unavailable'
    };

    return titles[code] || 'Error';
  }

  // Retry mechanism for retryable errors
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        console.log(`Retry attempt ${attempt} failed, retrying in ${waitTime}ms...`);
      }
    }

    throw lastError!;
  }
}

// Convenience functions
const errorHandler = ClientErrorHandler.getInstance();

export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    await errorHandler.handleApiError(response);
  }
  return response;
};

export const handleNetworkError = (error: Error) => {
  errorHandler.handleNetworkError(error);
};

export const handleValidationError = (errors: Record<string, string[]>) => {
  errorHandler.handleValidationError(errors);
};

export const handleAuthError = () => {
  errorHandler.handleAuthError();
};

export const withRetry = <T>(
  operation: () => Promise<T>,
  maxRetries?: number,
  delay?: number
) => {
  return errorHandler.withRetry(operation, maxRetries, delay);
};

// API client with error handling
export const apiClient = {
  async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('authToken');
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, defaultOptions);
      await handleApiResponse(response);
      
      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return {} as T;
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        handleNetworkError(error);
      }
      throw error;
    }
  },

  async get<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  },

  async post<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  async put<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
};

// React hook for error handling
export function useErrorHandler() {
  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        handleAuthError();
      } else if (error.message.includes('Network')) {
        handleNetworkError(error);
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      }
    } else {
      toast({
        title: 'Unknown Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  return { handleError, apiClient, withRetry };
}