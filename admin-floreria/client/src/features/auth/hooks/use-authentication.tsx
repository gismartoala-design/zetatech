import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AuthService from "../api/auth-service";

export default function useAuthentication() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await AuthService.authentication({ email, password });
      if (response.status === "success") {
        toast.success("Login exitoso");
        // redirect to dashboard
        navigate("/app/dashboard", { replace: true });
      }
    } catch (error: unknown) {
      const message = error && typeof error === "object" && "message" in error
        ? String(error.message)
        : error && typeof error === "object" && "error" in error
        ? String(error.error)
        : "No se pudo iniciar sesión. Inténtalo nuevamente.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    password,
    isLoading,
    setEmail,
    setPassword,
    handleSubmit,
  };
}
