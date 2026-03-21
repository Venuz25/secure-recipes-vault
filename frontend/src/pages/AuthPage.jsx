import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/Api';
import { useNavigate, Link } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true); // Estado para saber qué formulario mostrar
  const navigate = useNavigate();

  // Estados independientes para cada formulario
  const [loginData, setLoginData] = useState({ correo: '', password: '' });
  const [registerData, setRegisterData] = useState({ nombre: '', email: '', password: '' });

  // Manejadores de envío (la lógica que ya tenías)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.login(loginData);
      if (res.status === 'ok') {
        localStorage.setItem('token', res.token);
        alert('¡Bienvenido a la cocina!');
        navigate('/home');
      } else { alert(res.message || 'Credenciales incorrectas'); }
    } catch (err) { alert('Error al entrar a la bóveda'); }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.register({ ...registerData, correo: registerData.email, clave_publica: 'ECDSA_TEMP_KEY' });
      if (res.status === 'ok') {
        alert('¡Cocinero registrado! Ahora inicia sesión.');
        setIsLogin(true); // Cambiar automáticamente al login
      } else { alert(res.message); }
    } catch (err) { alert('Error al sazonar el registro'); }
  };

  // Variantes de animación para Framer Motion
  const formVariants = {
    hidden: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      transition: { ease: 'easeInOut', duration: 0.3 },
    }),
  };

  return (
    <div className="min-h-screen bg-[#FDF8F1] flex items-center justify-center p-4"
         style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      
      {/* Contenedor Principal con Sombra de Recetario */}
      <div className="max-w-4xl w-full flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden relative border border-[#D7CCC8]">
        
        {/* Lado Decorativo Estático (Panel Verde) */}
        <div className={`md:w-2/5 p-12 flex flex-col justify-center text-white relative transition-colors duration-500 ${isLogin ? 'bg-[#2E7D32]' : 'bg-[#D35400]'}`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cork-board.png")' }}></div>
          <motion.div
            key={isLogin ? 'login-text' : 'register-text'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {isLogin ? (
              <>
                <h1 className="text-4xl font-serif font-bold mb-4">¡Tus recetas te esperan!</h1>
                <p className="text-emerald-100 text-lg">Inicia sesión para abrir tu Bóveda de Recetas Secreta.</p>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-serif font-bold mb-4">¡Únete a la Cocina!</h1>
                <p className="text-orange-100 text-lg">Regístrate para empezar a guardar tus secretos culinarios.</p>
              </>
            )}
          </motion.div>
        </div>

        {/* Lado de Formularios Dinámicos con Animación */}
        <div className="md:w-3/5 p-10 bg-white relative min-h-[550px]">
          <AnimatePresence initial={false} custom={isLogin ? -1 : 1}>
            
            {/* FORMULARIO DE INICIO DE SESIÓN */}
            {isLogin && (
              <motion.div
                key="login-form"
                custom={1} // Dirección de la animación
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-x-10 top-10"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-[#E67E22]">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
                </div>
                <h2 className="text-3xl font-serif font-bold text-[#5D4037] mb-6 text-center">Entrar a la Bóveda</h2>
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <input type="email" placeholder="Correo electrónico" className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2E7D32] outline-none transition-all" onChange={(e) => setLoginData({...loginData, correo: e.target.value})} required />
                  <input type="password" placeholder="Tu clave secreta" className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2E7D32] outline-none transition-all" onChange={(e) => setLoginData({...loginData, password: e.target.value})} required />
                  <button className="w-full bg-[#5D4037] hover:bg-[#3E2723] text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1">Abrir Bóveda</button>
                </form>
                <div className="mt-8 text-center">
                  <button onClick={() => setIsLogin(false)} className="text-[#8D6E63] hover:text-[#D35400] text-sm transition-colors font-semibold">
                    ¿No tienes delantal? **Regístrate aquí**
                  </button>
                </div>
              </motion.div>
            )}

            {/* FORMULARIO DE REGISTRO */}
            {!isLogin && (
              <motion.div
                key="register-form"
                custom={-1} // Dirección de la animación (opuesta)
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-x-10 top-10"
              >
                 <div className="absolute top-0 right-0 text-[#2E7D32] opacity-20">
                    <svg width="60" height="60" fill="currentColor" viewBox="0 0 24 24"><path d="M11,9H9V2H7V9H5V2H3V9C3,11.12 4.66,12.84 6.75,12.97V22H9.25V12.97C11.34,12.84 13,11.12 13,9V2H11V9M16,6V14H18.5V22H21V2H16C16,4.21 17.79,6 20,6V6H16Z"/></svg>
                </div>
                <h2 className="text-3xl font-serif font-bold text-[#5D4037] mb-1">Nueva Cuenta</h2>
                <p className="text-[#8D6E63] mb-6 italic">Iníciate en nuestra cocina secreta</p>
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <input type="text" placeholder="Nombre del Chef" className="w-full p-3 bg-[#FAFAFA] border-b-2 border-[#D7CCC8] focus:border-[#E67E22] outline-none transition-colors" onChange={(e) => setRegisterData({...registerData, nombre: e.target.value})} required />
                  <input type="email" placeholder="Correo Electrónico" className="w-full p-3 bg-[#FAFAFA] border-b-2 border-[#D7CCC8] focus:border-[#E67E22] outline-none transition-colors" onChange={(e) => setRegisterData({...registerData, email: e.target.value})} required />
                  <input type="password" placeholder="Contraseña Secreta" className="w-full p-3 bg-[#FAFAFA] border-b-2 border-[#D7CCC8] focus:border-[#E67E22] outline-none transition-colors" onChange={(e) => setRegisterData({...registerData, password: e.target.value})} required />
                  <button className="w-full bg-[#E67E22] hover:bg-[#D35400] text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 uppercase tracking-widest mt-4">Empezar a Cocinar</button>
                </form>
                <div className="mt-8 text-center text-sm text-[#8D6E63]">
                  ¿Ya tienes delantal? <button onClick={() => setIsLogin(true)} className="text-[#D35400] font-bold hover:underline">Inicia sesión aquí</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;