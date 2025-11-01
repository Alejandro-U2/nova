import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useToast } from '../components/ToastNotification';
import Notification from "../components/Notification";
import FollowButton from "../components/FollowButton";
import PublicationModal from "../components/PublicationModal";
import "../styles/profile.css";

export default function Profile() {
  const { id } = useParams(); // ID del perfil en la URL
  const toast = useToast();
  const [user, setUser] = useState(null); // usuario logueado
  const [profile, setProfile] = useState(null); // perfil que se está viendo
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    lastname: "",
    nickname: "",
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
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loadingFollow, setLoadingFollow] = useState(false);
  
  // Estados para modales de seguidores/siguiendo
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersData, setFollowersData] = useState([]);
  const [followingData, setFollowingData] = useState([]);

  // Estados para modal de publicación
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [showPublicationModal, setShowPublicationModal] = useState(false);
  const [currentPublicationIndex, setCurrentPublicationIndex] = useState(0);

  // Cargar datos del usuario logueado
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error al parsear datos del usuario:", error);
      }
    }
    
    // Intentar cargar datos de seguimiento desde localStorage
    try {
      const followData = JSON.parse(localStorage.getItem('followData') || '{}');
      console.log("Datos de seguimiento cargados desde localStorage:", followData);
    } catch (error) {
      console.error("Error al cargar datos de seguimiento desde localStorage:", error);
    }
  }, []);
  
  // Función para recargar datos de seguidores cuando cambiamos de página
  const reloadFollowData = useCallback(() => {
    if (profile) {
      console.log("Recargando datos de seguimiento...");
      
      // Intentar obtener el ID del USUARIO (no del perfil), priorizando el objeto user anidado
      let profileId = null;
      
      // Prioridad 1: ID del usuario anidado (este es el correcto)
      if (profile.user && profile.user._id) profileId = profile.user._id;
      else if (profile.user && profile.user.id) profileId = profile.user.id;
      // Prioridad 2: Si el perfil tiene directamente el campo user (solo el ID)
      else if (profile.user && typeof profile.user === 'string') profileId = profile.user;
      // Prioridad 3: ID directo del perfil (fallback, podría ser incorrecto)
      else if (profile._id) profileId = profile._id;
      else if (profile.id) profileId = profile.id;
      
      console.log("ID de perfil detectado para cargar contadores:", profileId);
      console.log("profile.user completo:", profile.user);
      
      if (!profileId) {
        console.error("No se pudo obtener un ID de perfil válido para cargar contadores");
        return;
      }
      
      const token = localStorage.getItem("token");
      
      // Recargar contadores usando el endpoint unificado de contadores
      fetch(`${import.meta.env.VITE_API_URL}/api/follow/counters/${profileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Datos de contadores recibidos:", data);
        if (data.status === "success") {
          setFollowersCount(data.followers || 0);
          setFollowingCount(data.following || 0);
        } else if (typeof data.followers === 'number' && typeof data.following === 'number') {
          setFollowersCount(data.followers);
          setFollowingCount(data.following);
        } else {
          console.warn("Formato de respuesta no reconocido para contadores:", data);
        }
      })
      .catch(error => console.error("Error al recargar contadores:", error));
    }
  }, [profile]);

  // Obtener perfil (propio o ajeno)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const endpoint = id
          ? `${import.meta.env.VITE_API_URL}/api/profile/user/${id}` // ✅ ruta corregida
          : `${import.meta.env.VITE_API_URL}/api/profile/me`;

        console.log("🔍 Obteniendo perfil desde:", endpoint);
        console.log("📝 ID del parámetro URL:", id);

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        console.log("📡 Respuesta del servidor:", response.status, response.statusText);

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Datos recibidos del servidor:", data);
          const profileData = data.profile || data.user;
          console.log("Datos del perfil cargados:", profileData);
          
          // Obtener datos de usuario incluyendo los que pueden estar anidados en 'user'
          // Extrayendo y separando nombre y apellido correctamente
          let fullName = profileData?.name || "";
          let firstName = "";
          let lastName = "";
          
          if (fullName && fullName.includes(" ")) {
            const nameParts = fullName.split(" ");
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(" ");
          } else {
            firstName = fullName;
          }
          
          let userData = {
            name: firstName,
            lastname: profileData?.lastname || lastName || "",
            nickname: profileData?.nickname || "",
            bio: profileData?.bio || "",
            coverPhoto: profileData?.coverPhoto || "",
            email: profileData?.email || "",
            avatar: profileData?.avatar || ""
          };
          
          // Si hay datos anidados en el objeto user, obtenerlos también
          if (profileData?.user) {
            // Procesar nombre anidado en user
            let nestedFullName = profileData.user.name || "";
            let nestedFirstName = "";
            let nestedLastName = profileData.user.lastname || "";
            
            if (nestedFullName && nestedFullName.includes(" ") && !nestedLastName) {
              const nameParts = nestedFullName.split(" ");
              nestedFirstName = nameParts[0];
              nestedLastName = nameParts.slice(1).join(" ");
            } else {
              nestedFirstName = nestedFullName;
            }
            
            userData = {
              ...userData,
              name: userData.name || nestedFirstName || "",
              lastname: userData.lastname || nestedLastName || "",
              nickname: userData.nickname || profileData.user.nickname || "",
              email: userData.email || profileData.user.email || ""
            };
          }
          
          console.log("Datos de usuario extraídos para el formulario:", userData);
          
          setProfile(profileData);
          
          // Asegurar que nombre y apellido estén correctamente separados en el formulario
          if (userData) {
            console.log("Verificando separación de nombre y apellido:", userData);
            
            // Si el nombre contiene espacio y el apellido está vacío o ambos contienen el nombre completo
            if ((userData.name && userData.name.includes(" ") && !userData.lastname) || 
                (userData.name === userData.lastname && userData.name.includes(" "))) {
              console.log("Separando nombre y apellido del campo nombre:", userData.name);
              const nameParts = userData.name.split(" ");
              userData.name = nameParts[0];
              userData.lastname = nameParts.slice(1).join(" ");
              console.log("Nombre separado:", userData.name, "Apellido separado:", userData.lastname);
            } else if (userData.name && userData.name.includes(userData.lastname) && userData.lastname) {
              // Si el nombre incluye el apellido, extraer solo el nombre
              console.log("Extrayendo nombre del nombre completo:", userData.name, "Apellido:", userData.lastname);
              userData.name = userData.name.replace(userData.lastname, "").trim();
              console.log("Nombre extraído:", userData.name);
            }
          }
          
          setEditForm(userData);

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
          const errorData = await response.json().catch(() => ({}));
          console.error("❌ Error al obtener el perfil:", response.status, response.statusText);
          console.error("❌ Detalle del error:", errorData);
          console.error("❌ URL solicitada:", endpoint);
          console.error("❌ ID del parámetro:", id);
        }
      } catch (error) {
        console.error("❌ Error al conectar con el servidor:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  // Cargar estado de seguimiento y contadores
  useEffect(() => {
    // Función para cargar datos de seguimiento del perfil
    const loadProfileFollowData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Intentar obtener el ID del USUARIO (no del perfil), priorizando el objeto user anidado
        let profileId = null;
        
        // Prioridad 1: ID del usuario anidado (este es el correcto)
        if (profile.user && profile.user._id) profileId = profile.user._id;
        else if (profile.user && profile.user.id) profileId = profile.user.id;
        // Prioridad 2: Si el perfil tiene directamente el campo user (solo el ID)
        else if (profile.user && typeof profile.user === 'string') profileId = profile.user;
        // Prioridad 3: ID directo del perfil (fallback, podría ser incorrecto)
        else if (profile._id) profileId = profile._id;
        else if (profile.id) profileId = profile.id;
        
        console.log("Cargando contadores para el perfil:", profileId);
        console.log("Objeto profile.user:", profile.user);
        
        if (!profileId) {
          console.error("No se pudo obtener un ID de perfil válido para cargar datos de seguimiento");
          return;
        }
        
        // Verificar si tenemos datos en localStorage primero
        try {
          const followData = JSON.parse(localStorage.getItem('followData') || '{}');
          if (followData[profileId] !== undefined) {
            console.log("Estado de seguimiento encontrado en localStorage:", followData[profileId]);
            setIsFollowing(followData[profileId]);
          }
        } catch (error) {
          console.error("Error al verificar datos de seguimiento en localStorage:", error);
        }
        
        // Cargar contadores de seguidores y seguidos usando el endpoint unificado
        const countersResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/counters/${profileId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (countersResponse.ok) {
          const countersData = await countersResponse.json();
          console.log("Contadores cargados (respuesta completa):", countersData);
          
          // Intentar diferentes formatos de respuesta que podría enviar el API
          if (countersData.status === "success") {
            console.log("Actualizando contadores (formato status):", countersData.followers, countersData.following);
            setFollowersCount(countersData.followers || 0);
            setFollowingCount(countersData.following || 0);
          } else if (countersData.user) {
            // Posible formato alternativo donde los datos vienen dentro de un objeto 'user'
            console.log("Actualizando contadores (formato user):", countersData.user.followers, countersData.user.following);
            setFollowersCount(countersData.user.followers || 0);
            setFollowingCount(countersData.user.following || 0);
          } else if (typeof countersData.following === 'number' && typeof countersData.followers === 'number') {
            // Formato directo sin propiedad status
            console.log("Actualizando contadores (formato directo):", countersData.followers, countersData.following);
            setFollowersCount(countersData.followers);
            setFollowingCount(countersData.following);
          } else if (Array.isArray(countersData)) {
            // Si es un array (casos especiales)
            console.log("Actualizando contadores (formato array):", countersData.length);
            if (countersData.length >= 2) {
              setFollowersCount(countersData[0] || 0);
              setFollowingCount(countersData[1] || 0);
            }
          } else {
            console.warn("Formato de respuesta no reconocido para contadores:", countersData);
          }
        } else {
          console.error("Error al obtener contadores:", await countersResponse.text());
        }

        // Solo verificar si estoy siguiendo a este usuario si NO es mi propio perfil
        if (!isOwnProfile) {
          // Usar el nuevo endpoint para verificar directamente si sigo a este usuario
          const checkFollowResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/check/${profileId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (checkFollowResponse.ok) {
            const checkData = await checkFollowResponse.json();
            console.log("Verificación directa de seguimiento:", checkData);
            if (typeof checkData.isFollowing === 'boolean') {
              console.log("Estado de seguimiento según API:", checkData.isFollowing);
              setIsFollowing(checkData.isFollowing);
              // Si la verificación directa es exitosa, terminamos aquí
              return;
            }
          }
          
          // Método alternativo (fallback) si la verificación directa falla
          console.log("Usando método alternativo para verificar seguimiento...");
          const myFollowingResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/following`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (myFollowingResponse.ok) {
            const myFollowingData = await myFollowingResponse.json();
            console.log("Datos de usuarios seguidos (completos):", myFollowingData);
            
            // Verificar estructura de datos recibida para evitar errores
            let isAlreadyFollowing = false;
            
            // Intentar diferentes formatos de respuesta que podría enviar el API
            if (myFollowingData.following && Array.isArray(myFollowingData.following)) {
              // Formato: { following: [ {followed: {...}}, ... ] }
              isAlreadyFollowing = myFollowingData.following.some(follow => {
                // Extraer ID del formato ObjectId de MongoDB
                let followedId;
                if (typeof follow.followed === 'string') {
                  followedId = follow.followed;
                } else if (follow.followed?._id) {
                  followedId = follow.followed._id;
                } else if (follow.followed) {
                  followedId = follow.followed;
                }
                
                console.log("Comparando seguido:", followedId, "con perfil:", profileId);
                // Comparamos tanto el ObjectId completo como solo el ID interno
                return followedId === profileId || 
                      (typeof followedId === 'string' && followedId.includes(profileId)) ||
                      (typeof profileId === 'string' && profileId.includes(followedId));
              });
            } else if (Array.isArray(myFollowingData)) {
              // Formato: [ {followed: {...}}, ... ]
              isAlreadyFollowing = myFollowingData.some(follow => {
                let followedId;
                if (typeof follow.followed === 'string') {
                  followedId = follow.followed;
                } else if (follow.followed?._id) {
                  followedId = follow.followed._id;
                } else if (follow.followed) {
                  followedId = follow.followed;
                } else if (follow._id) {
                  followedId = follow._id;
                } else if (follow.id) {
                  followedId = follow.id;
                }
                
                console.log("Comparando seguido (array):", followedId, "con perfil:", profileId);
                return followedId === profileId || 
                      (typeof followedId === 'string' && followedId.includes(profileId)) ||
                      (typeof profileId === 'string' && profileId.includes(followedId));
              });
            } else if (myFollowingData.users && Array.isArray(myFollowingData.users)) {
              // Formato: { users: [ {...}, ... ] }
              isAlreadyFollowing = myFollowingData.users.some(user => {
                let userId;
                if (typeof user._id === 'string') {
                  userId = user._id;
                } else if (typeof user.id === 'string') {
                  userId = user.id;
                } else if (user._id) {
                  userId = String(user._id);
                } else if (user.id) {
                  userId = String(user.id);
                }
                
                console.log("Comparando usuario:", userId, "con perfil:", profileId);
                return userId === profileId || 
                      (typeof userId === 'string' && userId.includes(profileId)) ||
                      (typeof profileId === 'string' && profileId.includes(userId));
              });
            } else if (myFollowingData.follows && Array.isArray(myFollowingData.follows)) {
              // Formato: { follows: [ {...}, ... ] }
              isAlreadyFollowing = myFollowingData.follows.some(follow => {
                let followedId;
                if (typeof follow.followed === 'string') {
                  followedId = follow.followed;
                } else if (follow.followed?._id) {
                  followedId = follow.followed._id;
                } else if (follow.followed) {
                  followedId = follow.followed;
                } else if (follow._id) {
                  followedId = follow._id;
                } else if (follow.id) {
                  followedId = follow.id;
                }
                
                console.log("Comparando seguido (follows):", followedId, "con perfil:", profileId);
                return followedId === profileId || 
                      (typeof followedId === 'string' && followedId.includes(profileId)) ||
                      (typeof profileId === 'string' && profileId.includes(followedId));
              });
            } else {
              console.warn("Formato de datos no reconocido en usuarios seguidos:", myFollowingData);
              
              // Último intento: verificar si hay un campo boolean directo
              if (typeof myFollowingData.isFollowing === 'boolean') {
                isAlreadyFollowing = myFollowingData.isFollowing;
                console.log("Usando campo isFollowing directo:", isAlreadyFollowing);
              }
            }
            
            console.log("¿Ya estoy siguiendo a este perfil?", isAlreadyFollowing, "ID perfil:", profileId);
            setIsFollowing(isAlreadyFollowing);
          } else {
            console.error("Error al obtener usuarios seguidos:", await myFollowingResponse.text());
          }
        }
      } catch (error) {
        console.error('Error loading follow data:', error);
      }
    };

    if (profile) {
      loadProfileFollowData();
    }
  }, [profile, isOwnProfile]);
  
  // Escuchar eventos de cambio de estado de seguimiento desde otras páginas
  useEffect(() => {
    // Función para manejar el evento de cambio de estado de seguimiento
    const handleFollowStatusChange = (event) => {
      const { userId, isFollowing } = event.detail;
      const profileId = profile?._id || profile?.id;
      
      // Solo actualizar si el evento está relacionado con este perfil
      if (profileId && userId === profileId) {
        console.log('Actualizando estado de seguimiento desde evento externo');
        setIsFollowing(isFollowing);
        setFollowersCount(prev => isFollowing ? prev + 1 : prev - 1);
      }
    };

    // Agregar el listener del evento
    window.addEventListener('followStatusChanged', handleFollowStatusChange);
    
    // Limpiar el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('followStatusChanged', handleFollowStatusChange);
    };
  }, [profile]);
  
  // Recargar datos de seguidores cuando cambia la URL o se monta el componente
  useEffect(() => {
    if (profile) {
      reloadFollowData();
    }
  }, [id, profile, reloadFollowData]);
  
  // Funciones para cargar y mostrar datos de seguimiento
  const loadFollowers = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Intentar obtener el ID del USUARIO (no del perfil), priorizando el objeto user anidado
      let profileId = null;
      
      // Prioridad 1: ID del usuario anidado (este es el correcto)
      if (profile.user && profile.user._id) profileId = profile.user._id;
      else if (profile.user && profile.user.id) profileId = profile.user.id;
      // Prioridad 2: Si el perfil tiene directamente el campo user (solo el ID)
      else if (profile.user && typeof profile.user === 'string') profileId = profile.user;
      // Prioridad 3: ID directo del perfil (fallback)
      else if (profile._id) profileId = profile._id;
      else if (profile.id) profileId = profile.id;
      
      console.log("Cargando seguidores para el perfil:", profileId);
      console.log("Datos completos del perfil:", profile);
      console.log("profile.user:", profile.user);
      console.log("Usando token:", token ? "Token presente" : "Token ausente");
      
      if (!profileId) {
        console.error("No se pudo obtener un ID de perfil válido para cargar seguidores");
        return;
      }
      
      // Prueba con la API normal
      let response = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/followers/${profileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn(`Error con la API normal (status ${response.status}), intentando endpoint alternativo...`);
        // Intentar con un endpoint alternativo si el primero falló
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/followers-list/${profileId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log("Seguidores cargados (respuesta completa):", data);
        
        // Intentar diferentes formatos de respuesta
        if (data.follows && Array.isArray(data.follows)) {
          console.log("Formato 'follows' detectado con", data.follows.length, "elementos");
          setFollowersData(data.follows);
        } else if (data.followers && Array.isArray(data.followers)) {
          console.log("Formato 'followers' detectado con", data.followers.length, "elementos");
          setFollowersData(data.followers);
        } else if (Array.isArray(data)) {
          console.log("Formato 'array' detectado con", data.length, "elementos");
          setFollowersData(data);
        } else if (data.users && Array.isArray(data.users)) {
          console.log("Formato 'users' detectado con", data.users.length, "elementos");
          setFollowersData(data.users);
        } else {
          console.warn("No se pudo encontrar un array de seguidores en la respuesta:", data);
          setFollowersData([]);
        }
        
        setShowFollowersModal(true);
      } else {
        const errorText = await response.text();
        console.error("Error al cargar seguidores:", response.status, errorText);
        alert("Error al cargar seguidores: " + (errorText || response.status));
      }
    } catch (error) {
      console.error("Error al cargar seguidores:", error);
      alert("Error al conectar con el servidor: " + error.message);
    }
  };
  
  const loadFollowing = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Intentar obtener el ID del USUARIO (no del perfil), priorizando el objeto user anidado
      let profileId = null;
      
      // Prioridad 1: ID del usuario anidado (este es el correcto)
      if (profile.user && profile.user._id) profileId = profile.user._id;
      else if (profile.user && profile.user.id) profileId = profile.user.id;
      // Prioridad 2: Si el perfil tiene directamente el campo user (solo el ID)
      else if (profile.user && typeof profile.user === 'string') profileId = profile.user;
      // Prioridad 3: ID directo del perfil (fallback)
      else if (profile._id) profileId = profile._id;
      else if (profile.id) profileId = profile.id;
      
      console.log("Cargando seguidos para el perfil:", profileId);
      console.log("Datos completos del perfil:", profile);
      console.log("profile.user:", profile.user);
      console.log("Usando token:", token ? "Token presente" : "Token ausente");
      
      if (!profileId) {
        console.error("No se pudo obtener un ID de perfil válido para cargar seguidos");
        return;
      }
      
      // Prueba con la API normal
      let response = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/following/${profileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn(`Error con la API normal (status ${response.status}), intentando endpoint alternativo...`);
        // Intentar con un endpoint alternativo si el primero falló
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/following-list/${profileId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log("Seguidos cargados (respuesta completa):", data);
        
        // Intentar diferentes formatos de respuesta
        if (data.follows && Array.isArray(data.follows)) {
          console.log("Formato 'follows' detectado con", data.follows.length, "elementos");
          setFollowingData(data.follows);
        } else if (data.following && Array.isArray(data.following)) {
          console.log("Formato 'following' detectado con", data.following.length, "elementos");
          setFollowingData(data.following);
        } else if (Array.isArray(data)) {
          console.log("Formato 'array' detectado con", data.length, "elementos");
          setFollowingData(data);
        } else if (data.users && Array.isArray(data.users)) {
          console.log("Formato 'users' detectado con", data.users.length, "elementos");
          setFollowingData(data.users);
        } else {
          console.warn("No se pudo encontrar un array de seguidos en la respuesta:", data);
          setFollowingData([]);
        }
        
        setShowFollowingModal(true);
      } else {
        const errorText = await response.text();
        console.error("Error al cargar seguidos:", response.status, errorText);
        alert("Error al cargar seguidos: " + (errorText || response.status));
      }
    } catch (error) {
      console.error("Error al cargar usuarios seguidos:", error);
      alert("Error al conectar con el servidor: " + error.message);
    }
  };
  
  // Función para seguir/dejar de seguir usuario
  const handleFollow = async () => {
    if (!profile) return;
    
    setLoadingFollow(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No hay token de autenticación");
        alert("Error: Debes iniciar sesión para seguir usuarios");
        setLoadingFollow(false);
        return;
      }
      
      // Intentar obtener el ID del USUARIO (no del perfil), priorizando el objeto user anidado
      let profileId = null;
      
      // Prioridad 1: ID del usuario anidado (este es el correcto)
      if (profile.user && profile.user._id) profileId = profile.user._id;
      else if (profile.user && profile.user.id) profileId = profile.user.id;
      // Prioridad 2: Si el perfil tiene directamente el campo user (solo el ID)
      else if (profile.user && typeof profile.user === 'string') profileId = profile.user;
      // Prioridad 3: ID directo del perfil (fallback, podría ser incorrecto)
      else if (profile._id) profileId = profile._id;
      else if (profile.id) profileId = profile.id;
      
      console.log("Intentando seguir/dejar de seguir al usuario con ID:", profileId);
      console.log("Datos completos del perfil:", profile);
      console.log("Objeto user dentro del perfil:", profile.user);
      
      if (!profileId) {
        console.error("No se pudo obtener un ID de perfil válido para seguir/dejar de seguir");
        alert("Error: No se pudo identificar el perfil");
        setLoadingFollow(false);
        return;
      }
      
      // Obtener el ID del usuario logueado para verificación
      const loggedUser = JSON.parse(localStorage.getItem("user"));
      const myUserId = loggedUser && (loggedUser._id || loggedUser.id);
      
      if (!myUserId) {
        console.error("No se pudo obtener el ID del usuario logueado");
        alert("Error: Debes iniciar sesión para seguir usuarios");
        setLoadingFollow(false);
        return;
      }
      
      if (profileId === myUserId) {
        console.error("No puedes seguirte a ti mismo");
        alert("Error: No puedes seguirte a ti mismo");
        setLoadingFollow(false);
        return;
      }
      
      const action = isFollowing ? 'unfollow' : 'follow';
      const method = isFollowing ? 'DELETE' : 'POST';
      
      console.log(`Enviando petición ${method} a ${import.meta.env.VITE_API_URL}/api/follow/${action}/${profileId}`);
      
      // Intentar convertir cualquier formato de ObjectId a string para la URL
      const cleanProfileId = typeof profileId === 'object' ? 
        (profileId.toString ? profileId.toString() : JSON.stringify(profileId)) : 
        String(profileId);
        
      console.log("ID de perfil limpio para la petición:", cleanProfileId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/${action}/${cleanProfileId}`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Respuesta del servidor:", data);
        console.log(data.message || "Operación exitosa sin mensaje");
        
        // Actualizar estado local
        setIsFollowing(!isFollowing);
        
        // Actualizar contador de seguidores
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
        
        // Disparar evento global para informar a otros componentes
        const followEvent = new CustomEvent('followStatusChanged', {
          detail: {
            userId: profileId,
            isFollowing: !isFollowing
          }
        });
        window.dispatchEvent(followEvent);
        
        // Actualizar datos en localStorage para mantener todo sincronizado
        try {
          // Guardar el nuevo estado en localStorage para persistirlo entre recargas
          const followData = JSON.parse(localStorage.getItem('followData') || '{}');
          followData[profileId] = !isFollowing;
          localStorage.setItem('followData', JSON.stringify(followData));
        } catch (err) {
          console.error("Error al guardar estado de seguimiento en localStorage:", err);
        }
        
        // Refrescar datos de seguimiento para asegurar coherencia
        setTimeout(() => {
          if (profile) {
            const loadProfileFollowData = async () => {
              try {
                const countersResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/counters/${profileId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (countersResponse.ok) {
                  const countersData = await countersResponse.json();
                  console.log("Contadores actualizados:", countersData);
                  
                  if (countersData.followers !== undefined) {
                    setFollowersCount(countersData.followers);
                  }
                }
              } catch (err) {
                console.error("Error al refrescar contadores:", err);
              }
            };
            
            loadProfileFollowData();
          }
        }, 1000);
      } else {
        try {
          const errorData = await response.json();
          console.error('Error al seguir/dejar de seguir:', errorData.message);
          alert(`Error: ${errorData.message || "Error desconocido"}`);
        } catch {
          // Si hay un error al parsear el JSON, intentamos leer el texto
          try {
            const errorText = await response.text();
            console.error('Error al seguir/dejar de seguir. Respuesta:', errorText);
            alert(`Error: ${response.status} - ${errorText || "Error desconocido"}`);
          } catch (error) {
            console.error('Error al leer respuesta:', error);
            alert(`Error: ${response.status} - No se pudo obtener detalles del error`);
          }
        }
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
      alert('Error de conexión');
    } finally {
      setLoadingFollow(false);
    }
  };

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
          `${import.meta.env.VITE_API_URL}/api/publications/user/${targetId}`,
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
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Manejar caso especial para el nickname (agregar @ si no lo tiene)
    if (name === 'nickname' && value && !value.startsWith('@') && value.trim() !== '') {
      setEditForm({
        ...editForm,
        [name]: `@${value}`,
      });
    } else {
      setEditForm({
        ...editForm,
        [name]: value,
      });
    }
  };

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
      
      // Asegurarse de que el nickname no tenga el símbolo @ al inicio
      if (dataToSend.nickname && dataToSend.nickname.startsWith('@')) {
        dataToSend.nickname = dataToSend.nickname.substring(1);
      }
      
      // Asegurarse de que nombre y apellido estén presentes y separados correctamente
      if (!dataToSend.name) dataToSend.name = "";
      if (!dataToSend.lastname) dataToSend.lastname = "";
      
      // Verificar que no haya datos duplicados entre nombre y apellido
      if (dataToSend.name.includes(dataToSend.lastname) && dataToSend.lastname) {
        dataToSend.name = dataToSend.name.replace(dataToSend.lastname, "").trim();
      }

      if (selectedFiles.coverPhoto && uploadMethod.coverPhoto === "file") {
        dataToSend.coverPhoto = await convertFileToBase64(
          selectedFiles.coverPhoto
        );
      }
      if (selectedFiles.avatar && uploadMethod.avatar === "file") {
        dataToSend.avatar = await convertFileToBase64(selectedFiles.avatar);
      }

      console.log("Enviando datos actualizados del perfil:", dataToSend);
      
      const response = await fetch("${import.meta.env.VITE_API_URL}/api/profile/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Respuesta al actualizar perfil:", data);
        
        // Actualizar el perfil con los datos recibidos o con los enviados si no se reciben
        if (data.profile) {
          setProfile(data.profile);
        } else if (data.user) {
          setProfile(data.user);
        } else {
          // Si no viene el perfil en la respuesta, actualizamos con lo que enviamos
          setProfile(prev => ({...prev, ...dataToSend}));
        }
        
        // Actualizar usuario en localStorage si corresponde
        try {
          const userData = JSON.parse(localStorage.getItem('user'));
          if (userData && (userData._id === profile._id || userData.id === profile.id)) {
            // Es el usuario logueado, actualizamos sus datos en localStorage
            const updatedUser = {
              ...userData, 
              name: dataToSend.name || userData.name,
              lastname: dataToSend.lastname || userData.lastname,
              nickname: dataToSend.nickname || userData.nickname
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            console.log("Usuario actualizado en localStorage:", updatedUser);
          }
        } catch (err) {
          console.error("Error al actualizar usuario en localStorage:", err);
        }
        
        setIsEditing(false);
        
        // Mostrar notificación de éxito
        setNotification({
          message: 'Cambios completados',
          type: 'success'
        });
        
        // Ocultar notificación después de 3 segundos
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } else {
        const errorData = await response.text();
        console.error("Error al actualizar el perfil:", errorData);
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
    }
  };

  // --- Funciones del modal de publicación ---
  const handlePublicationClick = (publication, index) => {
    setSelectedPublication(publication);
    setCurrentPublicationIndex(index);
    setShowPublicationModal(true);
  };

  const handleClosePublicationModal = () => {
    setShowPublicationModal(false);
    setSelectedPublication(null);
  };

  const handleNextPublication = () => {
    if (currentPublicationIndex < publications.length - 1) {
      const nextIndex = currentPublicationIndex + 1;
      setCurrentPublicationIndex(nextIndex);
      setSelectedPublication(publications[nextIndex]);
    }
  };

  const handlePrevPublication = () => {
    if (currentPublicationIndex > 0) {
      const prevIndex = currentPublicationIndex - 1;
      setCurrentPublicationIndex(prevIndex);
      setSelectedPublication(publications[prevIndex]);
    }
  };

  // --- Función para manejar cuando se agrega un comentario ---
  const handleCommentAdded = (publicationId, newComment) => {
    // Actualizar el array de publicaciones
    setPublications(prevPublications => 
      prevPublications.map(pub => {
        if (pub._id === publicationId) {
          // Agregar el nuevo comentario a la publicación
          const updatedComments = [...(pub.comments || []), newComment];
          return { ...pub, comments: updatedComments };
        }
        return pub;
      })
    );

    // Actualizar la publicación seleccionada también
    if (selectedPublication && selectedPublication._id === publicationId) {
      const updatedComments = [...(selectedPublication.comments || []), newComment];
      setSelectedPublication({ ...selectedPublication, comments: updatedComments });
    }
  };

  // --- Función para eliminar publicación ---
  const handleDeletePublication = async (publicationId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) {
      return;
    }

    const toast = useToast();

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/publications/${publicationId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        // Actualizar la lista de publicaciones
        setPublications(prevPublications => 
          prevPublications.filter(pub => pub._id !== publicationId)
        );
        
        // Cerrar el modal si está abierto
        if (showPublicationModal) {
          setShowPublicationModal(false);
          setSelectedPublication(null);
        }

        toast.success("🗑️ Publicación eliminada exitosamente");
        setNotification({
          message: "✅ Publicación eliminada exitosamente",
          type: "success",
        });
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.message || "Error al eliminar la publicación";
        toast.error(`❌ ${errorMsg}`);
        setNotification({
          message: `❌ ${errorMsg}`,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error al eliminar publicación:", error);
      const errorMsg = "Error al eliminar la publicación";
      toast.error(`❌ ${errorMsg}`);
      setNotification({
        message: `❌ ${errorMsg}`,
        type: "error",
      });
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
  
  // Verificar que el perfil tiene al menos algún dato básico
  const hasValidProfileData = profile && (
    (profile.name || profile.nickname || (profile.user && (profile.user.name || profile.user.nickname)))
  );
  
  if (!hasValidProfileData) {
    console.error("Datos del perfil incompletos:", profile);
    return (
      <div className="profile-container">
        <div className="error-message">
          <h2>Datos de perfil incompletos</h2>
          <p>No se pudieron cargar los datos completos del perfil.</p>
          <button onClick={() => window.location.reload()} className="primary-btn">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const displayData = profile;
  // Imprimir el perfil completo para depuración
  console.log("Datos de perfil para mostrar:", displayData);
  
  // Obtener el nickname del usuario (puede estar anidado en el objeto 'user')
  let userNickname = '';
  if (displayData.nickname) {
    userNickname = displayData.nickname;
  } else if (displayData.user && displayData.user.nickname) {
    userNickname = displayData.user.nickname;
  }
  
  // Asegurarnos de que el nickname tenga el símbolo @ al principio
  const nickname = userNickname
    ? userNickname.startsWith('@') 
      ? userNickname 
      : `@${userNickname}`
    : '@usuario';
    
  console.log("Nickname detectado:", userNickname, "-> Formateado como:", nickname);

  return (
    <div className="profile-container">
      {/* Notificación flotante */}
      {notification && (
        <Notification 
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
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
            <h2 className="user-name">
              {/* Mostrar el nombre completo según la estructura del objeto, priorizando los datos del perfil principal */}
              {displayData.user ? 
                `${displayData.user.name || ""} ${displayData.user.lastname || ""}`.trim() : 
                (displayData.name ? 
                  `${displayData.name || ""} ${displayData.lastname || ""}`.trim() : 
                  "Usuario")}
            </h2>
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
              <button 
                className={`primary-btn ${isFollowing ? 'following' : ''}`}
                onClick={handleFollow}
                disabled={loadingFollow}
              >
                {loadingFollow ? 'Cargando...' : (isFollowing ? 'Siguiendo' : 'Seguir')}
              </button>
            )}
          </div>
        </div>

        {/* --- ESTADÍSTICAS --- */}
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-number">{publications.length}</span>
            <span className="stat-label">Publicaciones</span>
          </div>
          <div className="stat-item clickable" onClick={loadFollowers}>
            <span className="stat-number">{followersCount}</span>
            <span className="stat-label">Seguidores</span>
          </div>
          <div className="stat-item clickable" onClick={loadFollowing}>
            <span className="stat-number">{followingCount}</span>
            <span className="stat-label">Siguiendo</span>
          </div>
        </div>
        
        {/* Modal de Seguidores */}
        {showFollowersModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Seguidores</h3>
                <button className="close-btn" onClick={() => setShowFollowersModal(false)}>×</button>
              </div>
              <div className="modal-content">
                {followersData.length === 0 ? (
                  <p className="empty-list">No hay seguidores aún</p>
                ) : (
                  <ul className="users-list">
                    {followersData.map((follow, index) => {
                      // Intentar extraer la información del usuario según diferentes estructuras de datos
                      let userData = null;
                      if (follow.user) {
                        userData = follow.user;  // Estructura {user: {...}}
                      } else if (follow.follower) {
                        userData = follow.follower;  // Estructura {follower: {...}}
                      } else if (follow.name || follow.nickname) {
                        userData = follow;  // El objeto ya es el usuario
                      } else if (typeof follow === 'object') {
                        userData = follow;  // Cualquier otro objeto
                      }
                      
                      if (!userData) {
                        console.warn('Formato de seguidor no reconocido:', follow);
                        userData = { name: 'Usuario' };
                      }
                      
                      const displayName = userData.name || 'Usuario';
                      const nickname = userData.nickname 
                        ? userData.nickname.startsWith('@') 
                          ? userData.nickname 
                          : `@${userData.nickname}`
                        : `@${displayName.toLowerCase().replace(/\s+/g, '')}`;
                      
                      // Obtener el ID del usuario
                      const followUserId = userData._id || userData.id;
                      
                      // Verificar si es el usuario actual
                      const currentUserId = localStorage.getItem('user') 
                        ? JSON.parse(localStorage.getItem('user'))._id || JSON.parse(localStorage.getItem('user')).id
                        : null;
                      const isCurrentUser = followUserId === currentUserId;
                        
                      return (
                        <li key={userData._id || index} className="user-item">
                          <div 
                            className="user-avatar clickable"
                            onClick={() => window.location.href = `/profile/${followUserId}`}
                            style={{ cursor: 'pointer' }}
                          >
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-info">
                            <h4>{displayName}</h4>
                            <p>{nickname}</p>
                          </div>
                          {!isCurrentUser && (
                            <FollowButton 
                              userId={followUserId}
                              onFollowChange={() => {
                                // Recargar los datos de seguidores cuando cambie el estado
                                loadFollowers();
                                // Recargar los contadores de seguidores/siguiendo
                                reloadFollowData();
                              }}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de Seguidos */}
        {showFollowingModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Siguiendo</h3>
                <button className="close-btn" onClick={() => setShowFollowingModal(false)}>×</button>
              </div>
              <div className="modal-content">
                {followingData.length === 0 ? (
                  <p className="empty-list">No sigues a nadie aún</p>
                ) : (
                  <ul className="users-list">
                    {followingData.map((follow, index) => {
                      // Intentar extraer la información del usuario según diferentes estructuras de datos
                      let userData = null;
                      if (follow.followed) {
                        userData = follow.followed;  // Estructura {followed: {...}}
                      } else if (follow.following) {
                        userData = follow.following;  // Estructura {following: {...}}
                      } else if (follow.name || follow.nickname) {
                        userData = follow;  // El objeto ya es el usuario
                      } else if (typeof follow === 'object') {
                        userData = follow;  // Cualquier otro objeto
                      }
                      
                      if (!userData) {
                        console.warn('Formato de seguido no reconocido:', follow);
                        userData = { name: 'Usuario' };
                      }
                      
                      const displayName = userData.name || 'Usuario';
                      const nickname = userData.nickname 
                        ? userData.nickname.startsWith('@') 
                          ? userData.nickname 
                          : `@${userData.nickname}`
                        : `@${displayName.toLowerCase().replace(/\s+/g, '')}`;
                      
                      // Obtener el ID del usuario
                      const followUserId = userData._id || userData.id;
                      
                      // Verificar si es el usuario actual
                      const currentUserId = localStorage.getItem('user') 
                        ? JSON.parse(localStorage.getItem('user'))._id || JSON.parse(localStorage.getItem('user')).id
                        : null;
                      const isCurrentUser = followUserId === currentUserId;
                        
                      return (
                        <li key={userData._id || index} className="user-item">
                          <div 
                            className="user-avatar clickable"
                            onClick={() => window.location.href = `/profile/${followUserId}`}
                            style={{ cursor: 'pointer' }}
                          >
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-info">
                            <h4>{displayName}</h4>
                            <p>{nickname}</p>
                          </div>
                          {!isCurrentUser && (
                            <FollowButton 
                              userId={followUserId}
                              onFollowChange={() => {
                                // Recargar los datos de seguidos cuando cambie el estado
                                loadFollowing();
                                // Recargar los contadores de seguidores/siguiendo
                                reloadFollowData();
                              }}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PUBLICACIONES --- */}
        <div className="user-publications">
          <h3 className="section-title">Publicaciones</h3>
          <div className="publications-grid">
            {publications.length > 0 ? (
              publications.map((publication, index) => (
                <div 
                  key={publication._id || index} 
                  className="publication-item"
                  onClick={() => handlePublicationClick(publication, index)}
                  style={{ cursor: 'pointer' }}
                >
                  {isOwnProfile && (
                    <button
                      className="publication-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // Evitar que se abra el modal
                        handleDeletePublication(publication._id);
                      }}
                      title="Eliminar publicación"
                    >
                      ×
                    </button>
                  )}
                  <img
                    src={
                      (publication.images && Array.isArray(publication.images) && publication.images.length > 0)
                        ? (publication.images[0].scaled || publication.images[0].original)
                        : (publication.images && (publication.images.scaled || publication.images.original)) ||
                          publication.image ||
                          publication.imageUrl ||
                          publication.thumbnail ||
                          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><rect fill='%23000000' width='100%' height='100%'/><text x='50%' y='50%' fill='%23ffffff' font-size='18' text-anchor='middle' dominant-baseline='middle'>Sin imagen</text></svg>"
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
          <div className="modal edit-modal">
            <div className="modal-header">
              <h2 className="edit-title">Editar perfil</h2>
              <button className="close-btn" onClick={handleEditToggle}>
                ✕
              </button>
            </div>

            <div className="modal-content edit-form">
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

              {/* Apellido */}
              <div className="form-group">
                <label className="form-label">Apellido</label>
                <input
                  type="text"
                  name="lastname"
                  value={editForm.lastname}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Tu apellido"
                />
              </div>

              {/* Nickname */}
              <div className="form-group">
                <label className="form-label">Nickname</label>
                <input
                  type="text"
                  name="nickname"
                  value={editForm.nickname && editForm.nickname.startsWith('@') ? editForm.nickname : editForm.nickname ? `@${editForm.nickname}` : ""}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Tu nickname (sin @)"
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

      {/* --- MODAL DE PUBLICACIÓN --- */}
      {showPublicationModal && selectedPublication && (
        <PublicationModal
          publication={selectedPublication}
          userProfile={profile}
          onClose={handleClosePublicationModal}
          onNext={handleNextPublication}
          onPrev={handlePrevPublication}
          hasNext={currentPublicationIndex < publications.length - 1}
          hasPrev={currentPublicationIndex > 0}
          onDelete={handleDeletePublication}
          isOwnProfile={isOwnProfile}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  );
}
