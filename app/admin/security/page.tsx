'use client'

import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface SecurityAuditResult {
  timestamp: string;
  headers: {
    [key: string]: {
      present: boolean;
      value?: string;
      recommendation?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    };
  };
  score: number;
  recommendations: string[];
}

export default function SecurityDashboard() {
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHeaderValues, setShowHeaderValues] = useState(false)

  useEffect(() => {
    runSecurityAudit()
  }, [])

  const runSecurityAudit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/security/audit')
      
      if (!response.ok) {
        throw new Error('Failed to run security audit')
      }

      const result = await response.json()
      setAuditResult(result)
    } catch (error) {
      console.error('Security audit error:', error)
      setError('Failed to run security audit')
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreDescription = (score: number) => {
    if (score >= 90) return 'Excellent security posture'
    if (score >= 70) return 'Good security with room for improvement'
    if (score >= 50) return 'Moderate security - needs attention'
    return 'Poor security - immediate action required'
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8 text-blue-600" />
          Security Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor and audit security headers and configurations
        </p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Security Score Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Security Score</CardTitle>
                <CardDescription>
                  Overall security posture based on header configuration
                </CardDescription>
              </div>
              <Button 
                onClick={runSecurityAudit} 
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Auditing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Run Audit
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {auditResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold">
                    <span className={getScoreColor(auditResult.score)}>
                      {auditResult.score}%
                    </span>
                  </div>
                  <div className="flex-1">
                    <Progress value={auditResult.score} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {getScoreDescription(auditResult.score)}
                    </p>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Last audit: {new Date(auditResult.timestamp).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {isLoading ? 'Running security audit...' : 'Click "Run Audit" to check security headers'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Headers Status */}
        {auditResult && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Security Headers</CardTitle>
                  <CardDescription>
                    Status of critical security headers
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHeaderValues(!showHeaderValues)}
                >
                  {showHeaderValues ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Values
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Values
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(auditResult.headers).map(([headerName, headerInfo]) => (
                  <div key={headerName} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {headerInfo.present ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <h4 className="font-medium">{headerName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {headerInfo.recommendation}
                          </p>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(headerInfo.severity)}>
                        {headerInfo.severity}
                      </Badge>
                    </div>
                    
                    {showHeaderValues && headerInfo.value && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="mt-2">
                            View Header Value
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono break-all">
                            {headerInfo.value}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {auditResult && auditResult.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Security Recommendations
              </CardTitle>
              <CardDescription>
                Actions to improve your security posture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditResult.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle>Security Best Practices</CardTitle>
            <CardDescription>
              Additional security measures and monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium">Monitoring</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• CSP violation reports are automatically logged</li>
                  <li>• Security headers are validated on each request</li>
                  <li>• Failed authentication attempts are tracked</li>
                  <li>• Suspicious activity triggers alerts</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Additional Security</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Rate limiting on all API endpoints</li>
                  <li>• CSRF protection on state-changing operations</li>
                  <li>• Two-factor authentication available</li>
                  <li>• Session management with timeout</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
