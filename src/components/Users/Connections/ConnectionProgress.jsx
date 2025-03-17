// src/components/ConnectionProgress.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ConnectionProgress.css';

const ConnectionProgress = () => {
    const { connectionId } = useParams();
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [connectionData, setConnectionData] = useState(null);
    const [connectionUser, setConnectionUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [progressStats, setProgressStats] = useState({
        completedCourses: 0,
        inProgressCourses: 0,
        totalModules: 0,
        completedModules: 0,
        averageCompletionRate: 0
    });
    const [userLevel, setUserLevel] = useState(null);

    useEffect(() => {
        const fetchConnectionProgress = async () => {
            try {
                setLoading(true);
                
                // Fetch connection progress data
                const response = await axios.get(`http://localhost:8080/user/${userId}/connection/${connectionId}/progress`);
                
                setConnectionUser(response.data.user);
                
                const coursesData = response.data.courses || [];
                setCourses(coursesData);
                
                // Get user data for more details including progress and level
                const userResponse = await axios.get(`http://localhost:8080/user/${response.data.user.userId}`);
                const userData = userResponse.data;
                
                // Set user level data
                setUserLevel({
                    level: userData.level || 1,
                    rank: userData.rank || 'Beginner',
                    experience: userData.experience || 0,
                    nextLevelExp: userData.nextLevelExp || 100
                });
                
                // Process course progress data directly from user data
                const courseProgress = userData.courseProgress || {};
                
                // Calculate stats from the actual user data
                let completedCourses = 0;
                let inProgressCourses = 0;
                let totalModules = 0;
                let completedModules = 0;
                
                // Create a map of course data by ID for easy access
                const courseMap = {};
                coursesData.forEach(course => {
                    courseMap[course._id] = course;
                });
                
                // Process each course in the progress data
                Object.keys(courseProgress).forEach(courseId => {
                    const progress = courseProgress[courseId];
                    
                    if (!progress) return;
                    
                    // Count modules
                    const course = courseMap[courseId];
                    const moduleCount = course?.modules?.length || progress.moduleData?.length || 0;
                    const completedCount = progress.completedModules?.length || 0;
                    
                    totalModules += moduleCount;
                    completedModules += completedCount;
                    
                    // Determine if course is complete
                    if (progress.certificateIssued || (moduleCount > 0 && completedCount === moduleCount)) {
                        completedCourses++;
                    } else if (completedCount > 0) {
                        inProgressCourses++;
                    }
                    
                    // Enhance course data with progress information
                    if (course) {
                        course._progress = {
                            completedModules: progress.completedModules || [],
                            moduleData: progress.moduleData || [],
                            completionRate: moduleCount > 0 ? Math.round((completedCount / moduleCount) * 100) : 0
                        };
                    }
                });
                
                // Set calculated stats
                setProgressStats({
                    completedCourses,
                    inProgressCourses,
                    totalModules,
                    completedModules,
                    averageCompletionRate: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0
                });
                
                // Also fetch the connection details
                const connectionRes = await axios.get(`http://localhost:8080/user/connections?userId=${userId}`);
                const currentConnection = connectionRes.data.find(
                    conn => conn.connectionId === connectionId
                );
                setConnectionData(currentConnection);
            } catch (error) {
                console.error('Error fetching connection progress:', error);
                setError('Failed to load progress data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (userId && connectionId) {
            fetchConnectionProgress();
        }
    }, [userId, connectionId]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="connection-progress-loading">
                <div className="progress-spinner"></div>
                <p>Loading connection progress...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="connection-progress-error">
                <h3>Error</h3>
                <p>{error}</p>
                <button onClick={() => navigate('/dashboard')} className="back-button">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!connectionUser || !connectionData) {
        return (
            <div className="connection-progress-error">
                <h3>Connection Not Found</h3>
                <p>This connection may have been removed or you don't have permission to view it.</p>
                <button onClick={() => navigate('/dashboard')} className="back-button">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="connection-progress-container">
            <div className="connection-progress-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <h2>{connectionUser.name}'s Learning Progress</h2>
                <div className="connection-info-badge">
                    Connected since {formatDate(connectionData.since)}
                </div>
            </div>

            {userLevel && (
                <div className="user-level-section">
                    <div className="user-level-card">
                        <div className="level-badge">Level {userLevel.level}</div>
                        <div className="user-rank">{userLevel.rank}</div>
                        <div className="experience-bar-container">
                            <div className="experience-bar">
                                <div 
                                    className="experience-filled"
                                    style={{
                                        width: `${Math.min(100, (userLevel.experience / userLevel.nextLevelExp) * 100)}%`
                                    }}
                                ></div>
                            </div>
                            <div className="experience-text">
                                {userLevel.experience} / {userLevel.nextLevelExp} XP
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="connection-progress-stats">
                <div className="progress-stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-details">
                        <h3>Courses</h3>
                        <div className="stat-numbers">
                            <div className="stat-number-item">
                                <span className="stat-value">{progressStats.completedCourses}</span>
                                <span className="stat-label">Completed</span>
                            </div>
                            <div className="stat-number-item">
                                <span className="stat-value">{progressStats.inProgressCourses}</span>
                                <span className="stat-label">In Progress</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="progress-stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-details">
                        <h3>Modules</h3>
                        <div className="stat-numbers">
                            <div className="stat-number-item">
                                <span className="stat-value">{progressStats.completedModules}</span>
                                <span className="stat-label">Completed</span>
                            </div>
                            <div className="stat-number-item">
                                <span className="stat-value">{progressStats.totalModules}</span>
                                <span className="stat-label">Total</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="progress-stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-details">
                        <h3>Average Completion</h3>
                        <p className="big-stat">{progressStats.averageCompletionRate}%</p>
                    </div>
                </div>
            </div>

            <div className="connection-courses-section">
                <h3>Enrolled Courses</h3>
                
                {courses.length === 0 ? (
                    <div className="no-courses-message">
                        <p>{connectionUser.name} hasn't enrolled in any courses yet.</p>
                    </div>
                ) : (
                    <div className="connection-courses-grid">
                        {courses.map(course => {
                            // Get progress data from the enhanced course object
                            const progress = course._progress || { completionRate: 0, completedModules: [] };
                            const moduleCount = course.modules?.length || 0;
                            const completedCount = progress.completedModules?.length || 0;
                                
                            return (
                                <div key={course._id} className="connection-course-card">
                                    <div className="course-category-tag">{course.category || "General"}</div>
                                    <div className="course-level-tag">{course.level || "Beginner"}</div>
                                    <h4>{course.title}</h4>
                                    <p className="course-description">{course.description}</p>
                                    
                                    <div className="course-meta">
                                        <div className="meta-item">
                                            <span className="meta-icon">👨‍🏫</span>
                                            <span>{course.instructor || "Instructor"}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-icon">📖</span>
                                            <span>{moduleCount} modules</span>
                                        </div>
                                    </div>
                                    
                                    <div className="course-progress-bar-container">
                                        <div className="course-progress-label">
                                            <span>Progress</span>
                                            <span>{progress.completionRate}%</span>
                                        </div>
                                        <div className="course-progress-bar">
                                            <div 
                                                className="course-progress-filled"
                                                style={{width: `${progress.completionRate}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                    <div className="module-completion-status">
                                        <span className="modules-completed">
                                            {completedCount} of {moduleCount} modules completed
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {courses.length > 0 && (
                <div className="course-category-distribution">
                    <h3>Learning Focus</h3>
                    <div className="category-distribution-chart">
                        {(() => {
                            // Group courses by category
                            const categories = {};
                            courses.forEach(course => {
                                const category = course.category || "General";
                                if (!categories[category]) {
                                    categories[category] = {
                                        count: 0,
                                        courses: []
                                    };
                                }
                                categories[category].count += 1;
                                categories[category].courses.push(course);
                            });
                            
                            // Total number of courses for percentage calculation
                            const totalCourses = courses.length;
                            
                            return (
                                <div className="category-bars">
                                    {Object.entries(categories).map(([category, data], index) => {
                                        const percentage = (data.count / totalCourses) * 100;
                                        return (
                                            <div key={category} className="category-bar-item">
                                                <div className="category-bar-label">
                                                    <span>{category}</span>
                                                    <span>{data.count} course{data.count !== 1 ? 's' : ''}</span>
                                                </div>
                                                <div className="category-bar">
                                                    <div 
                                                        className="category-bar-fill"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConnectionProgress;