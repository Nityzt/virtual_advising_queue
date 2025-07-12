
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import StudentLogin from './components/StudentLogin';
import AdminLogin from './components/AdminLogin';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import StudentQueue from './components/StudentQueue';
import StudentStatus from './components/StudentStatus';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/student-login" element={<StudentLogin />} />
                    <Route path="/admin-login" element={<AdminLogin />} />
                    <Route path="/student-dashboard" element={<StudentDashboard />} />
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    <Route path="/student-queue/:queueId" element={<StudentQueue />} />
                    <Route path="/student-status/:queueId" element={<StudentStatus />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;