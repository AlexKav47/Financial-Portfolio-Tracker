export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";

  // When deploy frontend and backend on different domains need cross site cookies
  // sameSite must be "none"
  // secure must be true
  // CORS must allow credentials and explicit origin
  return {
    httpOnly: true,
    secure: isProd,    
    sameSite: "lax",    
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
