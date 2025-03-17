import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./MyCourses.css";
import { FaFilter, FaSearch, FaSortAmountDown, FaExternalLinkAlt, FaArrowLeft } from "react-icons/fa";

const MyCourses = () => {
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSort, setActiveSort] = useState("recent");
  const [categories, setCategories] = useState([]);
  
  // Get user info from localStorage
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  
  useEffect(() => {
    if (!token || !userId) {
      navigate("/login");
      return;
    }
    
    const fetchCoursesAndProgress = async () => {
      try {
        setLoading(true);
        
        // Get enrolled courses
        const coursesResponse = await axios.get(`http://localhost:8080/user/${userId}/courses`);
        
        if (!coursesResponse.data || !coursesResponse.data.courses) {
          setEnrolledCourses([]);
          setFilteredCourses([]);
          setLoading(false);
          return;
        }
        
        // Gather unique categories
        const uniqueCategories = [...new Set(
          coursesResponse.data.courses.map(course => course.category)
        )];
        setCategories(uniqueCategories);
        
        // Create progress promises for each course
        const progressPromises = coursesResponse.data.courses.map(course => 
          axios.get(`http://localhost:8080/user/${userId}/progress/${course._id}`)
        );
        
        // Wait for all progress data
        const progressResponses = await Promise.allSettled(progressPromises);
        
        // Combine course and progress data
        const enhancedCourses = coursesResponse.data.courses.map((course, index) => {
          const progressResult = progressResponses[index];
          let progressData = {
            completedModules: [],
            lastAccessed: null
          };
          
          if (progressResult.status === "fulfilled" && 
              progressResult.value.data && 
              progressResult.value.data.courseProgress) {
            progressData = progressResult.value.data.courseProgress;
          }
          
          // Calculate completion percentage
          const totalModules = course.modules ? course.modules.length : 0;
          const completedCount = progressData.completedModules ? progressData.completedModules.length : 0;
          const completionPercentage = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
          
          // Format last accessed date
          const lastAccessed = progressData.lastAccessed 
            ? new Date(progressData.lastAccessed).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
            : "Not started";
            
          return {
            ...course,
            progress: {
              completedModules: progressData.completedModules || [],
              completionPercentage,
              lastAccessed
            }
          };
        });
        
        setEnrolledCourses(enhancedCourses);
        setFilteredCourses(enhancedCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setError("Failed to load your courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCoursesAndProgress();
  }, [userId, token, navigate]);
  
  // Filter courses based on search, category, etc.
  useEffect(() => {
    let results = [...enrolledCourses];
    
    // Apply search filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      results = results.filter(course => 
        course.title.toLowerCase().includes(term) || 
        course.description.toLowerCase().includes(term) ||
        course.category.toLowerCase().includes(term)
      );
    }
    
    // Apply category filter
    if (activeFilter !== "all") {
      results = results.filter(course => course.category === activeFilter);
    }
    
    // Apply sorting
    switch (activeSort) {
      case "recent":
        results.sort((a, b) => {
          if (a.progress.lastAccessed === "Not started") return 1;
          if (b.progress.lastAccessed === "Not started") return -1;
          return new Date(b.progress.lastAccessed) - new Date(a.progress.lastAccessed);
        });
        break;
      case "progress":
        results.sort((a, b) => b.progress.completionPercentage - a.progress.completionPercentage);
        break;
      case "a-z":
        results.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "z-a":
        results.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }
    
    setFilteredCourses(results);
  }, [searchTerm, activeFilter, activeSort, enrolledCourses]);
  
  const handleStartLearning = (courseId) => {
    navigate(`/course/${courseId}/learn`);
  };
  
  const handleViewCourseDetails = (courseId) => {
    navigate(`/course/${courseId}`);
  };
  
  const handleBrowseCourses = () => {
    navigate("/courses");
  };
  
  if (loading) {
    return (
      <div className="my-courses-loading">
        <div className="loading-spinner"></div>
        <p>Loading your courses...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="my-courses-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="my-courses-container">
      <div className="my-courses-header">
    <div className="header-title-area">
      <button className="back-to-dashboard" onClick={() => navigate("/dashboard")}>
        <FaArrowLeft /> Back to Dashboard
      </button>
      <h1>My Courses</h1>
    </div>
    <div className="courses-actions">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FaSearch className="search-icon" />
      </div>
      
      <div className="filter-sort-controls">
        <div className="filter-dropdown">
          <button className="filter-button">
            <FaFilter /> Filter
          </button>
          <div className="dropdown-content">
            <button 
              className={activeFilter === "all" ? "active" : ""}
              onClick={() => setActiveFilter("all")}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button 
                key={category}
                className={activeFilter === category ? "active" : ""}
                onClick={() => setActiveFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        <div className="sort-dropdown">
          <button className="sort-button">
            <FaSortAmountDown /> Sort
          </button>
          <div className="dropdown-content">
            <button 
              className={activeSort === "recent" ? "active" : ""}
              onClick={() => setActiveSort("recent")}
            >
              Recently Accessed
            </button>
            <button 
              className={activeSort === "progress" ? "active" : ""}
              onClick={() => setActiveSort("progress")}
            >
              Progress (High to Low)
            </button>
            <button 
              className={activeSort === "a-z" ? "active" : ""}
              onClick={() => setActiveSort("a-z")}
            >
              Title (A-Z)
            </button>
            <button 
              className={activeSort === "z-a" ? "active" : ""}
              onClick={() => setActiveSort("z-a")}
            >
              Title (Z-A)
            </button>
          </div>
        </div>
      </div>
      
      <button className="browse-courses-btn" onClick={handleBrowseCourses}>
        Browse New Courses
      </button>
    </div>
  </div>
      
      <div className="courses-count">
        <p>{filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found</p>
      </div>
      
      {filteredCourses.length === 0 ? (
        <div className="empty-courses-container">
          <div className="empty-courses-icon">📚</div>
          <h2>No courses found</h2>
          {enrolledCourses.length === 0 ? (
            <>
              <p>You haven't enrolled in any courses yet.</p>
              <button 
                className="browse-empty-btn"
                onClick={handleBrowseCourses}
              >
                Browse Courses
              </button>
            </>
          ) : (
            <p>No courses match your current filters. Try adjusting your search or filters.</p>
          )}
        </div>
      ) : (
        <div className="courses-grid">
          {filteredCourses.map(course => (
            <div key={course._id} className="course-card">
              <div className="course-card-header">
                <span className="course-category">{course.category}</span>
                {course.progress.completionPercentage === 100 && (
                  <span className="course-completed-badge">Completed</span>
                )}
              </div>
              
              <h2 className="course-title">{course.title}</h2>
              <p className="course-instructor">By {course.instructor || "Staff Instructor"}</p>
              
              <div className="course-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${course.progress.completionPercentage}%` }}
                  ></div>
                </div>
                <div className="progress-stats">
                  <span className="progress-percentage">{course.progress.completionPercentage}% complete</span>
                  <span className="modules-count">
                    {course.progress.completedModules.length}/{course.modules?.length || 0} modules
                  </span>
                </div>
              </div>
              
              <div className="course-meta">
                <div className="meta-item">
                  <span className="meta-label">Level:</span>
                  <span className="meta-value">{course.level || "Beginner"}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Last accessed:</span>
                  <span className="meta-value">{course.progress.lastAccessed}</span>
                </div>
              </div>
              
              <p className="course-description">{
                course.description.length > 150 
                  ? course.description.substring(0, 150) + "..." 
                  : course.description
              }</p>
              
              <div className="course-actions">
                <button 
                  className="details-button"
                  onClick={() => handleViewCourseDetails(course._id)}
                >
                  <FaExternalLinkAlt /> Details
                </button>
                <button 
                  className="learning-button"
                  onClick={() => handleStartLearning(course._id)}
                >
                  {course.progress.completionPercentage > 0 ? 'Continue Learning' : 'Start Course'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;