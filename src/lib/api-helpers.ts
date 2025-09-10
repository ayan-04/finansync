import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export function withAuth<T extends any[]>(
  handler: (userId: string, request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await currentUser()
      if (!user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      return await handler(user.id, request, ...args)
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
