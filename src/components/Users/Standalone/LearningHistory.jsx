import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./LearningHistory.css";
import { FaFilter, FaQuestion, FaBookOpen, FaCalendar, FaSearch, FaBookmark, FaArrowLeft } from "react-icons/fa";

const LearningHistory = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    // Get user info from localStorage
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token || !userId) {
            navigate("/login");
            return;
        }

        const fetchLearningHistory = async () => {
            try {
                setLoading(true);

                // Fetch AI chat history
                const chatHistoryResponse = await axios.get(`http://localhost:8080/user/history/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                // Fetch course module completion history (via progress API)
                // We need to get enrolled courses first
                const enrolledCoursesResponse = await axios.get(`http://localhost:8080/user/${userId}/courses`);

                // Create array to hold combined history items
                let combinedHistory = [];

                // Process chat history
                if (chatHistoryResponse.data && Array.isArray(chatHistoryResponse.data)) {
                    const chatItems = chatHistoryResponse.data.map(item => ({
                        id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        type: 'question',
                        title: item.question,
                        content: item.response,
                        timestamp: item.timestamp || new Date(),
                        category: item.category || 'General'
                    }));

                    combinedHistory = [...combinedHistory, ...chatItems];
                }

                // Process course progress history if courses exist
                if (enrolledCoursesResponse.data && enrolledCoursesResponse.data.courses) {
                    const courses = enrolledCoursesResponse.data.courses;

                    // For each course, fetch detailed progress
                    for (const course of courses) {
                        try {
                            const progressResponse = await axios.get(`http://localhost:8080/user/${userId}/progress/${course._id}`);

                            if (progressResponse.data &&
                                progressResponse.data.courseProgress &&
                                progressResponse.data.courseProgress.moduleData) {

                                // Create history items for each completed module
                                const moduleItems = progressResponse.data.courseProgress.moduleData
                                    .filter(module => module.completed)
                                    .map(module => {
                                        // Find module details from course data
                                        const moduleIndex = module.moduleIndex || 0;
                                        const moduleDetails = course.modules[moduleIndex] || { title: 'Module ' + (moduleIndex + 1) };

                                        return {
                                            id: `module-${course._id}-${moduleIndex}`,
                                            type: 'module',
                                            title: `Completed: ${moduleDetails.title}`,
                                            content: `Completed module ${moduleIndex + 1} in course: ${course.title}`,
                                            courseId: course._id,
                                            courseTitle: course.title,
                                            moduleIndex,
                                            timestamp: module.lastAccessed || new Date(),
                                            category: course.category
                                        };
                                    });

                                combinedHistory = [...combinedHistory, ...moduleItems];
                            }
                        } catch (progressError) {
                            console.warn(`Could not fetch progress for course ${course._id}:`, progressError);
                        }
                    }
                }

                // Sort by timestamp, most recent first
                combinedHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                setHistory(combinedHistory);
                setFilteredHistory(combinedHistory);
            } catch (error) {
                console.error("Error fetching learning history:", error);
                setError("Failed to load your learning history. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchLearningHistory();
    }, [userId, token, navigate]);

    // Filter and sort history based on user selections
    useEffect(() => {
        let results = [...history];

        // Apply search filter
        if (searchTerm.trim() !== "") {
            const term = searchTerm.toLowerCase();
            results = results.filter(item =>
                item.title.toLowerCase().includes(term) ||
                item.content.toLowerCase().includes(term) ||
                (item.category && item.category.toLowerCase().includes(term))
            );
        }

        // Apply type filter
        if (activeFilter !== "all") {
            results = results.filter(item => item.type === activeFilter);
        }

        // Apply sorting
        switch (sortBy) {
            case "newest":
                results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case "oldest":
                results.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                break;
            case "a-z":
                results.sort((a, b) => a.title.localeCompare(b.title));
                break;
            default:
                results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
        }

        setFilteredHistory(results);
    }, [searchTerm, activeFilter, sortBy, history]);

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "Unknown date";

        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            });
        } catch (error) {
            return "Invalid date";
        }
    };

    // Handle navigation to relevant content
    const handleViewItem = (item) => {
        if (item.type === 'question') {
            navigate("/ai-chat", { state: { question: item.title } });
        } else if (item.type === 'module') {
            navigate(`/course/${item.courseId}/learn`, { state: { activeModule: item.moduleIndex } });
        }
    };

    // Handle starting a new AI chat
    const handleStartChat = () => {
        navigate("/ai-chat");
    };

    if (loading) {
        return (
            <div className="learning-history-loading">
                <div className="loading-spinner"></div>
                <p>Loading your learning history...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="learning-history-error">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="retry-button">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="learning-history-container">
            <div className="learning-history-header">
                <div className="header-title-area">
                    <button className="back-to-dashboard" onClick={() => navigate("/dashboard")}>
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                    <h1>Learning History</h1>
                </div>

                <div className="history-actions">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FaSearch className="search-icon" />
                    </div>

                    <div className="history-filters">
                        <div className="filter-dropdown">
                            <button className="filter-button">
                                <FaFilter /> Filter
                            </button>
                            <div className="dropdown-content">
                                <button
                                    className={activeFilter === "all" ? "active" : ""}
                                    onClick={() => setActiveFilter("all")}
                                >
                                    All Activities
                                </button>
                                <button
                                    className={activeFilter === "question" ? "active" : ""}
                                    onClick={() => setActiveFilter("question")}
                                >
                                    AI Questions
                                </button>
                                <button
                                    className={activeFilter === "module" ? "active" : ""}
                                    onClick={() => setActiveFilter("module")}
                                >
                                    Completed Modules
                                </button>
                            </div>
                        </div>

                        <div className="sort-dropdown">
                            <button className="sort-button">
                                <FaCalendar /> Sort
                            </button>
                            <div className="dropdown-content">
                                <button
                                    className={sortBy === "newest" ? "active" : ""}
                                    onClick={() => setSortBy("newest")}
                                >
                                    Newest First
                                </button>
                                <button
                                    className={sortBy === "oldest" ? "active" : ""}
                                    onClick={() => setSortBy("oldest")}
                                >
                                    Oldest First
                                </button>
                                <button
                                    className={sortBy === "a-z" ? "active" : ""}
                                    onClick={() => setSortBy("a-z")}
                                >
                                    Alphabetical (A-Z)
                                </button>
                            </div>
                        </div>
                    </div>

                    <button className="ask-ai-btn" onClick={handleStartChat}>
                        Ask AI Tutor
                    </button>
                </div>
            </div>

            <div className="history-count">
                <p>{filteredHistory.length} {filteredHistory.length === 1 ? 'item' : 'items'} in your learning history</p>
            </div>

            {filteredHistory.length === 0 ? (
                <div className="empty-history-container">
                    <div className="empty-history-icon">📚</div>
                    <h2>No learning history found</h2>
                    <p>Start learning or ask questions to build your history.</p>
                    <button
                        className="start-learning-btn"
                        onClick={handleStartChat}
                    >
                        Ask Your First Question
                    </button>
                </div>
            ) : (
                <div className="history-list">
                    {filteredHistory.map(item => (
                        <div key={item.id} className="history-item">
                            <div className={`history-icon ${item.type === 'question' ? 'question-icon' : 'module-icon'}`}>
                                {item.type === 'question' ? <FaQuestion /> : <FaBookOpen />}
                            </div>

                            <div className="history-content">
                                <h3 className="history-title">{item.title}</h3>
                                <div className="history-details">
                                    <div className="history-metadata">
                                        <span className="history-time">
                                            <FaCalendar /> {formatDate(item.timestamp)}
                                        </span>
                                        {item.category && (
                                            <span className="history-category">
                                                <FaBookmark /> {item.category}
                                            </span>
                                        )}
                                        {item.courseTitle && (
                                            <span className="history-course">
                                                <FaBookOpen /> {item.courseTitle}
                                            </span>
                                        )}
                                    </div>
                                    <p className="history-summary">
                                        {item.content.length > 150
                                            ? item.content.substring(0, 150) + "..."
                                            : item.content}
                                    </p>
                                </div>
                            </div>

                            <button
                                className="view-item-btn"
                                onClick={() => handleViewItem(item)}
                            >
                                {item.type === 'question' ? 'View Answer' : 'View Module'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LearningHistory;