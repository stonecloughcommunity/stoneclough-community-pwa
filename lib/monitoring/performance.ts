import { env } from "@/lib/config/environment";

// Core Web Vitals tracking
export interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Performance thresholds based on Google's recommendations
const PERFORMANCE_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(name: WebVitalsMetric['name'], value: number): WebVitalsMetric['rating'] {
  const thresholds = PERFORMANCE_THRESHOLDS[name];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

// Send metrics to analytics services
export function reportWebVitals(metric: WebVitalsMetric) {
  // Add rating to metric
  const enhancedMetric = {
    ...metric,
    rating: getRating(metric.name, metric.value),
  };

  // Send to Vercel Analytics
  if (typeof window !== 'undefined' && window.va) {
    window.va('track', 'Web Vitals', {
      metric_name: enhancedMetric.name,
      metric_value: enhancedMetric.value,
      metric_rating: enhancedMetric.rating,
    });
  }

  // Send to Google Analytics
  if (typeof window !== 'undefined' && window.gtag && env.googleAnalyticsId) {
    window.gtag('event', enhancedMetric.name, {
      event_category: 'Web Vitals',
      event_label: enhancedMetric.id,
      value: Math.round(enhancedMetric.name === 'CLS' ? enhancedMetric.value * 1000 : enhancedMetric.value),
      non_interaction: true,
    });
  }

  // Send to PostHog
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture('web_vitals', {
      metric_name: enhancedMetric.name,
      metric_value: enhancedMetric.value,
      metric_rating: enhancedMetric.rating,
      metric_id: enhancedMetric.id,
    });
  }

  // Log poor performance metrics
  if (enhancedMetric.rating === 'poor') {
    console.warn(`Poor ${enhancedMetric.name} performance:`, enhancedMetric.value);
    
    // Send alert for poor performance
    if (env.isProduction) {
      sendPerformanceAlert(enhancedMetric);
    }
  }
}

// Custom performance tracking
export class PerformanceTracker {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  mark(name: string) {
    const timestamp = performance.now();
    this.marks.set(name, timestamp);
    
    if (typeof performance.mark === 'function') {
      performance.mark(name);
    }
  }

  measure(name: string, startMark: string, endMark?: string) {
    const startTime = this.marks.get(startMark);
    const endTime = endMark ? this.marks.get(endMark) : performance.now();
    
    if (startTime && endTime) {
      const duration = endTime - startTime;
      this.measures.set(name, duration);
      
      if (typeof performance.measure === 'function') {
        try {
          performance.measure(name, startMark, endMark);
        } catch (error) {
          console.warn('Performance measure failed:', error);
        }
      }
      
      return duration;
    }
    
    return null;
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  clear() {
    this.marks.clear();
    this.measures.clear();
    
    if (typeof performance.clearMarks === 'function') {
      performance.clearMarks();
    }
    
    if (typeof performance.clearMeasures === 'function') {
      performance.clearMeasures();
    }
  }
}

// Global performance tracker instance
export const performanceTracker = new PerformanceTracker();

// Page load performance tracking
export function trackPageLoad(pageName: string) {
  if (typeof window === 'undefined') return;

  performanceTracker.mark(`${pageName}-start`);
  
  // Track when page is interactive
  document.addEventListener('DOMContentLoaded', () => {
    performanceTracker.mark(`${pageName}-dom-ready`);
    const domReadyTime = performanceTracker.measure(`${pageName}-dom-ready-time`, `${pageName}-start`, `${pageName}-dom-ready`);
    
    if (domReadyTime) {
      reportCustomMetric('dom_ready_time', domReadyTime, { page: pageName });
    }
  });

  // Track when page is fully loaded
  window.addEventListener('load', () => {
    performanceTracker.mark(`${pageName}-loaded`);
    const loadTime = performanceTracker.measure(`${pageName}-load-time`, `${pageName}-start`, `${pageName}-loaded`);
    
    if (loadTime) {
      reportCustomMetric('page_load_time', loadTime, { page: pageName });
    }
  });
}

// API call performance tracking
export async function trackAPICall<T>(
  apiName: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  performanceTracker.mark(`api-${apiName}-start`);
  
  try {
    const result = await apiCall();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performanceTracker.mark(`api-${apiName}-end`);
    performanceTracker.measure(`api-${apiName}-duration`, `api-${apiName}-start`, `api-${apiName}-end`);
    
    reportCustomMetric('api_call_duration', duration, { 
      api: apiName,
      status: 'success'
    });
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    reportCustomMetric('api_call_duration', duration, { 
      api: apiName,
      status: 'error'
    });
    
    throw error;
  }
}

// Database query performance tracking
export async function trackDatabaseQuery<T>(
  queryName: string,
  query: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await query();
    const duration = performance.now() - startTime;
    
    reportCustomMetric('db_query_duration', duration, { 
      query: queryName,
      status: 'success'
    });
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow database query: ${queryName} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    reportCustomMetric('db_query_duration', duration, { 
      query: queryName,
      status: 'error'
    });
    
    throw error;
  }
}

