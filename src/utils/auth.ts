export function getAccessToken(): string {
  return localStorage.getItem('accessToken') ?? '';
}

export function isLoggedIn(): boolean {
  const token = getAccessToken();
  return Boolean(token);
}
