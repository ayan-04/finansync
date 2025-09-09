import { prisma } from '@/lib/prisma'

export default async function TestPage() {
  // Simple database connection test
  const userCount = await prisma.user.count()
  
  return (
    <div className="p-8">
      <h1>Database Connection Test</h1>
      <p>Current users in database: {userCount}</p>
      <p>✅ Prisma Client is working!</p>
    </div>
  )
}