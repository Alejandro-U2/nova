import React, { useState, useEffect } from 'react';
import API from '../service';
import '../styles/followButton.css';

const FollowButton = ({ userId, initialFollowState = null, onFollowChange = () => {} }) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Verificar estado de seguimiento al cargar
  useEffect(() => {
    // Si tenemos un estado inicial, usarlo
    if (initialFollowState !== null) {
      setIsFollowing(initialFollowState);
      return;
    }

    // Si no tenemos estado inicial, verificarlo con la API
    const checkFollowStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Primero intentar obtener el estado desde localStorage
        try {
          const followData = JSON.parse(localStorage.getItem('followData') || '{}');
          if (followData[userId] !== undefined) {
            console.log(`Estado de seguimiento para ${userId} encontrado en localStorage:`, followData[userId]);
            setIsFollowing(followData[userId]);
            return;
          }
        } catch (err) {
          console.error("Error al leer estado de seguimiento de localStorage:", err);
        }
        
        // Si no hay datos en localStorage, consultar la API
        const response = await API.get(`/follow/check/${userId}`);

        if (response.data?.status === 'success') {
          const { isFollowing } = response.data;
          setIsFollowing(isFollowing);
          
          // Guardar en localStorage para futuros accesos
          try {
            const followData = JSON.parse(localStorage.getItem('followData') || '{}');
            followData[userId] = isFollowing;
            localStorage.setItem('followData', JSON.stringify(followData));
          } catch (err) {
            console.error("Error al guardar estado de seguimiento en localStorage:", err);
          }
        } else {
          setError(response.data?.message || 'No se pudo obtener el estado de seguimiento');
        }
      } catch (err) {
        console.error("Error al verificar estado de seguimiento:", err);
        setError(err.response?.data?.message || "Error al verificar estado de seguimiento");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      checkFollowStatus();
    }
  }, [userId, initialFollowState]);

  // Escuchar eventos de cambio de estado de seguimiento desde otras partes de la aplicación
  useEffect(() => {
    const handleFollowStatusChange = (event) => {
      if (event.detail.userId === userId) {
        setIsFollowing(event.detail.isFollowing);
      }
    };

    window.addEventListener('followStatusChanged', handleFollowStatusChange);
    return () => {
      window.removeEventListener('followStatusChanged', handleFollowStatusChange);
    };
  }, [userId]);

  // Manejar clic en botón de seguir/dejar de seguir
  const handleFollowToggle = async () => {
    try {
      setLoading(true);
      setError(null);

      // Realizar la acción inversa al estado actual
      const action = isFollowing ? 'unfollow' : 'follow';
      const response = isFollowing
        ? await API.delete(`/follow/unfollow/${userId}`)
        : await API.post(`/follow/follow/${userId}`, {});

      const success = response.data?.status === 'success';

      if (success) {
        const nextIsFollowing = Boolean(response.data?.isFollowing);
        // Actualizar estado local
        setIsFollowing(nextIsFollowing);
        
        // Notificar al componente padre
        onFollowChange({
          userId,
          isFollowing: nextIsFollowing,
          action
        });
        
        // Disparar evento global para que otros componentes se actualicen
        const followEvent = new CustomEvent('followStatusChanged', {
          detail: {
            userId,
            isFollowing: nextIsFollowing,
            action
          }
        });
        window.dispatchEvent(followEvent);
        
        // Guardar en localStorage para mantener sincronización
        try {
          const followData = JSON.parse(localStorage.getItem('followData') || '{}');
          followData[userId] = nextIsFollowing;
          localStorage.setItem('followData', JSON.stringify(followData));
        } catch (err) {
          console.error("Error al guardar estado de seguimiento en localStorage:", err);
        }
      } else {
        setError(response.data?.message || 'No se pudo actualizar el seguimiento');
      }
    } catch (err) {
      console.error(`Error al ${isFollowing ? 'dejar de seguir' : 'seguir'} usuario:`, err);
      setError(err.response?.data?.message || `Error al ${isFollowing ? 'dejar de seguir' : 'seguir'} usuario`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="follow-button-container">
      <button
        className={`follow-button ${isFollowing ? 'following' : ''}`}
        onClick={handleFollowToggle}
        disabled={loading || !userId}
      >
        {loading ? (
          <span className="loader"></span>
        ) : isFollowing ? (
          'Siguiendo'
        ) : (
          'Seguir'
        )}
      </button>
      {error && <div className="follow-error">{error}</div>}
    </div>
  );
};

export default FollowButton;
