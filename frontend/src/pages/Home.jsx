function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">
        Bienvenido a Recetas Deliciosas
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Las mejores recetas de la chef mexicana, directamente a tu cocina
      </p>
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2 text-orange-600">Receta {item}</h3>
            <p className="text-gray-600">Una deliciosa receta mexicana que te encantará preparar en casa.</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home