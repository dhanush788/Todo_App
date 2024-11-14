import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Home';
import Project from './pages/Project';
import { auth } from './firebase/config';
import { useEffect, useState } from 'react';


function App() {
  const [user, setUser] = useState(null);

  useEffect(() => { 
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {user && (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/project/:id" element={<Project />} />
            </>
        )}
      </Routes>
    </Router>
  );
}

export default App;

