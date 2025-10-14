export function redirectToLoginPreservingURL() {
  const current = window.location.pathname + window.location.search;
  // (opcional) limpia sesión
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  window.location.replace(`/?redirect=${encodeURIComponent(current)}`);
}