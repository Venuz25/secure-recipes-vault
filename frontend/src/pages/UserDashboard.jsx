import React, { useState, useEffect } from 'react';
import { api } from '../services/Api';
import { Search, Star, BookOpen, Lock, X, ChefHat, Heart, CheckCircle } from 'lucide-react';
import PaymentModal from '../components/PaymentModal'
import RecipeBookModal from '../components/RecipeBookModal';

// CONFIGURACIÓN GLOBAL DE FONDOS DE PANTALLA
const modulosFondos = import.meta.glob('../assets/fondosSubscriptor/*.{jpg,jpeg,png,webp}', { eager: true });
const catalogoFondos = Object.values(modulosFondos).map((modulo) => modulo.default);

const UserDashboard = () => {
  // Sesión y Usuario
  const userId = localStorage.getItem('userId');
  const [userData, setUserData] = useState(null);  
  
  // Datos Principales
  const [recipes, setRecipes] = useState([]);
  const [library, setLibrary] = useState({ subscriptions: [], favorites: [] });
  const [categories, setCategories] = useState([]);
  
  // UI y Filtros
  const [loading, setLoading] = useState(true);
  const [fondoAleatorio, setFondoAleatorio] = useState(catalogoFondos[0] || '');
  const [filters, setFilters] = useState({ search: '', categoria: '', orden: 'reciente', dificultad: '', estrellas: '' });
  const [favoriteLoading, setFavoriteLoading] = useState({});
  
  // Modales y Chef
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [loadingChef, setLoadingChef] = useState(false);
  const [chefDetails, setChefDetails] = useState(null);
  const [selectedChef, setSelectedChef] = useState(null);
  const [selectedPlanPreview, setSelectedPlanPreview] = useState(3);
  const [bookConfig, setBookConfig] = useState({ isOpen: false, mode: 'single', data: null, initialId: null });

  // Cargar fondo aleatorio
  useEffect(() => {
    if (catalogoFondos.length > 0) {
      const indiceAzar = Math.floor(Math.random() * catalogoFondos.length);
      setFondoAleatorio(catalogoFondos[indiceAzar]);
    }
  }, []);

  // Cargar datos completos del usuario y librería
  useEffect(() => {
    if (!userId || userId === 'null' || userId === 'undefined') {
      window.location.href = '/AuthPage';
      return;
    }

  const loadInitialData = async () => {
    try {
      // 1. Datos del usuario
      const resUsers = await fetch('http://localhost:3000/api/users');
      const users = await resUsers.json();
      
      if (users.status === 'ok' && users.data) {
        const foundUser = users.data.find(u => u.id_usuario === parseInt(userId) || u.id === parseInt(userId));
        setUserData(foundUser ? { nombre: foundUser.nombre || foundUser.nombre_usuario || 'Suscriptor', id_usuario: userId, email: foundUser.email || foundUser.correo } : { nombre: 'Suscriptor', id_usuario: userId, email: '' });
      }

      // 2. Cargar Recetas, Librería y Categorías de golpe
      const [resRecs, resLib, resCats] = await Promise.all([
        api.exploreRecipes({}), // Pedimos todas sin filtros, el navegador filtrará
        api.getUserLibrary(userId),
        api.getCategories()
      ]);

      if (resRecs.status === 'ok') setRecipes(resRecs.data);
      if (resLib.status === 'ok') setLibrary(resLib.data);
      if (resCats?.status === 'ok') setCategories(resCats.data);

    } catch (err) {
      console.error('Error cargando el dashboard:', err);
      setUserData({ nombre: 'Suscriptor', id_usuario: userId, email: '' });
    } finally {
      setLoading(false);
    }
  };

  loadInitialData();
  }, [userId]);

  // ACCIONES DEL USUARIO (HANDLERS)
  const HandleLogout = () => {
    localStorage.clear();
    window.location.href = '/AuthPage';
  };

  const handleOpenPayModal = async (recipe) => {
    setSelectedChef(recipe);
    setShowPayModal(true);
    setLoadingChef(true);
    setChefDetails(null);
    
    try {
      const res = await api.getPublicChefProfile(recipe.id_chef);
      if (res.status === 'ok') setChefDetails(res.data);
    } catch (err) {
      console.error("Error de red:", err);
    } finally {
      setLoadingChef(false);
    }
  };

  const toggleFavorite = async (id_receta) => {
    if (!userId || favoriteLoading[id_receta]) return;
    setFavoriteLoading(prev => ({ ...prev, [id_receta]: true }));
    
    try {
      const res = await api.toggleFavorite(parseInt(userId), id_receta);
      if (res.status === 'ok') {
        const resLib = await api.getUserLibrary(userId);
        if (resLib.status === 'ok') setLibrary(resLib.data);
      } else {
        alert(res.message || 'Error al guardar favorito');
      }
    } catch (err) {
      alert('Error de conexión al guardar favorito');
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [id_receta]: false }));
    }
  };

  const handleCancelSubscription = async (id_contrato) => {
    try {
      const res = await api.cancelUserSubscription(id_contrato);
      
      if (res.status === 'ok') {
        alert(res.message);
        window.location.reload();
      } else {
        alert(res.message || 'No se pudo cancelar la suscripción.');
      }
    } catch (error) {
      alert('Hubo un problema de conexión al intentar cancelar.');
    }
  };

  // FUNCIONES AUXILIARES (HELPERS)
  const isSubscribed = (id_chef) => {
    return library.subscriptions?.some(s => s.id_chef === id_chef && new Date(s.fecha_fin) >= new Date());
  };

  const isFavorite = (id_receta) => {
    return library.favorites?.some(f => f.id_receta === id_receta);
  };

  const formatExpirationDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDaysRemaining = (endDate) => {
    return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  // FILTROS CLIENTE
  const activeSubscriptions = (library.subscriptions || []).filter(sub => new Date(sub.fecha_fin) >= new Date());

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.titulo.toLowerCase().includes(filters.search.toLowerCase()) || 
                          (r.nombre_chef && r.nombre_chef.toLowerCase().includes(filters.search.toLowerCase()));
    const matchesCategory = filters.categoria === '' || r.id_categoria?.toString() === filters.categoria;
    const matchesDifficulty = filters.dificultad === '' || r.dificultad === filters.dificultad;
    const ratingValue = r.valoracion || r.estrellas || 0;
    const matchesStars = filters.estrellas === '' || ratingValue >= parseInt(filters.estrellas);
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesStars;
  });

  // RENDERIZADO DE PANTALLAS DE CARGA
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

  if (!userData) return null;

  return (
    <div className="relative min-h-screen font-serif bg-[#FDFCF0]">
      <div className="absolute inset-0 z-0 opacity-55 bg-cover bg-center bg-fixed transition-all duration-1000" style={{ backgroundImage: `url(${fondoAleatorio})` }}/>
      <div className="relative z-10">
        {/* HEADER */}
        <header className="bg-white p-8 flex items-center gap-6 shadow-sm relative">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 border-2 border-orange-200">
            <ChefHat size={35} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-stone-800">Hola, {userData.nombre || 'Suscriptor'}</h1>
            <p className="text-stone-500 italic">Bienvenido a tu cocina</p>
          </div>
        </header>

        <button onClick={HandleLogout} className="fixed top-6 right-8 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold shadow-md transition-colors z-10">Cerrar Sesión</button>

        <main className="max-w-7xl mx-auto p-10 grid grid-cols-1 lg:grid-cols-4 gap-10 bg-amber-50 rounded-3xl shadow-sm mt-10">
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
                        <button 
                          onClick={() => setBookConfig({ isOpen: true, mode: 'chef_book', data: sub })}
                          className="mt-3 w-full py-2 bg-orange-100 text-orange-700 font-bold text-xs rounded-lg hover:bg-orange-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                          <BookOpen size={14}/> Leer Volumen
                        </button>
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
                    <div key={f.id_receta} className="p-3 bg-white rounded-xl text-sm border-l-4 border-orange-400 hover:shadow-md transition-all cursor-pointer group relative">
                      <div onClick={() => setBookConfig({ isOpen: true, mode: 'favorites_book', data: library.favorites, initialId: f.id_receta })}>
                        <p className="font-bold truncate text-stone-800 group-hover:text-orange-600">{f.titulo}</p>
                        <p className="text-[10px] text-stone-400 uppercase mt-1">Chef: {f.nombre_chef}</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(f.id_receta); }}
                        className="text-xs text-red-400 hover:text-red-600 mt-2 flex items-center gap-1 z-10 relative"
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
            <div className="mb-8 bg-white p-4 rounded-3xl shadow-sm border border-stone-100 flex flex-col md:flex-row gap-3 items-center">
              
              {/* Búsqueda */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-3.5 text-stone-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar receta o chef..."
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>

              {/* Filtro Categoría */}
              <select 
                className="p-3 rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none text-sm w-full md:w-auto"
                value={filters.categoria}
                onChange={(e) => setFilters({...filters, categoria: e.target.value})}
              >
                <option value="">Todas las Categorías</option>
                {categories.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
              </select>

              {/* Filtro Dificultad */}
              <select 
                className="p-3 rounded-2xl border border-stone-100 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none text-sm w-full md:w-auto"
                value={filters.dificultad}
                onChange={(e) => setFilters({...filters, dificultad: e.target.value})}
              >
                <option value="">Cualquier Dificultad</option>
                <option value="Fácil">Fácil</option>
                <option value="Media">Media</option>
                <option value="Difícil">Difícil</option>
                <option value="Experto">Experto</option>
              </select>
            </div>
            
            {/* LISTADO DE RECETAS EXPLORABLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {!filteredRecipes || filteredRecipes.length === 0 ? (
                <div className="col-span-2 py-20 text-center">
                  <ChefHat className="mx-auto text-stone-200 mb-4" size={50} />
                  <p className="text-stone-400 italic">No encontramos recetas para esa búsqueda...</p>
                </div>
              ) : (
                filteredRecipes.map(r => (
                  <div key={r.id_receta} className="bg-white rounded-2xl p-8 shadow-sm border border-stone-50 hover:shadow-xl transition-all duration-300 relative">
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
                        <span className="text-sm">{r.valoracion || 0}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-stone-800 mb-2">{r.titulo}</h3>
                    <p className="text-stone-500 text-sm mb-6 line-clamp-2 italic">By Chef {r.nombre_chef}</p>

                    <div className="pt-6 border-t border-stone-50">
                      {isSubscribed(r.id_chef) ? (
                        <button 
                          onClick={() => setBookConfig({ isOpen: true, mode: 'single', data: r })}
                          className="w-full bg-stone-800 text-white py-3 rounded-2xl font-bold hover:bg-orange-700 transition-colors"
                        >
                          Abrir Receta
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleOpenPayModal(r)} 
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

        {/* ZONA DE MODALES*/}
        {/* MODAL DE PAGO (PERFIL PÚBLICO DEL CHEF) */}
        {showPayModal && selectedChef && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[3rem] p-10 max-w-3xl w-full relative shadow-2xl overflow-y-auto max-h-[90vh]">
              <button onClick={() => setShowPayModal(false)} className="absolute top-8 right-8 text-stone-300 hover:text-stone-800">
                <X size={24} />
              </button>

              {loadingChef ? (
                <div className="py-20 text-center animate-pulse text-orange-500 font-bold">Consultando a la Chef...</div>
              ) : chefDetails ? (
                <>
                  {/* CABECERA DEL PERFIL DE LA CHEF */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 bg-orange-100 rounded-full overflow-hidden border-4 border-orange-50 shadow-md">
                      <img 
                        src={chefDetails.foto_url || 'https://via.placeholder.com/150'} 
                        alt="Chef" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <h2 className="text-2xl font-bold mt-4 text-stone-800">Chef {chefDetails.nombre}</h2>
                    <div className="flex gap-1 mt-1 text-yellow-500">
                      {[...Array(chefDetails.estrellas || 5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                    </div>
                    <p className="text-center text-sm text-stone-500 italic mt-3 px-2 line-clamp-3">
                      "{chefDetails.descripcion || 'Especialista en secretos culinarios.'}"
                    </p>
                    
                    <div className="flex gap-6 mt-5 py-3 border-y border-stone-50 w-full justify-center">
                      <div className="text-center">
                        <p className="text-lg font-black text-orange-600">{chefDetails.total_recetas}</p>
                        <p className="text-[10px] uppercase font-bold text-stone-400">Recetas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black text-orange-600">{chefDetails.total_favoritos}</p>
                        <p className="text-[10px] uppercase font-bold text-stone-400">Favoritos</p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-center mb-4 text-stone-700">Planes de Acceso</h3>
                  
                  <div className="space-y-3 mb-8">
                    {[
                      { m: 3, p: chefDetails.precio_3m },
                      { m: 6, p: chefDetails.precio_6m },
                      { m: 12, p: chefDetails.precio_12m }
                    ].map(plan => (
                      <button 
                        key={plan.m}
                        onClick={() => setSelectedPlanPreview(plan.m)} 
                        className={`w-full p-4 border-2 rounded-2xl flex justify-between items-center transition-all ${selectedPlanPreview === plan.m ? 'border-orange-500 bg-orange-50' : 'border-stone-100 hover:border-orange-300'}`}
                      >
                        <span className="font-bold">{plan.m} Meses</span>
                        <span className="text-orange-600 font-black">${plan.p} MXN</span>
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => {
                      setShowPayModal(false);
                      setShowCheckoutModal(true);
                    }}
                    className="w-full bg-[#D35400] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all mb-4"
                  >
                    Continuar al Pago
                  </button>
                </>
              ) : (
                <p className="text-center py-10 text-red-400">No pudimos cargar el perfil de la chef.</p>
              )}
              <p className="text-[9px] text-center text-stone-300 uppercase tracking-widest">Bóveda Culinaria</p>
            </div>
          </div>
        )}
        
        {/* MODAL DE CHECKOUT REALISTA (PAGO FINAL) */}
        {showCheckoutModal && selectedChef && chefDetails && (
          <PaymentModal 
            chef={{...selectedChef, ...chefDetails}}
            initialPlan={selectedPlanPreview} 
            prices={{
              3: chefDetails.precio_3m, 
              6: chefDetails.precio_6m, 
              12: chefDetails.precio_12m 
            }}
            onClose={() => setShowCheckoutModal(false)} 
            onSuccess={() => {
              setShowCheckoutModal(false);
              loadData();
            }} 
          />
        )}

        {/* MODAL LIBRO DE RECETAS (INDIVIDUAL, CHEF O FAVORITOS) */}
        <RecipeBookModal 
          isOpen={bookConfig.isOpen}
          onClose={() => setBookConfig({ isOpen: false, mode: 'single', data: null, initialId: null })}
          mode={bookConfig.mode}
          initialData={bookConfig.data}
          initialRecipeId={bookConfig.initialId}
          onToggleFavorite={toggleFavorite}
          libraryFavorites={library.favorites}
          onCancelSubscription={handleCancelSubscription}
          activeSubscriptions={library.subscriptions}

          onSubscribeClick={(receta) => {
            setBookConfig({ isOpen: false, mode: 'single', data: null, initialId: null }); 
            handleOpenPayModal(receta);
          }}
        />

      </div>
    </div>
  );
};

export default UserDashboard;