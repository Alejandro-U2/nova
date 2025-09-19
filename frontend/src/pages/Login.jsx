import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mensajeColor, setMensajeColor] = useState("red");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setMensaje("Por favor, llena todos los campos.");
      setMensajeColor("red");
      return;
    }

    console.log("🔑 Enviando datos de login:", {
      email,
      password: password ? "***" : undefined,
    });

    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Guardar token y datos de usuario
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setMensaje("Usuario logueado con éxito ✅ Redirigiendo...");
        setMensajeColor("green");

        setTimeout(() => navigate("/inicio"), 1500);
      } else {
        setMensaje(data.message || "Usuario o contraseña incorrectos.");
        setMensajeColor("red");
      }
    } catch (err) {
      console.error("❌ Error:", err);
      setMensaje("Error de conexión con el servidor.");
      setMensajeColor("red");
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Sign In</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Link to="/forgot-password" className="forgot">Forgot Password?</Link>
          <button type="submit" className="btn">Sign In</button>
          <p id="mensaje" style={{ color: mensajeColor }}>{mensaje}</p>
        </form>

        <p className="signup-text">
          Don’t have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>

      <div className="login-info">
        <div className="overlay"></div>
        <div className="info-text">
          <h3>
            A new way to experience real estate<br />
            in the infinite virtual space.
          </h3>
          <Link to="/learn-more" className="learn-more">LEARN MORE →</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
