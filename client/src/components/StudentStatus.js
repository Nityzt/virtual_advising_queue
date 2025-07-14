/**
 * CLIENT: Fixed StudentStatus.js
 * Resolves React hooks dependency warnings
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api'; // Import smart API config
import './StudentStatus.css';

function StudentStatus() {
    const { queueId } = useParams();
    const navigate = useNavigate();
    const [queueData, setQueueData] = useState(null);
    const [studentPosition, setStudentPosition] = useState(null);
    const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeferModal, setShowDeferModal] = useState(false);
    const [deferMinutes, setDeferMinutes] = useState(15);
    const [studentData, setStudentData] = useState({ email: '', name: '' });

    // API_BASE_URL will automatically choose the right URL
    console.log('StudentStatus using API URL:', API_BASE_URL);

    // Hardcoded office closing time (5:00 PM)
    const OFFICE_CLOSING_TIME = 17; // 5 PM in 24-hour format
    const AVERAGE_ADVISING_TIME = 10; // minutes per student

    const calculateWaitTime = useCallback((position) => {
        if (position <= 1) return 0;
        return (position - 1) * AVERAGE_ADVISING_TIME;
    }, []);

    const fetchQueueStatus = useCallback(async () => {
        try {
            const storedStudentInfo = localStorage.getItem('studentInfo');
            if (!storedStudentInfo) {
                navigate('/student-login');
                return;
            }

            let studentInfo;
            try {
                studentInfo = JSON.parse(storedStudentInfo);
            } catch (parseError) {
                console.error('Error parsing student info:', parseError);
                navigate('/student-login');
                return;
            }

            const studentEmail = studentInfo.email;

            const response = await fetch(`${API_BASE_URL}/api/queue/${queueId}/status`, {
                headers: {
                    'Content-Type': 'application/json',
                    'student-email': studentEmail
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch queue status');
            }

            const data = await response.json();
            setQueueData(data);
            setStudentPosition(data.position);
            setEstimatedWaitTime(calculateWaitTime(data.position));
            setLoading(false);
        } catch (err) {
            console.error('Error fetching queue status:', err);
            setError('Unable to load queue status. Please try again.');
            setLoading(false);
        }
    }, [queueId, calculateWaitTime, navigate]);

    const updateStudentPosition = useCallback((entries) => {
        if (!studentData.email) return;

        const studentIndex = entries.findIndex(entry => entry.email === studentData.email);

        if (studentIndex === -1) {
            // Student not found in queue - they may have been removed
            alert("You have been removed from the queue.");
            navigate('/student-dashboard');
            return;
        }

        const position = studentIndex + 1;
        setStudentPosition(position);
        setEstimatedWaitTime(calculateWaitTime(position));
    }, [studentData.email, navigate, calculateWaitTime]);

    // FIXED: Main useEffect with proper dependencies
    useEffect(() => {
        // Get student info from localStorage (stored by StudentLogin)
        const storedStudentInfo = localStorage.getItem('studentInfo');
        if (!storedStudentInfo) {
            navigate('/student-login');
            return;
        }

        let studentInfo;
        try {
            studentInfo = JSON.parse(storedStudentInfo);
        } catch (error) {
            console.error('Error parsing student info:', error);
            navigate('/student-login');
            return;
        }

        const studentEmail = studentInfo.email;
        const studentName = studentInfo.fullName;

        // Store in component state for easy access
        setStudentData({ email: studentEmail, name: studentName });

        // Initialize socket connection
        const newSocket = io(API_BASE_URL, {
            transports: ["websocket"],
        });


        // SIMPLE FIX: Just refresh status instead of using socket data
        newSocket.on("queue-updated", (updatedQueue) => {
            if (updatedQueue.queueId === queueId) {
                console.log('Queue updated, refreshing status...');
                fetchQueueStatus(); // Just refresh from API
            }
        });

        newSocket.on("queue-deleted", () => {
            console.log('Queue entry deleted, refreshing status...');
            fetchQueueStatus(); // Refresh when someone leaves
        });
        newSocket.on("student-notified", (data) => {
            if (data.studentEmail === studentEmail) {
                alert("It's your turn! Please proceed to the advising office.");
            }
        });

        // Fetch initial queue status
        fetchQueueStatus();

        // CRITICAL: Cleanup socket connection to prevent memory leaks
        return () => {
            newSocket?.disconnect();
        };
    }, [queueId, navigate, fetchQueueStatus, updateStudentPosition]); // FIXED: Added missing dependencies

    const handleDefer = () => {
        setShowDeferModal(true);
    };

    const confirmDefer = async () => {
        const now = new Date();
        const deferredTime = new Date(now.getTime() + deferMinutes * 60000);
        const closingTime = new Date();
        closingTime.setHours(OFFICE_CLOSING_TIME, 0, 0, 0);

        // Check if deferred time would be past closing
        if (deferredTime > closingTime) {
            const confirmLeave = window.confirm(
                `Deferring by ${deferMinutes} minutes would push your appointment past office closing time (5:00 PM). Would you like to leave the queue instead?`
            );

            if (confirmLeave) {
                handleLeaveQueue();
                return;
            } else {
                setShowDeferModal(false);
                return;
            }
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/queue/${queueId}/defer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentEmail: studentData.email,
                    deferMinutes
                })
            });

            if (!response.ok) {
                throw new Error('Failed to defer appointment');
            }

            alert(`Your appointment has been deferred by ${deferMinutes} minutes.`);
            setShowDeferModal(false);
            fetchQueueStatus();
        } catch (err) {
            console.error('Error deferring appointment:', err);
            alert('Unable to defer appointment. Please try again.');
        }
    };

    const handleLeaveQueue = async () => {
        const confirmLeave = window.confirm(
            "Are you sure you want to leave the queue? You'll need to join again if you change your mind."
        );

        if (!confirmLeave) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/queue/${queueId}/leave`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ studentEmail: studentData.email })
            });

            if (!response.ok) {
                throw new Error('Failed to leave queue');
            }

            alert('You have left the queue.');
            navigate('/student-dashboard');
        } catch (err) {
            console.error('Error leaving queue:', err);
            alert('Unable to leave queue. Please try again.');
        }
    };

    const formatWaitTime = (minutes) => {
        if (minutes === 0) return "You're next!";
        if (minutes < 60) return `${minutes} minutes`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    if (loading) {
        return (
            <div className="student-status-container">
                <div className="loading">Loading your queue status...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="student-status-container">
                <div className="error">{error}</div>
                <button onClick={() => navigate('/student-dashboard')} className="btn btn-primary">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="student-status-container">
            <div className="student-status-card">
                <h1>Queue Status</h1>

                <div className="queue-info">
                    <h2>{queueData?.queueName || 'Academic Advising'}</h2>
                    <p className="queue-description">{queueData?.description}</p>
                </div>

                <div className="status-display">
                    <div className="position-card">
                        <h3>Your Position</h3>
                        <div className="position-number">{studentPosition}</div>
                        <p>in line</p>
                    </div>

                    <div className="time-card">
                        <h3>Estimated Wait Time</h3>
                        <div className="wait-time">{formatWaitTime(estimatedWaitTime)}</div>
                        <p>approximate</p>
                    </div>
                </div>

                <div className="student-info">
                    <h3>Your Details</h3>
                    <p><strong>Name:</strong> {studentData.name || 'Loading...'}</p>
                    <p><strong>Email:</strong> {studentData.email || 'Loading...'}</p>
                    {queueData?.studentDetails?.phone && (
                        <p><strong>Phone:</strong> {queueData.studentDetails.phone}</p>
                    )}
                    {queueData?.studentDetails?.questions && (
                        <div>
                            <strong>Questions:</strong>
                            <p className="questions-text">{queueData.studentDetails.questions}</p>
                        </div>
                    )}
                </div>

                <div className="action-buttons">
                    <button
                        onClick={handleDefer}
                        className="btn btn-secondary"
                        disabled={studentPosition <= 1}
                    >
                        Defer Appointment
                    </button>
                    <button
                        onClick={handleLeaveQueue}
                        className="btn btn-danger"
                    >
                        Leave Queue
                    </button>
                </div>

                <div className="queue-info-footer">
                    <p>Office Hours: 9:00 AM - 5:00 PM</p>
                    <p>Please arrive promptly when it's your turn.</p>
                </div>
            </div>

            {showDeferModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Defer Your Appointment</h3>
                        <p>How long would you like to defer your appointment?</p>

                        <div className="defer-options">
                            <label>
                                <input
                                    type="radio"
                                    name="deferTime"
                                    value="15"
                                    checked={deferMinutes === 15}
                                    onChange={(e) => setDeferMinutes(parseInt(e.target.value))}
                                />
                                15 minutes
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="deferTime"
                                    value="30"
                                    checked={deferMinutes === 30}
                                    onChange={(e) => setDeferMinutes(parseInt(e.target.value))}
                                />
                                30 minutes
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="deferTime"
                                    value="60"
                                    checked={deferMinutes === 60}
                                    onChange={(e) => setDeferMinutes(parseInt(e.target.value))}
                                />
                                1 hour
                            </label>
                        </div>

                        <div className="modal-actions">
                            <button onClick={() => setShowDeferModal(false)} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button onClick={confirmDefer} className="btn btn-primary">
                                Confirm Defer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentStatus;