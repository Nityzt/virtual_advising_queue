import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [adminInfo, setAdminInfo] = useState(null);
  const [queueEntries, setQueueEntries] = useState([]);
  const [groupedQueues, setGroupedQueues] = useState({});
  const [noShowTimers, setNoShowTimers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://virtual-advising-queue.onrender.com';

  // Queue information mapping
  const queueInfo = {
    'academic-advising': {
      name: 'Academic Advising',
      description: 'Course selection and degree planning',
      color: '#3b82f6'
    },
    'career-services': {
      name: 'Career Services',
      description: 'Resume review and career planning',
      color: '#10b981'
    },
    'financial-aid': {
      name: 'Financial Aid',
      description: 'Scholarships and financial assistance',
      color: '#f59e0b'
    },
    'general-advising': {
      name: 'General Advising',
      description: 'General academic support',
      color: '#8b5cf6'
    },
    'registration-help': {
      name: 'Registration Help',
      description: 'Course registration assistance',
      color: '#ef4444'
    }
  };

  // Group entries by queue
  const groupEntriesByQueue = useCallback((entries) => {
    const grouped = {};

    entries.forEach(entry => {
      const queueId = entry.queueId || 'general-advising'; // Default fallback
      if (!grouped[queueId]) {
        grouped[queueId] = [];
      }
      grouped[queueId].push(entry);
    });

    // Sort entries within each queue by join time
    Object.keys(grouped).forEach(queueId => {
      grouped[queueId].sort((a, b) =>
          new Date(a.joinedAt || a.createdAt) - new Date(b.joinedAt || b.createdAt)
      );
    });

    return grouped;
  }, []);

  const loadQueueEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/queue`);
      if (response.ok) {
        const data = await response.json();
        setQueueEntries(data);
        setGroupedQueues(groupEntriesByQueue(data));
      } else {
        console.error('Failed to load queue entries');
      }
    } catch (error) {
      console.error('Error loading queue entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, groupEntriesByQueue]);

  useEffect(() => {
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

    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    loadQueueEntries();

    newSocket.on('queue-added', (newEntry) => {
      console.log('✅ Queue added:', newEntry);
      setQueueEntries(prev => {
        const updated = [...prev, newEntry];
        setGroupedQueues(groupEntriesByQueue(updated));
        return updated;
      });
    });

    newSocket.on('queue-deleted', (deletedId) => {
      console.log('✅ Queue deleted:', deletedId);
      setQueueEntries(prev => {
        const updated = prev.filter(entry => entry._id !== deletedId);
        setGroupedQueues(groupEntriesByQueue(updated));
        return updated;
      });
    });

    // ✅ FIXED: Handle general refresh instead of queue-updated
    newSocket.on('queue-refresh', () => {
      console.log('✅ Queue refresh triggered, reloading...');
      loadQueueEntries(); // Just reload everything from API
    });

    // ✅ BACKUP: Still handle queue-updated but more carefully
    newSocket.on('queue-updated', (data) => {
      console.log('✅ Queue updated event:', data);
      // Instead of trying to parse socket data, just refresh
      loadQueueEntries();
    });

    return () => {
      newSocket.disconnect();
      Object.values(noShowTimers).forEach(timerId => {
        if (timerId) {
          clearTimeout(timerId);
        }
      });
    };
  }, [navigate, API_BASE_URL, loadQueueEntries, groupEntriesByQueue, noShowTimers]);

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/queue/all`);
      if (!response.ok) throw new Error('Failed to fetch entries');
      const allData = await response.json();

      const headers = [
        'Position',
        'Name',
        'Student ID',
        'Queue',
        'Status',
        'Joined At',
        'Completed At'
      ];

      const rows = allData.map((entry, i) => [
        i + 1,
        entry.name,
        entry.studentId,
        queueInfo[entry.queueId]?.name || entry.queueId || 'General',
        entry.status,
        entry.joinedAt ? new Date(entry.joinedAt).toLocaleString() : '',
        entry.status === 'completed'
            ? (entry.completedAt ? new Date(entry.completedAt).toLocaleString() : 'N/A')
            : 'N/A'
      ]);

      const csvContent = [headers, ...rows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'queue_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert('Error exporting CSV. Please try again.');
    }
  };

  const markNoShow = useCallback((entryId) => {
    if (noShowTimers[entryId]) return;

    const timerId = setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/queue/${entryId}/noshow`, {
          method: "POST"
        });

        if (response.ok) {
          alert("Marked as no-show.");
          loadQueueEntries();
        } else {
          alert("Failed to mark as no-show.");
        }
      } catch (error) {
        console.error("Error marking no-show:", error);
        alert("Error marking no-show.");
      }

      setNoShowTimers((prev) => {
        const copy = { ...prev };
        delete copy[entryId];
        return copy;
      });
    }, 60000);

    setNoShowTimers((prev) => ({ ...prev, [entryId]: timerId }));
  }, [noShowTimers, API_BASE_URL, loadQueueEntries]);

  const cancelNoShow = useCallback((entryId) => {
    if (!noShowTimers[entryId]) return;
    clearTimeout(noShowTimers[entryId]);
    setNoShowTimers(prev => {
      const copy = { ...prev };
      delete copy[entryId];
      return copy;
    });
  }, [noShowTimers]);

  const handleCompleteEntry = async (entryId) => {
    if (!window.confirm('Mark this advising session as complete?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/queue/${entryId}/complete`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('Advising session marked as complete!');
        loadQueueEntries();
      } else {
        alert('Failed to mark entry as complete.');
      }
    } catch (error) {
      console.error('Error completing entry:', error);
      alert('Error completing entry.');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Delete this queue entry?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/queue/${entryId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setQueueEntries(prev => {
          const updated = prev.filter(entry => entry._id !== entryId);
          setGroupedQueues(groupEntriesByQueue(updated));
          return updated;
        });
        alert('Queue entry deleted.');
      } else {
        alert('Failed to delete entry.');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminInfo');
    if (socket) socket.disconnect();
    navigate('/');
  };

  const handleRefresh = () => {
    loadQueueEntries();
  };

  // Calculate total counts
  const totalInQueue = queueEntries.length;
  const completedToday = 0; // TODO: Get from API
  const activeSessions = 0; // TODO: Get from API

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
            <button
                onClick={handleExportCSV}
                className="btn btn-outline btn-export">
              📥 Export CSV
            </button>
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
              <span className="summary-number">{totalInQueue}</span>
            </div>

            <div className="summary-card">
              <h3>Active Queues</h3>
              <span className="summary-number">{Object.keys(groupedQueues).length}</span>
            </div>

            <div className="summary-card">
              <h3>Completed Today</h3>
              <span className="summary-number">{completedToday}</span>
            </div>
          </div>

          {isLoading ? (
              <div className="loading">
                <p>Loading queue entries...</p>
              </div>
          ) : Object.keys(groupedQueues).length === 0 ? (
              <div className="empty-state">
                <h3>No Students in Any Queue</h3>
                <p>All queues are currently empty. Students will appear here as they join.</p>
              </div>
          ) : (
              // RENDER SEPARATE QUEUES
              Object.entries(groupedQueues).map(([queueId, entries]) => {
                const queue = queueInfo[queueId] || {
                  name: queueId,
                  description: 'Queue',
                  color: '#6b7280'
                };

                return (
                    <div key={queueId} className="queue-section" style={{ marginBottom: '2rem' }}>
                      <div className="section-header">
                        <h2 style={{ color: queue.color }}>
                          {queue.name} ({entries.length})
                        </h2>
                        <p>{queue.description}</p>
                      </div>

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
                          {entries.map((entry, index) => (
                              <tr key={entry._id} className={index === 0 ? 'next-student' : ''}>
                                <td className="position-cell">
                                  <span className="position-number">{index + 1}</span>
                                  {index === 0 && <span className="next-indicator">Next</span>}
                                </td>
                                <td className="name-cell">
                                  {entry.name}
                                  {entry.status === "no-show" && (
                                      <span style={{ color: "red", marginLeft: "4px" }}>(No-Show)</span>
                                  )}
                                </td>
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
                                  {index === 0 && (
                                      noShowTimers[entry._id] ? (
                                          <button
                                              onClick={() => cancelNoShow(entry._id)}
                                              className="btn btn-warning action-btn"
                                              title="Cancel no-show"
                                          >
                                            Cancel No-Show
                                          </button>
                                      ) : (
                                          <button
                                              onClick={() => markNoShow(entry._id)}
                                              className="btn btn-secondary action-btn"
                                              title="Mark student as no-show"
                                          >
                                            Mark No-Show
                                          </button>
                                      )
                                  )}
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                );
              })
          )}
        </div>
      </div>
  );
};

export default AdminDashboard;