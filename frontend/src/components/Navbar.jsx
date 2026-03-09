import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="bg-orange-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold hover:text-orange-200 transition">
            🍳 Recetas Deliciosas
          </Link>
          <div className="space-x-4">
            <Link to="/login" className="hover:text-orange-200 transition">
              Iniciar Sesión
            </Link>
            <Link 
              to="/registro" 
              className="bg-white text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-100 transition"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar