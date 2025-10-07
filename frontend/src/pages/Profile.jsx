import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/profile.css";

export default function Profile() {
  const { id } = useParams(); // ID del perfil en la URL
  const [user, setUser] = useState(null); // usuario logueado
  const [profile, setProfile] = useState(null); // perfil que se está viendo
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    coverPhoto: "",
    avatar: "",
  });
  const [uploadMethod, setUploadMethod] = useState({
    coverPhoto: "url",
    avatar: "url",
  });
  const [selectedFiles, setSelectedFiles] = useState({
    coverPhoto: null,
    avatar: null,
  });

  // Cargar datos del usuario logueado
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  // Obtener perfil (propio o ajeno)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const endpoint = id
          ? `http://localhost:5000/api/profile/user/${id}` // ✅ ruta corregida
          : `http://localhost:5000/api/profile/me`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const profileData = data.profile || data.user;
          setProfile(profileData);
          setEditForm({
            name: profileData?.name || "",
            bio: profileData?.bio || "",
            coverPhoto: profileData?.coverPhoto || "",
            avatar: profileData?.avatar || "",
          });

          // ✅ Detectar si es su propio perfil (id o _id)
          const loggedUser = JSON.parse(localStorage.getItem("user"));
          if (
            loggedUser &&
            (loggedUser._id === id ||
              loggedUser.id === id ||
              !id) // si no hay id (ruta /profile), también es suyo
          ) {
            setIsOwnProfile(true);
          } else {
            setIsOwnProfile(false);
          }
        } else {
          console.error("Error al obtener el perfil:", response.statusText);
        }
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  // Obtener publicaciones del usuario
  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        
        if (!token) {
          console.error("No hay token de autenticación");
          return;
        }

        let targetId = id;
        
        // Si no hay id en la URL, usar el id del usuario logueado
        if (!targetId && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            targetId = parsedUser._id || parsedUser.id;
          } catch (parseError) {
            console.error("Error al parsear datos del usuario:", parseError);
            return;
          }
        }

        // Verificar que tengamos un ID válido
        if (!targetId || targetId === "undefined") {
          console.error("No se pudo obtener un ID de usuario válido");
          return;
        }

        console.log("Obteniendo publicaciones para el usuario:", targetId);

        const response = await fetch(
          `http://localhost:5000/api/publications/user/${targetId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Publicaciones obtenidas:", data);
          setPublications(data.publications || []);
        } else if (response.status === 404) {
          console.warn("No se encontraron publicaciones para este usuario.");
          setPublications([]);
        } else {
          console.error("Error al obtener publicaciones:", response.statusText);
          const errorData = await response.text();
          console.error("Detalles del error:", errorData);
        }
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
      }
    };

    // Solo ejecutar si tenemos datos del usuario o un ID válido
    const userData = localStorage.getItem("user");
    if (id || userData) {
      fetchPublications();
    }
  }, [id]);

  // --- Edición de perfil ---
  const handleEditToggle = () => setIsEditing(!isEditing);
  const handleInputChange = (e) =>
    setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleMethodChange = (field, method) => {
    setUploadMethod({ ...uploadMethod, [field]: method });
    if (method === "url") setSelectedFiles({ ...selectedFiles, [field]: null });
    else setEditForm({ ...editForm, [field]: "" });
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFiles({ ...selectedFiles, [field]: file });
      const reader = new FileReader();
      reader.onload = (event) =>
        setEditForm({ ...editForm, [field]: event.target.result });
      reader.readAsDataURL(file);
    }
  };

  const convertFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return console.error("No hay token de autenticación");

      let dataToSend = { ...editForm };

      if (selectedFiles.coverPhoto && uploadMethod.coverPhoto === "file") {
        dataToSend.coverPhoto = await convertFileToBase64(
          selectedFiles.coverPhoto
        );
      }
      if (selectedFiles.avatar && uploadMethod.avatar === "file") {
        dataToSend.avatar = await convertFileToBase64(selectedFiles.avatar);
      }

      const response = await fetch("http://localhost:5000/api/profile/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setIsEditing(false);
        alert("Perfil actualizado correctamente ✅");
      } else {
        console.error("Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
    }
  };

  // --- Renderizado ---
  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="loading">Perfil no encontrado</div>
      </div>
    );
  }

  const displayData = profile;
  const nickname = displayData.nickname || "@usuario";

  return (
    <div className="profile-container">
      <div className="profile-content">
        {/* --- PORTADA --- */}
        <div className="profile-cover">
          <img
            src={displayData.coverPhoto || "https://picsum.photos/1200/300"}
            alt="Portada"
            className="cover-image"
          />
        </div>

        {/* --- INFO USUARIO --- */}
        <div className="profile-info-section inline">
          <div className="avatar-container-inline">
            {displayData.avatar ? (
              <img
                src={displayData.avatar}
                alt="Avatar"
                className="profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar">
                {displayData.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>

          <div className="user-details">
            <h2 className="user-name">{displayData.name || "Usuario"}</h2>
            <p className="user-nickname">{nickname}</p>
            <p className="user-bio">{displayData.bio || "Sin biografía"}</p>
          </div>

          <div className="profile-actions">
            {isOwnProfile ? (
              <>
                <button className="primary-btn">+ Añadir a historia</button>
                <button className="secondary-btn" onClick={handleEditToggle}>
                  Editar perfil
                </button>
              </>
            ) : (
              <button className="primary-btn">Seguir</button>
            )}
          </div>
        </div>

        {/* --- ESTADÍSTICAS --- */}
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-number">{publications.length}</span>
            <span className="stat-label">Publicaciones</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{displayData.followers || 0}</span>
            <span className="stat-label">Seguidores</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{displayData.following || 0}</span>
            <span className="stat-label">Siguiendo</span>
          </div>
        </div>

        {/* --- PUBLICACIONES --- */}
        <div className="user-publications">
          <h3 className="section-title">Publicaciones</h3>
          <div className="publications-grid">
            {publications.length > 0 ? (
              publications.map((publication, index) => (
                <div key={publication._id || index} className="publication-item">
                  <img
                    src={
                      publication.image ||
                      publication.imageUrl ||
                      "https://via.placeholder.com/300x300?text=Sin+Imagen"
                    }
                    alt={publication.description || `Publicación ${index + 1}`}
                    className="publication-image"
                  />
                  {publication.description && (
                    <div className="publication-overlay">
                      <p className="publication-description">
                        {publication.description}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-publications">
                <p>No hay publicaciones aún</p>
                <p>¡Comparte tu primera publicación!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL DE EDICIÓN --- */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="edit-header">
              <h2 className="edit-title">Editar perfil</h2>
              <button className="close-btn" onClick={handleEditToggle}>
                ✕
              </button>
            </div>

            <div className="edit-form">
              {/* Portada */}
              <div className="form-group">
                <label className="form-label">Foto de portada</label>
                <div className="upload-method-selector">
                  <button
                    type="button"
                    className={`method-btn ${
                      uploadMethod.coverPhoto === "url" ? "active" : ""
                    }`}
                    onClick={() => handleMethodChange("coverPhoto", "url")}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    className={`method-btn ${
                      uploadMethod.coverPhoto === "file" ? "active" : ""
                    }`}
                    onClick={() => handleMethodChange("coverPhoto", "file")}
                  >
                    Archivo
                  </button>
                </div>

                {uploadMethod.coverPhoto === "url" ? (
                  <input
                    type="url"
                    name="coverPhoto"
                    value={editForm.coverPhoto}
                    onChange={handleInputChange}
                    className="form-input-url"
                    placeholder="https://ejemplo.com/portada.jpg"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "coverPhoto")}
                    className="form-input"
                  />
                )}
              </div>

              {/* Avatar */}
              <div className="form-group">
                <label className="form-label">Foto de perfil</label>
                <div className="upload-method-selector">
                  <button
                    type="button"
                    className={`method-btn ${
                      uploadMethod.avatar === "url" ? "active" : ""
                    }`}
                    onClick={() => handleMethodChange("avatar", "url")}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    className={`method-btn ${
                      uploadMethod.avatar === "file" ? "active" : ""
                    }`}
                    onClick={() => handleMethodChange("avatar", "file")}
                  >
                    Archivo
                  </button>
                </div>

                {uploadMethod.avatar === "url" ? (
                  <input
                    type="url"
                    name="avatar"
                    value={editForm.avatar}
                    onChange={handleInputChange}
                    className="form-input-url"
                    placeholder="https://ejemplo.com/avatar.jpg"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "avatar")}
                    className="form-input"
                  />
                )}
              </div>

              {/* Nombre */}
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Tu nombre"
                />
              </div>

              {/* Bio */}
              <div className="form-group">
                <label className="form-label">Biografía</label>
                <textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Cuéntanos algo sobre ti..."
                  rows="4"
                />
              </div>

              {/* Botones */}
              <div className="form-actions">
                <button className="save-btn" onClick={handleSave}>
                  Guardar cambios
                </button>
                <button className="cancel-btn" onClick={handleEditToggle}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
