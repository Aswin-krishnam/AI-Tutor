import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaHome, 
  FaBookOpen, 
  FaSearch, 
  FaHistory, 
  FaChartLine, 
  FaUsers, 
  FaSignOutAlt,
  FaBell,
  FaQuestionCircle,
  FaEllipsisV
} from "react-icons/fa";
import "./UserDashboard.css";
import Connections from "../Users/Connections/Connections";

const UserDashboard = () => {
  // State management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [queryHistory, setQueryHistory] = useState([]);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [learningStreak, setLearningStreak] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastLoginTime, setLastLoginTime] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768);
  const [theme, setTheme] = useState("light");
  
  // Stats with smooth animations
  const [animatedStats, setAnimatedStats] = useState({
    lessonsCompleted: 0,
    completedCourses: 0,
    currentStreak: 0,
    questionsAsked: 0
  });
  
  const [actualStats, setActualStats] = useState({
    lessonsCompleted: 0,
    completedCourses: 0,
    currentStreak: 0,
    questionsAsked: 0
  });

  // Courses and data
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [courseCategories, setCourseCategories] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New course materials available", time: "2 hours ago", read: false },
    { id: 2, message: "Your assignment was graded", time: "1 day ago", read: true },
    { id: 3, message: "Course completion certificate ready", time: "3 days ago", read: false }
  ]);

  const navigate = useNavigate();

  // Calculate streak and stats based on progress data
  const calculateStats = useCallback((courses, history) => {
    if (!courses || courses.length === 0) return {};
    
    // Calculate lessons completed
    let totalLessons = 0;
    let completedLessons = 0;
    let completedCourses = 0;
    
    courses.forEach(course => {
      const totalModules = course.totalLessons || 0;
      const completed = course.completedLessons || 0;
      
      totalLessons += totalModules;
      completedLessons += completed;
      
      if (course.progressPercentage === 100) {
        completedCourses++;
      }
    });
    
    // For streak, we'll use a placeholder value until we implement actual tracking
    const streak = Math.min(courses.length, 7);
    
    return {
      lessonsCompleted: completedLessons,
      completedCourses,
      currentStreak: streak,
      questionsAsked: history.length
    };
  }, []);

  // Fetch all necessary user data
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token) {
      navigate("/");
      return;
    }

    const fetchAllUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user data
        const userRes = await axios.get(`http://localhost:8080/user/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setUser(userRes.data);
        
        // Set last login time
        setLastLoginTime(new Date().toLocaleString());

        // Fetch enrolled courses
        const coursesRes = await axios.get(`http://localhost:8080/user/${userId}/courses`);
        let enrolledCoursesData = [];
        
        if (coursesRes.data && coursesRes.data.courses) {
          enrolledCoursesData = coursesRes.data.courses.map(course => {
            return {
              id: course._id,
              title: course.title,
              description: course.description,
              category: course.category,
              instructor: course.instructor || "Instructor",
              progressPercentage: 0, // Will be updated with actual progress
              totalLessons: course.modules ? course.modules.length : 0,
              completedLessons: 0, // Will be updated with actual progress
              lastAccessed: "Recently",
              tags: [course.level || "beginner", course.category]
            };
          });
          
          setEnrolledCourses(enrolledCoursesData);
          setFilteredCourses(enrolledCoursesData);
        }
        
        // Get course categories for filters
        const categoriesRes = await axios.get(`http://localhost:8080/categories`);
        if (categoriesRes.data) {
          setCourseCategories(categoriesRes.data);
        }

        // Fetch query history
        const historyRes = await axios.get(`http://localhost:8080/user/history/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setQueryHistory(historyRes.data || []);

        // Fetch progress data for all courses
        const progressPromises = [];
        
        if (coursesRes.data && coursesRes.data.courses) {
          coursesRes.data.courses.forEach(course => {
            progressPromises.push(
              axios.get(`http://localhost:8080/user/${userId}/progress/${course._id}`)
            );
          });
        }
        
        // Process all progress data
        const progressResults = await Promise.allSettled(progressPromises);
        const validProgress = progressResults
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value.data);
        
        setProgressData(validProgress);
        
        // Update course progress information
        if (validProgress.length > 0 && coursesRes.data && coursesRes.data.courses) {
          const updatedCourses = [...enrolledCoursesData];
          
          validProgress.forEach((progress, index) => {
            if (progress.courseProgress && index < updatedCourses.length) {
              const courseId = coursesRes.data.courses[index]._id;
              const courseIndex = updatedCourses.findIndex(c => c.id === courseId);
              
              if (courseIndex >= 0) {
                const completedModules = progress.courseProgress.completedModules?.length || 0;
                const totalModules = updatedCourses[courseIndex].totalLessons;
                const progressPercentage = totalModules > 0 
                  ? Math.round((completedModules / totalModules) * 100) 
                  : 0;
                
                updatedCourses[courseIndex].completedLessons = completedModules;
                updatedCourses[courseIndex].progressPercentage = progressPercentage;
                
                const lastAccessed = progress.courseProgress.lastAccessed 
                  ? new Date(progress.courseProgress.lastAccessed).toLocaleDateString() 
                  : "Not started";
                  
                updatedCourses[courseIndex].lastAccessed = lastAccessed;
              }
            }
          });
          
          setEnrolledCourses(updatedCourses);
          setFilteredCourses(updatedCourses);
          
          // Calculate stats based on actual progress data
          const stats = calculateStats(updatedCourses, historyRes.data || []);
          setActualStats(stats);
          
          // Generate streak data
          const streak = [];
          // Generate a realistic streak pattern based on course access dates
          for (let i = 0; i < 30; i++) {
            // Days where user was active
            const dayHasActivity = updatedCourses.some(course => {
              const lastAccessDate = new Date(course.lastAccessed !== "Not started" ? course.lastAccessed : null);
              if (isNaN(lastAccessDate.getTime())) return false;
              
              const daysDiff = Math.ceil((new Date() - lastAccessDate) / (1000 * 60 * 60 * 24));
              return daysDiff === i;
            });
            
            streak.push(dayHasActivity ? 1 : 0);
          }
          setLearningStreak(streak);
        }
        
      } catch (error) {
        console.error("Error fetching user data", error);
        // Fallback to empty data if API fails
        setUser({ name: "User", email: "user@example.com", role: "user" });
        setEnrolledCourses([]);
        setFilteredCourses([]);
        setQueryHistory([]);
        setLearningStreak(Array(30).fill(0));
      } finally {
        setLoading(false);
      }
    };

    fetchAllUserData();
  }, [navigate, calculateStats]);

  // Animate stats when loading completes
  useEffect(() => {
    if (!loading && actualStats) {
      const duration = 1500; // Longer animation for better effect
      const steps = 20;      // More steps for smoother animation
      const interval = duration / steps;

      let step = 0;

      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        // Use easeOutQuad for nicer effect: t * (2-t) instead of linear
        const easeProgress = progress * (2 - progress);

        setAnimatedStats({
          lessonsCompleted: Math.floor(actualStats.lessonsCompleted * easeProgress),
          completedCourses: Math.floor(actualStats.completedCourses * easeProgress),
          currentStreak: Math.floor(actualStats.currentStreak * easeProgress),
          questionsAsked: Math.floor(actualStats.questionsAsked * easeProgress)
        });

        if (step >= steps) {
          clearInterval(timer);
          setAnimatedStats(actualStats);
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [loading, actualStats]);

  // Filter courses based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCourses(enrolledCourses);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = enrolledCourses.filter(course =>
        course.title.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term) ||
        course.category.toLowerCase().includes(term) ||
        (course.tags && course.tags.some(tag => tag.toLowerCase().includes(term)))
      );
      setFilteredCourses(filtered);
    }
  }, [searchTerm, enrolledCourses]);

  // Check window size for responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Course action handlers
  const handleStartLearning = useCallback((courseId) => {
    navigate(`/course/${courseId}/learn`);
  }, [navigate]);

  const handleViewCourseDetails = useCallback((courseId) => {
    navigate(`/course/${courseId}`);
  }, [navigate]);

  const handleBrowseCourses = useCallback(() => {
    navigate("/courses");
  }, [navigate]);

  // Proper logout handling - clearing ALL local storage items
  const handleLogout = useCallback(() => {
    setShowConfirmLogout(true);
  }, []);

  const confirmLogout = useCallback(() => {
    // Clear ALL localStorage items, not just token and userId
    localStorage.clear();
    navigate("/");
  }, [navigate]);

  const cancelLogout = useCallback(() => {
    setShowConfirmLogout(false);
  }, []);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.body.setAttribute("data-theme", newTheme);
  }, [theme]);

  // Format dates for display
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  }, []);

  // Mark a notification as read
  const markNotificationAsRead = useCallback((id) => {
    setNotifications(notifications.map(note => 
      note.id === id ? { ...note, read: true } : note
    ));
  }, [notifications]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner-wrapper">
          <div className="dashboard-spinner"></div>
          <p>Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${theme}`}>
      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="dashboard-sidebar-header">
          <div className="dashboard-logo">
            <span className="dashboard-logo-icon">🧠</span>
            {!sidebarCollapsed && <h2>Neurale Learn</h2>}
          </div>
          <button className="dashboard-toggle-sidebar" onClick={toggleSidebar}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="dashboard-sidebar-nav">
          <button
            className={`dashboard-nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
            title="Overview"
          >
            <FaHome className="dashboard-nav-icon" />
            {!sidebarCollapsed && <span>Overview</span>}
          </button>
          <button
            className={`dashboard-nav-item ${false ? "active" : ""}`}
            onClick={() => navigate("/my-courses")}
            title="My Courses"
          >
            <FaBookOpen className="dashboard-nav-icon" />
            {!sidebarCollapsed && <span>My Courses</span>}
          </button>
          <button
            className={`dashboard-nav-item ${false ? "active" : ""}`}
            onClick={() => navigate("/courses")}
            title="Browse Courses"
          >
            <FaSearch className="dashboard-nav-icon" />
            {!sidebarCollapsed && <span>Browse Courses</span>}
          </button>
          <button
            className={`dashboard-nav-item ${false ? "active" : ""}`}
            onClick={() => navigate("/learning-history")}
            title="Learning History"
          >
            <FaHistory className="dashboard-nav-icon" />
            {!sidebarCollapsed && <span>Learning History</span>}
          </button>
          <button
            className={`dashboard-nav-item ${false ? "active" : ""}`}
            onClick={() => navigate("/my-progress")}
            title="My Progress"
          >
            <FaChartLine className="dashboard-nav-icon" />
            {!sidebarCollapsed && <span>My Progress</span>}
          </button>
          <button
            className={`dashboard-nav-item ${activeTab === "connections" ? "active" : ""}`}
            onClick={() => setActiveTab("connections")}
            title="Learning Network"
          >
            <FaUsers className="dashboard-nav-icon" />
            {!sidebarCollapsed && <span>Learning Network</span>}
          </button>
        </nav>

        <div className="dashboard-sidebar-footer">
          <button 
            className="dashboard-theme-toggle"
            onClick={toggleTheme}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? "🌙" : "☀️"}
            {!sidebarCollapsed && <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>}
          </button>
          <button 
            className="dashboard-nav-item logout-btn" 
            onClick={handleLogout}
            title="Logout"
          >
            <FaSignOutAlt className="dashboard-nav-icon" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        {/* Top Header Bar */}
        <header className="dashboard-header">
          <div className="dashboard-welcome">
            <div className="dashboard-greeting">
              <h1>
                {new Date().getHours() < 12 ? "Good morning" :
                 new Date().getHours() < 18 ? "Good afternoon" :
                 "Good evening"}, {user?.name}!
              </h1>
              <p className="dashboard-last-login">Last login: {lastLoginTime}</p>
            </div>

            <div className="dashboard-streak">
              <span className="dashboard-streak-icon">🔥</span>
              <span className="dashboard-streak-count">{animatedStats.currentStreak}</span>
              <span className="dashboard-streak-text">day streak</span>
            </div>
          </div>

          <div className="dashboard-header-controls">
            <div className="dashboard-search">
              <input 
                type="text" 
                placeholder="Search courses..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dashboard-search-input"
              />
            </div>
            
            <button 
              className="dashboard-chat-btn"
              onClick={() => navigate("/ai-chat")}
            >
              <FaQuestionCircle className="dashboard-chat-icon" />
              <span>Ask AI Tutor</span>
            </button>
            
            <div className="dashboard-notification-wrapper">
              <button 
                className="dashboard-notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <FaBell />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="dashboard-notification-badge">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="dashboard-notification-dropdown">
                  <h3>Notifications</h3>
                  {notifications.length === 0 ? (
                    <p className="dashboard-no-notifications">No notifications</p>
                  ) : (
                    <div className="dashboard-notification-list">
                      {notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`dashboard-notification-item ${notification.read ? 'read' : 'unread'}`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <p className="dashboard-notification-message">{notification.message}</p>
                          <span className="dashboard-notification-time">{notification.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="dashboard-profile-wrapper">
              <button 
                className="dashboard-profile-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="dashboard-avatar">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div className="dashboard-user-info">
                  <span className="dashboard-user-name">{user?.name}</span>
                  <span className="dashboard-user-role">
                    {user?.role === "admin" ? "Administrator" : "Student"}
                  </span>
                </div>
                <FaEllipsisV className="dashboard-dropdown-icon" />
              </button>
              
              {showProfileMenu && (
                <div className="dashboard-profile-dropdown">
                  <ul className="dashboard-profile-menu">
                    <li onClick={() => navigate("/profile")}>View Profile</li>
                    <li onClick={() => navigate("/settings")}>Settings</li>
                    <li onClick={handleLogout}>Logout</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="dashboard-content">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="dashboard-overview">
              {/* Stats Cards */}
              <div className="dashboard-stats-grid">
                <div className="dashboard-stat-card lessons">
                  <div className="dashboard-stat-icon">📘</div>
                  <div className="dashboard-stat-content">
                    <h3>Lessons Completed</h3>
                    <p className="dashboard-stat-value">{animatedStats.lessonsCompleted}</p>
                  </div>
                </div>

                <div className="dashboard-stat-card courses">
                  <div className="dashboard-stat-icon">🎓</div>
                  <div className="dashboard-stat-content">
                    <h3>Courses Completed</h3>
                    <p className="dashboard-stat-value">{animatedStats.completedCourses}</p>
                  </div>
                </div>

                <div className="dashboard-stat-card streak">
                  <div className="dashboard-stat-icon">🔥</div>
                  <div className="dashboard-stat-content">
                    <h3>Current Streak</h3>
                    <p className="dashboard-stat-value">{animatedStats.currentStreak} days</p>
                  </div>
                </div>

                <div className="dashboard-stat-card questions">
                  <div className="dashboard-stat-icon">❓</div>
                  <div className="dashboard-stat-content">
                    <h3>Questions Asked</h3>
                    <p className="dashboard-stat-value">{animatedStats.questionsAsked}</p>
                  </div>
                </div>
              </div>

              {/* Continue Learning Section */}
              <section className="dashboard-continue-learning">
                <div className="dashboard-section-header">
                  <h2>Continue Learning</h2>
                  <button 
                    className="dashboard-view-all" 
                    onClick={() => navigate("/my-courses")}
                  >
                    View All Courses
                  </button>
                </div>

                <div className="dashboard-continue-grid">
                  {enrolledCourses.length === 0 ? (
                    <div className="dashboard-empty-state">
                      <div className="dashboard-empty-icon">📚</div>
                      <h3>No courses yet</h3>
                      <p>You haven't enrolled in any courses yet. Start your learning journey today!</p>
                      <button
                        className="dashboard-primary-btn"
                        onClick={handleBrowseCourses}
                      >
                        Browse Courses
                      </button>
                    </div>
                  ) : (
                    enrolledCourses
                      .filter(course => course.progressPercentage > 0 && course.progressPercentage < 100)
                      .sort((a, b) => b.progressPercentage - a.progressPercentage)
                      .slice(0, 2)
                      .map((course) => (
                        <div key={course.id} className="dashboard-course-card">
                          <div className="dashboard-course-info">
                            <div className="dashboard-course-category">{course.category}</div>
                            <h3 className="dashboard-course-title">{course.title}</h3>
                            <div className="dashboard-course-meta">
                              <span>{course.instructor}</span>
                              <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                            </div>
                            
                            <div className="dashboard-progress">
                              <div className="dashboard-progress-bar">
                                <div
                                  className="dashboard-progress-fill"
                                  style={{ width: `${course.progressPercentage}%` }}
                                ></div>
                              </div>
                              <div className="dashboard-progress-stats">
                                <span>Progress</span>
                                <span>{course.progressPercentage}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="dashboard-course-actions">
                            <button
                              className="dashboard-secondary-btn"
                              onClick={() => handleViewCourseDetails(course.id)}
                            >
                              Details
                            </button>
                            <button
                              className="dashboard-primary-btn"
                              onClick={() => handleStartLearning(course.id)}
                            >
                              Continue
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                  
                  {enrolledCourses.length > 0 && 
                   enrolledCourses.filter(course => course.progressPercentage > 0 && course.progressPercentage < 100).length === 0 && (
                    <div className="dashboard-empty-state">
                      <div className="dashboard-empty-icon">🚀</div>
                      <h3>Start learning</h3>
                      <p>You have enrolled courses but haven't started any yet. Begin your journey now!</p>
                      <button
                        className="dashboard-primary-btn"
                        onClick={() => navigate("/my-courses")}
                      >
                        View My Courses
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Learning Activity */}
              <section className="dashboard-learning-activity">
                <div className="dashboard-section-header">
                  <h2>Learning Activity</h2>
                </div>
                
                <div className="dashboard-activity-wrapper">
                  <div className="dashboard-streak-calendar">
                    <h3>Activity Streak</h3>
                    <div className="dashboard-streak-grid">
                      {learningStreak.map((day, index) => (
                        <div 
                          key={index} 
                          className={`dashboard-streak-day ${day ? 'active' : 'inactive'}`}
                          title={day ? 'Active' : 'Inactive'}
                        ></div>
                      ))}
                    </div>
                    <div className="dashboard-streak-legend">
                      <div className="dashboard-legend-item">
                        <div className="dashboard-legend-inactive"></div>
                        <span>Inactive</span>
                      </div>
                      <div className="dashboard-legend-item">
                        <div className="dashboard-legend-active"></div>
                        <span>Active</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="dashboard-categories-chart">
                    <h3>Courses by Category</h3>
                    {enrolledCourses.length === 0 ? (
                      <div className="dashboard-empty-mini">
                        <p>No categories to display yet</p>
                      </div>
                    ) : (
                      (() => {
                        // Group courses by category
                        const categories = {};
                        enrolledCourses.forEach(course => {
                          if (!categories[course.category]) {
                            categories[course.category] = {
                              count: 0,
                              courses: []
                            };
                          }
                          categories[course.category].count += 1;
                          categories[course.category].courses.push(course);
                        });
                        
                        // Total number of courses for percentage calculation
                        const totalCourses = enrolledCourses.length;
                        
                        return (
                          <div className="dashboard-category-bars">
                            {Object.entries(categories).map(([category, data], index) => {
                              const percentage = (data.count / totalCourses) * 100;
                              return (
                                <div key={category} className="dashboard-category-bar-item">
                                  <div className="dashboard-category-bar-label">
                                    <span>{category}</span>
                                    <span>{data.count} course{data.count !== 1 ? 's' : ''}</span>
                                  </div>
                                  <div className="dashboard-category-bar">
                                    <div 
                                      className="dashboard-category-bar-fill"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              </section>

              {/* Recent Questions Section */}
              <section className="dashboard-recent-questions">
                <div className="dashboard-section-header">
                  <h2>Recent Questions</h2>
                  <button 
                    className="dashboard-view-all"
                    onClick={() => navigate("/learning-history")}
                  >
                    View All History
                  </button>
                </div>

                <div className="dashboard-questions-list">
                  {queryHistory.length === 0 ? (
                    <div className="dashboard-empty-state">
                      <div className="dashboard-empty-icon">💬</div>
                      <h3>No questions yet</h3>
                      <p>You haven't asked any questions to your AI tutor. Get personalized help now!</p>
                      <button
                        className="dashboard-primary-btn"
                        onClick={() => navigate("/ai-chat")}
                      >
                        Ask AI Tutor
                      </button>
                    </div>
                  ) : (
                    <div className="dashboard-questions-grid">
                      {queryHistory.slice(0, 3).map((query, index) => (
                        <div key={index} className="dashboard-question-card">
                          <div className="dashboard-question-content">
                            <p className="dashboard-question-text">{query.question}</p>
                            <div className="dashboard-question-meta">
                              <span className="dashboard-question-time">{formatDate(query.timestamp)}</span>
                              <span className="dashboard-question-category">{query.category || "General"}</span>
                            </div>
                          </div>
                          <button 
                            className="dashboard-view-question" 
                            onClick={() => navigate("/ai-chat", { state: { question: query.question } })}
                          >
                            View Answer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Featured & Recommended Courses */}
              <section className="dashboard-featured-courses">
                <div className="dashboard-section-header">
                  <h2>Recommended For You</h2>
                  <button 
                    className="dashboard-view-all"
                    onClick={handleBrowseCourses}
                  >
                    Browse All Courses
                  </button>
                </div>

                <div className="dashboard-featured-banner">
                  <div className="dashboard-featured-content">
                    <h3>Advance Your Skills</h3>
                    <p>Explore our curated catalog of AI and machine learning courses designed to enhance your knowledge and career prospects.</p>
                    <button
                      className="dashboard-featured-btn"
                      onClick={handleBrowseCourses}
                    >
                      Discover Courses
                    </button>
                  </div>
                  <div className="dashboard-featured-decoration">
                    <div className="dashboard-decoration-circle"></div>
                    <div className="dashboard-decoration-square"></div>
                    <div className="dashboard-decoration-triangle"></div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Connections Tab */}
          {activeTab === "connections" && (
            <div className="dashboard-connections">
            <Connections />
          </div>
          )}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showConfirmLogout && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal">
            <div className="dashboard-modal-header">
              <h3>Confirm Logout</h3>
              <button 
                className="dashboard-modal-close"
                onClick={cancelLogout}
              >
                ×
              </button>
            </div>
            <div className="dashboard-modal-content">
              <p>Are you sure you want to log out of your account? All your local session data will be cleared.</p>
            </div>
            <div className="dashboard-modal-actions">
              <button 
                className="dashboard-secondary-btn"
                onClick={cancelLogout}
              >
                Cancel
              </button>
              <button 
                className="dashboard-primary-btn danger"
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;