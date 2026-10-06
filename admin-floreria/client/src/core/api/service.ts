import axios from "axios";
import { useUserStore } from "@/store/use-user-store";
import { ADMIN_API_URL } from "@/core/config/public-env";

const service = axios.create({
  baseURL: ADMIN_API_URL,
  withCredentials: true,
});

// Interceptor de respuesta: si 401/419 limpia sesión y redirige a login
service.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 419 || status === 403) {
      try {
        const { clearUser } = useUserStore.getState();
        clearUser();
      } catch {
        // ignore store access errors in non-react contexts
      }
      // No forzar navegación aquí; dejamos que el guard redirija.
    }
    return Promise.reject(error);
  }
);

export default service;
