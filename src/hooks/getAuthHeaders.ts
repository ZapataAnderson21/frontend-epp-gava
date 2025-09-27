export default function getAuthHeaders() {
  const token = localStorage.getItem("accessToken"); // o donde lo guardes (ej. context)
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}
