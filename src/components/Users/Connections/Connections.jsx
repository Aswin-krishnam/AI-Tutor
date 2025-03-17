// src/components/Connections.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Connections.css';

const Connections = () => {
    const [connections, setConnections] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const [activeView, setActiveView] = useState('myConnections');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    // Fetch connections and pending requests
    const fetchConnections = useCallback(async () => {
        try {
            setLoading(true);
            const connectionsRes = await axios.get(`http://localhost:8080/user/connections?userId=${userId}`);
            setConnections(connectionsRes.data);

            const requestsRes = await axios.get(`http://localhost:8080/user/connection-requests?userId=${userId}`);
            setPendingRequests(requestsRes.data);
        } catch (error) {
            console.error('Error fetching connections:', error);
            setError('Failed to load your connections. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            fetchConnections();
        }
    }, [userId, fetchConnections]);

    // Search for users
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:8080/user/search?query=${searchQuery}&userId=${userId}`);
            setSearchResults(res.data);
            setActiveView('searchResults');
        } catch (error) {
            console.error('Error searching users:', error);
            setError('Failed to search for users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        if (e.target.value === '') {
            setSearchResults([]);
        }
    };

    // Send connection request
    const sendConnectionRequest = async (recipientId) => {
        try {
            setRequestLoading(true);
            await axios.post('http://localhost:8080/connection/send-request', {
                requesterId: userId,
                recipientId,
                message: `I'd like to connect with you and follow your learning progress!`
            });

            setSuccessMessage('Connection request sent successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
            
            // Refresh search results to update status
            handleSearch();
        } catch (error) {
            console.error('Error sending connection request:', error);
            setError('Failed to send connection request. Please try again.');
            setTimeout(() => setError(null), 3000);
        } finally {
            setRequestLoading(false);
        }
    };

    // Accept a connection request
    const acceptRequest = async (connectionId) => {
        try {
            setRequestLoading(true);
            await axios.put(`http://localhost:8080/connection/${connectionId}/respond`, {
                userId,
                status: 'accepted'
            });
            
            setSuccessMessage('Connection request accepted!');
            fetchConnections(); // Refresh data
        } catch (error) {
            console.error('Error accepting request:', error);
            setError('Failed to accept connection request. Please try again.');
        } finally {
            setRequestLoading(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    // Reject a connection request
    const rejectRequest = async (connectionId) => {
        try {
            setRequestLoading(true);
            await axios.put(`http://localhost:8080/connection/${connectionId}/respond`, {
                userId,
                status: 'rejected'
            });
            
            setSuccessMessage('Connection request rejected.');
            fetchConnections(); // Refresh data
        } catch (error) {
            console.error('Error rejecting request:', error);
            setError('Failed to reject connection request. Please try again.');
        } finally {
            setRequestLoading(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    // Remove a connection
    const removeConnection = async (connectionId) => {
        if (window.confirm('Are you sure you want to remove this connection?')) {
            try {
                setRequestLoading(true);
                await axios.delete(`http://localhost:8080/connection/${connectionId}?userId=${userId}`);
                
                setSuccessMessage('Connection removed successfully.');
                fetchConnections(); // Refresh data
            } catch (error) {
                console.error('Error removing connection:', error);
                setError('Failed to remove connection. Please try again.');
            } finally {
                setRequestLoading(false);
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        }
    };

    // View a connection's progress
    const viewProgress = (connectionId) => {
        navigate(`/connection/${connectionId}/progress`);
    };

    // Render status badge
    const renderStatusBadge = (status) => {
        let className, text;
        switch (status) {
            case 'pending':
                className = 'status-pending';
                text = 'Pending';
                break;
            case 'accepted':
                className = 'status-accepted';
                text = 'Connected';
                break;
            case 'rejected':
                className = 'status-rejected';
                text = 'Rejected';
                break;
            default:
                className = '';
                text = 'No Status';
        }
        
        return <span className={`connection-status ${className}`}>{text}</span>;
    };

    return (
        <div className="connections-container">
            <div className="connections-header">
                <h2>My Learning Network</h2>
                <div className="connection-actions">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search for users by name or email"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="connection-search-input"
                        />
                        <button className="search-button" onClick={handleSearch}>
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {error && <div className="connection-error-message">{error}</div>}
            {successMessage && <div className="connection-success-message">{successMessage}</div>}

            <div className="connection-tabs">
                <button 
                    className={`connection-tab ${activeView === 'myConnections' ? 'active' : ''}`}
                    onClick={() => setActiveView('myConnections')}
                >
                    My Connections ({connections.length})
                </button>
                <button 
                    className={`connection-tab ${activeView === 'pendingRequests' ? 'active' : ''}`}
                    onClick={() => setActiveView('pendingRequests')}
                >
                    Pending Requests ({pendingRequests.length})
                </button>
                {searchResults.length > 0 && (
                    <button 
                        className={`connection-tab ${activeView === 'searchResults' ? 'active' : ''}`}
                        onClick={() => setActiveView('searchResults')}
                    >
                        Search Results ({searchResults.length})
                    </button>
                )}
            </div>

            {loading ? (
                <div className="connections-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            ) : (
                <div className="connections-content">
                    {activeView === 'myConnections' && (
                        <>
                            {connections.length === 0 ? (
                                <div className="no-connections">
                                    <div className="empty-icon">👥</div>
                                    <h3>No connections yet</h3>
                                    <p>Search for other users to connect with them and follow their learning progress.</p>
                                </div>
                            ) : (
                                <div className="connections-list">
                                    {connections.map(connection => (
                                        <div key={connection.connectionId} className="connection-card">
                                            <div className="connection-avatar">
                                                {connection.name.charAt(0)}
                                            </div>
                                            <div className="connection-info">
                                                <h3>{connection.name}</h3>
                                                <p className="connection-email">{connection.email}</p>
                                                <p className="connection-since">Connected since: {new Date(connection.since).toLocaleDateString()}</p>
                                            </div>
                                            <div className="connection-actions">
                                                <button 
                                                    className="view-progress-btn"
                                                    onClick={() => viewProgress(connection.connectionId)}
                                                >
                                                    View Progress
                                                </button>
                                                <button 
                                                    className="remove-connection-btn"
                                                    onClick={() => removeConnection(connection.connectionId)}
                                                    disabled={requestLoading}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeView === 'pendingRequests' && (
                        <>
                            {pendingRequests.length === 0 ? (
                                <div className="no-requests">
                                    <div className="empty-icon">✉️</div>
                                    <h3>No pending requests</h3>
                                    <p>You don't have any connection requests to review at this time.</p>
                                </div>
                            ) : (
                                <div className="requests-list">
                                    {pendingRequests.map(request => (
                                        <div key={request.requestId} className="request-card">
                                            <div className="request-avatar">
                                                {request.from.name.charAt(0)}
                                            </div>
                                            <div className="request-info">
                                                <h3>{request.from.name}</h3>
                                                <p className="request-email">{request.from.email}</p>
                                                <p className="request-message">
                                                    <em>"{request.message || "I'd like to connect with you!"}"</em>
                                                </p>
                                                <p className="request-date">
                                                    Requested on: {new Date(request.requestDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="request-actions">
                                                <button 
                                                    className="accept-request-btn"
                                                    onClick={() => acceptRequest(request.requestId)}
                                                    disabled={requestLoading}
                                                >
                                                    Accept
                                                </button>
                                                <button 
                                                    className="reject-request-btn"
                                                    onClick={() => rejectRequest(request.requestId)}
                                                    disabled={requestLoading}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeView === 'searchResults' && (
                        <>
                            {searchResults.length === 0 ? (
                                <div className="no-results">
                                    <div className="empty-icon">🔍</div>
                                    <h3>No results found</h3>
                                    <p>Try searching with a different name or email.</p>
                                </div>
                            ) : (
                                <div className="search-results-list">
                                    {searchResults.map(user => (
                                        <div key={user._id} className="user-result-card">
                                            <div className="user-avatar">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div className="user-info">
                                                <h3>{user.name}</h3>
                                                <p className="user-email">{user.email}</p>
                                                {user.connectionStatus && renderStatusBadge(user.connectionStatus)}
                                            </div>
                                            <div className="user-actions">
                                                {!user.connectionStatus && (
                                                    <button 
                                                        className="send-request-btn"
                                                        onClick={() => sendConnectionRequest(user._id)}
                                                        disabled={requestLoading}
                                                    >
                                                        Connect
                                                    </button>
                                                )}
                                                {user.connectionStatus === 'pending' && user.connectionId && (
                                                    <p className="pending-text">Request Pending</p>
                                                )}
                                                {user.connectionStatus === 'accepted' && user.connectionId && (
                                                    <button 
                                                        className="view-progress-btn"
                                                        onClick={() => viewProgress(user.connectionId)}
                                                    >
                                                        View Progress
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Connections;