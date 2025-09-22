import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/register.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/inicio" element={<h1>Bienvenido al Inicio</h1>} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<h1>Recuperar Contraseña</h1>} />
      <Route path="/learn-more" element={<h1>Aprende Más </h1>} />
    </Routes>
  );
}

export default App;
