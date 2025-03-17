// ModuleForum.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./ModuleForum.css"; // Will create this next
import {
  FaArrowLeft, FaPlus, FaBrain, FaSearch,
  FaThumbsUp, FaComments, FaEye, FaCalendarAlt,
  FaClock, FaStar, FaRobot, FaSpinner, FaFilter
} from "react-icons/fa";

const ModuleForum = () => {
  const { courseId, moduleIndex } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [discussions, setDiscussions] = useState([]);
  const [course, setCourse] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [filterBy, setFilterBy] = useState("all");
  
  // Get user info from localStorage
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const serverBaseUrl = "http://localhost:8080"; // Update with your actual server URL
  
  useEffect(() => {
    if (!token || !userId) {
      navigate("/login", { state: { from: `/course/${courseId}/forum/${moduleIndex}` } });
      return;
    }
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch course details
        const courseResponse = await axios.get(`${serverBaseUrl}/course/${courseId}`);
        setCourse(courseResponse.data);
        
        if (courseResponse.data.modules && courseResponse.data.modules[moduleIndex]) {
          setCurrentModule(courseResponse.data.modules[moduleIndex]);
        } else {
          setError("Module not found");
          setLoading(false);
          return;
        }
        
        // Fetch forum discussions
        await fetchDiscussions();
        
      } catch (error) {
        console.error("Error loading forum data:", error);
        setError("Failed to load forum. Please try again.");
      } finally {
        setLoading(false);
      }
        
    };
    
    loadData();
  }, [courseId, moduleIndex, token, userId, navigate]);
  
  // Function to fetch forum discussions with current filters
  const fetchDiscussions = async () => {
    try {
      let url = `${serverBaseUrl}/api/forum/module/${courseId}/${moduleIndex}`;
      
      // Add query parameters for sorting and filtering if needed
      const params = new URLSearchParams();
      if (sortBy) params.set("sortBy", sortBy);
      if (filterBy !== "all") params.set("filter", filterBy);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setDiscussions(response.data);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      setError("Failed to load discussions");
    }
  };
  
  // Function to handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search is empty, just fetch normal discussions
      fetchDiscussions();
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${serverBaseUrl}/api/forum/course/${courseId}/search?query=${encodeURIComponent(searchQuery)}&moduleIndex=${moduleIndex}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setDiscussions(response.data);
    } catch (error) {
      console.error("Error searching discussions:", error);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value === "") {
      // Reset to default discussions if search field is cleared
      fetchDiscussions();
    }
  };
  
  // Handle search on enter key
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  // Handle sort and filter changes
  const handleSortChange = (value) => {
    setSortBy(value);
    // Refetch with new sort parameter
    setTimeout(() => fetchDiscussions(), 0);
  };
  
  const handleFilterChange = (value) => {
    setFilterBy(value);
    // Refetch with new filter parameter
    setTimeout(() => fetchDiscussions(), 0);
  };
  
  // Navigate to create new discussion page
  const navigateToNewDiscussion = () => {
    navigate(`/course/${courseId}/forum/${moduleIndex}/new`);
  };
  
  // Navigate back to course learning page
  const navigateBackToCourse = () => {
    navigate(`/course/${courseId}/learn`);
  };
  
  // Get relative time string (e.g., "2 hours ago")
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} days ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} months ago`;
    
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} years ago`;
  };
  
  if (loading) {
    return (
      <div className="mf__loading">
        <FaSpinner className="mf__spinner" />
        <p>Loading forum discussions...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="mf__error">
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          onClick={navigateBackToCourse}
          className="mf__button mf__button-primary"
        >
          Return to Course
        </button>
      </div>
    );
  }
  
  return (
    <div className="mf__container">
      <header className="mf__header">
        <div className="mf__header-left">
          <button 
            className="mf__back-button" 
            onClick={navigateBackToCourse}
            aria-label="Back to course"
          >
            <FaArrowLeft />
          </button>
          <div className="mf__title-container">
            <h1 className="mf__title">Module Discussions</h1>
            <p className="mf__subtitle">
              {course?.title} • Module {parseInt(moduleIndex) + 1}: {currentModule?.title}
            </p>
          </div>
        </div>
        <div className="mf__header-right">
          <button 
            className="mf__new-discussion-button"
            onClick={navigateToNewDiscussion}
          >
            <FaPlus /> New Discussion
          </button>
        </div>
      </header>
      
      <div className="mf__search-container">
        <div className="mf__search-box">
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyPress={handleSearchKeyPress}
            className="mf__search-input"
          />
          <button 
            className="mf__search-button"
            onClick={handleSearch}
            aria-label="Search"
          >
            <FaSearch />
          </button>
        </div>
        
        <div className="mf__filters">
          <div className="mf__filter-group">
            <label className="mf__filter-label">
              <FaFilter /> Sort:
            </label>
            <select 
              className="mf__select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
              <option value="mostComments">Most Comments</option>
              <option value="mostViews">Most Views</option>
            </select>
          </div>
          
          <div className="mf__filter-group">
            <label className="mf__filter-label">
              <FaFilter /> Filter:
            </label>
            <select 
              className="mf__select"
              value={filterBy}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="all">All Discussions</option>
              <option value="aiAssisted">AI Assisted</option>
              <option value="myDiscussions">My Discussions</option>
              <option value="answered">Answered</option>
              <option value="unanswered">Unanswered</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="mf__discussions-container">
        {discussions.length > 0 ? (
          <div className="mf__discussions-list">
            {discussions.map((discussion) => (
              <div 
                key={discussion._id} 
                className="mf__discussion-card"
                onClick={() => navigate(`/course/${courseId}/forum/${moduleIndex}/discussion/${discussion._id}`)}
              >
                <div className="mf__discussion-header">
                  <h3 className="mf__discussion-title">{discussion.title}</h3>
                  {discussion.aiAssisted && (
                    <span className="mf__ai-badge">
                      <FaRobot /> AI Assisted
                    </span>
                  )}
                </div>
                
                <div className="mf__discussion-preview">
                  {discussion.content.substring(0, 150)}
                  {discussion.content.length > 150 ? '...' : ''}
                </div>
                
                <div className="mf__discussion-footer">
                  <div className="mf__discussion-meta">
                    <span className="mf__discussion-author">
                      Posted by {discussion.createdBy?.name || "Unknown"}
                    </span>
                    <span className="mf__discussion-time">
                      <FaClock /> {getTimeAgo(discussion.createdAt)}
                    </span>
                  </div>
                  
                  <div className="mf__discussion-stats">
                    <span className="mf__stat">
                      <FaComments /> {discussion.commentCount || 0}
                    </span>
                    <span className="mf__stat">
                      <FaEye /> {discussion.views}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mf__empty-state">
            <div className="mf__empty-icon">
              <FaComments />
            </div>
            <h2>No discussions yet</h2>
            <p>Be the first to start a conversation in this module!</p>
            <button 
              className="mf__button mf__button-primary"
              onClick={navigateToNewDiscussion}
            >
              <FaPlus /> Start New Discussion
            </button>
          </div>
        )}
      </div>
      
      <div className="mf__ai-help">
        <div className="mf__ai-help-content">
          <div className="mf__ai-help-icon">
            <FaBrain />
          </div>
          <div className="mf__ai-help-text">
            <h3>Need help with this module?</h3>
            <p>Our AI assistant can help you understand difficult concepts or answer questions about the course material.</p>
          </div>
          <button 
            className="mf__ai-help-button"
            onClick={() => navigate('/ai-chat')}
          >
            Ask AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleForum;