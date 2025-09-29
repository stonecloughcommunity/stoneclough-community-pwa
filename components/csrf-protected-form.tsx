'use client'

import React from 'react'
import { useCSRFToken } from '@/lib/security/csrf-client'

interface CSRFProtectedFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
}

export function CSRFProtectedForm({ 
  children, 
  onSubmit, 
  ...props 
}: CSRFProtectedFormProps) {
  const { token, loading, error } = useCSRFToken()

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      
      if (!token) {
        console.error('CSRF token not available')
        return
      }

      // Add CSRF token to form data
      const formData = new FormData(event.currentTarget)
      formData.append('csrf_token', token)

      if (onSubmit) {
        onSubmit(event)
      }
    },
    [token, onSubmit]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Security Error
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form {...props} onSubmit={handleSubmit}>
      {token && (
        <input type="hidden" name="csrf_token" value={token} />
      )}
      {children}
    </form>
  )
}
