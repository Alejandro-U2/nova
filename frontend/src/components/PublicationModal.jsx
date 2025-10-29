import React, { useState, useEffect } from 'react';
import '../styles/publicationModal.css';

export default function PublicationModal({ publication, onClose, onNext, onPrev, hasNext, hasPrev, userProfile, onDelete, isOwnProfile, onCommentAdded }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeFilter, setActiveFilter] = useState('original'); // 'original', 'bw', 'sepia', 'cyanotype'
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Para navegar entre múltiples imágenes

  if (!publication) return null;

  // Cargar comentarios cuando se monta el componente
  useEffect(() => {
    if (publication.comments && Array.isArray(publication.comments)) {
      setComments(publication.comments);
    }
  }, [publication]);

  // Debug: ver estructura de datos
  console.log('Publication data:', publication);
  console.log('UserProfile data:', userProfile);

  // Obtener información del usuario
  const getUserAvatar = () => {
    if (publication.userProfile?.avatar) return publication.userProfile.avatar;
    if (publication.user?.avatar) return publication.user.avatar;
    if (userProfile?.avatar) return userProfile.avatar;
    // Small inline SVG avatar placeholder (32x32)
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect fill='%23222' width='100%25' height='100%25'/><text x='50%25' y='50%25' fill='%23fff' font-size='10' text-anchor='middle' dominant-baseline='middle'>Usr</text></svg>";
  };

  const getUserNickname = () => {
    // Buscar en diferentes ubicaciones posibles
    if (publication.userProfile?.nickname) return publication.userProfile.nickname;
    if (publication.user?.nickname) return publication.user.nickname;
    if (userProfile?.nickname) return userProfile.nickname;
    if (userProfile?.user?.nickname) return userProfile.user.nickname;
    if (publication.nickname) return publication.nickname;
    return 'Usuario';
  };

  const getLikesCount = () => {
    if (typeof publication.likes === 'number') return publication.likes;
    if (Array.isArray(publication.likes)) return publication.likes.length;
    return 223; // Valor por defecto
  };

  const defaultSvgPlaceholder = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect fill='%23000000' width='100%' height='100%'/><text x='50%' y='50%' fill='%23ffffff' font-size='24' text-anchor='middle' dominant-baseline='middle'>Sin imagen</text></svg>";

  // Obtener la imagen actual según el filtro activo
  const getPublicationImage = () => {
    // Verificar si images es un array (nuevo formato) o un objeto (formato antiguo)
    const images = publication.images;
    
    if (!images) return defaultSvgPlaceholder;
    
    // Nuevo formato: array de imágenes
    if (Array.isArray(images)) {
      const currentImage = images[currentImageIndex];
      if (!currentImage) return defaultSvgPlaceholder;
      
      // Aplicar filtro
      if (activeFilter === 'bw' && currentImage.bw) return currentImage.bw;
      if (activeFilter === 'sepia' && currentImage.sepia) return currentImage.sepia;
      if (activeFilter === 'cyanotype' && currentImage.cyanotype) return currentImage.cyanotype;
      return currentImage.original || currentImage.scaled || defaultSvgPlaceholder;
    }
    
    // Formato antiguo: un solo objeto de imagen
    if (activeFilter === 'bw' && images.bw) return images.bw;
    if (activeFilter === 'sepia' && images.sepia) return images.sepia;
    if (activeFilter === 'cyanotype' && images.cyanotype) return images.cyanotype;
    return images.original || images.scaled || publication.image || defaultSvgPlaceholder;
  };

  // Verificar si hay filtros disponibles
  const hasFilters = () => {
    const images = publication.images;
    if (!images) return false;
    
    if (Array.isArray(images)) {
      const currentImage = images[currentImageIndex];
      return currentImage && (currentImage.bw || currentImage.sepia);
    }
    
    return images.bw || images.sepia;
  };

  // Verificar si hay múltiples imágenes
  const hasMultipleImages = Array.isArray(publication.images) && publication.images.length > 1;

  // Navegar a la siguiente imagen
  const nextImage = () => {
    if (Array.isArray(publication.images) && currentImageIndex < publication.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  // Navegar a la imagen anterior
  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleLike = () => {
    // Implementar lógica de like
    console.log('Like publicación:', publication._id);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/publications/${publication._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: comment.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Si el comentario no viene con avatar completo, agregarlo desde localStorage
        const enrichedComment = {
          ...data.comment,
          user: {
            ...data.comment.user,
            avatar: data.comment.user?.avatar || userProfile?.avatar || user.avatar || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect fill='%23222' width='100%25' height='100%25'/><text x='50%25' y='50%25' fill='%23fff' font-size='10' text-anchor='middle' dominant-baseline='middle'>U</text></svg>",
            nickname: data.comment.user?.nickname || userProfile?.nickname || user.nickname || 'Usuario'
          }
        };
        
        // Agregar el nuevo comentario a la lista local
        const newComments = [...comments, enrichedComment];
        setComments(newComments);
        setComment('');
        
        // Notificar al componente padre para actualizar la publicación
        if (onCommentAdded) {
          onCommentAdded(publication._id, enrichedComment);
        }
      } else {
        console.error('Error al agregar comentario');
      }
    } catch (error) {
      console.error('Error al enviar comentario:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="publication-modal-overlay" onClick={onClose}>
      <div className="publication-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Botón cerrar */}
        <button className="modal-close-btn" onClick={onClose}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Botón eliminar (solo si es el perfil propio) */}
        {isOwnProfile && onDelete && (
          <button 
            className="modal-delete-btn" 
            onClick={() => {
              if (window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) {
                onDelete(publication._id);
              }
            }}
            title="Eliminar publicación"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        )}

        {/* Botón anterior */}
        {hasPrev && (
          <button className="modal-nav-btn modal-prev-btn" onClick={onPrev}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}

        {/* Botón siguiente */}
        {hasNext && (
          <button className="modal-nav-btn modal-next-btn" onClick={onNext}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}

        <div className="publication-modal-content">
          {/* Imagen */}
          <div className="publication-modal-image-container">
            <img
              src={getPublicationImage()}
              alt={typeof publication.description === 'string' ? publication.description : 'Publicación'}
              className="publication-modal-image"
            />
            
            {/* Botones de navegación entre imágenes */}
            {hasMultipleImages && (
              <>
                {currentImageIndex > 0 && (
                  <button className="image-nav-btn image-prev-btn" onClick={prevImage}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                )}
                
                {currentImageIndex < publication.images.length - 1 && (
                  <button className="image-nav-btn image-next-btn" onClick={nextImage}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                )}

                {/* Indicadores de puntos */}
                <div className="image-indicators">
                  {publication.images.map((_, index) => (
                    <button
                      key={index}
                      className={`indicator-dot ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Botones de filtro */}
            {hasFilters() && (
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${activeFilter === 'original' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('original')}
                  title="Original"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  Original
                </button>
                
                {(() => {
                  const images = publication.images;
                  const currentImage = Array.isArray(images) ? images[currentImageIndex] : images;
                  
                  return (
                    <>
                      {currentImage?.bw && (
                        <button 
                          className={`filter-btn ${activeFilter === 'bw' ? 'active' : ''}`}
                          onClick={() => setActiveFilter('bw')}
                          title="Blanco y Negro"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 2v20"></path>
                          </svg>
                          B/N
                        </button>
                      )}
                      
                      {currentImage?.sepia && (
                        <button 
                          className={`filter-btn ${activeFilter === 'sepia' ? 'active' : ''}`}
                          onClick={() => setActiveFilter('sepia')}
                          title="Sepia"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          Sepia
                        </button>
                      )}
                      
                      {currentImage?.cyanotype && (
                        <button 
                          className={`filter-btn ${activeFilter === 'cyanotype' ? 'active' : ''}`}
                          onClick={() => setActiveFilter('cyanotype')}
                          title="Cianotipo"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <path d="M3 9h18"></path>
                            <path d="M9 21V9"></path>
                          </svg>
                          Cianotipo
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Información inferior */}
          <div className="publication-modal-footer">
            {/* Botones de acción */}
            <div className="publication-actions">
              <button className="publication-action-btn" onClick={handleLike}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>

            {/* Likes */}
            <div className="publication-likes">
              <span className="publication-likes-count">
                {getLikesCount()} Me gusta
              </span>
            </div>

            {/* Usuario y descripción */}
            <div className="publication-info">
              <div className="publication-user-info">
                <img
                  src={getUserAvatar()}
                  alt={getUserNickname()}
                  className="publication-user-avatar"
                />
                <span className="publication-user-nickname">
                  {getUserNickname()}
                </span>
              </div>
              {publication.description && typeof publication.description === 'string' && (
                <p className="publication-description-text">
                  {publication.description}
                </p>
              )}
            </div>

            {/* Sección de comentarios */}
            <div className="publication-comments-section">
              {/* Botón para mostrar/ocultar comentarios */}
              <button 
                className="toggle-comments-btn"
                onClick={() => setShowComments(!showComments)}
              >
                {showComments ? 'Ocultar' : 'Ver'} comentarios ({comments.length})
              </button>

              {/* Lista de comentarios */}
              {showComments && (
                <div className="comments-list">
                  {comments.length === 0 ? (
                    <p className="no-comments">No hay comentarios aún. ¡Sé el primero en comentar!</p>
                  ) : (
                    comments.map((commentItem, index) => (
                      <div key={commentItem._id || index} className="comment-item">
                        <img
                          src={commentItem.user?.avatar || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect fill='%23222' width='100%25' height='100%25'/><text x='50%25' y='50%25' fill='%23fff' font-size='10' text-anchor='middle' dominant-baseline='middle'>U</text></svg>"}
                          alt={commentItem.user?.nickname || 'Usuario'}
                          className="comment-user-avatar"
                        />
                        <div className="comment-content">
                          <span className="comment-user-nickname">
                            {commentItem.user?.nickname || 'Usuario'}
                          </span>
                          <p className="comment-text">{commentItem.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Formulario para agregar comentario */}
              <form onSubmit={handleComment} className="comment-form">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="comment-input"
                  maxLength={500}
                  disabled={submittingComment}
                />
                <button 
                  type="submit" 
                  className="comment-submit-btn"
                  disabled={!comment.trim() || submittingComment}
                >
                  {submittingComment ? 'Enviando...' : 'Publicar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
