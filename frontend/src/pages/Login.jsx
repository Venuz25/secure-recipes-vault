import { useState } from 'react'
import { Link } from 'react-router-dom'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Login:', formData)
    // Aquí irá la conexión con el backend en Semana 2
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Iniciar Sesión</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Contraseña</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition font-semibold"
        >
          Iniciar Sesión
        </button>
        <p className="text-center mt-4 text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-orange-600 hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </form>
    </div>
  )
}

export default Login