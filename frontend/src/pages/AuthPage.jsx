import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/Api';
import { useNavigate, Link } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isChefRegistration, setIsChefRegistration] = useState(false);
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ correo: '', password: '' });
  const [registerData, setRegisterData] = useState({ nombre: '', email: '', password: '' });

const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.login(loginData);
      if (res.status === 'ok') {
        if (res.data.rol === 'chef') {
          console.log('Redirigiendo a panel de Chef...');
          navigate('/ChefDashboard'); 
        } else {
          console.log('Redirigiendo a Bóveda de Usuario...');
          // navigate('/home');
        }
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('No se pudo conectar con el servidor.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { 
        nombre: registerData.nombre, 
        correo: registerData.email, 
        password: registerData.password 
      };

      const res = isChefRegistration 
        ? await api.registerChef(dataToSend) 
        : await api.register(dataToSend);

      if (res.status === 'ok') {
        alert(res.message);
        setIsLogin(true); 
        setIsChefRegistration(false);
      } else { 
        alert(res.message); 
      }
    } catch (err) { 
      alert('Error al procesar el registro'); 
    }
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
      {/* BOTÓN SUPERIOR DERECHA: Cambiar entre registro de usuario y chef */}
      {!isLogin && (
        <div className="absolute top-8 right-8 z-20">
          {isChefRegistration ? 
          <button 
            onClick={() => setIsChefRegistration(!isChefRegistration)}
            className="bg-[#D35400] text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-[#D35400] transition-all transform hover:scale-105"
          >  Registrar como Suscriptor </button> 
          : 
          <button 
            onClick={() => setIsChefRegistration(!isChefRegistration)}
            className="bg-[#5D4037] text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-[#3E2723] transition-all transform hover:scale-105"
          >  Eres Chef? Regístrate!! </button> }
        </div>
      )}
      
      <div className="max-w-4xl w-full flex flex-col md:flex-row bg-white rounded-3xl recipe-card-shadow overflow-hidden relative border border-[#D7CCC8]">
        
        {/* Panel Decorativo Izquierdo */}
        <div className={`md:w-2/5 p-12 flex flex-col justify-center text-white relative transition-colors duration-500 ${
          isLogin ? 'bg-[#2E7D32]' : (isChefRegistration ? 'bg-[#5D4037]' : 'bg-[#D35400]')
        }`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cork-board.png")' }}></div>
          
          <motion.div
            // La 'key' dinámica permite que la animación se reinicie al cambiar de estado
            key={isLogin ? 'login' : (isChefRegistration ? 'chef' : 'register')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative text-center"
          >
            {/* El ícono se mantiene igual, solo cambia el color de su fondo circular */}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isLogin ? 'bg-green-100 text-[#2E7D32]' : (isChefRegistration ? 'bg-amber-100 text-[#5D4037]' : 'bg-orange-100 text-[#D35400]')
            }`}>
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>

            {isLogin ? (
              <>
                <h1 className="text-4xl font-serif-recipe font-bold mb-4">La Bóveda Culiniaria</h1>
                <p className="text-emerald-100 text-lg">Inicia sesión para desbloquear mis secretos de cocina más preciados.</p>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-serif-recipe font-bold mb-4">
                  {isChefRegistration ? 'Únete como Chef' : 'Únete a la Bóveda'}
                </h1>
                <p className="text-orange-100 text-lg">
                  {isChefRegistration 
                    ? 'Protege tus recetas con criptografía híbrida.' 
                    : 'Suscríbete para acceder a recetas exclusivas.'}
                </p>
              </>
            )}
          </motion.div>
        </div>

        {/* Lado de Formularios*/}
        <div className="md:w-3/5 p-10 bg-white relative min-h-[550px]">
          <AnimatePresence initial={false} custom={isLogin ? -1 : 1}>
            
            {/* FORMULARIO DE INICIO DE SESIÓN */}
            {isLogin && (
              <motion.div
                key="login-form"
                custom={1}
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

            {/* REGISTRO (DINÁMICO: USUARIO O CHEF) */}
            {!isLogin && (
              <motion.div key="register" custom={-1} variants={formVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-x-10 top-10">
                <h2 className="text-3xl font-serif font-bold text-[#5D4037] mb-1">
                  {isChefRegistration ? 'Registro de Chef' : 'Nueva Cuenta'}
                </h2>
                <p className="text-[#8D6E63] mb-6 italic">
                  {isChefRegistration ? 'Sube y protege tus creaciones' : 'Empecemos nuestro contrato digital'}
                </p>
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <input type="text" placeholder={isChefRegistration ? "Nombre del Chef" : "Tu Nombre Completo"} className="w-full p-3 bg-[#FAFAFA] border-b-2 border-[#D7CCC8] focus:border-[#E67E22] outline-none" onChange={(e) => setRegisterData({...registerData, nombre: e.target.value})} required />
                  <input type="email" placeholder="Correo electrónico" className="w-full p-3 bg-[#FAFAFA] border-b-2 border-[#D7CCC8] focus:border-[#E67E22] outline-none" onChange={(e) => setRegisterData({...registerData, email: e.target.value})} required />
                  <input type="password" placeholder="Contraseña segura" className="w-full p-3 bg-[#FAFAFA] border-b-2 border-[#D7CCC8] focus:border-[#E67E22] outline-none" onChange={(e) => setRegisterData({...registerData, password: e.target.value})} required />
                  
                  <p className="text-xs text-[#8D6E63] mt-2">
                    {isChefRegistration 
                      ? '* Al registrarte, aceptas los términos de autoría y protección de datos.' 
                      : '* Al registrarte, aceptas firmar un contrato culinario digital por tu suscripción.'}
                  </p>
                  
                  <button className={`w-full text-white font-bold py-4 rounded-xl shadow-lg uppercase transition-colors ${isChefRegistration ? 'bg-[#5D4037] hover:bg-[#3E2723]' : 'bg-[#E67E22] hover:bg-[#D35400]'}`}>
                    {isChefRegistration ? 'Crear Cuenta de Chef' : 'Suscribirme'}
                  </button>
                </form>
                <div className="mt-8 text-center text-[#8D6E63]">
                  ¿Ya tienes cuenta? <button onClick={() => {setIsLogin(true); setIsChefRegistration(false);}} className="text-[#D35400] font-bold hover:underline">Inicia sesión</button>
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