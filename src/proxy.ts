import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const MOBILE_COOKIE = "mobile";
const MOBILE_MAX_AGE = 60 * 60 * 24 * 7;
const MOBILE_UA = /Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i;

function isMobileUA(request: NextRequest) {
  return MOBILE_UA.test(request.headers.get("user-agent") || "");
}

function isMobileByCookie(request: NextRequest) {
  return request.cookies.get(MOBILE_COOKIE)?.value === "true";
}

function hasMPrefix(pathname: string) {
  return /^\/m(\/|$)/.test(pathname);
}

function stripMPrefix(pathname: string) {
  return pathname.replace(/^\/m(\/|$)/, "/");
}

function setMobileFlags(res: NextResponse) {
  res.headers.set("x-mobile", "true");
  res.cookies.set(MOBILE_COOKIE, "true", {
    maxAge: MOBILE_MAX_AGE,
    path: "/",
  });
}

function copyCookies(from: NextResponse, to: NextResponse) {
  const setCookie = from.headers.get("set-cookie");
  if (setCookie) {
    to.headers.append("set-cookie", setCookie);
  }
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isMobileUAOnly = isMobileUA(request);
  const isMobile = isMobileUAOnly || isMobileByCookie(request);
  const isM = hasMPrefix(pathname);

  // ── /m/{locale}/... → strip /m/, process via intl ──
  if (isM) {
    request.nextUrl.pathname = stripMPrefix(pathname);
    request.headers.set("x-mobile", "true");

    const intlRes = intlMiddleware(request);
    const location = intlRes.headers.get("location");

    if (location) {
      const locUrl = new URL(location, request.url);
      locUrl.pathname = "/m" + locUrl.pathname;
      const redirect = NextResponse.redirect(locUrl);
      copyCookies(intlRes, redirect);
      setMobileFlags(redirect);
      return redirect;
    }

    // intl returned next() or rewrite() — always force a rewrite to the stripped path
    // because next() would serve the original /m/ URL which doesn't exist
    const rewrite = NextResponse.rewrite(request.nextUrl, {
      request: { headers: request.headers },
    });
    rewrite.cookies.set(MOBILE_COOKIE, "true", {
      maxAge: MOBILE_MAX_AGE,
      path: "/",
    });
    return rewrite;
  }

  // ── Regular path: run intl, then redirect mobile UA ──
  const intlRes = intlMiddleware(request);
  const location = intlRes.headers.get("location");

  if (isMobileUAOnly) {
    const targetPath = location
      ? new URL(location, request.url).pathname
      : pathname;

    const mobileUrl = request.nextUrl.clone();
    mobileUrl.pathname = "/m" + targetPath;
    const redirect = NextResponse.redirect(mobileUrl);
    copyCookies(intlRes, redirect);
    setMobileFlags(redirect);
    return redirect;
  }

  return intlRes;
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
