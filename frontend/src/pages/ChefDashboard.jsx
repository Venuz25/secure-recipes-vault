import React, { useState, useEffect } from 'react';
import { api } from '../services/Api';

const ChefDashboard = () => {
  const [data, setData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Estados para la nueva receta
  const [newRecipe, setNewRecipe] = useState({
    titulo: '', 
    subtitulo: '', 
    dificultad: 'Media', 
    porciones: 4, 
    tiempo_preparacion: '',
    contenido: { ingredientes: [{ nombre: '', cantidad: '' }], pasos: [''], imagenes: [''] }
    });

  // Estado para edición de perfil
  const [editedProfile, setEditedProfile] = useState({
    descripcion: '', foto_url: '', estrellas: 5
  });

  // Componente para mostrar estrellas de valoración
  const StarRating = ({ rating, setRating, editable = false }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => editable && setRating(star)}
            className={`text-2xl transition-transform ${editable ? 'hover:scale-120' : ''}`}
          >
            {star <= rating ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    );
  };

  const loadData = async () => {
    const id = localStorage.getItem('userId') || 1; 
    const res = await api.getChefDashboard(id);
    if (res.status === 'ok') {
      setData(res.data);
      setEditedProfile({
        descripcion: res.data.perfil.descripcion || '',
        foto_url: res.data.perfil.foto_url || '',
        estrellas: res.data.perfil.estrellas || 5
      });
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- LÓGICA DE PERFIL ---
  const handleUpdateProfile = async () => {
    const id = localStorage.getItem('userId') || 1;
    try {
      const res = await api.updateChefProfile(id, editedProfile);
      if (res.status === 'ok') {
        setIsEditingProfile(false);
        loadData();
        alert("¡Perfil actualizado con éxito!");
      }
    } catch (err) {
      alert("Error al actualizar el perfil.");
    }
  };

  // --- LÓGICA DE RECETAS (INGREDIENTES Y PASOS) ---
  const handleAddIngredient = () => {
    setNewRecipe({
      ...newRecipe,
      contenido: { ...newRecipe.contenido, ingredientes: [...newRecipe.contenido.ingredientes, { nombre: '', cantidad: '' }] }
    });
  };

  const handleAddStep = () => {
    setNewRecipe({
      ...newRecipe,
      contenido: { ...newRecipe.contenido, pasos: [...newRecipe.contenido.pasos, ''] }
    });
  };

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
    const imgs = [...newRecipe.contenido.imagenes];
    imgs[index] = value;
    setNewRecipe({ ...newRecipe, contenido: { ...newRecipe.contenido, imagenes: imgs } });
    };

  const handleAddImage = () => {
    const imgs = [...newRecipe.contenido.imagenes, ''];
    setNewRecipe({ ...newRecipe, contenido: { ...newRecipe.contenido, imagenes: imgs } });
    };

  const handlePublish = async () => {
    const id = localStorage.getItem('userId') || 1;
    await api.uploadRecipe({ ...newRecipe, id_chef: id });
    setShowModal(false);
    loadData();
    alert("¡Receta enviada a la bóveda cifrada!");
  };

  if (!data) return <div className="p-10 text-center font-serif text-[#5D4037]">Cargando cocina...</div>;

  return (
    <div className="min-h-screen bg-[#FDF8F1] p-8 font-serif">
      
      {/* HEADER PERFIL */}
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-orange-100 mb-10">
        {!isEditingProfile ? (
          <div className="flex items-center gap-8">
            <div className="w-32 h-32 bg-orange-200 rounded-full overflow-hidden border-4 border-white shadow-md">
              <img src={data.perfil.foto_url || 'https://via.placeholder.com/150'} alt="Chef" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h1 className="text-4xl font-bold text-[#5D4037]">Chef {data.perfil.nombre}</h1>
                <button onClick={() => setIsEditingProfile(true)} className="text-[#D35400] font-bold text-sm hover:underline">Editar Perfil</button>
              </div>
              <p className="text-[#8D6E63] italic mt-2">{data.perfil.descripcion || 'Sin descripción aún.'}</p>
              <div className="mt-3">
                <StarRating rating={data.perfil.estrellas} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#5D4037]">Editar mi Perfil</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#8D6E63]">URL de la Imagen:</label>
                <input type="text" placeholder="https://ejemplo.com/foto.jpg" className="p-3 border rounded-xl w-full text-sm" value={editedProfile.foto_url} onChange={e => setEditedProfile({...editedProfile, foto_url: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#8D6E63]">Tu calificación:</label>
                <StarRating rating={editedProfile.estrellas} setRating={(val) => setEditedProfile({...editedProfile, estrellas: val})} editable={true} />
              </div>
              <textarea placeholder="Cuéntanos sobre ti..." className="p-3 border rounded-xl w-full md:col-span-2" rows="3" value={editedProfile.descripcion} onChange={e => setEditedProfile({...editedProfile, descripcion: e.target.value})} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleUpdateProfile} className="bg-[#2E7D32] text-white px-6 py-2 rounded-xl font-bold">Guardar</button>
              <button onClick={() => setIsEditingProfile(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl">Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMNA: RECETAS */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#5D4037]">Mis Recetas Publicados</h2>
            <button onClick={() => setShowModal(true)} className="bg-[#D35400] text-white px-6 py-2 rounded-full hover:bg-orange-700 shadow-md">
              + Nueva Receta
            </button>
          </div>
          
          {data.recetas.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl border-2 border-dashed border-orange-100 text-center">
              <p className="text-[#8D6E63] text-xl italic">Sin contenido publicado aún.</p>
              <p className="text-sm text-gray-400 mt-2">Tus recetas aparecerán aquí una vez subidas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.recetas.map(r => (
                <div key={r.id_receta} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-lg text-[#5D4037]">{r.titulo}</h3>
                  <p className="text-sm text-[#8D6E63]">{r.categoria} • {r.dificultad} • {r.tiempo_preparacion}</p>
                  <div className="mt-4 flex justify-between items-center text-sm">
                    <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-lg">❤️ {r.favoritos} fans</span>
                    <div className="flex gap-3 font-bold">
                      <button className="text-blue-600">Editar</button>
                      <button className="text-red-600">Borrar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA: SUSCRIPTORES */}
        <div className="bg-white p-6 rounded-3xl border border-orange-50 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-[#5D4037] mb-6">Suscriptores Activos</h2>
          {data.suscriptores.length === 0 ? (
             <p className="text-center text-gray-400 text-sm italic">Sin suscriptores activos.</p>
          ) : (
            <div className="space-y-4">
              {data.suscriptores.map((s, i) => (
                <div key={i} className="flex flex-col p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <span className="font-bold text-[#5D4037]">{s.nombre}</span>
                  <span className="text-xs text-[#8D6E63]">{s.correo}</span>
                  <span className="text-[10px] mt-2 font-bold uppercase text-orange-700 italic">Vence: {new Date(s.fecha_fin).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: NUEVA RECETA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 rounded-3xl shadow-2xl">
            <h2 className="text-3xl font-bold mb-2 text-[#5D4037]">Sazonar Nueva Receta</h2>
            <p className="text-sm text-[#8D6E63] mb-6 italic">La información de preparación se cifrará con AES-128 y mucho sabor.</p>
            
            <div className="space-y-6">
                {/* Metadata básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Título de la receta" className="p-3 border rounded-xl w-full" onChange={e => setNewRecipe({...newRecipe, titulo: e.target.value})} />
                    <input type="text" placeholder="Subtítulo (ej. Estilo Michoacán)" className="p-3 border rounded-xl w-full" onChange={e => setNewRecipe({...newRecipe, subtitulo: e.target.value})} />
                    <input type="text" placeholder="Tiempo de preparación" className="p-3 border rounded-xl w-full" onChange={e => setNewRecipe({...newRecipe, tiempo_preparacion: e.target.value})} />
                    <select className="p-3 border rounded-xl w-full" onChange={e => setNewRecipe({...newRecipe, dificultad: e.target.value})}>
                    <option>Fácil</option><option selected>Media</option><option>Difícil</option>
                    </select>
                    <input type="number" placeholder="Porciones" className="p-3 border rounded-xl w-full" onChange={e => setNewRecipe({...newRecipe, porciones: e.target.value})} />
                </div>

              {/* Ingredientes */}
              <div className="bg-[#FAFAFA] p-5 rounded-2xl">
                <h3 className="font-bold mb-3 text-[#5D4037] flex justify-between">
                  Ingredientes
                  <button onClick={handleAddIngredient} className="text-[#D35400] text-sm">+ Añadir</button>
                </h3>
                {newRecipe.contenido.ingredientes.map((ing, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="text" placeholder="Cant." className="w-24 p-2 border rounded-lg text-sm" value={ing.cantidad} onChange={e => updateIngredient(i, 'cantidad', e.target.value)} />
                    <input type="text" placeholder="Ingrediente" className="flex-1 p-2 border rounded-lg text-sm" value={ing.nombre} onChange={e => updateIngredient(i, 'nombre', e.target.value)} />
                  </div>
                ))}
              </div>

              {/* Pasos de Preparación (NUEVO) */}
              <div className="bg-[#FAFAFA] p-5 rounded-2xl">
                <h3 className="font-bold mb-3 text-[#5D4037] flex justify-between">
                  Pasos de Preparación
                  <button onClick={handleAddStep} className="text-[#D35400] text-sm">+ Añadir Paso</button>
                </h3>
                {newRecipe.contenido.pasos.map((paso, i) => (
                  <div key={i} className="flex gap-3 mb-4 items-start">
                    <span className="bg-[#D35400] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-1">{i + 1}</span>
                    <textarea placeholder={`Describe el paso ${i + 1}...`} className="flex-1 p-3 border rounded-xl text-sm h-20 outline-none focus:ring-2 focus:ring-orange-200" value={paso} onChange={e => updateStep(i, e.target.value)} />
                  </div>
                ))}
              </div>

            {/* Imágenes*/}
            <div className="bg-[#FAFAFA] p-5 rounded-2xl">
                <h3 className="font-bold mb-3 text-[#5D4037] flex justify-between">
                    Galería de Imágenes (URLs)
                    <button onClick={handleAddImage} className="text-[#D35400] text-sm">+ Añadir Imagenes (URLs)</button>
                </h3>
                {newRecipe.contenido.imagenes.map((img, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                    <input 
                        type="text" 
                        placeholder="https://enlace-a-tu-foto.jpg" 
                        className="flex-1 p-2 border rounded-lg text-sm" 
                        value={img} 
                        onChange={e => updateImage(i, e.target.value)} 
                    />
                    {img && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border">
                        <img src={img} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                    </div>
                ))}
            </div>
                
              {/* Botones de acción */}
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-gray-100 rounded-xl font-bold text-gray-400 hover:bg-gray-50">Cancelar</button>
                <button onClick={handlePublish} className="flex-1 py-3 bg-[#D35400] text-white rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all">Cifrar y Publicar Receta</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefDashboard;