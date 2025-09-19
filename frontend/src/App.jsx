import { Routes, Route } from "react-router-dom";
import Login from "./pages/login.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/inicio" element={<h1>Bienvenido al Inicio 🚀</h1>} />
      <Route path="/register" element={<h1>Página de Registro 📝</h1>} />
      <Route path="/forgot-password" element={<h1>Recuperar Contraseña 🔐</h1>} />
      <Route path="/learn-more" element={<h1>Aprende Más 📚</h1>} />
    </Routes>
  );
}

export default App;
