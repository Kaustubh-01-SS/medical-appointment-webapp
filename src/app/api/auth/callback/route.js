import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // These cookies will be set on the response
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const response = NextResponse.redirect(new URL(next, req.url))
      
      // Get session to extract tokens
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Set access token cookie
        response.cookies.set('sb-access-token', session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: session.expires_in,
        })
        
        // Set refresh token cookie
        response.cookies.set('sb-refresh-token', session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365, // 1 year
        })
      }
      
      return response
    }
  }

  return NextResponse.redirect(new URL('/auth/error', req.url))
}
