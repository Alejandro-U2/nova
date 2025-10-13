import React, { useState, useEffect, useCallback } from "react";
import FollowButton from "../components/FollowButton";
import API from "../service";
import "../styles/profile.css";

// Implementación simplificada para usar con el nuevo sistema de seguimiento
export default function ProfileFollowSection({ profile, isOwnProfile }) {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersData, setFollowersData] = useState([]);
  const [followingData, setFollowingData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Obtener ID del perfil
  const getProfileId = useCallback(() => {
    if (!profile) return null;
    
    // Extraer ID del objeto de perfil, manejando diferentes estructuras posibles
    if (profile._id) return profile._id;
    if (profile.id) return profile.id;
    if (profile.user && profile.user._id) return profile.user._id;
    if (profile.user && profile.user.id) return profile.user.id;
    
    return null;
  }, [profile]);
  
  // Cargar contadores de seguidores y seguidos
  const loadCounters = useCallback(async () => {
    const profileId = getProfileId();
    if (!profileId) return;
    
    try {
      setLoading(true);
      const response = await API.get(`/follow/counters/${profileId}`);

      if (response.data?.status === "success") {
        setFollowersCount(response.data.followers ?? 0);
        setFollowingCount(response.data.following ?? 0);
      } else {
        console.error("Error al cargar contadores:", response.data?.message);
      }
    } catch (error) {
      console.error("Error al cargar contadores:", error);
    } finally {
      setLoading(false);
    }
  }, [getProfileId]);

  // Cargar lista de seguidores
  const loadFollowers = async () => {
    const profileId = getProfileId();
    if (!profileId) return;
    
    try {
      setLoading(true);
      const response = await API.get(`/follow/followers/${profileId}`);

      if (response.data?.status === "success") {
        setFollowersData(response.data.followers || []);
        setShowFollowersModal(true);
      } else {
        const message = response.data?.message || "No se pudo cargar la lista de seguidores";
        console.error("Error al cargar seguidores:", message);
        alert("Error al cargar seguidores: " + message);
      }
    } catch (error) {
      console.error("Error al cargar seguidores:", error);
      alert("Error de conexión al cargar seguidores");
    } finally {
      setLoading(false);
    }
  };

  // Cargar lista de seguidos
  const loadFollowing = async () => {
    const profileId = getProfileId();
    if (!profileId) return;
    
    try {
      setLoading(true);
      const response = await API.get(`/follow/following/${profileId}`);

      if (response.data?.status === "success") {
        setFollowingData(response.data.following || []);
        setShowFollowingModal(true);
      } else {
        const message = response.data?.message || "No se pudo cargar la lista de seguidos";
        console.error("Error al cargar seguidos:", message);
        alert("Error al cargar seguidos: " + message);
      }
    } catch (error) {
      console.error("Error al cargar seguidos:", error);
      alert("Error de conexión al cargar seguidos");
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el estado de seguimiento
  const handleFollowChange = ({ userId, isFollowing }) => {
    // Actualizar contadores localmente para respuesta inmediata
    if (userId === getProfileId()) {
      setFollowersCount(prev => isFollowing ? prev + 1 : prev - 1);
    }
    
    // Recargar contadores del servidor después de un momento
    setTimeout(loadCounters, 1000);
  };

  // Cargar contadores al montar el componente
  useEffect(() => {
    loadCounters();
  }, [loadCounters, profile]);

  // Escuchar eventos de cambio de estado de seguimiento
  useEffect(() => {
    const handleFollowStatusChange = (event) => {
      if (event.detail.userId === getProfileId()) {
        // Recargar contadores cuando cambia el estado de seguimiento
        loadCounters();
      }
    };

    window.addEventListener('followStatusChanged', handleFollowStatusChange);
    return () => {
      window.removeEventListener('followStatusChanged', handleFollowStatusChange);
    };
  }, [getProfileId, loadCounters]);

  return (
    <div className="profile-follow-section">
      {/* Contadores de seguidores y seguidos */}
      <div className="follow-counters">
        <div className="follow-counter" onClick={loadFollowers}>
          <span className="counter-number">{loading ? '...' : followersCount}</span>
          <span className="counter-label">Seguidores</span>
        </div>
        <div className="follow-counter" onClick={loadFollowing}>
          <span className="counter-number">{loading ? '...' : followingCount}</span>
          <span className="counter-label">Siguiendo</span>
        </div>
      </div>

      {/* Botón de seguir (solo mostrar si no es el propio perfil) */}
      {!isOwnProfile && (
        <FollowButton
          userId={getProfileId()}
          onFollowChange={handleFollowChange}
        />
      )}

      {/* Modal de seguidores */}
      {showFollowersModal && (
        <div className="modal-backdrop">
          <div className="follow-modal">
            <div className="modal-header">
              <h2>Seguidores</h2>
              <button 
                className="close-modal"
                onClick={() => setShowFollowersModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {followersData.length > 0 ? (
                <ul className="follow-list">
                  {followersData.map(follower => (
                    <li key={follower._id} className="follow-item">
                      <img 
                        src={follower.avatar || '/default-avatar.png'}
                        alt={follower.nickname || `${follower.name} ${follower.lastname}`}
                        className="follow-avatar"
                      />
                      <div className="follow-info">
                        <h3>{follower.nickname || `${follower.name} ${follower.lastname}`}</h3>
                        <p>{follower.bio || 'Sin biografía'}</p>
                      </div>
                      {/* No mostrar botón de seguir si es el propio usuario */}
                      {follower._id !== JSON.parse(localStorage.getItem("user"))?.id && (
                        <FollowButton userId={follower._id} />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-list">No hay seguidores aún</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de seguidos */}
      {showFollowingModal && (
        <div className="modal-backdrop">
          <div className="follow-modal">
            <div className="modal-header">
              <h2>Siguiendo</h2>
              <button 
                className="close-modal"
                onClick={() => setShowFollowingModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {followingData.length > 0 ? (
                <ul className="follow-list">
                  {followingData.map(followed => (
                    <li key={followed._id} className="follow-item">
                      <img 
                        src={followed.avatar || '/default-avatar.png'}
                        alt={followed.nickname || `${followed.name} ${followed.lastname}`}
                        className="follow-avatar"
                      />
                      <div className="follow-info">
                        <h3>{followed.nickname || `${followed.name} ${followed.lastname}`}</h3>
                        <p>{followed.bio || 'Sin biografía'}</p>
                      </div>
                      {/* No mostrar botón de seguir si es el propio usuario */}
                      {followed._id !== JSON.parse(localStorage.getItem("user"))?.id && (
                        <FollowButton userId={followed._id} initialFollowState={true} />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-list">No sigue a nadie aún</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
