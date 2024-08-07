import React, { useState, useEffect } from 'react';
import emailjs from 'emailjs-com';

const Contact = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    document.title = 'MyFinances - Contact';
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState({
      ...formState,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs.sendForm('your_service_id', 'your_template_id', e.target, 'your_user_id')
      .then((result) => {
        console.log(result.text);
        setStatus('Message envoyé avec succès !');
        setFormState({ name: '', email: '', message: '' });
      }, (error) => {
        console.log(error.text);
        setStatus('Erreur lors de l\'envoi du message.');
      });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-6">Contactez-nous</h1>
        
        <section className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Nous serions ravis d'avoir de vos nouvelles</h2>
          <p className="text-gray-700 mb-4">
            Si vous avez des questions, des suggestions ou des préoccupations, n'hésitez pas à nous contacter. 
            Nous nous engageons à répondre à toutes vos demandes dans les plus brefs délais.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">Nom</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formState.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formState.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-gray-700 font-semibold mb-2">Message</label>
              <textarea
                id="message"
                name="message"
                rows="4"
                value={formState.message}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
              ></textarea>
            </div>
            
            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-300"
            >
              Envoyer
            </button>
          </form>

          {status && <p className="mt-4 text-center text-gray-600">{status}</p>}
        </section>
      </div>
    </div>
  );
}

export default Contact;
