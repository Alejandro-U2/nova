import { Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/register.jsx";
import HomePremium from "./pages/HomePremium.jsx";
import Profile from "./pages/Profile.jsx";
import Search from "./pages/Search.jsx";
import Crear from "./pages/Crear.jsx";
import NavbarNew from "./components/NavbarNew.jsx";

function App() {
  const location = useLocation();
  const hideNavbar = ['/login', '/register', '/'].includes(location.pathname);

  return (
    <div className="app">
      {!hideNavbar && <NavbarNew />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        //<Route path="/home" element={<HomePremium />} />
        <Route path="/inicio" element={<HomePremium />} />
        <Route path="/profile">
        <Route index element={<Profile />} />          {/* /profile (propio) */}
        <Route path=":id" element={<Profile />} />     {/* /profile/:id (otros) */}
        </Route>        
        <Route path="/search" element={<Search />} />
        <Route path="/crear" element={<Crear />} />
        <Route path="/forgot-password" element={<h1>Recuperar Contraseña</h1>} />
        <Route path="/learn-more" element={<h1>Aprende Más </h1>} />
      </Routes>
    </div>
  );
}

export default App;
