// Các trang cho phép vào khi chưa đăng nhập.
export const AUTH_PAGES = ["/login", "/register"];

// Trả về đường dẫn cần chuyển tới, hoặc null nếu cho đi tiếp.
export function authRedirectTarget(
  pathname: string,
  isSignedIn: boolean,
): string | null {
  const isAuthPage = AUTH_PAGES.includes(pathname);
  if (!isSignedIn && !isAuthPage) return "/login";
  if (isSignedIn && isAuthPage) return "/";
  return null;
}
