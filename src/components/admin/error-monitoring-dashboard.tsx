'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Download, 
  RefreshCw, 
  Trash2,
  Clock,
  User,
  Code
} from 'lucide-react';
import { format } from 'date-fns';

interface ErrorReport {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context: {
    userId?: string;
    component?: string;
    url?: string;
  };
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface ErrorStats {
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

export function ErrorMonitoringDashboard() {
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24');
  const [levelFilter, setLevelFilter] = useState('all');
  const [componentFilter, setComponentFilter] = useState('all');
  const [resolvedFilter, setResolvedFilter] = useState('unresolved');
  const { toast } = useToast();

  const fetchErrorData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        timeRange,
        ...(levelFilter !== 'all' && { level: levelFilter }),
        ...(componentFilter !== 'all' && { component: componentFilter }),
        ...(resolvedFilter !== 'all' && { resolved: resolvedFilter })
      });

      const response = await fetch(`/api/admin/errors?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setErrors(data.errors);
      } else {
        throw new Error('Failed to fetch error data');
      }
    } catch (error) {
      console.error('Error fetching error data:', error);
      toast({
        title: 'Error',
        description: 'Could not load error monitoring data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchErrorData();
  }, [timeRange, levelFilter, componentFilter, resolvedFilter]);

  const resolveError = async (errorId: string) => {
    try {
      const response = await fetch('/api/admin/errors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          errorId,
          resolvedBy: 'Admin'
        })
      });

      if (response.ok) {
        toast({
          title: 'Error Resolved',
          description: 'The error has been marked as resolved',
        });
        fetchErrorData(); // Refresh data
      } else {
        throw new Error('Failed to resolve error');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not resolve error',
        variant: 'destructive'
      });
    }
  };

  const clearAllErrors = async () => {
    if (!confirm('Are you sure you want to clear all error reports? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/errors', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Errors Cleared',
          description: 'All error reports have been cleared',
        });
        fetchErrorData(); // Refresh data
      } else {
        throw new Error('Failed to clear errors');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not clear errors',
        variant: 'destructive'
      });
    }
  };

  const exportErrors = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams({
        export: format,
        timeRange,
        ...(levelFilter !== 'all' && { level: levelFilter }),
        ...(componentFilter !== 'all' && { component: componentFilter })
      });

      const response = await fetch(`/api/admin/errors?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `errors_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Export Complete',
          description: `Error data exported as ${format.toUpperCase()}`,
        });
      } else {
        throw new Error('Failed to export errors');
      }
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Could not export error data',
        variant: 'destructive'
      });
    }
  };

  const getErrorIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getErrorBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Error Monitoring</h1>
          <p className="text-muted-foreground">Monitor and manage application errors</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => exportErrors('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportErrors('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={fetchErrorData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="destructive" onClick={clearAllErrors}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last Hour</SelectItem>
            <SelectItem value="24">Last 24h</SelectItem>
            <SelectItem value="168">Last Week</SelectItem>
            <SelectItem value="720">Last Month</SelectItem>
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="error">Errors</SelectItem>
            <SelectItem value="warning">Warnings</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>

        <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Errors</p>
                  <p className="text-2xl font-bold">{stats.totalErrors}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Warnings</p>
                  <p className="text-2xl font-bold">{stats.errorsByType.warning || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold">
                    {errors.filter(e => e.resolved).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Code className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Components</p>
                  <p className="text-2xl font-bold">
                    {Object.keys(stats.errorsByComponent).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Details */}
      <Tabs defaultValue="recent" className="w-full">
        <TabsList>
          <TabsTrigger value="recent">Recent Errors</TabsTrigger>
          <TabsTrigger value="top">Top Errors</TabsTrigger>
          <TabsTrigger value="components">By Component</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          {errors.length > 0 ? (
            <div className="space-y-4">
              {errors.map((error) => (
                <Card key={error.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getErrorIcon(error.level)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            {getErrorBadge(error.level)}
                            <span className="text-xs text-gray-500">
                              {format(new Date(error.timestamp), 'MMM d, h:mm a')}
                            </span>
                            {error.resolved && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                Resolved
                              </Badge>
                            )}
                          </div>
                          
                          <p className="font-medium text-gray-900 mb-2">{error.message}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {error.context.component && (
                              <div className="flex items-center space-x-1">
                                <Code className="h-3 w-3" />
                                <span>{error.context.component}</span>
                              </div>
                            )}
                            {error.context.userId && (
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>User: {error.context.userId}</span>
                              </div>
                            )}
                            {error.resolvedAt && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>Resolved: {format(new Date(error.resolvedAt), 'MMM d, h:mm a')}</span>
                              </div>
                            )}
                          </div>
                          
                          {error.stack && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 cursor-pointer">
                                View Stack Trace
                              </summary>
                              <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                                {error.stack}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                      
                      {!error.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveError(error.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">No Errors Found</h3>
                <p className="text-muted-foreground">
                  No errors match your current filters.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="top" className="space-y-4">
          {stats?.topErrors && stats.topErrors.length > 0 ? (
            <div className="space-y-4">
              {stats.topErrors.map((error, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{error.message}</p>
                        <p className="text-sm text-gray-500">
                          Last occurred: {format(new Date(error.lastOccurred), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <Badge variant="secondary">{error.count} occurrences</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No error patterns found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          {stats?.errorsByComponent && Object.keys(stats.errorsByComponent).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.errorsByComponent).map(([component, count]) => (
                <Card key={component}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Code className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{component}</span>
                      </div>
                      <Badge variant="secondary">{count} errors</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No component data available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}