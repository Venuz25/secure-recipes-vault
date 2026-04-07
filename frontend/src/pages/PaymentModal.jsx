const PaymentModal = ({ chef, onClose, onSuccess }) => {
  const [plan, setPlan] = useState(3);
  const costs = { 3: 150, 6: 250, 12: 400 };

  const handlePay = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const res = await subscriberApi.subscribe({
      id_usuario: user.id_usuario,
      id_chef: chef.id_chef,
      periodo_meses: plan,
      costo: costs[plan]
    });
    if (res.status === 'ok') {
      alert(res.message);
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Suscripción a {chef.nombre_chef}</h2>
        <div className="space-y-3 mb-6">
          {[3, 6, 12].map(m => (
            <label key={m} className={`flex justify-between p-4 border-2 rounded-xl cursor-pointer ${plan === m ? 'border-orange-500 bg-orange-50' : 'border-stone-100'}`}>
              <input type="radio" name="plan" className="hidden" onClick={() => setPlan(m)} />
              <span>{m} meses de acceso</span>
              <span className="font-bold">${costs[m]} MXN</span>
            </label>
          ))}
        </div>
        <button onClick={handlePay} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold">
          Confirmar Pago Simulado
        </button>
        <button onClick={onClose} className="w-full mt-2 text-stone-400">Cancelar</button>
      </div>
    </div>
  );
};