import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/Api';
import { useNavigate, Link } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ correo: '', password: '' });
  const [registerData, setRegisterData] = useState({ nombre: '', email: '', password: '' });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.login(loginData);
      if (res.status === 'ok') {
        localStorage.setItem('token', res.token);
        alert('¡Bienvenido a mi bóveda culinaria! Vamos a cocinar.');
        navigate('/home');
      } else { alert(res.message || 'Credenciales incorrectas'); }
    } catch (err) { alert('Error al sazonar el inicio de sesión'); }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.register({ ...registerData, correo: registerData.email, clave_publica: 'ECDSA_SECURE_KEY_TEMP' });
      if (res.status === 'ok') {
        alert('¡Bienvenido al club culinario! Tu contrato digital está listo.');
        setIsLogin(true);
      } else { alert(res.message); }
    } catch (err) { alert('Error al sazonar el registro'); }
  };

  // Variantes de animación para los formularios
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
    <div className="min-h-screen flex items-center justify-center p-4">
      
      {/* Contenedor Principal (Tarjeta de Recetario) */}
      <div className="max-w-4xl w-full flex flex-col md:flex-row bg-white rounded-3xl recipe-card-shadow overflow-hidden relative border border-[#D7CCC8]">
        
        {/* Lado Decorativo Estático (Panel Verde Forestal / Naranja Quemado) */}
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
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-[#2E7D32] mx-auto mb-6">                 
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <h1 className="text-4xl font-serif-recipe font-bold mb-4">La Bóveda Culiniaria</h1>
                <p className="text-emerald-100 text-lg">Inicia sesión para desbloquear mis secretos de cocina más preciados.</p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-[#D35400] mx-auto mb-6">                 
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <h1 className="text-4xl font-serif-recipe font-bold mb-4">Únete a mi Cocina</h1>
                <p className="text-orange-100 text-lg">Regístrate para suscribirte y acceder a recetas exclusivas mediante tu contrato digital culinario.</p>
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
                className="absolute inset-x-10 top-25"
              >
                <h2 className="text-3xl font-serif-recipe font-bold text-[#5D4037] mb-6 text-center">Entrar a mi Cuenta Culiniaria</h2>
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <input type="email" placeholder="Correo electrónico del suscriptor" className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2E7D32] outline-none transition-all" onChange={(e) => setLoginData({...loginData, correo: e.target.value})} required />
                  <input type="password" placeholder="Tu contraseña secreta culiniaria" className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2E7D32] outline-none transition-all" onChange={(e) => setLoginData({...loginData, password: e.target.value})} required />
                  <button className="w-full bg-[#5D4037] hover:bg-[#3E2723] text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 uppercase tracking-wider">Desbloquear mis Recetas</button>
                </form>
                <div className="mt-8 text-center text-sm text-[#8D6E63]">
                  ¿No tienes cuenta? <button onClick={() => setIsLogin(false)} className="text-[#2E7D32] font-bold hover:underline">Regístrate aquí</button>
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
                    {/* Icono de Tenedor y Cuchara Culiniario */}
                    <svg width="60" height="60" fill="currentColor" viewBox="0 0 24 24"><path d="M11,9H9V2H7V9H5V2H3V9C3,11.12 4.66,12.84 6.75,12.97V22H9.25V12.97C11.34,12.84 13,11.12 13,9V2H11V9M16,6V14H18.5V22H21V2H16C16,4.21 17.79,6 20,6V6H16Z"/></svg>
                </div>
                <h2 className="text-3xl font-serif-recipe font-bold text-[#5D4037] mb-1">Nueva Cuenta</h2>
                <p className="text-[#8D6E63] mb-6 italic">Empecemos nuestro contrato digital culinario</p>
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <input type="text" placeholder="Tu Nombre de Chef" className="w-full p-3 bg-[#FAFAFA] border-b-2 border-[#D7CCC8] focus:border-[#E67E22] outline-none transition-colors" onChange={(e) => setRegisterData({...registerData, nombre: e.target.value})} required />
                  <input type="email" placeholder="Correo electrónico" className="w-full p-3 bg-[#FAFAFA] border-b-2 border-[#D7CCC8] focus:border-[#E67E22] outline-none transition-colors" onChange={(e) => setRegisterData({...registerData, email: e.target.value})} required />
                  <input type="password" placeholder="Crea tu contraseña secreta culiniaria" className="w-full p-3 bg-[#FAFAFA] border-b-2 border-[#D7CCC8] focus:border-[#E67E22] outline-none transition-colors" onChange={(e) => setRegisterData({...registerData, password: e.target.value})} required />
                  {/* Nota: En una fase futura, aquí agregarías los campos de contrato (período de suscripción) */}
                  <p className="text-xs text-[#8D6E63] mt-2">* Al registrarte, aceptas firmar un contrato culinario digital por tu suscripción a la Bóveda Culiniaria.</p>
                  <button className="w-full bg-[#E67E22] hover:bg-[#D35400] text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 uppercase tracking-widest mt-4">Suscribirme y Empezar</button>
                </form>
                <div className="mt-8 text-center text-sm text-[#8D6E63]">
                  ¿Ya tienes cuenta? <button onClick={() => setIsLogin(true)} className="text-[#D35400] font-bold hover:underline">Inicia sesión aquí</button>
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