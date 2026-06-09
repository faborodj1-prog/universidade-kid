import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kid_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem("kid_refresh");
      if (refresh) {
        try {
          const { data } = await axios.post("/api/auth/refresh", { refresh });
          localStorage.setItem("kid_token", data.access);
          localStorage.setItem("kid_refresh", data.refresh);
          err.config.headers.Authorization = `Bearer ${data.access}`;
          return api.request(err.config);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      } else {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
