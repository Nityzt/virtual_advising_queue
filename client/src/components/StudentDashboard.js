import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './StudentDashboard.css';

const StudentDashboard = () => {
    const [studentInfo, setStudentInfo] = useState(null);
    const [availableQueues, setAvailableQueues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Mock queue data - replace with actual API call
    const mockQueues = [
        {
            id: 'academic-advising',
            name: 'Academic Advising',
            description: 'General academic guidance and course planning',
            currentCount: 3,
            estimatedWaitTime: '15-20 minutes',
            isOpen: true,
            advisors: ['Dr. Sarah Johnson', 'Prof. Michael Chen']
        },
        {
            id: 'career-services',
            name: 'Career Services',
            description: 'Resume review, interview prep, and career planning',
            currentCount: 1,
            estimatedWaitTime: '5-10 minutes',
            isOpen: true,
            advisors: ['Jessica Martinez']
        },
        {
            id: 'financial-aid',
            name: 'Financial Aid',
            description: 'Scholarships, grants, and financial assistance',
            currentCount: 5,
            estimatedWaitTime: '25-30 minutes',
            isOpen: true,
            advisors: ['Robert Kim', 'Angela Thompson']
        },
        {
            id: 'registration-help',
            name: 'Registration Help',
            description: 'Course registration and enrollment assistance',
            currentCount: 0,
            estimatedWaitTime: 'No wait',
            isOpen: false,
            advisors: ['Mark Davis']
        }
    ];

    useEffect(() => {
        // Check if student is logged in
        const storedStudentInfo = localStorage.getItem('studentInfo');
        if (!storedStudentInfo) {
            navigate('/student-login');
            return;
        }

        try {
            const parsed = JSON.parse(storedStudentInfo);
            setStudentInfo(parsed);
        } catch (error) {
            console.error('Error parsing student info:', error);
            navigate('/student-login');
            return;
        }

        // Load available queues
        loadAvailableQueues();
    }, [navigate]);

    const loadAvailableQueues = async () => {
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setAvailableQueues(mockQueues);
        } catch (error) {
            console.error('Error loading queues:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinQueue = (queueId) => {
        navigate(`/student-queue/${queueId}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('studentInfo');
        navigate('/');
    };

    if (!studentInfo) {
        return (
            <div className="loading">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h1>Welcome, {studentInfo.fullName}!</h1>
                    <p className="student-email">{studentInfo.email}</p>
                </div>

                <div className="header-actions">
                    <button onClick={handleLogout} className="btn btn-outline">
                        Logout
                    </button>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="section-header">
                    <h2>Available Queues</h2>
                    <p>Select a queue to join and receive academic assistance</p>
                </div>

                {isLoading ? (
                    <div className="loading">
                        <p>Loading available queues...</p>
                    </div>
                ) : (
                    <div className="queues-grid">
                        {availableQueues.map(queue => (
                            <div key={queue.id} className={`queue-card ${!queue.isOpen ? 'closed' : ''}`}>
                                <div className="queue-header">
                                    <h3>{queue.name}</h3>
                                    <span className={`queue-status ${queue.isOpen ? 'open' : 'closed'}`}>
                    {queue.isOpen ? 'Open' : 'Closed'}
                  </span>
                                </div>

                                <p className="queue-description">{queue.description}</p>

                                <div className="queue-stats">
                                    <div className="stat">
                                        <span className="stat-label">Current Wait:</span>
                                        <span className="stat-value">{queue.currentCount} students</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Estimated Time:</span>
                                        <span className="stat-value">{queue.estimatedWaitTime}</span>
                                    </div>
                                </div>

                                <div className="queue-advisors">
                                    <span className="advisors-label">Advisors:</span>
                                    <span className="advisors-list">
                    {queue.advisors.join(', ')}
                  </span>
                                </div>

                                <button
                                    className={`btn ${queue.isOpen ? 'btn-primary' : 'btn-secondary'} queue-join-btn`}
                                    onClick={() => handleJoinQueue(queue.id)}
                                    disabled={!queue.isOpen}
                                >
                                    {queue.isOpen ? 'Join Queue' : 'Currently Closed'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && availableQueues.length === 0 && (
                    <div className="empty-state">
                        <h3>No Queues Available</h3>
                        <p>There are currently no active queues. Please check back later.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;