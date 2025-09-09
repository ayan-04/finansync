"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TestResult {
  [endpoint: string]: any
}

export default function APITestPage() {
  const [results, setResults] = useState<TestResult>({})
  const [loading, setLoading] = useState<string | null>(null)

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(endpoint)
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      })
      
      const data = await response.json()
      setResults((prev: TestResult) => ({ ...prev, [endpoint]: data }))
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setResults((prev: TestResult) => ({ 
        ...prev, 
        [endpoint]: { error: errorMessage } 
      }))
    } finally {
      setLoading(null)
    }
  }

  const tests = [
    {
      name: '✅ Database Connection Test',
      endpoint: '/api/test',
      method: 'GET'
    },
    {
      name: '✅ Create Test User & Sample Data',
      endpoint: '/api/create-test-user',
      method: 'POST'
    },
    {
      name: '🎯 Test Dashboard (No Auth)',
      endpoint: '/api/test-dashboard',
      method: 'GET'
    },
    {
      name: '🎯 Test Budgets (No Auth)',
      endpoint: '/api/test-budgets',
      method: 'GET'
    }
  ]

  return (
    <div className="p-8 space-y-6">
      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
        <h1 className="text-3xl font-bold text-blue-900">FinanSync API Testing</h1>
        <p className="text-blue-700 mt-2">
          Testing core API functionality without authentication. 
          <strong> Clear your browser cookies first!</strong>
        </p>
      </div>
      
      <div className="grid gap-4">
        {tests.map((test, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {test.name}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {test.method} {test.endpoint}
              </p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => testEndpoint(test.endpoint, test.method)}
                disabled={loading === test.endpoint}
                className="mb-4"
                variant={test.endpoint.includes('test') ? 'default' : 'outline'}
              >
                {loading === test.endpoint ? 'Testing...' : 'Test Endpoint'}
              </Button>
              
              {results[test.endpoint] && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <pre className="text-sm overflow-auto max-h-64">
                    {JSON.stringify(results[test.endpoint], null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
        <h3 className="font-semibold text-green-900">🎯 Next Steps After Testing</h3>
        <ol className="list-decimal list-inside text-green-800 mt-2 space-y-1">
          <li>Verify all test endpoints work</li>
          <li>Build dashboard UI components using test data</li>
          <li>Implement proper authentication flow</li>
          <li>Add Socket.IO real-time features</li>
        </ol>
      </div>
    </div>
  )
}
