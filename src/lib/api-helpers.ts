import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'

export function withAuth<T extends any[]>(
  handler: (userId: string, request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      return await handler(session.user.id, request, ...args)
    } catch (error) {
      console.error('Auth wrapper error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

export function handleApiError(error: any) {
  console.error('API Error:', error)
  return NextResponse.json(
    { error: 'Internal server error' }, 
    { status: 500 }
  )
}
