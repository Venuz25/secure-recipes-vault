import React, { useState, useEffect } from 'react';
import { CreditCard, Lock, ShieldCheck, X, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { api } from '../services/Api';

const PaymentModal = ({ chef, initialPlan = 3, prices, onClose, onSuccess }) => {
  const [plan, setPlan] = useState(initialPlan);
  const [method, setMethod] = useState('card');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  });

  // Estado de errores
  const [errors, setErrors] = useState({});

  const currentCost = prices[plan];

  // Formateadores automáticos mientras el usuario escribe
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'number') {
      const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      const parts = [];
      for (let i = 0; i < v.length; i += 4) {
        parts.push(v.substring(i, i + 4));
      }
      formattedValue = parts.length > 1 ? parts.join(' ') : v;
      if (formattedValue.length > 19) return;
    }

    if (name === 'expiry') {
      // Formato MM/YY
      const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      if (v.length >= 2) {
        formattedValue = `${v.substring(0, 2)}/${v.substring(2, 4)}`;
      } else {
        formattedValue = v;
      }
      if (formattedValue.length > 5) return;
    }

    if (name === 'cvv') {
      formattedValue = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      if (formattedValue.length > 4) return;
    }

    setFormData({ ...formData, [name]: formattedValue });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  // Validaciones antes de pagar
  const validateForm = () => {
    const newErrors = {};
    if (method === 'card') {
      if (formData.name.trim().length < 3) newErrors.name = 'Ingresa el nombre impreso en la tarjeta';
      if (formData.number.replace(/\s/g, '').length !== 16) newErrors.number = 'El número debe tener 16 dígitos';
      if (formData.cvv.length < 3) newErrors.cvv = 'CVV inválido';
      
      // Validar expiración (Mes 01-12, Año futuro)
      const expParts = formData.expiry.split('/');
      if (expParts.length !== 2 || parseInt(expParts[0]) < 1 || parseInt(expParts[0]) > 12) {
        newErrors.expiry = 'Mes inválido';
      } else {
        const year = parseInt(`20${expParts[1]}`);
        const currentYear = new Date().getFullYear();
        if (year < currentYear) newErrors.expiry = 'Tarjeta expirada';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePay = async (e) => {
    e.preventDefault();
    
    if (method === 'card' && !validateForm()) return;

    setIsLoading(true);
    const userId = localStorage.getItem('userId');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const numeroLimpio = method === 'card' 
        ? formData.number.replace(/\s/g, '') 
        : "0000000000000000";

      const res = await api.createSubscription({
        id_usuario: parseInt(userId),
        id_chef: chef.id_chef,
        periodo_meses: plan,
        costo: currentCost,
        datos_pago: { 
          numero_tarjeta: numeroLimpio
        }
      });
      
      if (res.status === 'ok') {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        alert(res.message || 'Fondos insuficientes o error en la tarjeta.');
      }
    } catch (err) {
      console.error('Error en suscripción:', err);
      alert('Error de conexión con la pasarela bancaria.');
    } finally {
      if (!isSuccess) setIsLoading(false);
    }
  };

  // Pantalla de Éxito
  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-2xl flex flex-col items-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">¡Pago Exitoso!</h2>
          <p className="text-stone-500 mb-6">Tu suscripción a la Bóveda de <b>Chef {chef.nombre_chef}</b> está activa.</p>
          <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-full animate-[pulse_1s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 font-sans">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative max-h-[95vh]">
        
        <button onClick={onClose} className="absolute top-6 right-6 text-stone-400 hover:text-stone-800 z-10 bg-white/50 rounded-full p-1 backdrop-blur-sm">
          <X size={24} />
        </button>

        {/* COLUMNA IZQUIERDA: RESUMEN DE COMPRA */}
        <div className="w-full md:w-5/12 bg-stone-50 p-8 md:p-10 border-r border-stone-200 overflow-y-auto">
          <h2 className="text-xl font-bold text-stone-800 mb-8 font-serif">Resumen del Pedido</h2>
          
          <div className="flex items-center gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
            <img src={chef.foto_url || 'https://via.placeholder.com/150'} alt="Chef" className="w-16 h-16 rounded-full object-cover border-2 border-orange-100" />
            <div>
              <p className="text-xs text-orange-600 font-bold uppercase">Suscripción</p>
              <p className="font-bold text-stone-800">Chef {chef.nombre_chef}</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <p className="text-sm font-bold text-stone-800 mb-2">Selecciona tu plan:</p>
            {[3, 6, 12].map(m => (
              <label key={m} className={`flex justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${plan === m ? 'border-orange-500 bg-orange-50' : 'border-stone-200 bg-white hover:border-orange-300'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="plan" className="hidden" onChange={() => setPlan(m)} checked={plan === m} />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${plan === m ? 'border-orange-500' : 'border-stone-300'}`}>
                    {plan === m && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                  </div>
                  <span className={`text-sm ${plan === m ? 'font-bold text-orange-900' : 'text-stone-600'}`}>{m} Meses</span>
                </div>
                <span className="font-bold text-stone-800">${prices[m]}</span>
              </label>
            ))}
          </div>

          <div className="border-t border-stone-200 pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-stone-500">Subtotal</span>
              <span className="font-bold text-stone-800">${currentCost}.00 MXN</span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-stone-500">Impuestos</span>
              <span className="font-bold text-stone-800">$0.00 MXN</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-stone-800">Total a pagar</span>
              <span className="font-black text-orange-600">${currentCost}.00 MXN</span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: PASARELA DE PAGO */}
        <div className="w-full md:w-7/12 p-8 md:p-10 overflow-y-auto bg-white">
          <div className="flex items-center gap-2 text-stone-800 mb-8">
            <Lock size={20} className="text-green-600" />
            <h2 className="text-xl font-bold font-serif">Pago Seguro</h2>
          </div>

          {/* Selector de Método de Pago */}
          <div className="flex gap-4 mb-8">
            <button 
              type="button"
              onClick={() => setMethod('card')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${method === 'card' ? 'border-stone-800 bg-stone-800 text-white' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}
            >
              <CreditCard size={18} /> Tarjeta
            </button>
            <button 
              type="button"
              onClick={() => setMethod('paypal')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${method === 'paypal' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 6.003 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.529 0-.968.382-1.05.9l-1.12 7.106z"/></svg>
              PayPal
            </button>
          </div>

          <form onSubmit={handlePay}>
            {method === 'card' ? (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Nombre en la tarjeta</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej. Juan Pérez"
                    className={`w-full p-3.5 border rounded-xl bg-stone-50 focus:bg-white outline-none transition-all ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-200 focus:border-stone-800'}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Número de tarjeta</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="number"
                      value={formData.number}
                      onChange={handleInputChange}
                      placeholder="0000 0000 0000 0000"
                      className={`w-full pl-10 pr-4 py-3.5 border rounded-xl bg-stone-50 focus:bg-white outline-none transition-all font-mono text-lg tracking-wider ${errors.number ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-200 focus:border-stone-800'}`}
                    />
                    <CreditCard size={18} className="absolute left-3.5 top-4 text-stone-400" />
                  </div>
                  {errors.number && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.number}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Expiración</label>
                    <input 
                      type="text" 
                      name="expiry"
                      value={formData.expiry}
                      onChange={handleInputChange}
                      placeholder="MM/YY"
                      className={`w-full p-3.5 border rounded-xl bg-stone-50 focus:bg-white outline-none transition-all font-mono text-center tracking-widest ${errors.expiry ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-200 focus:border-stone-800'}`}
                    />
                    {errors.expiry && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.expiry}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">CVV</label>
                    <input 
                      type="password" 
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      placeholder="•••"
                      className={`w-full p-3.5 border rounded-xl bg-stone-50 focus:bg-white outline-none transition-all font-mono text-center tracking-widest ${errors.cvv ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-200 focus:border-stone-800'}`}
                    />
                    {errors.cvv && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.cvv}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50 animate-in fade-in duration-300">
                <p className="text-blue-800 font-bold mb-2">Serás redirigido a PayPal</p>
                <p className="text-sm text-blue-600 mb-6">Completa tu compra de forma segura utilizando tu cuenta.</p>
                <div className="inline-block px-6 py-3 bg-blue-600 text-white rounded-full font-bold opacity-50">
                  Simulación Activa
                </div>
              </div>
            )}

            <div className="mt-10 flex items-center gap-2 text-xs text-stone-500 mb-6 justify-center">
              <ShieldCheck size={16} className="text-green-600" />
              <span>Tus datos están protegidos con cifrado de extremo a extremo.</span>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition-all ${isLoading ? 'bg-stone-300 text-stone-500 cursor-not-allowed' : method === 'paypal' ? 'bg-[#FFC439] text-[#003087] hover:bg-[#FFD15C]' : 'bg-[#D35400] hover:bg-orange-700 text-white'}`}
            >
              {isLoading ? (
                <>Procesando <div className="w-4 h-4 border-2 border-stone-500 border-t-transparent rounded-full animate-spin"></div></>
              ) : (
                <>Pagar ${currentCost}.00 MXN <ChevronRight size={18} /></>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default PaymentModal;