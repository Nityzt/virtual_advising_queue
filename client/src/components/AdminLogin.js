import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminLogin.css';

const AdminLogin = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Hardcoded admin credentials (as requested)
    const ADMIN_CREDENTIALS = {
        email: 'admin@yorku.ca',
        password: 'admin123'
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check hardcoded credentials
            if (formData.email === ADMIN_CREDENTIALS.email &&
                formData.password === ADMIN_CREDENTIALS.password) {

                // Store admin info in localStorage for the session
                const adminInfo = {
                    email: formData.email,
                    role: 'admin',
                    loginTime: new Date().toISOString()
                };

                localStorage.setItem('adminInfo', JSON.stringify(adminInfo));

                // Navigate to admin dashboard
                navigate('/admin-dashboard');
            } else {
                setErrors({ submit: 'Invalid email or password' });
            }
        } catch (error) {
            console.error('Login error:', error);
            setErrors({ submit: 'Login failed. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-content">
                <div className="login-header">
                    <h1>Admin Login</h1>
                    <p>Access the administrative dashboard to manage queues</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="admin@yorku.ca"
                            disabled={isLoading}
                        />
                        {errors.email && (
                            <div className="form-error">{errors.email}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className={`form-input ${errors.password ? 'error' : ''}`}
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            disabled={isLoading}
                        />
                        {errors.password && (
                            <div className="form-error">{errors.password}</div>
                        )}
                    </div>

                    {errors.submit && (
                        <div className="alert alert-error">
                            {errors.submit}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-secondary login-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login to Dashboard'}
                    </button>
                </form>

                <div className="login-footer">
                    <div className="demo-credentials">
                        <h4>Demo Credentials:</h4>
                        <p>Email: admin@yorku.ca</p>
                        <p>Password: admin123</p>
                    </div>

                    <Link to="/" className="back-link">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;