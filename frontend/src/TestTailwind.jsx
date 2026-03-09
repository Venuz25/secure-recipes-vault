function TestTailwind() {
  return (
    <div className="p-8">
      {/* Tarjeta de prueba con estilos de Tailwind */}
      <div className="max-w-sm rounded-lg overflow-hidden shadow-lg bg-white">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-bold text-orange-600 mb-2">
            ¡Tailwind funciona! 🎉
          </h2>
          <p className="text-gray-700 text-base">
            Si ves esta tarjeta con estilos bonitos, Tailwind está configurado correctamente.
          </p>
        </div>
        <div className="px-6 pt-4 pb-2">
          <span className="inline-block bg-orange-200 rounded-full px-3 py-1 text-sm font-semibold text-orange-700 mr-2 mb-2">
            #prueba
          </span>
          <span className="inline-block bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-700 mr-2 mb-2">
            #tailwind
          </span>
        </div>
      </div>
    </div>
  );
}

export default TestTailwind;