import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [adminInfo, setAdminInfo] = useState(null);
    const [queueEntries, setQueueEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const navigate = useNavigate();

    // Mock API base URL - replace with your actual API
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        // Check if admin is logged in
        const storedAdminInfo = localStorage.getItem('adminInfo');
        if (!storedAdminInfo) {
            navigate('/admin-login');
            return;
        }

        try {
            const parsed = JSON.parse(storedAdminInfo);
            setAdminInfo(parsed);
        } catch (error) {
            console.error('Error parsing admin info:', error);
            navigate('/admin-login');
            return;
        }

        // Initialize socket connection
        const newSocket = io(API_BASE_URL);
        setSocket(newSocket);

        // Load queue entries
        loadQueueEntries();

        // Listen for real-time updates
        newSocket.on('queue-added', (newEntry) => {
            setQueueEntries(prev => [...prev, newEntry]);
        });

        newSocket.on('queue-deleted', (deletedId) => {
            setQueueEntries(prev => prev.filter(entry => entry._id !== deletedId));
        });

        return () => {
            newSocket.disconnect();
        };
    }, [navigate, API_BASE_URL]);

    const loadQueueEntries = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/queue`);
            if (response.ok) {
                const data = await response.json();
                setQueueEntries(data);
            } else {
                console.error('Failed to load queue entries');
            }
        } catch (error) {
            console.error('Error loading queue entries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteEntry = async (entryId) => {
        if (!window.confirm('Mark this advising session as complete? This will notify the next student in line.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/queue/${entryId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Remove from local state (socket will also handle this)
                setQueueEntries(prev => prev.filter(entry => entry._id !== entryId));

                // In a real app, you would also:
                // 1. Send notification to the next student
                // 2. Update student status to "completed"
                // 3. Log the completion for records

                alert('Advising session marked as complete!');
            } else {
                alert('Failed to complete entry. Please try again.');
            }
        } catch (error) {
            console.error('Error completing entry:', error);
            alert('Error completing entry. Please try again.');
        }
    };

    const handleDeleteEntry = async (entryId) => {
        if (!window.confirm('Delete this queue entry? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/queue/${entryId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Remove from local state (socket will also handle this)
                setQueueEntries(prev => prev.filter(entry => entry._id !== entryId));
                alert('Queue entry deleted successfully!');
            } else {
                alert('Failed to delete entry. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
            alert('Error deleting entry. Please try again.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminInfo');
        if (socket) {
            socket.disconnect();
        }
        navigate('/');
    };

    const handleRefresh = () => {
        loadQueueEntries();
    };

    if (!adminInfo) {
        return (
            <div className="loading">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="admin-header">
                <div className="admin-welcome">
                    <h1>Admin Dashboard</h1>
                    <p className="admin-email">{adminInfo.email}</p>
                </div>

                <div className="admin-actions">
                    <button onClick={handleRefresh} className="btn btn-outline">
                        Refresh
                    </button>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        Logout
                    </button>
                </div>
            </div>

            <div className="admin-content">
                <div className="queue-summary">
                    <div className="summary-card">
                        <h3>Total in Queue</h3>
                        <span className="summary-number">{queueEntries.length}</span>
                    </div>

                    <div className="summary-card">
                        <h3>Active Sessions</h3>
                        <span className="summary-number">0</span>
                    </div>

                    <div className="summary-card">
                        <h3>Completed Today</h3>
                        <span className="summary-number">0</span>
                    </div>
                </div>

                <div className="queue-section">
                    <div className="section-header">
                        <h2>Current Queue</h2>
                        <p>Manage student appointments and queue entries</p>
                    </div>

                    {isLoading ? (
                        <div className="loading">
                            <p>Loading queue entries...</p>
                        </div>
                    ) : queueEntries.length === 0 ? (
                        <div className="empty-state">
                            <h3>No Students in Queue</h3>
                            <p>The queue is currently empty. Students will appear here as they join.</p>
                        </div>
                    ) : (
                        <div className="queue-table-container">
                            <table className="queue-table">
                                <thead>
                                <tr>
                                    <th>Position</th>
                                    <th>Student Name</th>
                                    <th>Student ID</th>
                                    <th>Wait Time</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {queueEntries.map((entry, index) => (
                                    <tr key={entry._id} className={index === 0 ? 'next-student' : ''}>
                                        <td className="position-cell">
                                            <span className="position-number">{index + 1}</span>
                                            {index === 0 && <span className="next-indicator">Next</span>}
                                        </td>
                                        <td className="name-cell">{entry.name}</td>
                                        <td className="id-cell">{entry.studentId}</td>
                                        <td className="wait-cell">
                        <span className="wait-time">
                          {Math.max(0, (index * 15))} min
                        </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                onClick={() => handleCompleteEntry(entry._id)}
                                                className="btn btn-success action-btn"
                                                title="Mark advising session as complete"
                                            >
                                                Complete
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEntry(entry._id)}
                                                className="btn btn-danger action-btn"
                                                title="Delete entry (for no-shows or mistakes)"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;