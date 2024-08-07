import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'MyFinances - Home';
  }, []);

  const handleStartClick = () => {
    navigate('/login');
  };

  return (
    <div className="flex flex-col items-center text-center p-6 pt-0 bg-gray-50 min-h-screen">
      <h1 className="text-5xl font-bold text-gray-900 my-6">MyFinances</h1>
      <p className="text-lg text-gray-700 max-w-2xl mb-8">
        Prenez le contrôle de vos finances avec MyFinances. Suivez vos dépenses, définissez des budgets et atteignez vos objectifs financiers de manière simple et efficace.
      </p>
      <div className="flex flex-wrap justify-center w-full max-w-4xl mb-12">
        <div className="max-w-xs m-4 p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Suivi des Dépenses</h2>
          <p className="text-gray-600">Enregistrez vos dépenses quotidiennes et obtenez une vision claire de vos habitudes de dépenses.</p>
        </div>
        <div className="max-w-xs m-4 p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Budgets Personnalisés</h2>
          <p className="text-gray-600">Créez des budgets adaptés à vos besoins et gérez vos finances efficacement.</p>
        </div>
        <div className="max-w-xs m-4 p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Graphiques et Rapports</h2>
          <p className="text-gray-600">Visualisez vos données financières avec des graphiques intuitifs et des rapports détaillés.</p>
        </div>
      </div>
      <button
        className="bg-gray-900 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-gray-800 transition-colors duration-300"
        onClick={handleStartClick}
      >
        Commencer
      </button>
    </div>
  );
};

export default Home;
