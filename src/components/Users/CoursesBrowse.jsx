import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  FaSearch, 
  FaFilter, 
  FaBook, 
  FaClock, 
  FaUserTie, 
  FaLayerGroup, 
  FaChevronLeft,
  FaArrowRight
} from "react-icons/fa";
import "./CoursesBrowse.css";

const CoursesBrowse = () => {
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [levels, setLevels] = useState(["Beginner", "Intermediate", "Advanced"]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [featuredCourse, setFeaturedCourse] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchCourses();
        fetchCategories();
    }, []);

    // Filter courses when filter criteria change
    useEffect(() => {
        filterCourses();
    }, [courses, searchTerm, selectedCategory, selectedLevel]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const response = await axios.get("http://localhost:8080/published");
            setCourses(response.data);
            setFilteredCourses(response.data);
            
            // Set a featured course
            if (response.data.length > 0) {
                // Find a course with the most modules if possible
                const sorted = [...response.data].sort((a, b) => 
                    (b.modules?.length || 0) - (a.modules?.length || 0)
                );
                setFeaturedCourse(sorted[0]);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
            setError("Failed to load courses. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get("http://localhost:8080/categories");
            setCategories(response.data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const filterCourses = () => {
        let results = [...courses];

        // Apply search filter
        if (searchTerm) {
            results = results.filter(
                course =>
                    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    course.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply category filter
        if (selectedCategory) {
            results = results.filter(course => course.category === selectedCategory);
        }

        // Apply level filter
        if (selectedLevel) {
            results = results.filter(course => course.level === selectedLevel);
        }

        setFilteredCourses(results);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedCategory("");
        setSelectedLevel("");
    };

    const handleEnrollCourse = async (courseId) => {
        try {
            // Check if user is logged in and get userId from local storage
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");

            if (!token || !userId) {
                navigate("/login", { state: { from: `/course/${courseId}` } });
                return;
            }

            // Call enrollment API with userId
            await axios.post("http://localhost:8080/enroll", {
                courseId,
                userId
            });

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

            // Navigate to course
            navigate(`/course/${courseId}`);

        } catch (error) {
            console.error("Error enrolling in course:", error);

            // Create error notification
            const notification = document.createElement('div');
            notification.className = 'course-notification error';
            
            let errorMessage = "Failed to enroll in course. Please try again.";
            
            if (error.response) {
                // If the error is that user is already enrolled, handle it specially
                if (error.response.status === 400 && error.response.data.error === "Already enrolled in this course") {
                    errorMessage = "You're already enrolled in this course. Redirecting...";
                    notification.className = 'course-notification warning';
                    
                    setTimeout(() => {
                        navigate(`/course/${courseId}`);
                    }, 2000);
                } else {
                    // For other server errors, show the specific error message
                    errorMessage = `Failed to enroll: ${error.response.data.error || "Unknown error"}`;
                }
            }
            
            notification.innerHTML = `
                <div class="notification-content">
                    <div class="notification-icon">!</div>
                    <div class="notification-message">${errorMessage}</div>
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
        }
    };

    // Generate a color based on category for consistent coloring
    const getCategoryColor = (category) => {
        if (!category) return '#4361ee';
        
        const colors = [
            '#4361ee', // primary
            '#2ecc71', // green
            '#9b59b6', // purple
            '#e74c3c', // red
            '#f39c12', // orange
            '#1abc9c', // teal
            '#3498db'  // blue
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

    if (loading) {
        return (
            <div className="courses-loading">
                <div className="courses-spinner"></div>
                <p>Loading amazing courses for you...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="courses-error">
                <div className="error-icon">!</div>
                <h3>Oops! Something went wrong</h3>
                <p>{error}</p>
                <button 
                    className="back-button"
                    onClick={() => navigate("/dashboard")}
                >
                    <FaChevronLeft /> Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="courses-browse-container">
            <div className="courses-browse-header">
                <button 
                    className="back-to-dashboard"
                    onClick={() => navigate("/dashboard")}
                >
                    <FaChevronLeft /> Back to Dashboard
                </button>
                
                <div className="courses-title">
                    <h1>Explore Courses</h1>
                    <p>Discover learning opportunities to enhance your skills</p>
                </div>
            </div>

            {/* Featured Course Section */}
            {featuredCourse && (
                <div className="featured-course-section">
                    <div className="featured-course-content">
                        <div className="featured-badge">Featured Course</div>
                        <h2>{featuredCourse.title}</h2>
                        <p>{featuredCourse.description}</p>
                        <div className="featured-details">
                            <span className="featured-category" style={{ backgroundColor: getCategoryColor(featuredCourse.category) + '20', color: getCategoryColor(featuredCourse.category) }}>
                                {featuredCourse.category}
                            </span>
                            <span className="featured-modules">
                                <FaLayerGroup /> {featuredCourse.modules ? featuredCourse.modules.length : 0} Modules
                            </span>
                            <span className="featured-level">
                                Level: {featuredCourse.level || "Beginner"}
                            </span>
                        </div>
                        <div className="featured-actions">
                            <button 
                                className="view-featured-btn"
                                onClick={() => navigate(`/course/${featuredCourse._id}`)}
                            >
                                View Details
                            </button>
                            <button 
                                className="enroll-featured-btn"
                                onClick={() => handleEnrollCourse(featuredCourse._id)}
                            >
                                Enroll Now <FaArrowRight />
                            </button>
                        </div>
                    </div>
                    <div className="featured-course-graphic">
                        <div className="featured-icon">
                            <FaBook className="featured-book-icon" />
                        </div>
                        <div className="featured-decoration">
                            <div className="decoration-circle"></div>
                            <div className="decoration-dots"></div>
                            <div className="decoration-line"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search & Filters */}
            <div className="courses-controls">
                <div className="search-container">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <button 
                    className="filter-toggle"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <FaFilter /> Filters
                </button>
            </div>

            {showFilters && (
                <div className="filter-panel">
                    <div className="filter-options">
                        <div className="filter-group">
                            <label>Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">All Categories</option>
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Level</label>
                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">All Levels</option>
                                {levels.map((level, index) => (
                                    <option key={index} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <button
                                onClick={clearFilters}
                                className="clear-filters-btn"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Results summary */}
            <div className="courses-results-summary">
                <span>{filteredCourses.length} courses available</span>
                {(selectedCategory || selectedLevel) && (
                    <div className="active-filters">
                        {selectedCategory && (
                            <span className="filter-tag">
                                Category: {selectedCategory}
                            </span>
                        )}
                        {selectedLevel && (
                            <span className="filter-tag">
                                Level: {selectedLevel}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {filteredCourses.length === 0 ? (
                <div className="no-courses-found">
                    <div className="no-courses-icon">
                        <FaSearch />
                    </div>
                    <h3>No courses found</h3>
                    <p>Try adjusting your search criteria or check back later for new courses.</p>
                    <button
                        className="reset-search-btn"
                        onClick={clearFilters}
                    >
                        Reset Search
                    </button>
                </div>
            ) : (
                <div className="courses-grid">
                    {filteredCourses.map(course => {
                        const categoryColor = getCategoryColor(course.category);
                        const levelClass = getLevelClass(course.level);
                        
                        return (
                            <div key={course._id} className="course-card">
                                <div className="course-top-content">
                                    <div 
                                        className="course-decoration" 
                                        style={{ backgroundColor: categoryColor + '20' }}
                                    ></div>
                                    <div className="course-header">
                                        <div 
                                            className="course-icon" 
                                            style={{ backgroundColor: categoryColor }}
                                        >
                                            {course.title.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={`course-level ${levelClass}`}>
                                            {course.level || "Beginner"}
                                        </div>
                                    </div>
                                    
                                    <h3 className="course-title">{course.title}</h3>
                                    
                                    <div className="course-category-tag" style={{ color: categoryColor, backgroundColor: categoryColor + '15' }}>
                                        {course.category}
                                    </div>
                                    
                                    <p className="course-description">
                                        {course.description.length > 120
                                            ? `${course.description.substring(0, 120)}...`
                                            : course.description}
                                    </p>
                                </div>
                                
                                <div className="course-bottom-content">
                                    <div className="course-details">
                                        <div className="course-detail-item">
                                            <FaUserTie className="detail-icon" style={{ color: categoryColor }} />
                                            <span>{course.instructor || "Admin"}</span>
                                        </div>
                                        <div className="course-detail-item">
                                            <FaClock className="detail-icon" style={{ color: categoryColor }} />
                                            <span>{course.duration || 0} hours</span>
                                        </div>
                                        <div className="course-detail-item">
                                            <FaLayerGroup className="detail-icon" style={{ color: categoryColor }} />
                                            <span>{course.modules ? course.modules.length : 0} Modules</span>
                                        </div>
                                    </div>
                                    
                                    <div className="course-actions">
                                        <button
                                            className="view-course-btn"
                                            onClick={() => navigate(`/course/${course._id}`)}
                                        >
                                            View Details
                                        </button>
                                        <button
                                            className="enroll-course-btn"
                                            onClick={() => handleEnrollCourse(course._id)}
                                            style={{ backgroundColor: categoryColor }}
                                        >
                                            Enroll Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CoursesBrowse;