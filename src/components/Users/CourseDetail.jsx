import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaChevronLeft, 
  FaUser, 
  FaClock, 
  FaLayerGroup,
  FaBook,
  FaCheck,
  FaFacebook,
  FaTwitter,
  FaEnvelope,
  FaArrowRight,
  FaShare
} from "react-icons/fa";
import "./CourseDetail.css";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeModule, setActiveModule] = useState(0);
  const [instructorImage, setInstructorImage] = useState(null);
  
  // Get user info from localStorage
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  
  useEffect(() => {
    fetchCourseDetails();
    if (userId && token) {
      checkEnrollmentStatus();
    }
  }, [id, userId, token]);
  
  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8080/course/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCourse(response.data);
      
      // Generate a color for the instructor avatar based on the instructor name
      if (response.data.instructor) {
        generateInstructorImage(response.data.instructor);
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
      setError("Failed to load course details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  const checkEnrollmentStatus = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/user/${userId}/enrollments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Check if current course ID is in the enrollments
      const enrolledCourses = response.data.enrollments || [];
      setIsEnrolled(enrolledCourses.some(courseId => courseId === id));
    } catch (error) {
      console.error("Error checking enrollment status:", error);
    }
  };
  
  const handleEnroll = async () => {
    // Check if user is logged in
    if (!token || !userId) {
      navigate("/login", { state: { from: `/course/${id}` } });
      return;
    }
    
    try {
      setLoading(true);
      await axios.post("http://localhost:8080/enroll", { 
        courseId: id,
        userId: userId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setIsEnrolled(true);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'course-notification success';
      notification.innerHTML = `
          <div class="notification-content">
              <div class="notification-icon">✓</div>
              <div class="notification-message">Successfully enrolled in the course!</div>
          </div>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
          notification.classList.add('show');
          setTimeout(() => {
              notification.classList.remove('show');
              setTimeout(() => {
                  document.body.removeChild(notification);
              }, 300);
          }, 3000);
      }, 100);
      
    } catch (error) {
      console.error("Error enrolling in course:", error);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'course-notification error';
      notification.innerHTML = `
          <div class="notification-content">
              <div class="notification-icon">!</div>
              <div class="notification-message">Failed to enroll in this course. Please try again.</div>
          </div>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
          notification.classList.add('show');
          setTimeout(() => {
              notification.classList.remove('show');
              setTimeout(() => {
                  document.body.removeChild(notification);
              }, 300);
          }, 3000);
      }, 100);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartLearning = () => {
    navigate(`/course/${id}/learn`);
  };
  
  const generateInstructorImage = (name) => {
    const colors = [
      '#4361ee', '#2ecc71', '#9b59b6', 
      '#e74c3c', '#f39c12', '#1abc9c', '#3498db'
    ];
    
    // Generate a hash from instructor name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const color = colors[Math.abs(hash) % colors.length];
    setInstructorImage(color);
  };
  
  // Generate a category color
  const getCategoryColor = (category) => {
    if (!category) return '#4361ee';
    
    const colors = [
      '#4361ee', '#2ecc71', '#9b59b6', 
      '#e74c3c', '#f39c12', '#1abc9c', '#3498db'
    ];
    
    // Simple hash function to get a consistent color for each category
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  const getLevelClass = (level) => {
    if (!level) return '';
    
    const levelLower = level.toLowerCase();
    if (levelLower === 'beginner') return 'level-beginner';
    if (levelLower === 'intermediate') return 'level-intermediate';
    if (levelLower === 'advanced') return 'level-advanced';
    
    return '';
  };
  
  const handleShare = (platform) => {
    const courseUrl = window.location.href;
    let shareUrl;
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(courseUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(courseUrl)}&text=${encodeURIComponent(`Check out this course: ${course.title}`)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(`Check out this course: ${course.title}`)}&body=${encodeURIComponent(`I found this interesting course: ${courseUrl}`)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank');
  };
  
  if (loading) {
    return (
      <div className="course-detail-loading">
        <div className="course-detail-spinner"></div>
        <p>Loading course details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="course-detail-error">
        <div className="error-icon">!</div>
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button 
          className="back-button"
          onClick={() => navigate("/courses")}
        >
          <FaChevronLeft /> Back to Courses
        </button>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="course-detail-error">
        <div className="error-icon">?</div>
        <h3>Course not found</h3>
        <p>The course you're looking for doesn't exist or has been removed.</p>
        <button 
          className="back-button"
          onClick={() => navigate("/courses")}
        >
          <FaChevronLeft /> Back to Courses
        </button>
      </div>
    );
  }
  
  const categoryColor = getCategoryColor(course.category);
  const levelClass = getLevelClass(course.level);

  return (
    <div className="course-detail-container">
      <div className="course-detail-navigation">
        <button 
          className="back-to-courses"
          onClick={() => navigate("/courses")}
        >
          <FaChevronLeft /> Back to Courses
        </button>
      </div>
      
      <div className="course-detail-hero">
        <div className="course-hero-content">
          <div className="course-hero-tags">
            <span 
              className="course-category-pill"
              style={{ 
                backgroundColor: `${categoryColor}20`, 
                color: categoryColor 
              }}
            >
              {course.category}
            </span>
            <span className={`course-level-pill ${levelClass}`}>
              {course.level || "Beginner"}
            </span>
          </div>
          
          <h1 className="course-hero-title">{course.title}</h1>
          
          <p className="course-hero-description">
            {course.description.length > 150 
              ? `${course.description.substring(0, 150)}...` 
              : course.description}
          </p>
          
          <div className="course-hero-meta">
            <div className="meta-item">
              <div 
                className="instructor-avatar"
                style={{ backgroundColor: instructorImage }}
              >
                {course.instructor ? course.instructor.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="meta-info">
                <span className="meta-label">Instructor</span>
                <span className="meta-value">{course.instructor || "Admin"}</span>
              </div>
            </div>
            
            <div className="meta-item">
              <div className="meta-icon">
                <FaClock style={{ color: categoryColor }} />
              </div>
              <div className="meta-info">
                <span className="meta-label">Duration</span>
                <span className="meta-value">{course.duration || 0} hours</span>
              </div>
            </div>
            
            <div className="meta-item">
              <div className="meta-icon">
                <FaLayerGroup style={{ color: categoryColor }} />
              </div>
              <div className="meta-info">
                <span className="meta-label">Modules</span>
                <span className="meta-value">{course.modules ? course.modules.length : 0} modules</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="course-hero-graphic">
          <div 
            className="course-icon-large"
            style={{ backgroundColor: categoryColor }}
          >
            <FaBook className="course-book-icon" />
          </div>
          <div className="course-graphic-decoration">
            <div className="decoration-circle"></div>
            <div className="decoration-dots"></div>
          </div>
        </div>
      </div>
      
      <div className="course-detail-content">
        <div className="course-detail-main">
          <div className="course-section">
            <h2 className="section-title">About This Course</h2>
            <div className="course-description">
              <p>{course.description}</p>
            </div>
          </div>
          
          <div className="course-section">
            <h2 className="section-title">What You'll Learn</h2>
            <div className="course-outcomes">
              {course.modules && course.modules.length > 0 ? (
                <ul className="outcomes-list">
                  {course.modules.map((module, index) => (
                    <li key={index}>
                      <FaCheck className="outcome-icon" style={{ color: categoryColor }} />
                      <span>{module.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-content-message">
                  <div className="no-content-icon">
                    <FaBook />
                  </div>
                  <p>This course structure is being developed.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="course-section">
            <h2 className="section-title">Course Content</h2>
            <div className="course-modules">
              {course.modules && course.modules.length > 0 ? (
                <div className="module-accordion">
                  {course.modules.map((module, index) => (
                    <div 
                      className={`module-item ${activeModule === index ? "active" : ""}`}
                      key={index}
                    >
                      <div 
                        className="module-header"
                        onClick={() => setActiveModule(activeModule === index ? null : index)}
                      >
                        <div className="module-title">
                          <div 
                            className="module-number"
                            style={{ backgroundColor: categoryColor }}
                          >
                            {index + 1}
                          </div>
                          <h3>{module.title}</h3>
                        </div>
                        <span className="module-toggle">
                          {activeModule === index ? "−" : "+"}
                        </span>
                      </div>
                      
                      {activeModule === index && (
                        <div className="module-content">
                          <p>{module.description || "No details available for this module."}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-content-message">
                  <div className="no-content-icon">
                    <FaLayerGroup />
                  </div>
                  <p>No modules available for this course yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="course-detail-sidebar">
          <div className="course-enrollment-card">
            <div className="enrollment-header">
              <h3>Join This Course</h3>
              <div className="enrollment-price">
                Free
              </div>
            </div>
            
            <div className="enrollment-features">
              <div className="feature-item">
                <div className="feature-icon">
                  <FaCheck style={{ color: categoryColor }} />
                </div>
                <span>Full access to all materials</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <FaCheck style={{ color: categoryColor }} />
                </div>
                <span>Personalized learning experience</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <FaCheck style={{ color: categoryColor }} />
                </div>
                <span>Track your progress</span>
              </div>
            </div>
            
            {isEnrolled ? (
              <button 
                className="continue-learning-btn"
                onClick={handleStartLearning}
                style={{ backgroundColor: categoryColor }}
              >
                Continue Learning <FaArrowRight />
              </button>
            ) : (
              <button 
                className="enroll-course-btn"
                onClick={handleEnroll}
                disabled={loading}
                style={{ backgroundColor: categoryColor }}
              >
                {loading ? "Processing..." : "Enroll Now"}
              </button>
            )}
          </div>
          
          <div className="share-course-card">
            <h3>Share This Course</h3>
            <div className="share-buttons">
              <button 
                className="share-btn facebook"
                onClick={() => handleShare('facebook')}
              >
                <FaFacebook />
              </button>
              <button 
                className="share-btn twitter"
                onClick={() => handleShare('twitter')}
              >
                <FaTwitter />
              </button>
              <button 
                className="share-btn email"
                onClick={() => handleShare('email')}
              >
                <FaEnvelope />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;