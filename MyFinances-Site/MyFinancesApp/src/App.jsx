import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
//Main Components
import Home from './Components/Home';
//Components du Header
import Header from './Components/Header';
//Components du Footer
import Footer from './Components/Footer/Footer';
import About from './Components/Footer/About';
import Contact from './Components/Footer/Contact';
//My Account
import MyAccount from './Components/MoneyDashboard/MonCompte';
//Money Dashboard
import Opérations from './Components/MoneyDashboard/Opérations';
//Login
import Login from './Components/Login/LoginForm';
//Register
import Register from './Components/Login/RegisterForm';
//Error
import Error from './Error';


function App() {
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

export default App;