// Custom metric reporting
export function reportCustomMetric(
  name: string,
  value: number,
  labels?: Record<string, string>
) {
  // Send to Vercel Analytics
  if (typeof window !== 'undefined' && window.va) {
    window.va('track', 'Custom Metric', {
      metric_name: name,
      metric_value: value,
      ...labels,
    });
  }

  // Send to PostHog
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture('custom_metric', {
      metric_name: name,
      metric_value: value,
      ...labels,
    });
  }

  // Log in development
  if (env.isDevelopment) {
    console.log(`Custom metric: ${name} = ${value}`, labels);
  }
}

// Performance alert system
async function sendPerformanceAlert(metric: WebVitalsMetric) {
  try {
    await fetch('/api/monitoring/performance-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metric,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    });
  } catch (error) {
    console.error('Failed to send performance alert:', error);
  }
}

// Resource timing analysis
export function analyzeResourceTiming() {
  if (typeof window === 'undefined' || !window.performance?.getEntriesByType) {
    return;
  }

  const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const analysis = {
    totalResources: resources.length,
    slowResources: resources.filter(r => r.duration > 1000),
    largeResources: resources.filter(r => r.transferSize > 100000),
    failedResources: resources.filter(r => r.responseStatus >= 400),
  };

  // Report slow resources
  analysis.slowResources.forEach(resource => {
    reportCustomMetric('slow_resource', resource.duration, {
      resource_name: resource.name,
      resource_type: resource.initiatorType,
    });
  });

  // Report large resources
  analysis.largeResources.forEach(resource => {
    reportCustomMetric('large_resource', resource.transferSize, {
      resource_name: resource.name,
      resource_type: resource.initiatorType,
    });
  });

  return analysis;
}

// Memory usage tracking
export function trackMemoryUsage() {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return;
  }

  const memory = (performance as any).memory;
  
  reportCustomMetric('memory_used', memory.usedJSHeapSize);
  reportCustomMetric('memory_total', memory.totalJSHeapSize);
  reportCustomMetric('memory_limit', memory.jsHeapSizeLimit);
  
  // Alert if memory usage is high
  const memoryUsagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
  if (memoryUsagePercent > 80) {
    console.warn(`High memory usage: ${memoryUsagePercent.toFixed(2)}%`);
    reportCustomMetric('high_memory_usage', memoryUsagePercent);
  }
}

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Track memory usage periodically
  setInterval(trackMemoryUsage, 30000); // Every 30 seconds

  // Analyze resource timing after page load
  window.addEventListener('load', () => {
    setTimeout(analyzeResourceTiming, 1000);
  });

  // Track navigation timing
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      reportCustomMetric('dns_lookup_time', navigation.domainLookupEnd - navigation.domainLookupStart);
      reportCustomMetric('tcp_connect_time', navigation.connectEnd - navigation.connectStart);
      reportCustomMetric('server_response_time', navigation.responseEnd - navigation.requestStart);
      reportCustomMetric('dom_processing_time', navigation.domComplete - navigation.domLoading);
    }
  });
}
