import React, { useState, useEffect } from 'react';
import { api } from '../services/Api';
import { Search, Star, BookOpen, Lock, X, ChefHat, Heart, CheckCircle } from 'lucide-react';

const UserDashboard = () => {
  const [recipes, setRecipes] = useState([]);
  const [library, setLibrary] = useState({ subscriptions: [], favorites: [] });
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedChef, setSelectedChef] = useState(null);
  const [filters, setFilters] = useState({ search: '', categoria: '', orden: 'reciente' });
  const [userData, setUserData] = useState(null);  
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState({}); // Para evitar clicks múltiples

  // Obtener el ID 
  const userId = localStorage.getItem('userId');

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!userId || userId === 'null' || userId === 'undefined') {
        window.location.href = '/AuthPage';
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/users');
        const users = await response.json();
        
        console.log('📋 Lista de usuarios:', users);
        
        if (users.status === 'ok' && users.data) {
          const foundUser = users.data.find(u => u.id_usuario === parseInt(userId) || u.id === parseInt(userId));
          
          if (foundUser) {
            setUserData({
              nombre: foundUser.nombre || foundUser.nombre_usuario || 'Suscriptor',
              id_usuario: userId,
              email: foundUser.email || foundUser.correo
            });
          } else {
            setUserData({ 
              nombre: 'Suscriptor', 
              id_usuario: userId,
              email: ''
            });
          }
        } else {
          setUserData({ 
            nombre: 'Suscriptor', 
            id_usuario: userId,
            email: ''
          });
        }
      } catch (err) {
        console.error('Error cargando datos del usuario:', err);
        setUserData({ 
          nombre: 'Suscriptor', 
          id_usuario: userId,
          email: ''
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, [userId]);

  const HandleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    window.location.href = '/AuthPage';
  };

  // Cargar recetas y librería
  useEffect(() => {
    if (userId && userId !== 'null' && userId !== 'undefined') {
      loadData();
    }
  }, [filters, userId]);

  const loadData = async () => {
    if (!userId) return;
    
    try {
      const resRecs = await api.exploreRecipes(filters);
      const resLib = await api.getUserLibrary(userId);
      
      if (resRecs.status === 'ok') setRecipes(resRecs.data);
      if (resLib.status === 'ok') setLibrary(resLib.data);
    } catch (err) { 
      console.error("Error cargando dashboard", err); 
    }
  };

  // Verificar si está suscrito a un chef
  const isSubscribed = (id_chef) => {
    const subs = library.subscriptions || [];
    const sub = subs.find(s => s.id_chef === id_chef);
    return sub && new Date(sub.fecha_fin) >= new Date();
  };

  // Verificar si una receta está en favoritos
  const isFavorite = (id_receta) => {
    const favs = library.favorites || [];
    return favs.some(f => f.id_receta === id_receta);
  };

  // Alternar favorito
  const toggleFavorite = async (id_receta) => {
    if (!userId) return;
    
    // Prevenir múltiples clicks
    if (favoriteLoading[id_receta]) return;
    
    setFavoriteLoading(prev => ({ ...prev, [id_receta]: true }));
    
    try {
      const res = await api.toggleFavorite(parseInt(userId), id_receta);
      
      if (res.status === 'ok') {
        // Recargar los datos para actualizar la lista de favoritos
        await loadData();
      } else {
        alert(res.message || 'Error al guardar favorito');
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Error de conexión al guardar favorito');
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [id_receta]: false }));
    }
  };

  // Formatear fecha de expiración
  const formatExpirationDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calcular días restantes
  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF0]">
        <div className="text-center">
          <ChefHat className="mx-auto text-orange-500 animate-bounce" size={50} />
          <p className="mt-4 text-stone-500 font-serif">Cargando tu bóveda personal...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  // Obtener suscripciones activas
  const activeSubscriptions = (library.subscriptions || []).filter(sub => 
    new Date(sub.fecha_fin) >= new Date()
  );

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-serif">
      {/* HEADER */}
      <header className="bg-white border-b p-8 flex items-center gap-6 shadow-sm relative">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 border-2 border-orange-200">
          <ChefHat size={35} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Hola, {userData.nombre || 'Suscriptor'}</h1>
          <p className="text-stone-500 italic">Bienvenido a tu cocina</p>
        </div>
      </header>

      {/* BOTÓN CERRAR SESIÓN */}
      <button 
        onClick={HandleLogout}
        className="fixed top-6 right-8 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold shadow-md transition-colors z-10"
      >
        Cerrar Sesión
      </button>

      <main className="max-w-7xl mx-auto p-10 grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* COLUMNA IZQUIERDA - MI LIBRO Y SUSCRIPCIONES */}
        <section className="lg:col-span-1 space-y-6">
          
          {/* SUSCRIPCIONES ACTIVAS */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-800">
              <CheckCircle size={20} /> Mis Libros
            </h2>
            
            {activeSubscriptions.length === 0 ? (
              <div className="text-center py-6 px-4 border-2 border-dashed rounded-2xl bg-stone-50">
                <p className="text-sm text-stone-400 italic">
                  Aún no tienes suscripciones activas.
                </p>
                <p className="text-xs text-stone-300 mt-2">
                  Explora recetas y suscríbete a tus chefs favoritos.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSubscriptions.map(sub => {
                  const daysLeft = getDaysRemaining(sub.fecha_fin);
                  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
                  
                  return (
                    <div key={sub.id_suscripcion} className="p-3 bg-stone-50 rounded-xl border-l-4 border-orange-400">
                      <p className="font-bold text-stone-800">{sub.nombre_chef}</p>
                      <p className="text-xs text-stone-500 mt-1">
                        Vence: {formatExpirationDate(sub.fecha_fin)}
                      </p>
                      {isExpiringSoon ? (
                        <p className="text-xs text-orange-600 font-bold mt-1">
                          ⚠️ {daysLeft} días restantes
                        </p>
                      ) : (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Activo
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RECETAS FAVORITAS */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-800">
              <Heart size={20} /> Mis Favoritos
            </h2>
            
            {!library.favorites || library.favorites.length === 0 ? (
              <div className="text-center py-6 px-4 border-2 border-dashed rounded-2xl bg-stone-50">
                <p className="text-sm text-stone-400 italic">
                  No tienes recetas favoritas aún.
                </p>
                <p className="text-xs text-stone-300 mt-2">
                  Haz clic en la estrella ⭐ de cualquier receta para guardarla aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {library.favorites.map(f => (
                  <div key={f.id_receta} className="p-3 bg-stone-50 rounded-xl text-sm border-l-4 border-orange-400 hover:bg-orange-50 transition-colors">
                    <p className="font-bold truncate text-stone-800">{f.titulo}</p>
                    <p className="text-[10px] text-stone-400 uppercase mt-1">Chef: {f.nombre_chef}</p>
                    <button 
                      onClick={() => toggleFavorite(f.id_receta)}
                      className="text-xs text-red-500 hover:text-red-700 mt-2 flex items-center gap-1"
                    >
                      <Heart size={12} fill="currentColor" /> Quitar de favoritos
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* COLUMNA DERECHA - EXPLORACIÓN DE RECETAS */}
        <section className="lg:col-span-3">
          <div className="mb-8 relative">
            <Search className="absolute left-4 top-3.5 text-stone-300" size={20} />
            <input 
              type="text" 
              placeholder="¿Qué secreto culinario buscas hoy?"
              className="w-full pl-12 pr-6 py-4 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-orange-500 bg-white"
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {!recipes || recipes.length === 0 ? (
              <div className="col-span-2 py-20 text-center">
                <ChefHat className="mx-auto text-stone-200 mb-4" size={50} />
                <p className="text-stone-400 italic">No encontramos recetas con esos criterios...</p>
              </div>
            ) : (
              recipes.map(r => (
                <div key={r.id_receta} className="bg-white rounded-[2rem] p-8 shadow-sm border border-stone-50 hover:shadow-xl transition-all duration-300 relative">
                  
                  {/* Botón de favorito (estrella) */}
                  <button 
                    onClick={() => toggleFavorite(r.id_receta)}
                    disabled={favoriteLoading[r.id_receta]}
                    className="absolute top-6 right-6 text-yellow-500 hover:scale-110 transition-transform"
                  >
                    <Star 
                      size={24} 
                      fill={isFavorite(r.id_receta) ? "currentColor" : "none"}
                      className={isFavorite(r.id_receta) ? "text-yellow-500" : "text-gray-300"}
                    />
                  </button>

                  <div className="flex justify-between items-start mb-4 pr-8">
                    <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-3 py-1 rounded-full uppercase tracking-widest">
                      {r.nombre_categoria}
                    </span>
                    <div className="flex items-center gap-1 text-orange-500 font-bold">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm">{r.valoracion || 5}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-stone-800 mb-2">{r.titulo}</h3>
                  <p className="text-stone-500 text-sm mb-6 line-clamp-2 italic">By Chef {r.nombre_chef}</p>

                  <div className="pt-6 border-t border-stone-50">
                    {isSubscribed(r.id_chef) ? (
                      <button className="w-full bg-stone-800 text-white py-3 rounded-2xl font-bold hover:bg-orange-700 transition-colors">
                        Abrir Receta
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setSelectedChef(r); setShowPayModal(true); }}
                        className="w-full border-2 border-orange-600 text-orange-600 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-50"
                      >
                        <Lock size={18}/> Desbloquear Contenido
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* MODAL DE PAGO */}
      {showPayModal && selectedChef && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full relative shadow-2xl">
            <button onClick={() => setShowPayModal(false)} className="absolute top-8 right-8 text-stone-300 hover:text-stone-800">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-center mb-2">Suscripción Premium</h2>
            <p className="text-center text-stone-500 mb-8">Accede a todos los secretos del Chef <span className="font-bold text-stone-800">{selectedChef.nombre_chef}</span></p>
            
            <div className="space-y-3 mb-8">
              {[3, 6, 12].map(m => (
                <button 
                  key={m}
                  onClick={() => handleSimulatedPayment(m, selectedChef.id_chef)}
                  className="w-full p-4 border-2 border-stone-100 rounded-2xl flex justify-between items-center hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <span className="font-bold">{m} Meses</span>
                  <span className="text-orange-600 font-black">${m === 3 ? 150 : m === 6 ? 250 : 400} MXN</span>
                </button>
              ))}
            </div>
            <p className="text-[9px] text-center text-stone-300 uppercase tracking-widest">Pago simulado • Sistema académico de criptografía</p>
          </div>
        </div>
      )}
    </div>
  );

  // Función para manejar el pago simulado
  async function handleSimulatedPayment(meses, id_chef) {
    if (!userId) {
      alert('Error: No se encontró el usuario');
      return;
    }
    
    try {
      const res = await api.createSubscription({
        id_usuario: parseInt(userId),
        id_chef: id_chef,
        periodo_meses: meses,
        costo: meses === 3 ? 150 : meses === 6 ? 250 : 400,
        datos_pago: { numero_tarjeta: "4242424242424242" }
      });
      
      if (res.status === 'ok') {
        alert(res.message || '¡Suscripción exitosa! Ahora puedes acceder a las recetas.');
        setShowPayModal(false);
        loadData(); // Recargar datos
      } else {
        alert(res.message || 'Error al procesar la suscripción');
      }
    } catch (err) {
      console.error('Error en suscripción:', err);
      alert('Error de conexión con el servidor');
    }
  }
};

export default UserDashboard;