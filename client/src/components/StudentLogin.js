import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './StudentLogin.css';

const StudentLogin = () => {
    const [formData, setFormData] = useState({
        email: '',
        fullName: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

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
        } else if (!formData.email.endsWith('@my.yorku.ca')) {
            newErrors.email = 'Please use your @my.yorku.ca email address';
        }

        // Full name validation
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Please enter your full name';
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
            // Store student info in localStorage for the session
            const studentInfo = {
                email: formData.email,
                fullName: formData.fullName.trim(),
                loginTime: new Date().toISOString()
            };

            localStorage.setItem('studentInfo', JSON.stringify(studentInfo));

            // Navigate to student dashboard
            navigate('/student-dashboard');
        } catch (error) {
            console.error('Login error:', error);
            setErrors({ submit: 'Login failed. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="student-login-container">
            <div className="student-login-content">
                <div className="login-header">
                    <h1>Student Login</h1>
                    <p>Enter your York University credentials to access available queues</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            York University Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your.name@my.yorku.ca"
                            disabled={isLoading}
                        />
                        {errors.email && (
                            <div className="form-error">{errors.email}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="fullName" className="form-label">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            className={`form-input ${errors.fullName ? 'error' : ''}`}
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            disabled={isLoading}
                        />
                        {errors.fullName && (
                            <div className="form-error">{errors.fullName}</div>
                        )}
                    </div>

                    {errors.submit && (
                        <div className="alert alert-error">
                            {errors.submit}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary login-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Continue to Dashboard'}
                    </button>
                </form>

                <div className="login-footer">
                    <Link to="/" className="back-link">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default StudentLogin;