export function redirectToLoginPreservingURL() {
  const current = window.location.pathname + window.location.search;
  localStorage.removeItem("user");
  window.location.replace(`/?redirect=${encodeURIComponent(current)}`);
}
