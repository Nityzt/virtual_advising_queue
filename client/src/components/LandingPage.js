import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    return (
        <div className="landing-container">
            <div className="landing-content">
                <header className="landing-header">
                    <h1 className="landing-title">Virtual Queue Management</h1>
                    <p className="landing-subtitle">
                        Join academic advising queues and manage your wait time efficiently
                    </p>
                </header>

                <div className="landing-actions">
                    <Link
                        to="/student-login"
                        className="btn btn-primary landing-btn"
                    >
                        Student Login
                    </Link>

                    <Link
                        to="/admin-login"
                        className="btn btn-secondary landing-btn"
                    >
                        Admin Login
                    </Link>
                </div>

                <div className="landing-features">
                    <div className="feature-card">
                        <h3>For Students</h3>
                        <ul>
                            <li>View available queues</li>
                            <li>Join queues with your details</li>
                            <li>Track your wait time</li>
                            <li>Defer your appointment if needed</li>
                        </ul>
                    </div>

                    <div className="feature-card">
                        <h3>For Administrators</h3>
                        <ul>
                            <li>Manage multiple queues</li>
                            <li>Complete student appointments</li>
                            <li>Remove no-shows from queues</li>
                            <li>Real-time queue updates</li>
                        </ul>
                    </div>
                </div>

                <footer className="landing-footer">
                    <p>York University Academic Advising</p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;