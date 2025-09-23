import { NextRequest, NextResponse } from 'next/server';
import { withAuthMiddleware } from '@/lib/api-middleware';
import errorMonitoring, { getErrorStats } from '@/lib/error-monitoring';
import { log } from '@/lib/logger';

// Get error statistics and reports
async function getErrors(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange');
    const component = searchParams.get('component');
    const level = searchParams.get('level') as 'error' | 'warning' | 'info' | undefined;
    const resolved = searchParams.get('resolved');
    const export_format = searchParams.get('export');

    // Build time range filter
    let dateRange: { start: Date; end: Date } | undefined;
    if (timeRange) {
      const now = new Date();
      const hours = parseInt(timeRange);
      if (!isNaN(hours)) {
        dateRange = {
          start: new Date(now.getTime() - hours * 60 * 60 * 1000),
          end: now
        };
      }
    }

    // Get error statistics
    const stats = getErrorStats(dateRange);

    // Search for specific errors if filters are provided
    let filteredErrors = errorMonitoring.getUnresolvedErrors();
    if (component || level || resolved !== null) {
      filteredErrors = errorMonitoring.searchErrors({
        component: component || undefined,
        level,
        resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined
      });
    }

    // Export functionality
    if (export_format) {
      const exportData = errorMonitoring.exportErrors(export_format as 'json' | 'csv');
      const contentType = export_format === 'csv' ? 'text/csv' : 'application/json';
      const filename = `errors_${new Date().toISOString().split('T')[0]}.${export_format}`;
      
      return new NextResponse(exportData, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    // Log admin access
    log.info(
      'Admin accessed error monitoring',
      'Admin',
      { timeRange, component, level, resolved },
      (request as any).user?.userId
    );

    return NextResponse.json({
      stats,
      errors: filteredErrors.slice(0, 100), // Limit to 100 most recent
      filters: {
        timeRange,
        component,
        level,
        resolved
      }
    });

  } catch (error) {
    log.error(
      'Error fetching error monitoring data',
      error instanceof Error ? error : new Error(String(error)),
      'Admin'
    );
    
    return NextResponse.json(
      { error: 'Failed to fetch error data' },
      { status: 500 }
    );
  }
}

// Resolve an error
async function resolveError(request: NextRequest) {
  try {
    const body = await request.json();
    const { errorId, resolvedBy } = body;

    if (!errorId) {
      return NextResponse.json(
        { error: 'Error ID is required' },
        { status: 400 }
      );
    }

    const success = errorMonitoring.resolveError(errorId, resolvedBy);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Error not found' },
        { status: 404 }
      );
    }

    log.info(
      `Error resolved by admin: ${errorId}`,
      'Admin',
      { errorId, resolvedBy },
      (request as any).user?.userId
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    log.error(
      'Error resolving error report',
      error instanceof Error ? error : new Error(String(error)),
      'Admin'
    );
    
    return NextResponse.json(
      { error: 'Failed to resolve error' },
      { status: 500 }
    );
  }
}

// Clear all errors (admin only)
async function clearErrors(request: NextRequest) {
  try {
    errorMonitoring.clearErrors();
    
    log.info(
      'All errors cleared by admin',
      'Admin',
      {},
      (request as any).user?.userId
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    log.error(
      'Error clearing error reports',
      error instanceof Error ? error : new Error(String(error)),
      'Admin'
    );
    
    return NextResponse.json(
      { error: 'Failed to clear errors' },
      { status: 500 }
    );
  }
}

export const GET = withAuthMiddleware(getErrors);
export const POST = withAuthMiddleware(resolveError);
export const DELETE = withAuthMiddleware(clearErrors);