import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// Main Components
import Home from './Components/Home';
// Components du Header
import Header from './Components/Header';
// Components du Footer
import Footer from './Components/Footer/Footer';
import About from './Components/Footer/About';
import Contact from './Components/Footer/Contact';
// My Account
import MyAccount from './Components/MoneyDashboard/MonCompte';
// Money Dashboard
import Opérations from './Components/MoneyDashboard/Transactions';
// Login
import Login from './Components/Login/LoginForm';
// Register
import Register from './Components/Login/RegisterForm';
// Error
import Error from './Error';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const token = JSON.parse(storedUser);
        if (token) {
          try {
            const response = await fetch('/api/auth', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.ok) {
              throw new Error('Failed to fetch user data');
            }

            const data = await response.json();
            setUser(data);
          } catch (error) {
            console.error('Error fetching user data:', error);
            localStorage.removeItem('user');
          }
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Error />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/operations" element={<Opérations />} />
      </Routes>
      <Footer />
    </Router>
  );
}

// Ce que moi j'aurais fait <3
// Tu auras probablement à l'adapter, mais c'est l'idée

/*

return (
    <>
    <Router>
        <Header />
          <Routes>
            {user ? (
              // Si on a un utilisateur
              <Route path="/my-account" element={<MyAccount />} />
              <Route path="/operations" element={<Opérations />} />
            ) : (
              // Si pas d'utilisateur
              <Route path="/my-account" element={<Login />} />
              <Route path="/operations" element={<Login />} />
            )}
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Error />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        <Footer />
      </Router>
    <>
  );
}

*/

export default App;
