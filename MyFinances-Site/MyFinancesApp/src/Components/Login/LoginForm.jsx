import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Email ou mot de passe incorrect');
        }
        throw new Error('Erreur lors de la connexion');
      }

      const data = await response.json();
      console.log('Utilisateur connecté:', data);

      // Stocker le token JWT
      localStorage.setItem('token', data.token);

      // Rediriger vers la page d'accueil après une connexion réussie
      navigate('/my-account');
    } catch (error) {
      console.error('Erreur lors de la connexion:', error.message);
      setError(error.message);
    }
  };

  const handleGoogleLogin = () => {
    // Logique de connexion via Google ici
    console.log('Connexion avec Google');
  };

  useEffect(() => {
    document.title = 'MyFinances - Login';
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Connexion à MyFinances</h2>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-gray-200"
              placeholder="Entrer votre adresse email"
            />
          </div>
          <div className="mb-6 relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-gray-200"
                placeholder="Entrer votre mot de passe"
              />
              <button
                type="button"
                className="absolute right-3 flex items-center text-gray-600 hover:text-gray-800 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94a9.952 9.952 0 0 1-5.94 2.06C6.48 20 2 14.97 2 12s4.48-8 10-8c2.13 0 4.13.68 5.76 1.81M22 22l-2-2M4 4l16 16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-gray-900 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-800 transition-colors duration-300"
          >
            Se connecter
          </button>
        </form>
        <div className="flex items-center justify-center mt-4">
          <span className="text-gray-600 mx-2">ou</span>
        </div>
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-600 font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 transition-colors duration-300 mt-4"
        >
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google"
            className="w-6 h-6 mr-2"
          />
          Se connecter avec Google
        </button>
        <p className="text-center text-sm text-gray-600 mt-4">
          Pas encore de compte ?{' '}
          <a href="/register" className="text-gray-900 font-semibold hover:underline">
            Inscrivez-vous
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
