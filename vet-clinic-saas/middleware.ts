import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/sso-callback(.*)',
  '/accept-invite(.*)',
  '/select-clinic(.*)',
  '/api/invites/verify(.*)',
  '/api/invites/accept(.*)',
  '/api/user/clinics(.*)',
  '/api/user/select-clinic(.*)',
  '/api/user/profile(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes
  if (isPublicRoute(request)) {
    return NextResponse.next()
  }

  // Protect all other routes - require authentication
  const authResult = await auth()
  const { userId } = authResult

  // If not authenticated, redirect to sign-in
  if (!userId) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://drpawgh.com'
    const signInUrl = new URL('/sign-in', appUrl)
    signInUrl.searchParams.set('redirect_url', new URL(request.url).pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Authenticated - allow access
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}