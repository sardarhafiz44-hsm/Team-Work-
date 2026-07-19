import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import SplashScreen from './pages/SplashScreen';
import DashboardLayout from './pages/DashboardLayout';
function App() {
 const isAuthenticated = useStore((state) => state.isAuthenticated);
 return (
 <div className="bg-canvas min-h-screen text-text-primary font-sans selection:bg-cyber-primary selection:text-canvas">
 <Router>
 <Routes>
 <Route
 path="/"
 element={!isAuthenticated ? <SplashScreen /> : <Navigate to="/dashboard" />}
 />
 <Route
 path="/dashboard"
 element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/" />}
 />
 </Routes>
 </Router>
 </div>
 );
}
export default App;