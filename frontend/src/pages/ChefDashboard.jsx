import React, { useState, useEffect } from 'react';
import { api } from '../services/Api';
import { useNavigate } from 'react-router-dom';

const ChefDashboard = () => {
  const navigate = useNavigate();
  const id = localStorage.getItem('userId');

  // --- ESTADOS ---
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado inicial para limpiar el formulario
  const initialRecipeState = {
    titulo: '', subtitulo: '', descripcion: '', id_categoria: '',
    dificultad: 'Media', porciones: 4, tiempo_preparacion: '',
    contenido: { ingredientes: [{ nombre: '', cantidad: '' }], pasos: [''], imagenes: [''] }
  };

  const [newRecipe, setNewRecipe] = useState(initialRecipeState);
  const [editedProfile, setEditedProfile] = useState({ descripcion: '', foto_url: '', estrellas: 5 });

  // --- REDIRECCIÓN SI NO HAY SESIÓN ---
  useEffect(() => {
    if (!id || id === "undefined") {
      navigate('/login');
    }
  }, [id, navigate]);

  // --- CARGA DE DATOS ---
  const loadData = async () => {
  if (!id) return;
  setLoading(true);
  try {
    const [resDash, resCats] = await Promise.all([
      api.getChefDashboard(id),
      api.getCategories()
    ]);

    if (resDash.status === 'ok' && resDash.data && resDash.data.perfil) {
      setData(resDash.data);
      setEditedProfile({
        descripcion: resDash.data.perfil.descripcion || '',
        foto_url: resDash.data.perfil.foto_url || '',
        estrellas: resDash.data.perfil.estrellas || 5
      });
    } else {
      console.error("Datos de perfil incompletos:", resDash);
      alert("No se encontró el perfil del Chef. ¿Iniciaste sesión correctamente?");
      navigate('/login');
    }

    if (resCats.status === 'ok') setCategories(resCats.data);
  } catch (error) {
    console.error("Error cargando dashboard:", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { loadData(); }, []);

  // --- COMPONENTE DE ESTRELLAS ---
  const StarRating = ({ rating, setRating, editable = false }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star} type="button"
          onClick={() => editable && setRating(star)}
          className={`text-2xl transition-transform ${editable ? 'hover:scale-120 active:scale-90' : 'cursor-default'}`}
        >
          {star <= rating ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );

  // --- GESTIÓN DINÁMICA ---
  const updateIngredient = (index, field, value) => {
    const newIngs = [...newRecipe.contenido.ingredientes];
    newIngs[index][field] = value;
    setNewRecipe({ ...newRecipe, contenido: { ...newRecipe.contenido, ingredientes: newIngs } });
  };

  const updateStep = (index, value) => {
    const newSteps = [...newRecipe.contenido.pasos];
    newSteps[index] = value;
    setNewRecipe({ ...newRecipe, contenido: { ...newRecipe.contenido, pasos: newSteps } });
  };

  const updateImage = (index, value) => {
    const newImages = [...newRecipe.contenido.imagenes];
    newImages[index] = value;
    setNewRecipe({
      ...newRecipe,
      contenido: { ...newRecipe.contenido, imagenes: newImages }
    });
  };

  // --- ACCIONES ---
  const handleEditClick = async (recipe) => {
    setLoading(true);
    try {
      const res = await api.getDecryptedRecipe(recipe.id_receta);
      if (res.status === 'ok') {
        setEditingId(recipe.id_receta);
        setNewRecipe({
          titulo: recipe.titulo,
          subtitulo: recipe.subtitulo,
          descripcion: recipe.descripcion,
          id_categoria: recipe.id_categoria,
          dificultad: recipe.dificultad,
          porciones: recipe.porciones,
          tiempo_preparacion: recipe.tiempo_preparacion,
          // CAMBIO AQUÍ: res.data ahora contiene el objeto completo, 
          // y el JSON descifrado está dentro de res.data.contenido
          contenido: res.data.contenido 
        });
        setShowModal(true);
      }
    } catch (err) {
      alert("Error al descifrar el contenido. Verifica que tu sesión sea válida.");
    } finally {
      setLoading(false);
    }
  };

  // Guardado de receta
  const handleLogout = () => {
    localStorage.clear();
    navigate('/AuthPage');
  };

  const handleSaveRecipe = async () => {
    // 1. Extraemos los datos
    const { titulo, subtitulo, descripcion, id_categoria, tiempo_preparacion, porciones, dificultad, contenido } = newRecipe;

    // 2. Validación de campos de texto básicos
    if (!titulo.trim() || !subtitulo.trim() || !descripcion.trim() || !id_categoria || !tiempo_preparacion.trim() || !porciones || !dificultad) {
      alert("¡Cuidado chef! Todos los campos de texto deben estar completos para sazonar tu receta.");
      return;
    }

    // 3. Validación de contenido cifrado
    // Verificamos que al menos un ingrediente tenga nombre y cantidad
    const tieneIngrediente = contenido.ingredientes.some(ing => ing.nombre.trim() !== '' && ing.cantidad.trim() !== '');
    
    // Verificamos que al menos un paso no esté vacío
    const tienePaso = contenido.pasos.some(paso => paso.trim() !== '');
    
    // Verificamos que al menos una imagen tenga una URL
    const tieneImagen = contenido.imagenes.some(img => img.trim() !== '');

    if (!tieneIngrediente || !tienePaso || !tieneImagen) {
      alert("Algo falta en tu receta... como podra el suscriptor disfrutar de tu secreto si no hay ingredientes, pasos o imágenes?");
      return;
    }

    // 4. Si todo es válido, subimos al backend para cifrar y guardar
    try {
      const recipeData = { ...newRecipe, id_chef: id };
      
      const res = editingId 
        ? await api.updateRecipe(editingId, recipeData)
        : await api.uploadRecipe(recipeData);

      if (res.status === 'ok') {
        setShowModal(false);
        setEditingId(null);
        setNewRecipe(initialRecipeState);
        loadData();
        alert(res.message);
      } else {
        alert("Error del servidor: " + res.message);
      }
    } catch (error) {
      console.error("Error al guardar la receta:", error);
      alert("Hubo un fallo en la conexión con la bóveda.");
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (window.confirm("¿Seguro que quieres borrar este secreto? Se eliminará de la bóveda de tus suscriptores.")) {
      const res = await api.deleteRecipe(recipeId);
      if (res.status === 'ok') loadData();
    }
  };

  if (loading && !data) return <div className="min-h-screen flex items-center justify-center bg-[#FDF8F1] font-serif text-[#D35400] text-2xl animate-pulse">Encendiendo fogones... 🍳</div>;

  return (
    <div className="min-h-screen bg-[#FDF8F1] p-8 font-serif">

      {/* BOTÓN CERRAR SESIÓN */}
      <button 
        onClick={handleLogout}
        className="absolute top-6 right-8 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold shadow-md transition-colors z-10"
      >
        Cerrar Sesión
      </button>

      {/* HEADER PERFIL */}
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-orange-100 mb-10">
        {!isEditingProfile ? (
          <div className="flex items-center gap-8">
            <div className="w-32 h-32 bg-orange-200 rounded-full overflow-hidden border-4 border-white shadow-md">
              <img src={data?.perfil?.foto_url || 'https://via.placeholder.com/150'} alt="Chef" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h1 className="text-4xl font-bold text-[#5D4037]">Chef {data?.perfil?.nombre}</h1>
                <button onClick={() => setIsEditingProfile(true)} className="text-[#D35400] font-bold text-sm hover:underline">Editar Perfil</button>
              </div>
              <p className="text-[#8D6E63] italic mt-2">{data?.perfil?.descripcion || 'Especialista en sabores cifrados.'}</p>
              <div className="mt-3"><StarRating rating={data?.perfil?.estrellas} /></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#5D4037]">Actualizar mi Identidad Culianaria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="URL Foto" className="p-3 border rounded-xl w-full text-sm" value={editedProfile.foto_url} onChange={e => setEditedProfile({...editedProfile, foto_url: e.target.value})} />
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-[#8D6E63]">Estrellas:</span>
                <StarRating rating={editedProfile.estrellas} setRating={(val) => setEditedProfile({...editedProfile, estrellas: val})} editable={true} />
              </div>
              <textarea className="p-3 border rounded-xl w-full md:col-span-2" rows="3" value={editedProfile.descripcion} onChange={e => setEditedProfile({...editedProfile, descripcion: e.target.value})} />
            </div>
            <div className="flex gap-2">
              <button onClick={async () => { await api.updateChefProfile(id, editedProfile); setIsEditingProfile(false); loadData(); }} className="bg-[#2E7D32] text-white px-6 py-2 rounded-xl font-bold">Guardar</button>
              <button onClick={() => setIsEditingProfile(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl">Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* RECETAS */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#5D4037]">Mis Secretos Publicados</h2>
            <button onClick={() => { setEditingId(null); setNewRecipe(initialRecipeState); setShowModal(true); }} className="bg-[#D35400] text-white px-6 py-2 rounded-full shadow-md hover:bg-orange-700">+ Nueva Receta</button>
          </div>

          {data?.recetas.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-orange-100 text-center text-[#8D6E63]">Sin contenido publicado aún.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data?.recetas.map(r => (
                <div key={r.id_receta} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#5D4037]">{r.titulo}</h3>
                    <span className="text-[10px] bg-orange-100 text-[#D35400] px-2 py-1 rounded-full font-bold uppercase">{r.categoria_nombre}</span>
                  </div>
                  <p className="text-xs text-[#8D6E63] mb-2">{r.subtitulo}</p>
                  <p className="text-sm text-gray-500 line-clamp-2 italic mb-4">{r.descripcion}</p>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 border-t pt-4">
                    <div className="flex gap-2 uppercase font-bold tracking-widest">
                      <span>⏱️ {r.tiempo_preparacion}</span>
                      <span>❤️ {r.favoritos} Fans</span>
                    </div>
                    <div className="flex gap-3 font-bold">
                      <button onClick={() => handleEditClick(r)} className="text-blue-600 hover:underline">Editar</button>
                      <button onClick={() => handleDeleteRecipe(r.id_receta)} className="text-red-600 hover:underline">Borrar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SUSCRIPTORES */}
        <div className="bg-white p-6 rounded-3xl border border-orange-50 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-[#5D4037] mb-6 font-serif">Suscriptores Activos</h2>
          {data?.suscriptores.length === 0 ? (
            <p className="text-sm italic text-gray-400 text-center">Sin suscriptores activos.</p>
          ) : (
            data?.suscriptores.map((s, i) => (
              <div key={i} className="mb-3 p-3 bg-orange-50 rounded-xl text-xs border border-orange-100">
                <p className="font-bold text-[#5D4037]">{s.nombre}</p>
                <p className="text-orange-700 uppercase font-bold mt-1">Vence: {new Date(s.fecha_fin).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL RECETA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 rounded-3xl shadow-2xl relative">
            <h2 className="text-2xl font-bold mb-2 text-[#5D4037]">{editingId ? 'Refinar Secreto' : 'Sazonar Nueva Receta'}</h2>
            <p className="text-sm text-gray-500 italic mb-6">Contenido cifrado con AES-128 y mucho sabor.</p>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8D6E63] uppercase">Título</label>
                  <input type="text" className="p-3 border rounded-xl w-full" value={newRecipe.titulo} onChange={e => setNewRecipe({...newRecipe, titulo: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8D6E63] uppercase">Subtítulo</label>
                  <input type="text" className="p-3 border rounded-xl w-full" value={newRecipe.subtitulo} onChange={e => setNewRecipe({...newRecipe, subtitulo: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8D6E63] uppercase">Categoría</label>
                  <select className="p-3 border rounded-xl w-full bg-white" value={newRecipe.id_categoria} onChange={e => setNewRecipe({...newRecipe, id_categoria: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {categories.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8D6E63] uppercase">Dificultad</label>
                  <select 
                    className="p-3 border rounded-xl w-full bg-white" 
                    value={newRecipe.dificultad} 
                    onChange={e => setNewRecipe({...newRecipe, dificultad: e.target.value})}
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Media">Media</option>
                    <option value="Difícil">Difícil</option>
                    <option value="Experto">Experto</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8D6E63] uppercase">Tiempo y Porciones</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Ej: 45m" className="p-3 border rounded-xl w-full" value={newRecipe.tiempo_preparacion} onChange={e => setNewRecipe({...newRecipe, tiempo_preparacion: e.target.value})} />
                    <input type="number" className="p-3 border rounded-xl w-24" value={newRecipe.porciones} onChange={e => setNewRecipe({...newRecipe, porciones: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8D6E63] uppercase">Descripción Pública</label>
                <textarea className="w-full p-3 border rounded-xl" rows="2" value={newRecipe.descripcion} onChange={e => setNewRecipe({...newRecipe, descripcion: e.target.value})} />
              </div>

              {/* Secciones Cifradas */}
              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-4">
                <h3 className="text-xs font-black text-orange-800 uppercase tracking-widest">Contenido Cifrado (Solo Suscriptores)</h3>
                
                {/* Ingredientes */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><span className="text-sm font-bold">Ingredientes</span> <button onClick={() => setNewRecipe({...newRecipe, contenido: {...newRecipe.contenido, ingredientes: [...newRecipe.contenido.ingredientes, {nombre:'', cantidad:''}]}})} className="text-xs text-orange-600">+ Añadir</button></div>
                  {newRecipe.contenido.ingredientes.map((ing, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="text" placeholder="Cant." className="w-20 p-2 border rounded-lg text-sm" value={ing.cantidad} onChange={e => updateIngredient(i, 'cantidad', e.target.value)} />
                      <input type="text" placeholder="Ingrediente" className="flex-1 p-2 border rounded-lg text-sm" value={ing.nombre} onChange={e => updateIngredient(i, 'nombre', e.target.value)} />
                      <button onClick={() => { const ings = newRecipe.contenido.ingredientes.filter((_, idx) => idx !== i); setNewRecipe({...newRecipe, contenido: {...newRecipe.contenido, ingredientes: ings}}); }} className="text-red-400">✕</button>
                    </div>
                  ))}
                </div>

                {/* Pasos */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><span className="text-sm font-bold">Preparación</span> <button onClick={() => setNewRecipe({...newRecipe, contenido: {...newRecipe.contenido, pasos: [...newRecipe.contenido.pasos, '']}})} className="text-xs text-orange-600">+ Añadir Paso</button></div>
                  {newRecipe.contenido.pasos.map((paso, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="w-6 h-6 bg-orange-500 border border-orange-200 rounded-full flex items-center justify-center text-[12px] text-white shrink-0 mt-2">{i+1}</span>
                      <textarea className="flex-1 p-2 border rounded-lg text-sm h-16" value={paso} onChange={e => updateStep(i, e.target.value)} />
                      <button onClick={() => { const steps = newRecipe.contenido.pasos.filter((_, idx) => idx !== i); setNewRecipe({...newRecipe, contenido: {...newRecipe.contenido, pasos: steps}}); }} className="text-red-400 mt-2">✕</button>
                    </div>
                  ))}
                </div>

                {/* SECCIÓN: IMÁGENES (Añadida) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Galería de Imágenes</span> 
                    <button 
                      onClick={() => setNewRecipe({...newRecipe, contenido: {...newRecipe.contenido, imagenes: [...newRecipe.contenido.imagenes, '']}})} 
                      className="text-xs text-orange-600"
                    >
                      + Añadir URL
                    </button>
                  </div>
                  {newRecipe.contenido.imagenes.map((img, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        placeholder="https://enlace-a-tu-foto.jpg" 
                        className="flex-1 p-2 border rounded-lg text-sm" 
                        value={img} 
                        onChange={e => updateImage(i, e.target.value)} 
                      />
                      {img && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-orange-100 shrink-0">
                          <img src={img} alt="Vista previa" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <button 
                        onClick={() => { const imgs = newRecipe.contenido.imagenes.filter((_, idx) => idx !== i); setNewRecipe({...newRecipe, contenido: {...newRecipe.contenido, imagenes: imgs}}); }} 
                        className="text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-400">Descartar</button>
                <button onClick={handleSaveRecipe} className="flex-1 py-3 bg-[#D35400] text-white rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all">
                  {editingId ? 'Re-cifrar y Actualizar' : 'Cifrar y Publicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefDashboard;