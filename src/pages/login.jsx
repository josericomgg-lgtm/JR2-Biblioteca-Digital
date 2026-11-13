
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { Library, Lock, Mail } from "lucide-react";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <div className="login-logo">
          <Library size={36} />
        </div>

        <span className="login-brand">JR² BIBLIOTECA DIGITAL</span>
        <h1>Bienvenido</h1>
        <p>Ingresa a tu panel administrativo</p>

        <label>Correo electrónico</label>
        <div className="login-input">
          <Mail size={18} />
          <input
            type="email"
            placeholder="admin@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <label>Contraseña</label>
        <div className="login-input">
          <Lock size={18} />
          <input
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="login-button" disabled={loading}>
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>

        <small>Acceso exclusivo para administración</small>
      </form>
    </div>
  );
}

export default Login;
