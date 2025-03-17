// Updated CourseLearning.jsx with Forum Integration
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./CourseLearning.css";
import {
    FaBook, FaArrowLeft, FaArrowRight, FaBars,
    FaHeadphones, FaSpinner, FaChartLine, FaPencilAlt,
    FaRobot, FaComments, FaBrain, FaCertificate
} from "react-icons/fa";

const CourseLearning = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State variables
    const [course, setCourse] = useState(null);
    const [activeModule, setActiveModule] = useState(0);
    const [completedModules, setCompletedModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasStudyMaterials, setHasStudyMaterials] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [podcasts, setPodcasts] = useState([]);
    const [loadingPodcasts, setLoadingPodcasts] = useState(false);
    const [showAITutorButton, setShowAITutorButton] = useState(false);
    const [certificateEligibility, setCertificateEligibility] = useState({
        eligible: false,
        certificateIssued: false,
        message: "",
        completedModules: 0,
        totalModules: 0,
        completedAssessments: 0
    });

    // New state variables for forum integration
    const [recentDiscussions, setRecentDiscussions] = useState([]);
    const [loadingDiscussions, setLoadingDiscussions] = useState(false);
    const [hasDiscussions, setHasDiscussions] = useState(false);

    // Get user info from localStorage
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    // Define the base URL for serving files
    const serverBaseUrl = "http://localhost:8080"; // Update with your actual server URL

    // Create a memoized fetchPodcasts function to prevent unnecessary re-renders
    const fetchPodcasts = useCallback(async () => {
        if (!id || activeModule === null) return;

        setLoadingPodcasts(true);
        try {
            const response = await axios.get(`${serverBaseUrl}/podcasts/${id}/${activeModule}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Map through the podcasts to ensure fileUrl is properly formatted
            const formattedPodcasts = (response.data || []).map(podcast => ({
                ...podcast,
                // Ensure fileUrl has the proper server prefix if it's a relative path
                fileUrl: podcast.fileUrl.startsWith('http')
                    ? podcast.fileUrl
                    : `${serverBaseUrl}${podcast.fileUrl}`
            }));

            setPodcasts(formattedPodcasts);
            console.log("Podcasts loaded:", formattedPodcasts);
        } catch (error) {
            console.error("Error fetching podcasts:", error);
            setPodcasts([]);
        } finally {
            setLoadingPodcasts(false);
        }
    }, [id, activeModule, token, serverBaseUrl]);

    // Fetch recent forum discussions for the current module
    const fetchRecentDiscussions = useCallback(async () => {
        if (!id || activeModule === null) return;

        setLoadingDiscussions(true);
        try {
            console.log(`Fetching recent discussions for course: ${id}, module: ${activeModule}`);

            // Update the API endpoint to use the new path
            const response = await axios.get(
                `${serverBaseUrl}/api/forum/${id}/${activeModule}?limit=3&sortBy=latest`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            console.log("Recent discussions fetched successfully:", response.data);
            setRecentDiscussions(response.data.slice(0, 3)); // Just take the 3 most recent
            setHasDiscussions(response.data.length > 0);
        } catch (error) {
            console.error("Error fetching discussions:", error);
            setRecentDiscussions([]);
            setHasDiscussions(false);
        } finally {
            setLoadingDiscussions(false);
        }
    }, [id, activeModule, token, serverBaseUrl]);

    useEffect(() => {
        if (!token || !userId) {
            navigate("/login", { state: { from: `/course/${id}/learn` } });
            return;
        }

        if (!id || id === "undefined") {
            setError("Invalid course ID");
            setLoading(false);
            return;
        }

        const loadCourseData = async () => {
            try {
                await fetchCourseDetails();
                await fetchUserProgress();
                await checkStudyMaterials();
                await checkAITutorAvailability();
                await checkCertificateEligibility(); // Check if eligible for certificate
            } catch (error) {
                console.error("Error loading course data:", error);
            }
        };

        loadCourseData();
    }, [id, userId, token, navigate]);

    // Separate useEffect for podcast loading to ensure it runs when activeModule changes
    useEffect(() => {
        if (course) {
            fetchPodcasts();
            fetchRecentDiscussions(); // Fetch forum discussions when module changes
        }
    }, [course, activeModule, fetchPodcasts, fetchRecentDiscussions]);

    const fetchCourseDetails = async () => {
        try {
            console.log("Fetching course details for ID:", id);
            const response = await axios.get(`${serverBaseUrl}/course/${id}`);
            setCourse(response.data);
        } catch (error) {
            console.error("Error fetching course:", error);
            setError("Failed to load course. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProgress = async () => {
        try {
            console.log(`Fetching progress for user ${userId} and course ${id}`);

            const response = await axios.get(`${serverBaseUrl}/user/${userId}/progress/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log("Progress data received:", response.data);

            if (response.data && response.data.courseProgress) {
                const progress = response.data.courseProgress;

                // Log the retrieved completed modules
                console.log("Completed modules from server:", progress.completedModules);

                // Make sure we're setting the state with valid data
                const validCompletedModules = Array.isArray(progress.completedModules)
                    ? progress.completedModules
                    : [];

                setCompletedModules(validCompletedModules);
            } else {
                console.warn("No progress data received from server");
                setCompletedModules([]);
            }
        } catch (error) {
            console.error("Error fetching progress:", error);
            setCompletedModules([]);
        }
    };

    const checkStudyMaterials = async () => {
        try {
            console.log("Checking study materials for course ID:", id);
            const response = await axios.get(`${serverBaseUrl}/study-materials/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setHasStudyMaterials(response.data && response.data.length > 0);
        } catch (error) {
            console.error("Error checking study materials:", error);
            setHasStudyMaterials(false);
        }
    };

    // Check if AI Tutor feature is available
    const checkAITutorAvailability = async () => {
        try {
            // You can replace this with actual API call if your server has an endpoint
            // to check AI Tutor availability per course

            // For now, we'll just set it to true to enable the feature
            setShowAITutorButton(true);

            // If you need to make an actual API call, use something like:
            /*
            const response = await axios.get(`${serverBaseUrl}/check-ai-tutor/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setShowAITutorButton(response.data && response.data.available);
            */
        } catch (error) {
            console.error("Error checking AI Tutor availability:", error);
            setShowAITutorButton(false);
        }
    };

    // Check if eligible for certificate
    const checkCertificateEligibility = async () => {
        try {
            const response = await axios.get(
                `${serverBaseUrl}/course/${id}/certificate/check?userId=${userId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            setCertificateEligibility(response.data);
            console.log("Certificate eligibility:", response.data);
        } catch (error) {
            console.error("Error checking certificate eligibility:", error);
        }
    };

    const handleModuleCompletion = async (moduleId) => {
        const isCompleted = completedModules.includes(moduleId);

        // Log debugging information
        console.log("Marking module with ID:", moduleId);
        console.log("Current completedModules:", completedModules);
        console.log("isCompleted status:", isCompleted);

        try {
            // Ensure we're sending both moduleId and moduleIndex for better identification
            const response = await axios.post(`${serverBaseUrl}/user/progress`, {
                userId,
                courseId: id,
                moduleId: moduleId,
                moduleIndex: activeModule,
                completed: !isCompleted
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log("Server response:", response.data);

            // Verify that server response contains updated progress data
            if (response.data && response.data.courseProgress) {
                // Update local state with the server's response data
                // This ensures our local state exactly matches what's in the database
                setCompletedModules(response.data.courseProgress.completedModules || []);

                // Log updated state
                console.log("Updated completedModules from server:",
                    response.data.courseProgress.completedModules);

                // Check certificate eligibility after updating progress
                await checkCertificateEligibility();
            } else {
                // Fallback to manual state update if server doesn't return updated data
                if (isCompleted) {
                    setCompletedModules(completedModules.filter(id => id !== moduleId));
                } else {
                    setCompletedModules([...completedModules, moduleId]);
                }
            }
        } catch (error) {
            console.error("Error updating progress:", error);
            alert("Failed to update progress. Please try again.");
        }
    };

    const calculateProgress = () => {
        if (!course || !course.modules || course.modules.length === 0) {
            return 0;
        }

        return Math.round((completedModules.length / course.modules.length) * 100);
    };

    const handleNext = () => {
        if (course && activeModule < course.modules.length - 1) {
            setActiveModule(activeModule + 1);
            // Scroll to top when changing modules
            const contentElement = document.querySelector('.cl__content');
            if (contentElement) contentElement.scrollTop = 0;
        }
    };

    const handlePrevious = () => {
        if (activeModule > 0) {
            setActiveModule(activeModule - 1);
            // Scroll to top when changing modules
            const contentElement = document.querySelector('.cl__content');
            if (contentElement) contentElement.scrollTop = 0;
        }
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Navigate to progress dashboard
    const navigateToProgressDashboard = () => {
        navigate(`/course/${id}/progress`);
    };

    // Navigate to AI Tutor chat with context
    const navigateToAITutor = () => {
        // Here we can pass context from the current course and module
        // to pre-populate the AI Tutor with relevant information

        // Store current module in localStorage for context
        if (course && currentModule) {
            localStorage.setItem("aiTutorContext", JSON.stringify({
                courseId: id,
                courseName: course.title,
                moduleId: currentModule._id || `module-${activeModule}`,
                moduleName: currentModule.title,
                moduleContent: currentModule.description
            }));
        }

        // Navigate to AI Tutor chat
        navigate("/ai-chat");
    };

    // Navigate to forum discussions for the current module
    const navigateToForum = () => {
        navigate(`/course/${id}/forum/${activeModule}`);
    };

    // Create a new discussion directly from the course learning page
    const navigateToNewDiscussion = () => {
        navigate(`/course/${id}/forum/${activeModule}/new`);
    };

    // Function to render certificate notification
    const renderCertificateNotification = () => {
        if (!certificateEligibility.eligible) return null;

        return (
            <div className="cl__certificate-notification">
                <div className="cl__certificate-icon">
                    <FaCertificate />
                </div>
                <div className="cl__certificate-content">
                    <h3>Congratulations! You've Completed the Course!</h3>
                    <p>
                        You have successfully completed all modules and passed all assessments.
                        {certificateEligibility.certificateIssued
                            ? ' Your certificate has been issued.'
                            : ' You are eligible to receive a course completion certificate.'}
                    </p>
                    {certificateEligibility.certificateIssued ? (
                        <Link to={`/course/${id}/certificate`} className="cl__certificate-button">
                            <FaCertificate /> View Your Certificate
                        </Link>
                    ) : (
                        <Link to={`/course/${id}/progress`} className="cl__certificate-button">
                            <FaCertificate /> Get Your Certificate
                        </Link>
                    )}
                </div>
            </div>
        );
    };

    // Function to render recent forum discussions section
    const renderForumDiscussions = () => {
        if (loadingDiscussions) {
            return (
                <div className="cl__forum-loading">
                    <FaSpinner className="cl__spinner" />
                    <p>Loading discussions...</p>
                </div>
            );
        }

        return (
            <div className="cl__forum-section">
                <div className="cl__forum-header">
                    <div className="cl__forum-icon"><FaComments /></div>
                    <h3>Module Discussions</h3>
                </div>

                <div className="cl__forum-body">
                    {recentDiscussions.length > 0 ? (
                        <>
                            <div className="cl__forum-discussions">
                                {recentDiscussions.map(discussion => (
                                    <div
                                        key={discussion._id}
                                        className="cl__forum-discussion-item"
                                        onClick={() => navigate(`/course/${id}/forum/${activeModule}/discussion/${discussion._id}`)}
                                    >
                                        <div className="cl__forum-discussion-header">
                                            <h4 className="cl__forum-discussion-title">
                                                {discussion.title}
                                                {discussion.aiAssisted && (
                                                    <span className="cl__forum-ai-badge">
                                                        <FaRobot /> AI Assisted
                                                    </span>
                                                )}
                                            </h4>
                                            <div className="cl__forum-discussion-meta">
                                                By {discussion.createdBy?.name || "Unknown"} •
                                                {new Date(discussion.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="cl__forum-discussion-preview">
                                            {discussion.content.substring(0, 120)}...
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="cl__forum-actions">
                                <button
                                    className="cl__forum-view-all"
                                    onClick={navigateToForum}
                                >
                                    View All Discussions
                                </button>
                                <button
                                    className="cl__forum-new-discussion"
                                    onClick={navigateToNewDiscussion}
                                >
                                    <FaComments /> Start New Discussion
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="cl__forum-empty">
                            <p>No discussions yet for this module. Be the first to start a conversation!</p>
                            <div className="cl__forum-actions">
                                <button
                                    className="cl__forum-new-discussion"
                                    onClick={navigateToNewDiscussion}
                                >
                                    <FaComments /> Start New Discussion
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Function to log audio element events for debugging
    const handleAudioEvent = (event, podcastIndex) => {
        console.log(`Audio event ${event.type} for podcast ${podcastIndex}:`, event);
    };

    if (loading) {
        return (
            <div className="cl__loading">
                <div className="cl__loading-spinner"></div>
                <p>Loading course content...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cl__error">
                <div className="cl__error-icon">!</div>
                <h2>Error</h2>
                <p>{error}</p>
                <button
                    onClick={() => navigate("/courses")}
                    className="cl__btn cl__btn-primary"
                >
                    Browse Courses
                </button>
            </div>
        );
    }

    if (!course) {
        return <div className="cl__error">Course not found</div>;
    }

    if (!course.modules || course.modules.length === 0) {
        return (
            <div className="cl__error">
                <h2>No content available</h2>
                <p>This course doesn't have any modules yet. Please check back later.</p>
                <button
                    onClick={() => navigate(`/course/${id}`)}
                    className="cl__btn cl__btn-primary"
                >
                    Return to Course Details
                </button>
            </div>
        );
    }

    const currentModule = course.modules[activeModule];
    const canTakeAssessment = completedModules.includes(currentModule._id || `module-${activeModule}`);

    return (
        <div className="cl__container">
            <header className="cl__header">
                <div className="cl__header-left">
                    <button className="cl__sidebar-toggle" onClick={toggleSidebar}>
                        <FaBars />
                    </button>
                    <h2 className="cl__course-title">{course.title}</h2>
                </div>
                <div className="cl__header-right">
                    {showAITutorButton && (
                        <button
                            className="cl__ai-tutor-button"
                            onClick={navigateToAITutor}
                            title="Get help from AI Tutor"
                        >
                            <FaBrain /> AI Tutor
                        </button>
                    )}
                    <Link to={`/course/${id}/forum/${activeModule}`} className="cl__forum-button">
                        <FaComments /> Module Discussions
                    </Link>
                    <button
                        className="cl__progress-button"
                        onClick={navigateToProgressDashboard}
                    >
                        <FaChartLine /> View Progress
                    </button>
                    <button
                        className="cl__back-button"
                        onClick={() => navigate(`/course/${id}`)}
                    >
                        Back to Course Details
                    </button>
                </div>
            </header>

            <div className="cl__main">
                <aside className={`cl__sidebar ${sidebarOpen ? 'cl__sidebar-open' : 'cl__sidebar-closed'}`}>
                    <div className="cl__progress-section">
                        <h3 className="cl__section-title">Your Progress</h3>
                        <div className="cl__progress-bar-container">
                            <div
                                className="cl__progress-bar"
                                style={{ width: `${calculateProgress()}%` }}
                            ></div>
                        </div>
                        <span className="cl__progress-percentage">{calculateProgress()}% Complete</span>
                    </div>

                    <div className="cl__modules-section">
                        <h3 className="cl__section-title">Course Modules</h3>
                        <div className="cl__module-list">
                            {course.modules.map((module, index) => (
                                <div
                                    key={index}
                                    className={`cl__module-item ${index === activeModule ? 'cl__module-active' : ''}`}
                                    onClick={() => setActiveModule(index)}
                                >
                                    <div className="cl__module-header">
                                        <div className="cl__module-number">{index + 1}</div>
                                        <div className="cl__module-title">{module.title}</div>
                                        <div className="cl__module-status">
                                            {completedModules.includes(module._id || `module-${index}`) && (
                                                <div className="cl__status-icon cl__status-complete">✓</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {hasStudyMaterials && (
                        <div className="cl__resources-section">
                            <Link
                                to={`/course/${id}/study-materials`}
                                className="cl__resources-link"
                            >
                                <FaBook /> View All Study Materials
                            </Link>
                        </div>
                    )}

                    {/* Forum link in sidebar */}
                    <div className="cl__resources-section">
                        <Link
                            to={`/course/${id}/forum/${activeModule}`}
                            className="cl__resources-link cl__forum-link"
                        >
                            <FaComments /> Module Discussions
                        </Link>
                    </div>

                    {/* AI Tutor in Sidebar */}
                    {showAITutorButton && (
                        <div className="cl__ai-tutor-section">
                            <div className="cl__ai-tutor-card" onClick={navigateToAITutor}>
                                <div className="cl__ai-tutor-icon">
                                    <FaBrain />
                                </div>
                                <div className="cl__ai-tutor-content">
                                    <h3>Need Help?</h3>
                                    <p>Ask our AI Tutor about this course content</p>
                                    <div className="cl__ai-tutor-cta">Chat Now</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="cl__dashboard-link">
                        <button onClick={navigateToProgressDashboard} className="cl__dashboard-button">
                            <FaChartLine /> Progress Dashboard
                        </button>
                    </div>
                </aside>

                <main className="cl__content">
                    <div className="cl__module-header">
                        <div className="cl__breadcrumbs">
                            Module {activeModule + 1} of {course.modules.length}
                        </div>
                        <h1 className="cl__module-heading">{currentModule.title}</h1>
                        <div className="cl__module-nav">
                            <button
                                className="cl__nav-btn"
                                onClick={handlePrevious}
                                disabled={activeModule === 0}
                            >
                                <FaArrowLeft /> Previous Module
                            </button>
                            <button
                                className="cl__nav-btn"
                                onClick={handleNext}
                                disabled={activeModule === course.modules.length - 1}
                            >
                                Next Module <FaArrowRight />
                            </button>
                        </div>
                    </div>

                    {/* Certificate notification */}
                    {renderCertificateNotification()}

                    <div className="cl__module-content">
                        <div className="cl__module-description">
                            {currentModule.description}
                        </div>

                        <div className="cl__course-material">
                            {/* Course content goes here */}

                            {hasStudyMaterials && (
                                <div className="cl__resources-card">
                                    <div className="cl__resources-header">
                                        <div className="cl__resources-icon"><FaBook /></div>
                                        <h3>Additional Resources</h3>
                                    </div>
                                    <div className="cl__resources-body">
                                        <p>
                                            Access comprehensive study materials, examples, and resources
                                            to deepen your understanding of this topic.
                                        </p>
                                        <Link
                                            to={`/course/${id}/study-materials`}
                                            state={{ selectedModule: activeModule }}
                                            className="cl__resources-button"
                                        >
                                            <FaBook /> View Study Materials for this Module
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Forum discussions section */}
                            {renderForumDiscussions()}

                            {/* AI Tutor Card in Content Area */}
                            {showAITutorButton && (
                                <div className="cl__ai-tutor-content-card">
                                    <div className="cl__ai-tutor-content-header">
                                        <FaBrain className="cl__ai-tutor-content-icon" />
                                        <h3>Stuck on something?</h3>
                                    </div>
                                    <div className="cl__ai-tutor-content-body">
                                        <p>
                                            Our AI Tutor can help you understand difficult concepts,
                                            answer your questions, or provide additional explanations
                                            for the material in this module.
                                        </p>
                                        <button
                                            className="cl__ai-tutor-content-button"
                                            onClick={navigateToAITutor}
                                        >
                                            <FaComments /> Open AI Tutor Chat
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Podcasts section with improved loading state and debugging */}
                        <div className="cl__podcasts-section">
                            <div className="cl__podcasts-header">
                                <div className="cl__podcasts-icon"><FaHeadphones /></div>
                                <h3>Audio Learning Resources</h3>
                            </div>

                            <div className="cl__podcasts-body">
                                {loadingPodcasts ? (
                                    <div className="cl__podcasts-loading">
                                        <FaSpinner className="cl__podcasts-spinner" />
                                        <p>Loading audio resources...</p>
                                    </div>
                                ) : podcasts && podcasts.length > 0 ? (
                                    <div className="cl__podcasts-list">
                                        {podcasts.map((podcast, index) => (
                                            <div key={index} className="cl__podcast-item">
                                                <div className="cl__podcast-info">
                                                    <h4>{podcast.title}</h4>
                                                    <p>{podcast.description}</p>
                                                </div>
                                                <div className="cl__podcast-player">
                                                    <audio
                                                        controls
                                                        preload="metadata"
                                                        src={podcast.fileUrl}
                                                        onError={(e) => handleAudioEvent(e, index)}
                                                        onLoadStart={(e) => handleAudioEvent(e, index)}
                                                        className="cl__audio-player"
                                                    >
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                    {/* Fallback player using HTML5 audio */}
                                                    <div className="cl__podcast-fallback">
                                                        <a
                                                            href={podcast.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="cl__podcast-download"
                                                        >
                                                            Download Audio
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="cl__podcasts-empty">
                                        <p>No audio resources available for this module.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="cl__module-actions">
                            <button
                                className={`cl__completion-btn ${completedModules.includes(currentModule._id || `module-${activeModule}`) ? 'cl__completed' : ''}`}
                                onClick={() => handleModuleCompletion(currentModule._id || `module-${activeModule}`)}
                            >
                                {completedModules.includes(currentModule._id || `module-${activeModule}`)
                                    ? 'Mark as Incomplete'
                                    : 'Mark as Complete'}
                            </button>
                            {canTakeAssessment && (
                                <Link
                                    to={`/course/${id}/assessment/${activeModule}`}
                                    className="cl__assessment-btn"
                                >
                                    <FaPencilAlt /> Take Module Assessment
                                </Link>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Floating Discussion Button */}
            <button
                className="cl__forum-floating-btn"
                onClick={() => navigate(`/course/${id}/forum/${activeModule}`)}
                aria-label="View Module Discussions"
                title="View Module Discussions"
            >
                <FaComments />
            </button>

            {/* Floating AI Tutor Chat Button */}
            {showAITutorButton && (
                <button
                    className="cl__ai-tutor-floating-btn"
                    onClick={navigateToAITutor}
                    aria-label="Open AI Tutor Chat"
                    title="Chat with AI Tutor"
                >
                    <FaBrain />
                </button>
            )}
        </div>
    );
};

export default CourseLearning;