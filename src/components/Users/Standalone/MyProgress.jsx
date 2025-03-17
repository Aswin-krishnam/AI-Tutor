import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./MyProgress.css";
import { 
  FaTrophy, FaFire, FaBookOpen, FaCertificate, FaChartLine, 
  FaCalendarAlt, FaArrowLeft, FaCheckCircle, FaExclamationCircle
} from "react-icons/fa";

const MyProgress = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [courseDetails, setCourseDetails] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    notStartedCourses: 0,
    averageCompletionRate: 0,
    courseDetails: [],
    totalCompletedModules: 0,
    currentStreak: 0,
    questionsAsked: 0
  });
  const [achievements, setAchievements] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [showNewAchievementNotification, setShowNewAchievementNotification] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  
  // Get user info from localStorage
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  
  useEffect(() => {
    if (!token || !userId) {
      navigate("/login");
      return;
    }
    
    const fetchUserProgress = async () => {
      try {
        setLoading(true);
        
        // Fetch user's enrolled courses
        const enrollmentsResponse = await axios.get(`http://localhost:8080/user/${userId}/courses`);
        if (enrollmentsResponse.data && enrollmentsResponse.data.courses) {
          setEnrolledCourses(enrollmentsResponse.data.courses);
        }
        
        // Process course data and build analytics
        const courseProgressData = [];
        let totalCompletedModules = 0;
        let completedCoursesCount = 0;
        let inProgressCoursesCount = 0;
        let notStartedCoursesCount = 0;
        let totalCompletionRate = 0;
        
        // Fetch progress for each course
        for (const course of enrollmentsResponse.data.courses) {
          try {
            const progressResponse = await axios.get(`http://localhost:8080/user/${userId}/progress/${course._id}`);
            const courseProgress = progressResponse.data.courseProgress;
            
            const totalModules = course.modules ? course.modules.length : 0;
            const completedModules = courseProgress?.completedModules?.length || 0;
            totalCompletedModules += completedModules;
            
            const completionRate = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
            totalCompletionRate += completionRate;
            
            // Categorize course by completion status
            if (completionRate === 100) {
              completedCoursesCount++;
            } else if (completionRate > 0) {
              inProgressCoursesCount++;
            } else {
              notStartedCoursesCount++;
            }
            
            courseProgressData.push({
              courseId: course._id,
              title: course.title,
              category: course.category,
              completionRate: completionRate,
              lastAccessed: courseProgress?.lastAccessed || null,
              startedAt: courseProgress?.startedAt || null,
              certificateIssued: courseProgress?.certificateIssued || false
            });
          } catch (error) {
            console.error(`Error fetching progress for course ${course._id}:`, error);
          }
        }
        
        // Calculate average completion rate
        const averageCompletionRate = courseProgressData.length > 0 
          ? totalCompletionRate / courseProgressData.length 
          : 0;
        
        // Build analytics object
        const userAnalytics = {
          totalCourses: enrollmentsResponse.data.courses.length,
          completedCourses: completedCoursesCount,
          inProgressCourses: inProgressCoursesCount,
          notStartedCourses: notStartedCoursesCount,
          averageCompletionRate: averageCompletionRate,
          courseDetails: courseProgressData,
          totalCompletedModules: totalCompletedModules,
          currentStreak: calculateStreak(courseProgressData), // Implement this function
          questionsAsked: 0 // Will fetch this separately if available
        };
        
        setAnalytics(userAnalytics);
        setCourseDetails(courseProgressData);
        
        // Generate activity data from recent course accesses
        generateActivityData(courseProgressData);
        
        // Fetch user achievements
        try {
          const achievementsResponse = await axios.get(`http://localhost:8080/user/${userId}/achievements`);
          
          if (achievementsResponse.data) {
            setAchievements(achievementsResponse.data);
            
            // Check if there are any new achievements to show notification
            const newlyEarned = achievementsResponse.data.find(a => a.isCompleted && a.isNew);
            
            if (newlyEarned) {
              setNewAchievement(newlyEarned);
              setShowNewAchievementNotification(true);
              
              // Mark the achievement as seen
              await axios.put(`http://localhost:8080/user/${userId}/achievements/${newlyEarned.code}/seen`);
            }
          }
        } catch (achievementError) {
          console.error("Error fetching achievements:", achievementError);
          // Don't set main error - we can still show the rest of the progress data
        }
        
      } catch (error) {
        console.error("Error fetching progress data:", error);
        setError("Failed to load your progress data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProgress();
  }, [userId, token, navigate]);
  
  // Helper function to estimate streak based on recent course accesses
  const calculateStreak = (courseDetails) => {
    // This is a simplified approach as we don't have daily login tracking
    
    // Get the most recent access date across all courses
    const recentAccesses = courseDetails
      .filter(course => course.lastAccessed)
      .map(course => new Date(course.lastAccessed).getTime())
      .sort((a, b) => b - a);
    
    if (recentAccesses.length === 0) return 0;
    
    const now = new Date().getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const mostRecent = recentAccesses[0];
    
    // If the most recent access was more than 2 days ago, streak is broken
    if (now - mostRecent > 2 * oneDayMs) return 0;
    
    // Simple streak calculation based on number of courses accessed recently
    // This is a placeholder - in real implementation you'd have a more precise streak mechanism
    const recentCoursesAccessed = recentAccesses.filter(
      time => now - time < 7 * oneDayMs
    ).length;
    
    return Math.min(recentCoursesAccessed + 1, 30); // Limit to 30
  };
  
  // Generate activity data based on course accesses
  const generateActivityData = (courseDetails) => {
    // Create an array of 30 days (0 = no activity, 1 = activity)
    const activityArray = Array(30).fill(0);
    
    // For each course, check when it was last accessed
    courseDetails.forEach(course => {
      if (course.lastAccessed) {
        const accessDate = new Date(course.lastAccessed);
        const now = new Date();
        const diffTime = Math.abs(now - accessDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // Mark activity in the activity array (if within last 30 days)
        if (diffDays < 30) {
          activityArray[diffDays] = 1;
        }
      }
    });
    
    setActivityData(activityArray);
  };
  
  // Handle dismissing achievement notification
  const dismissAchievementNotification = () => {
    setShowNewAchievementNotification(false);
  };
  
  // Navigate back to dashboard
  const goToDashboard = () => {
    navigate("/dashboard");
  };
  
  if (loading) {
    return (
      <div className="my-progress-loading">
        <div className="loading-spinner"></div>
        <p>Loading your progress data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="my-progress-error">
        <h2>Error</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={() => window.location.reload()} className="retry-button">
            <FaExclamationCircle /> Try Again
          </button>
          <button onClick={goToDashboard} className="back-to-dashboard">
            <FaArrowLeft /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="my-progress-container">
      <div className="progress-header">
        <button className="back-to-dashboard" onClick={goToDashboard}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1 className="progress-title">My Learning Progress</h1>
      </div>
      
      {showNewAchievementNotification && newAchievement && (
        <div className="new-achievement-notification">
          <div className="achievement-icon">{newAchievement.icon}</div>
          <div className="achievement-content">
            <h3>New Achievement Unlocked!</h3>
            <h4>{newAchievement.title}</h4>
            <p>{newAchievement.description}</p>
            <p className="achievement-points">+{newAchievement.points} points</p>
          </div>
          <button className="dismiss-notification" onClick={dismissAchievementNotification}>
            <FaCheckCircle />
          </button>
        </div>
      )}
      
      <div className="progress-overview">
        <div className="streak-card">
          <div className="streak-icon">
            <FaFire />
          </div>
          <div className="streak-content">
            <h2>Current Streak</h2>
            <p className="streak-count">{analytics.currentStreak} {analytics.currentStreak === 1 ? 'day' : 'days'}</p>
            <p className="streak-message">
              {analytics.currentStreak === 0 
                ? "Start learning today to build your streak!" 
                : analytics.currentStreak < 3 
                  ? "Good start! Keep it going." 
                  : analytics.currentStreak < 7 
                    ? "You're on a roll!" 
                    : "Impressive dedication!"}
            </p>
          </div>
        </div>
        
        <div className="courses-summary-card">
          <h2>Course Progress</h2>
          <div className="course-stats">
            <div className="stats-item">
              <div className="stat-circle">
                <svg viewBox="0 0 36 36">
                  <path
                    className="circle-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="circle-progress"
                    strokeDasharray={`${analytics.completedCourses * 100 / (analytics.totalCourses || 1)}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="stat-text">
                    {Math.round(analytics.completedCourses * 100 / (analytics.totalCourses || 1))}%
                  </text>
                </svg>
              </div>
              <div className="stat-details">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{analytics.completedCourses}/{analytics.totalCourses}</span>
              </div>
            </div>
            
            <div className="stats-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-dot completed"></span>
                <span className="breakdown-label">Completed</span>
                <span className="breakdown-value">{analytics.completedCourses}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-dot in-progress"></span>
                <span className="breakdown-label">In Progress</span>
                <span className="breakdown-value">{analytics.inProgressCourses}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-dot not-started"></span>
                <span className="breakdown-label">Not Started</span>
                <span className="breakdown-value">{analytics.notStartedCourses}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="completion-rate-card">
          <h2>Average Completion</h2>
          <div className="completion-content">
            <div className="completion-meter">
              <div 
                className="meter-fill" 
                style={{ width: `${analytics.averageCompletionRate}%` }}
              ></div>
            </div>
            <div className="completion-percentage">
              {Math.round(analytics.averageCompletionRate)}%
            </div>
            <p className="completion-message">
              {analytics.averageCompletionRate < 25 
                ? "Just getting started! Keep learning." 
                : analytics.averageCompletionRate < 50 
                  ? "Making good progress. Stay consistent!" 
                  : analytics.averageCompletionRate < 75 
                    ? "Great work! You're over halfway there." 
                    : "Outstanding! You're close to mastery."}
            </p>
          </div>
        </div>
      </div>
      
      <div className="activity-calendar-section">
        <h2>
          <FaCalendarAlt /> Learning Activity Calendar
        </h2>
        <div className="calendar-subtitle">Last 30 days of activity</div>
        <div className="activity-calendar">
          {activityData.slice().reverse().map((day, index) => (
            <div 
              key={index}
              className={`calendar-day ${day ? 'active' : ''}`}
              title={day ? `Active ${30 - index} days ago` : `No activity ${30 - index} days ago`}
            ></div>
          ))}
        </div>
        <div className="calendar-labels">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>
      
      <div className="course-progress-section">
        <h2>Course-by-Course Progress</h2>
        
        {analytics.courseDetails.length === 0 ? (
          <div className="empty-courses-message">
            <p>You haven't enrolled in any courses yet.</p>
            <button 
              className="browse-courses-btn"
              onClick={() => navigate("/courses")}
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="course-progress-list">
            {analytics.courseDetails
              .sort((a, b) => b.completionRate - a.completionRate)
              .map((course, index) => (
                <div key={index} className="course-progress-item">
                  <div className="course-details">
                    <h3>{course.title}</h3>
                    <span className="course-category">{course.category}</span>
                    {course.certificateIssued && (
                      <span className="certificate-badge">
                        <FaCertificate /> Certificate Issued
                      </span>
                    )}
                  </div>
                  
                  <div className="course-progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${course.completionRate}%` }}
                    ></div>
                    <span className="progress-percentage">{Math.round(course.completionRate)}%</span>
                  </div>
                  
                  <div className="course-actions">
                    <button 
                      className="view-course-btn"
                      onClick={() => navigate(`/course/${course.courseId}`)}
                    >
                      Details
                    </button>
                    <button 
                      className="continue-course-btn"
                      onClick={() => navigate(`/course/${course.courseId}/learn`)}
                    >
                      {course.completionRate === 100 ? 'Review' : 'Continue'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      
      {achievements.length > 0 && (
        <div className="achievements-section">
          <h2>Achievements</h2>
          <div className="achievements-grid">
            {achievements.map(achievement => (
              <div 
                key={achievement.code} 
                className={`achievement-card ${achievement.isCompleted ? 'achieved' : ''}`}
              >
                <div className="achievement-icon">
                  {achievement.icon}
                </div>
                <div className="achievement-progress-bar">
                  <div 
                    className="achievement-progress-fill"
                    style={{ width: `${(achievement.progress / achievement.condition.target) * 100}%` }}
                  ></div>
                </div>
                <div className="achievement-progress-text">
                  {achievement.progress}/{achievement.condition.target}
                </div>
                <h3>{achievement.title}</h3>
                <p>{achievement.description}</p>
                {achievement.isCompleted && (
                  <div className="achievement-badge">
                    <FaTrophy /> Unlocked
                  </div>
                )}
                {achievement.isCompleted && achievement.earnedAt && (
                  <div className="achievement-date">
                    Earned on {new Date(achievement.earnedAt).toLocaleDateString()}
                  </div>
                )}
                {achievement.isCompleted && (
                  <div className="achievement-points-badge">
                    +{achievement.points} points
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProgress;