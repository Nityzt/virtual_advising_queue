import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './StudentQueue.css';

const StudentQueue = () => {
    const { queueId } = useParams(); // ✅ Extract queueId from URL
    const navigate = useNavigate();
    const [studentInfo, setStudentInfo] = useState(null);
    const [queueInfo, setQueueInfo] = useState(null);
    const [formData, setFormData] = useState({
        studentId: '',
        phoneNumber: '',
        advisingQuestions: '',
        urgencyLevel: 'normal'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentQueueLength, setCurrentQueueLength] = useState(0);

    // Mock API base URL
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://virtual-advising-queue.onrender.com';

    // ✅ FIXED: Use the exact same queue IDs as AdminDashboard expects
    const mockQueues = useMemo(() => ({
        'academic-advising': {
            id: 'academic-advising',
            name: 'Academic Advising',
            description: 'Get help with course selection, degree planning, and academic requirements.',
            estimatedWaitTime: 15,
            isOpen: true,
            advisorName: 'Dr. Sarah Johnson',
            location: 'Student Services Building, Room 201'
        },
        'career-services': {
            id: 'career-services',
            name: 'Career Services',
            description: 'Resume review, job search assistance, and career planning.',
            estimatedWaitTime: 20,
            isOpen: true,
            advisorName: 'Mike Chen',
            location: 'Career Center, Room 105'
        },
        'financial-aid': {
            id: 'financial-aid',
            name: 'Financial Aid',
            description: 'Questions about scholarships, loans, and financial assistance.',
            estimatedWaitTime: 25,
            isOpen: true,
            advisorName: 'Lisa Rodriguez',
            location: 'Financial Aid Office, Room 150'
        },
        'general-advising': {
            id: 'general-advising',
            name: 'General Academic Advising',
            description: 'Get help with course selection, degree planning, and academic requirements.',
            estimatedWaitTime: 15,
            isOpen: true,
            advisorName: 'Dr. Sarah Johnson',
            location: 'Student Services Building, Room 201'
        },
        'registration-help': {
            id: 'registration-help',
            name: 'Registration Help',
            description: 'Course registration and enrollment assistance.',
            estimatedWaitTime: 10,
            isOpen: false,
            advisorName: 'Mark Davis',
            location: 'Registrar Office, Room 120'
        }
    }), []);

    const loadCurrentQueueLength = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/queue`);
            if (response.ok) {
                const data = await response.json();
                // ✅ Filter by current queueId to get accurate count
                const currentQueueEntries = data.filter(entry => entry.queueId === queueId);
                setCurrentQueueLength(currentQueueEntries.length);
            }
        } catch (error) {
            console.error('Error loading queue length:', error);
        }
    }, [API_BASE_URL, queueId]);

    useEffect(() => {
        // ✅ Debug: Log the queueId from URL
        console.log('🔍 StudentQueue - queueId from URL:', queueId);

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

        // Load queue information
        const queue = mockQueues[queueId];
        if (!queue) {
            console.error('❌ Queue not found:', queueId);
            navigate('/student-dashboard');
            return;
        }

        console.log('✅ Queue found:', queue);
        setQueueInfo(queue);

        // Load current queue length
        loadCurrentQueueLength();
    }, [queueId, navigate, mockQueues, loadCurrentQueueLength]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // ✅ FIXED: Create queue entry with proper field names and queueId
            const queueEntry = {
                name: studentInfo.fullName,
                studentId: formData.studentId,
                email: studentInfo.email,
                phone: formData.phoneNumber,           // ✅ FIXED: phone not phoneNumber
                questions: formData.advisingQuestions, // ✅ FIXED: questions not advisingQuestions
                queueId: queueId,                      // ✅ CRITICAL: Include queueId from URL
                joinedAt: new Date().toISOString()
            };

            // ✅ Debug logging
            console.log('🔍 Queue ID from URL:', queueId);
            console.log('🔍 Submitting queue entry:', queueEntry);

            const response = await fetch(`${API_BASE_URL}/api/queue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(queueEntry)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Server response:', result);

                // Store queue entry info for status page
                localStorage.setItem('currentQueueEntry', JSON.stringify({
                    ...result,
                    queueId: queueId,
                    joinedAt: new Date().toISOString()
                }));

                // Navigate to status page
                navigate(`/student-status/${queueId}`);
            } else {
                const error = await response.json();
                console.error('❌ Server error:', error);
                alert(`Failed to join queue: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error joining queue:', error);
            alert('Error joining queue. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate('/student-dashboard');
    };

    const getEstimatedWaitTime = () => {
        if (!queueInfo) return 0;
        return (currentQueueLength * queueInfo.estimatedWaitTime) + queueInfo.estimatedWaitTime;
    };

    const isOfficeClosingSoon = () => {
        const now = new Date();
        const closingTime = new Date();
        closingTime.setHours(17, 0, 0, 0); // 5 PM

        const estimatedFinishTime = new Date(now.getTime() + (getEstimatedWaitTime() * 60000));
        return estimatedFinishTime > closingTime;
    };

    if (!studentInfo || !queueInfo) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading queue information...</p>
            </div>
        );
    }

    return (
        <div className="student-queue-container">
            <div className="queue-header">
                <button onClick={handleBack} className="back-button">
                    ← Back to Dashboard
                </button>
                <div className="student-welcome">
                    <h1>Join Queue: {queueInfo.name}</h1>
                    <p className="student-email">Logged in as: {studentInfo.email}</p>
                </div>
            </div>

            <div className="queue-content">
                <div className="queue-info-card">
                    <h2>{queueInfo.name}</h2>
                    <p className="queue-description">{queueInfo.description}</p>

                    <div className="queue-details">
                        <div className="detail-item">
                            <span className="detail-label">Queue ID:</span>
                            <span className="detail-value">{queueId}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Advisor:</span>
                            <span className="detail-value">{queueInfo.advisorName}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Location:</span>
                            <span className="detail-value">{queueInfo.location}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Current Queue Length:</span>
                            <span className="detail-value">{currentQueueLength} students</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Estimated Wait Time:</span>
                            <span className="detail-value wait-time">
                                {getEstimatedWaitTime()} minutes
                            </span>
                        </div>
                    </div>

                    {isOfficeClosingSoon() && (
                        <div className="warning-message">
                            <strong>⚠️ Notice:</strong> Based on the estimated wait time, your appointment may extend past office hours (5:00 PM).
                            Please consider joining earlier tomorrow or contact the office directly.
                        </div>
                    )}

                    <div className="queue-status">
                        <span className={`status-indicator ${queueInfo.isOpen ? 'open' : 'closed'}`}>
                            {queueInfo.isOpen ? 'Queue Open' : 'Queue Closed'}
                        </span>
                    </div>
                </div>

                <div className="join-form-card">
                    <h3>Join Queue</h3>
                    <p className="form-description">
                        Please provide the following information to join the {queueInfo.name} queue. Your name and email are pre-filled from your login.
                    </p>

                    <form onSubmit={handleSubmit} className="join-form">
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                value={studentInfo.fullName}
                                disabled
                                className="form-input disabled"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={studentInfo.email}
                                disabled
                                className="form-input disabled"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="studentId">Student ID</label>
                            <input
                                type="text"
                                id="studentId"
                                name="studentId"
                                value={formData.studentId}
                                onChange={handleInputChange}
                                placeholder="e.g. 123456789"
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phoneNumber">Phone Number (Optional)</label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                placeholder="(555) 123-4567"
                                className="form-input"
                            />
                            <small className="form-help">
                                Provide your phone number to receive SMS notifications about queue updates.
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="advisingQuestions">Questions/Topics to Discuss (Optional)</label>
                            <textarea
                                id="advisingQuestions"
                                name="advisingQuestions"
                                value={formData.advisingQuestions}
                                onChange={handleInputChange}
                                placeholder="Briefly describe what you'd like to discuss during your appointment..."
                                rows="4"
                                className="form-textarea"
                            />
                            <small className="form-help">
                                This helps the advisor prepare for your meeting and can reduce wait time.
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="urgencyLevel">Priority Level</label>
                            <select
                                id="urgencyLevel"
                                name="urgencyLevel"
                                value={formData.urgencyLevel}
                                onChange={handleInputChange}
                                className="form-select"
                            >
                                <option value="normal">Normal Priority</option>
                                <option value="urgent">Urgent (Deadline Today)</option>
                                <option value="high">High Priority (Deadline This Week)</option>
                            </select>
                            <small className="form-help">
                                Select urgency level based on your deadlines. This does not change queue order.
                            </small>
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="btn btn-secondary"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting || !queueInfo.isOpen}
                            >
                                {isSubmitting ? 'Joining Queue...' : `Join ${queueInfo.name}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StudentQueue;