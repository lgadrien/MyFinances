import React, { useState, useEffect } from 'react';

const ProfilePage = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    password: '',
    date_of_birth: '',
    profile_picture: '',  // Ajout du champ photo de profil
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);  // Pour stocker l'image choisie
  const [profilePictureUrl, setProfilePictureUrl] = useState(''); // URL pour afficher l'image

  // Fonction pour formater la date au format "dd/mm/yyyy"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR'); // Formate la date au format français
  };

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      fetch(`http://localhost:3000/users/${userId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données utilisateur');
          }
          return response.json();
        })
        .then((data) => {
          setUser(data);

          // Si la photo de profil est un blob, la convertir en URL
          if (data.profile_picture) {
            const blob = new Blob([data.profile_picture], { type: 'image/jpeg' });
            const imageUrl = URL.createObjectURL(blob);
            setProfilePictureUrl(imageUrl);  // Mettre à jour l'URL de l'image
          }

          setLoading(false);
        })
        .catch((error) => {
          setError(error.message);
          setLoading(false);
        });
    } else {
      setError("ID utilisateur non trouvé");
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);  // Récupérer le fichier sélectionné
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('user_id');
    const formData = new FormData();

    // Ajoute les données texte du profil
    formData.append('name', user.name);
    formData.append('email', user.email);
    formData.append('password', user.password);
    formData.append('date_of_birth', user.date_of_birth);

    // Ajoute le fichier de la photo de profil
    if (file) {
      formData.append('profile_picture', file);
    }

    fetch(`http://localhost:3000/users/${userId}`, {
      method: 'PUT',
      body: formData,  // Envoie les données en format FormData pour gérer le fichier
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Profil mis à jour', data);
        alert('Modifications enregistrées avec succès');
        setIsEditing(false);
      })
      .catch((error) => console.error("Erreur lors de la mise à jour de l'utilisateur :", error));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement des données...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-md lg:max-w-lg bg-white rounded-lg shadow-md p-6">
        <h1 className="text-xl font-semibold text-center mb-4 text-black">Mon Profil</h1>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
            <div>
              <label className="block text-sm md:text-base font-medium text-black">Nom complet</label>
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={handleChange}
                className="border p-2 mt-1 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-100 text-black"
                placeholder="Entrez votre nom"
              />
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium text-black">Date de naissance</label>
              <input
                type="date"
                name="date_of_birth"
                value={user.date_of_birth}
                onChange={handleChange}
                className="border p-2 mt-1 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-100 text-black"
              />
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium text-black">Email</label>
              <input
                type="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                className="border p-2 mt-1 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-100 text-black"
                placeholder="Entrez votre email"
              />
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium text-black">Mot de passe</label>
              <input
                type="password"
                name="password"
                value={user.password}
                onChange={handleChange}
                className="border p-2 mt-1 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-100 text-black"
                placeholder="Entrez votre mot de passe"
              />
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium text-black">Photo de profil</label>
              <input
                type="file"
                name="profile_picture"
                onChange={handleFileChange}
                className="border p-2 mt-1 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-100 text-black"
              />
            </div>
            <div className="flex justify-between space-x-2 mt-4">
              <button type="submit" className="bg-black text-white py-2 px-4 w-full sm:w-auto rounded-lg hover:bg-gray-800 transition-colors">
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white py-2 px-4 w-full sm:w-auto rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {profilePictureUrl && (
              <div className="flex justify-center">
                <img src={profilePictureUrl} alt="Profile" className="w-24 h-24 rounded-full mx-auto" />
              </div>
            )}
            <p className="text-lg text-black"><strong>Nom complet :</strong> {user.name}</p>
            <p className="text-lg text-black"><strong>Date de naissance :</strong> {formatDate(user.date_of_birth)}</p>
            <p className="text-lg text-black"><strong>Email :</strong> {user.email}</p>
            <div className="text-center">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-black text-white py-2 px-4 w-full sm:w-auto rounded-lg hover:bg-gray-800 transition-colors mt-4"
              >
                Modifier mon profil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
