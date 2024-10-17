import React, { useEffect } from 'react';

const About = () => {

  useEffect(() => {
    document.title = 'MyFinances - A propos';
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-6">À propos de nous</h1>
        
        <section className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Notre Mission</h2>
          <p className="text-gray-700 mb-4">
            Chez MyFinances, notre mission est de vous aider à gérer vos finances de manière efficace et intuitive. 
            Nous croyons que tout le monde mérite un accès facile à des outils puissants pour suivre, planifier et 
            optimiser leurs dépenses et économies.
          </p>
          <p className="text-gray-700">
            Notre application est conçue pour être simple à utiliser tout en offrant des fonctionnalités robustes 
            qui répondent aux besoins variés de nos utilisateurs. Nous nous engageons à fournir un service de haute 
            qualité et à améliorer constamment nos outils en fonction des retours de nos utilisateurs.
          </p>
        </section>

        <section className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Notre Histoire</h2>
          <p className="text-gray-700 mb-4">
            MyFinances a été fondée en 2020 avec l'idée que la gestion financière ne devrait pas être compliquée. 
            Depuis nos débuts, nous avons travaillé sans relâche pour créer une plateforme qui combine simplicité et 
            puissance, permettant à chacun de prendre le contrôle de ses finances sans effort.
          </p>
          <p className="text-gray-700">
            Nous sommes une équipe de passionnés de finance et de technologie, dédiée à rendre la gestion des finances 
            accessible à tous. Chaque jour, nous nous efforçons d'innover et d'améliorer notre produit pour vous offrir 
            la meilleure expérience possible.
          </p>
        </section>

        <section className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Nous Contacter</h2>
          <p className="text-gray-700 mb-4">
            Si vous avez des questions, des préoccupations ou si vous rencontrez des problèmes avec notre service, 
            n'hésitez pas à nous contacter. Nous sommes là pour vous aider et nous nous engageons à répondre à toutes 
            vos demandes dans les plus brefs délais.
          </p>
          <p className="text-gray-700">
            Vous pouvez nous joindre par email à <a href="mailto:support@myfinances.com" className="text-blue-500 hover:underline">support@myfinances.com</a> ou via notre 
            formulaire de contact disponible sur notre site. Nous apprécions vos retours et sommes toujours prêts à 
            améliorer notre service pour mieux répondre à vos besoins.
          </p>
        </section>
      </div>
    </div>
  );
}

export default About;
