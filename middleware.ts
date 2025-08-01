// middleware.ts (Optional - for route protection)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Add any middleware logic here if needed
  // For example, rate limiting, additional auth checks, etc.
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/posts/:path*',
    '/api/users/:path*'
  ]
};
