import React from "react";
import "../styles/loader.css";

export default function Loader({ 
  text = "Espere un momento", 
  show = false, 
  fixed = false, 
image = "/public/vite.svg"
}) {
  if (!show) return null;

  return (
    <div 
      className="loader-screen visible" 
      style={fixed ? { position: "fixed", inset: 0, zIndex: 1200 } : {}}
    >
      <div className="loader-content"> 
        <img src={image} alt="loading" className="loader-gif" /> 
        {/* 👆 mantiene la clase loader-gif, así se conserva el estilo original */}
        <h2 className="loader-text">{text}</h2>
      </div>
    </div>
  );
}
