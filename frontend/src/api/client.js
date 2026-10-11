import axios from "axios";
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api",
  timeout: 15000,
});
apiClient.interceptors.request.use((config) => {
  if (!["/users/login", "/users/register"].includes(config.url)) {
    try {
      const saved = JSON.parse(sessionStorage.getItem("user"));
      if (saved?.token) config.headers.Authorization = `Bearer ${saved.token}`;
    } catch {
      sessionStorage.removeItem("user");
    }
  }
  return config;
});
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !["/users/login", "/users/register"].includes(error.config?.url)
    ) {
      sessionStorage.removeItem("user");
      window.dispatchEvent(new Event("auth-expired"));
    }
    return Promise.reject(error);
  },
);
export default apiClient;
