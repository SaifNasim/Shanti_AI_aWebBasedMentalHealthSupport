import { NextResponse, type NextRequest } from 'next/server'

const SESSION_SECRET = process.env.SESSION_SECRET || 'shanti-ai-default-secret-change-in-production'

async function verifyToken(token: string): Promise<boolean> {
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [userId, timestamp, signature] = parts
  if (!userId || !timestamp) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const data = encoder.encode(`${userId}.${timestamp}`)
  const sig = await crypto.subtle.sign('HMAC', key, data)
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return expected === signature
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('shanti_ai_session')?.value

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token || !(await verifyToken(token))) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
