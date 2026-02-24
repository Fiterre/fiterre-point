import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 認証不要のパス
  const publicPaths = ['/login', '/signup', '/auth/callback']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // 未認証ユーザーをログインページへリダイレクト
  if (!user && !isPublicPath && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 認証済みユーザーがログインページにアクセスした場合、ダッシュボードへ
  if (user && isPublicPath) {
    // anon keyのSupabaseクライアントでuser_rolesを取得（RLSポリシーで本人のロールのみ参照可能）
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const url = request.nextUrl.clone()
    const role = roleData?.role
    if (role === 'admin' || role === 'manager') {
      url.pathname = '/admin'
    } else if (role === 'mentor') {
      url.pathname = '/mentor'
    } else {
      url.pathname = '/dashboard'
    }
    return NextResponse.redirect(url)
  }

  // ロールベースのルート保護
  if (user && (pathname.startsWith('/admin') || pathname.startsWith('/mentor'))) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const role = roleData?.role

    // /admin/* は admin/manager のみ
    if (pathname.startsWith('/admin') && role !== 'admin' && role !== 'manager') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // /mentor/* は mentor/admin/manager のみ
    if (pathname.startsWith('/mentor') && role !== 'mentor' && role !== 'admin' && role !== 'manager') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
