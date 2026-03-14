export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  const sameSiteEnv = String(process.env.COOKIE_SAMESITE || "lax").toLowerCase();
  const sameSite = sameSiteEnv === "none" ? "none" : "lax";
  const secure = sameSite === "none" ? true : isProd;

  return {
    secure: true,
    sameSite, 
    path: "/",
  };
}


export function setAuthCookies(res, { accessToken, refreshToken }) {
  const base = getCookieOptions();

  res.cookie("accessToken", accessToken, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookies(res) {
  const base = getCookieOptions();
  res.clearCookie("accessToken", base);
  res.clearCookie("refreshToken", base);
}
