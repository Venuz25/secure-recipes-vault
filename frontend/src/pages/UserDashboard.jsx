import React, { useState, useEffect } from 'react';
import { api } from '../services/Api';
import { Search, Star, BookOpen, Lock, CreditCard, X, ChefHat } from 'lucide-react';

const UserDashboard = () => {
  const [recipes, setRecipes] = useState([]);
  const [library, setLibrary] = useState({ subscriptions: [], favorites: [] });
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedChef, setSelectedChef] = useState(null);
  const [filters, setFilters] = useState({ search: '', categoria: '', orden: 'reciente' });

  // Obtenemos los datos del usuario logueado
  const user = JSON.parse(localStorage.getItem('user')) || { nombre: 'Usuario' };

  useEffect(() => { loadData(); }, [filters]);

  const loadData = async () => {
    try {
      const resRecs = await api.exploreRecipes(filters);
      const resLib = await api.getUserLibrary(user.id_usuario);
      if (resRecs.status === 'ok') setRecipes(resRecs.data);
      if (resLib.status === 'ok') setLibrary(resLib.data);
    } catch (err) { console.error("Error cargando dashboard"); }
  };

  const isSubscribed = (id_chef) => {
    const sub = library.subscriptions.find(s => s.id_chef === id_chef);
    return sub && new Date(sub.fecha_fin) >= new Date();
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-serif">
      {/* HEADER SIMPLIFICADO */}
      <header className="bg-white border-b p-8 flex items-center gap-6 shadow-sm">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 border-2 border-orange-200">
          <ChefHat size={35} /> {/* El chefsito genérico */}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Hola, {user.nombre}</h1>
          <p className="text-stone-500 italic">Bienvenido a tu cocina</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-10 grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* MI LIBRO DE COCINA (FAVORITOS) */}
        <section className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-orange-800">
            <BookOpen size={20}/> Mi Libro
          </h2>
          {library.favorites.length === 0 ? (
            <div className="text-center py-10 px-4 border-2 border-dashed rounded-2xl bg-stone-50">
              <p className="text-sm text-stone-400 italic">Tu libro está esperando su primera receta favorita.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {library.favorites.map(f => (
                <div key={f.id_receta} className="p-3 bg-stone-50 rounded-xl text-sm border-l-4 border-orange-400">
                  <p className="font-bold truncate">{f.titulo}</p>
                  <p className="text-[10px] text-stone-400 uppercase">Chef: {f.nombre_chef}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* EXPLORACIÓN DE LA BÓVEDA */}
        <section className="lg:col-span-3">
          <div className="mb-8 relative">
            <Search className="absolute left-4 top-3.5 text-stone-300" size={20} />
            <input 
              type="text" placeholder="¿Qué secreto culinario buscas hoy?"
              className="w-full pl-12 pr-6 py-4 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-orange-500 bg-white"
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recipes.length === 0 ? (
              <div className="col-span-2 py-20 text-center">
                <ChefHat className="mx-auto text-stone-200 mb-4" size={50} />
                <p className="text-stone-400 italic">No encontramos recetas con esos criterios...</p>
              </div>
            ) : (
              recipes.map(r => (
                <div key={r.id_receta} className="bg-white rounded-[2rem] p-8 shadow-sm border border-stone-50 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-3 py-1 rounded-full uppercase tracking-widest">
                      {r.nombre_categoria}
                    </span>
                    <div className="flex items-center gap-1 text-orange-500 font-bold">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm">{r.valoracion}</span>
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

      {/* MODAL DE PAGO SIMULADO */}
      {showPayModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full relative shadow-2xl">
            <button onClick={() => setShowPayModal(false)} className="absolute top-8 right-8 text-stone-300 hover:text-stone-800">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-center mb-2">Suscripción Premium</h2>
            <p className="text-center text-stone-500 mb-8">Accede a todos los secretos del Chef <span className="font-bold text-stone-800">{selectedChef?.nombre_chef}</span></p>
            
            <div className="space-y-3 mb-8">
              {[3, 6, 12].map(m => (
                <button 
                  key={m}
                  onClick={() => handleSimulatedPayment(m)}
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

  async function handleSimulatedPayment(meses) {
    const res = await api.createSubscription({
      id_usuario: user.id_usuario,
      id_chef: selectedChef.id_chef,
      periodo_meses: meses,
      costo: meses === 3 ? 150 : meses === 6 ? 250 : 400,
      datos_pago: { numero_tarjeta: "4242424242424242" }
    });
    if (res.status === 'ok') {
      alert(res.message);
      setShowPayModal(false);
      loadData();
    }
  }
};

export default UserDashboard;