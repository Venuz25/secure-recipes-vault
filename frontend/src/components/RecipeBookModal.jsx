import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Search, BookOpen, Clock, ChefHat, ShieldCheck, AlertCircle, Minus, Plus, Trash2, Star, Lock } from 'lucide-react';
import { api } from '../services/Api';

const VAULT_SESSION_KEY = 'culinary_vault_temp_pw';

const RecipeBookModal = ({ 
  isOpen, 
  onClose, 
  mode, 
  initialData, 
  initialRecipeId = null, 
  onToggleFavorite,
  libraryFavorites = [],
  onCancelSubscription,
  activeSubscriptions = [],
  onSubscribeClick
}) => {
  if (!isOpen) return null;

  // ESTADOS
  const [recipes, setRecipes] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [decryptedCache, setDecryptedCache] = useState({});
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [showGalleryImage, setShowGalleryImage] = useState(null);
  const [filters, setFilters] = useState({ search: '' });
  
  const [chefInfo, setChefInfo] = useState(null); 
  const [currentServings, setCurrentServings] = useState(1);

  const [vaultPassword, setVaultPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(true);

  // CARGA INICIAL
  useEffect(() => {
    const initializeBook = async () => {
      if (mode === 'single') {
        setRecipes([initialData]);
        setCurrentPage(1);
      } else if (mode === 'favorites_book') {
        setRecipes(initialData);
        const index = initialData.findIndex(r => r.id_receta === initialRecipeId);
        setCurrentPage(index !== -1 ? index + 1 : 1);
      } else if (mode === 'chef_book') {
        setCurrentPage(0);
        try {
          const [resRecs, resChef] = await Promise.all([
            api.exploreRecipes({}),
            api.getPublicChefProfile(initialData.id_chef)
          ]);

          if (resRecs.status === 'ok') {
            setRecipes(resRecs.data.filter(r => r.id_chef === initialData.id_chef));
          }
          if (resChef.status === 'ok') {
            setChefInfo(resChef.data);
          }
        } catch (e) { console.error(e); }
      }
    };
    if (isOpen) initializeBook();
  }, [isOpen, mode, initialData, initialRecipeId]);

  // Reset de contraseña al cambiar de página
  useEffect(() => { setVaultPassword(''); }, [currentPage]);

  // FILTRADO
  const filteredRecipes = useMemo(() => 
    recipes.filter(r => r.titulo.toLowerCase().includes(filters.search.toLowerCase())),
    [recipes, filters.search]
  );
  
  const totalPages = filteredRecipes.length;
  const currentRecipe = filteredRecipes[currentPage - 1];

  // Reset de porciones al cambiar de receta
  useEffect(() => {
    if (currentRecipe) {
      setCurrentServings(currentRecipe.porciones || 1);
    }
  }, [currentPage, currentRecipe]);

  // LÓGICA DE ESCALADO DE INGREDIENTES
  const scaleQuantity = (qtyStr, originalPortions) => {
    if (qtyStr === '-' || !originalPortions || !currentServings) return qtyStr;
    const num = parseFloat(qtyStr);
    if (isNaN(num)) return qtyStr;
    
    const scaled = (num * currentServings) / originalPortions;
    return Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(2).replace(/\.?0+$/, "");
  };

  // DESCIFRADO
  const decryptPage = async (providedPassword) => {
    const passwordToUse = providedPassword || sessionStorage.getItem(VAULT_SESSION_KEY);

    if (!passwordToUse) { return; }

    if (decryptedCache[currentRecipe.id_receta]) return;

    setIsDecrypting(true);
    try {
      const payload = { 
        id_usuario: parseInt(localStorage.getItem('userId')), 
        id_receta: currentRecipe.id_receta,
        password: passwordToUse 
      };

      const res = await api.getSubscriberRecipeContent(payload); 
      
      if (res.status === 'ok') {
        setDecryptedCache(prev => ({ 
          ...prev, 
          [currentRecipe.id_receta]: res.data 
        }));
        
        // Solo guardamos en sesión si el servidor confirmó que la clave es válida
        sessionStorage.setItem(VAULT_SESSION_KEY, passwordToUse);
        setVaultPassword(''); 
      } else {
        // Si la contraseña guardada en sesión falla la borramos
        sessionStorage.removeItem(VAULT_SESSION_KEY);
        alert(res.message);
      }
    } catch (e) { 
      console.error("Error en el descifrado:", e);
    } finally { 
      setIsDecrypting(false); 
    }
  };

  // Intentamos descifrar automáticamente al cambiar de receta
  useEffect(() => {
    if (currentPage === 0 || !currentRecipe) return;
    
    const recipeId = currentRecipe.id_receta;
    if (decryptedCache[recipeId]) return;

    if (sessionStorage.getItem(VAULT_SESSION_KEY)) {
      decryptPage();
    }
  }, [currentPage, currentRecipe?.id_receta]);


  // --- VISTAS ---
  const renderCover = () => {
    const coverData = chefInfo || initialData;
    const numEstrellas = Number(coverData.estrellas) || 5;

    return (
      <div className="flex w-full h-full">
        {/* Lado Izquierdo: Perfil del Chef con Fondo Decorativo */}
        <div className="w-1/2 p-12 flex flex-col justify-center items-center border-r-4 border-stone-300 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d35400_1px,transparent_1px)] [background-size:20px_20px] z-0"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 to-white z-0"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-44 h-44 rounded-full border-8 border-white shadow-2xl overflow-hidden mb-6">
              <img 
                src={coverData.foto_url || coverData.foto_chef || 'https://via.placeholder.com/150'} 
                alt="Chef" 
                className="w-full h-full object-cover bg-stone-100"
              />
            </div>
            <h1 className="text-4xl font-black text-stone-800 mb-2 font-serif text-center">Bóveda Culinaria</h1>
            <h2 className="text-2xl font-bold text-orange-600 mb-2 font-serif text-center">
              Chef {coverData.nombre || coverData.nombre_chef}
            </h2>
            
            <div className="flex gap-1 text-yellow-500 mb-4">
              {[...Array(numEstrellas)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
            </div>
            
            <p className="text-stone-500 text-center italic px-8 leading-relaxed">
              "{coverData.descripcion || 'Secretos culinarios protegidos para paladares exclusivos.'}"
            </p>
          </div>
        </div>

        {/* Lado Derecho: Info de Suscripción */}
        <div className="w-1/2 p-12 bg-white flex flex-col justify-center relative">
          <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-100 mb-10 shadow-sm">
            <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-6 text-lg">
              <ShieldCheck className="text-green-600" size={24}/> Tu Pase de Acceso
            </h3>
            <div className="space-y-4 text-stone-600">
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-sm">Válido desde:</span>
                <span className="font-bold">
                  {initialData.fecha_inicio ? new Date(initialData.fecha_inicio).toLocaleDateString() : 'Activa'}
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-sm">Vence el:</span>
                <span className="font-bold text-orange-600">
                  {initialData.fecha_fin ? new Date(initialData.fecha_fin).toLocaleDateString() : 'Pendiente'}
                </span>
              </div>
            </div>
            
            <button 
                onClick={() => {
                if (window.confirm('¿Seguro que deseas cancelar esta suscripción? Perderás el acceso a las recetas cifradas de inmediato.')) {
                    const idToCancel = initialData.id_contrato || initialData.id_suscripcion;
                    onCancelSubscription(idToCancel);
                }
                }}
                className="mt-8 w-full py-3 flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors border border-red-100"
            >
                <Trash2 size={16}/> Cancelar Suscripción
            </button>
          </div>

          <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
              <Search size={18}/> Buscar en este Volumen
          </h3>
          <div className="relative">
            <input 
              type="text" 
              placeholder="¿Qué quieres cocinar hoy?"
              className="w-full pl-5 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              value={filters.search}
              onChange={e => { setFilters({search: e.target.value}); setCurrentPage(0); }}
            />
          </div>
        </div>
      </div>
    );
  };

  const tienePermiso = () => {
        if (!currentRecipe) return false;
        return activeSubscriptions.some(sub => sub.id_chef === currentRecipe.id_chef);
    };

  const renderRecipePage = () => {
    if (!currentRecipe) return null;
    const contenido = decryptedCache[currentRecipe.id_receta];
    const cuentaConAcceso = tienePermiso();
    const tienePasswordEnSesion = !!sessionStorage.getItem(VAULT_SESSION_KEY);

    return (
      <div className="flex w-full h-full bg-[#FDFCF0]">
        
        {/* LADO IZQUIERDO: Metadatos y Público (Se queda igual) */}
        <div className="w-1/2 p-12 border-r-4 border-stone-300 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.05)] overflow-y-auto bg-white">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-3 py-1 rounded-full uppercase tracking-widest">
              {currentRecipe.nombre_categoria || currentRecipe.categoria_nombre || 'Gourmet'}
            </span>
            <button 
                onClick={() => onToggleFavorite(currentRecipe.id_receta)}
                className="p-3 rounded-full hover:bg-red-50 transition-colors"
            >
                <Heart size={28} fill={isFavorite(currentRecipe.id_receta) ? "#ef4444" : "none"} className={isFavorite(currentRecipe.id_receta) ? "text-red-500" : "text-stone-300"} />
            </button>
          </div>

          <h2 className="text-4xl font-black text-stone-800 mb-2 font-serif leading-tight">{currentRecipe.titulo}</h2>
          <p className="text-stone-500 italic mb-8">Receta exclusiva de Chef {currentRecipe.nombre_chef}</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="flex flex-col items-center p-3 bg-stone-50 rounded-2xl border border-stone-100">
                <Clock className="text-orange-500 mb-1" size={20}/>
                <span className="text-xs font-bold">{currentRecipe.tiempo_preparacion}</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-stone-50 rounded-2xl border border-stone-100">
                <ChefHat className="text-orange-500 mb-1" size={20}/>
                <span className="text-xs font-bold">{currentRecipe.dificultad}</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-orange-50 rounded-2xl border border-orange-100">
                <span className="text-[10px] font-bold text-orange-600 uppercase mb-1">Porciones</span>
                <div className="flex items-center gap-3">
                    <button onClick={() => setCurrentServings(Math.max(1, currentServings - 1))} className="text-orange-600 hover:scale-125 transition-transform"><Minus size={14} strokeWidth={3}/></button>
                    <span className="font-black text-stone-800">{currentServings}</span>
                    <button onClick={() => setCurrentServings(currentServings + 1)} className="text-orange-600 hover:scale-125 transition-transform"><Plus size={14} strokeWidth={3}/></button>
                </div>
            </div>
          </div>

          <p className="text-stone-600 mb-10 leading-relaxed italic border-l-4 border-orange-200 pl-4">
            {currentRecipe.descripcion || currentRecipe.subtitulo}
          </p>

          <div className="w-full h-72 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
            {contenido?.imagenes?.[0] ? (
               <img src={contenido.imagenes[0]} alt="Plato" className="w-full h-full object-cover"/>
            ) : (
               <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-200">
                  <ChefHat size={80} opacity={0.1}/>
               </div>
            )}
          </div>
        </div>

        {/* LADO DERECHO: Ingredientes y Pasos (Secretos) */}
        <div className="w-1/2 p-12 overflow-y-auto relative bg-[#FDFCF0]">
            {isDecrypting ? (
                /* 1. Estado: Descifrando */
                <div className="h-full flex flex-col items-center justify-center text-orange-600">
                  <div className="relative mb-6">
                      <ShieldCheck size={60} className="animate-pulse" />
                      <div className="absolute inset-0 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                  </div>
                  <p className="font-bold font-mono text-sm tracking-tighter uppercase">Desbloqueando Llave Privada...</p>
                  <p className="text-[10px] text-stone-400 mt-2 uppercase font-bold tracking-widest">Protocolo ECDH + AES-256</p>
                </div>
            ) : !contenido ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-500 animate-in zoom-in duration-500 p-6">
                  {tienePermiso ? (
                    <>
                      {/* CASO A: TIENE SUSCRIPCIÓN - PEDIR CONTRASEÑA SI NO HAY EN SESIÓN, SINO MOSTRAR FORMULARIO DE DESCIFRADO */}
                      {isDecrypting && tienePasswordEnSesion ? (
                        <div className="animate-pulse text-orange-600 font-bold">Abriendo Bóveda...</div>
                      ) : (
                        <>
                          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <ShieldCheck size={40} className="text-orange-600" />
                          </div>
                          <h3 className="text-2xl font-black text-stone-800 mb-2 font-serif text-center">Bóveda Protegida</h3>
                          <p className="text-stone-500 mb-8 text-center text-sm leading-relaxed">
                            Ingresa tu contraseña una vez para desbloquear todas las recetas de esta sesión.
                          </p>
                          
                          <div className="w-full max-w-xs space-y-4">
                            <input 
                              type="password" 
                              placeholder="Tu contraseña secreta"
                              className="w-full p-4 bg-white border-2 border-stone-200 rounded-2xl focus:border-orange-500 outline-none text-center font-bold tracking-widest"
                              value={vaultPassword}
                              onChange={(e) => setVaultPassword(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && decryptPage(vaultPassword)}
                            />
                            <button 
                              onClick={() => decryptPage(vaultPassword)}
                              className="w-full bg-stone-800 hover:bg-orange-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3"
                            >
                              <Lock size={18} /> Revelar Secreto
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    /* CASO B: NO TIENE SUSCRIPCIÓN - MOSTRAR PUBLICIDAD */
                    <>
                      <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                          <Lock size={40} className="text-stone-300" />
                      </div>
                      <h3 className="text-2xl font-black text-stone-800 mb-3 font-serif">Bóveda Bloqueada</h3>
                      <p className="text-stone-500 mb-8 text-center max-w-xs leading-relaxed">
                          No tienes acceso a esta receta. ¡Suscríbete al Chef para revelar este y todos sus secretos culinarios!
                      </p>
                      <button 
                          onClick={() => onSubscribeClick(currentRecipe)}
                          className="bg-[#D35400] hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all hover:scale-105 hover:shadow-orange-500/30 flex items-center gap-3"
                      >
                          <Lock size={18} /> Suscribirse Ahora
                      </button>
                    </>
                  )}
                </div>
            ) : ( 
            /* CASO C: CONTENIDO DESCIFRADO - MOSTRAR RECETA */
            <div className="animate-in fade-in slide-in-from-right-4 duration-700">
              <h3 className="text-2xl font-black text-stone-800 mb-6 flex items-center gap-3">
                <BookOpen size={24} className="text-orange-500"/> Ingredientes
              </h3>
              <ul className="space-y-3 mb-12">
                {contenido.ingredientes.map((ing, i) => (
                  <li key={i} className="flex gap-3 text-base group">
                    <span className="font-black text-orange-600 min-w-[50px] text-right">
                        {scaleQuantity(ing.cantidad, currentRecipe.porciones)}
                    </span>
                    <span className="text-stone-700 group-hover:translate-x-1 transition-transform">{ing.nombre}</span>
                  </li>
                ))}
              </ul>

              <h3 className="text-2xl font-black text-stone-800 mb-6">Preparación Paso a Paso</h3>
              <div className="space-y-8 mb-12">
                {contenido.pasos.map((paso, i) => (
                  <div key={i} className="flex gap-5 relative">
                    <div className="flex flex-col items-center">
                        <span className="w-8 h-8 bg-stone-800 text-white rounded-full flex items-center justify-center text-sm font-bold z-10">{i+1}</span>
                        {i < contenido.pasos.length - 1 && <div className="w-0.5 h-full bg-stone-200 absolute top-8"></div>}
                    </div>
                    <p className="text-stone-700 leading-relaxed pt-1 text-sm">{paso}</p>
                  </div>
                ))}
              </div>

              {contenido.imagenes?.length > 1 && (
                <div className="grid grid-cols-3 gap-3">
                    {contenido.imagenes.slice(1).map((img, i) => (
                    <button key={i} onClick={() => setShowGalleryImage(img)} className="aspect-square rounded-2xl overflow-hidden shadow-md hover:scale-95 transition-all">
                        <img src={img} alt="Paso" className="w-full h-full object-cover"/>
                    </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const isFavorite = (id) => libraryFavorites.some(f => f.id_receta === id);

  return (
    <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-md flex items-center justify-center z-50 p-4 lg:p-12">
      <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-orange-400 transition-all z-[60] hover:rotate-90">
        <X size={35} />
      </button>

      <div className="relative w-full max-w-7xl h-full max-h-[90vh] bg-white rounded-lg shadow-2xl flex overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-10 -ml-5 bg-gradient-to-r from-black/10 via-black/20 to-black/10 z-20 pointer-events-none shadow-[0_0_20px_rgba(0,0,0,0.3)]"></div>

        {(mode === 'chef_book' ? currentPage > 0 : currentPage > 1) && (
          <button onClick={() => setCurrentPage(p => p - 1)} className="absolute left-6 top-1/2 -translate-y-1/2 z-30 bg-stone-900 text-white p-4 rounded-full shadow-2xl hover:bg-orange-600 transition-all">
            <ChevronLeft size={30} />
          </button>
        )}

        {mode === 'chef_book' && currentPage === 0 ? renderCover() : renderRecipePage()}

        {currentPage < totalPages && (
          <button onClick={() => setCurrentPage(p => p + 1)} className="absolute right-6 top-1/2 -translate-y-1/2 z-30 bg-stone-900 text-white p-4 rounded-full shadow-2xl hover:bg-orange-600 transition-all">
            <ChevronRight size={30} />
          </button>
        )}
      </div>

      {showGalleryImage && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-8" onClick={() => setShowGalleryImage(null)}>
          <img src={showGalleryImage} alt="Zoom" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in duration-300"/>
        </div>
      )}
    </div>
  );
};

export default RecipeBookModal;