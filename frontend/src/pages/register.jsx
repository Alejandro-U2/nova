import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/register.css";

function Register() {
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mensajeColor, setMensajeColor] = useState("red");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !lastname || !nickname || !email || !password) {
      setMensaje("Por favor, llena todos los campos.");
      setMensajeColor("red");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, lastname, nickname, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje("Usuario registrado con éxito ✅ Redirigiendo...");
        setMensajeColor("green");

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setMensaje(data.message || "Error al registrar usuario.");
        setMensajeColor("red");
      }
    } catch (err) {
      console.error("❌ Error completo:", err);
      setMensaje("Error de conexión con el servidor.");
      setMensajeColor("red");
    }
  };

  return (
    <div className="register-container">
      {/* Imagen a la izquierda */}
      <div className="register-info">
        <div className="overlay"></div>
        <div className="info-text">
          <h3>
            Create your account and start <br />
            exploring the platform.
          </h3>
        </div>
      </div>

      {/* Formulario a la derecha */}
      <div className="register-form">
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">First Name</label>
            <input
              type="text"
              id="name"
              placeholder="Enter your first name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastname">Last Name</label>
            <input
              type="text"
              id="lastname"
              placeholder="Enter your last name"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="nickname">Nickname</label>
            <input
              type="text"
              id="nickname"
              placeholder="Choose a nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

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

          <button type="submit" className="btn1">Sign Up</button>
          <p id="mensaje" style={{ color: mensajeColor }}>{mensaje}</p>
        </form>

        <p className="signup-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
