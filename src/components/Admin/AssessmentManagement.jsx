import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AssessmentManagement.css";
import { 
  FaPlus, FaSpinner, FaTrash, FaEdit, 
  FaSave, FaTimes, FaRobot, FaExclamationTriangle ,FaChartLine
} from "react-icons/fa";

const AssessmentManagement = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // States
  const [course, setCourse] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingModuleIndex, setGeneratingModuleIndex] = useState(null);
  const [error, setError] = useState(null);
  
  // Get admin token from localStorage
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const serverBaseUrl = "http://localhost:8080";
  
  useEffect(() => {
    // Check if user is admin
    const checkAdminAccess = async () => {
      try {
        const userResponse = await axios.get(`${serverBaseUrl}/user/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userResponse.data.role !== "admin") {
          setError("You do not have permission to access this page");
          return false;
        }
        
        return true;
      } catch (error) {
        console.error("Error checking admin access:", error);
        setError("Failed to verify permissions");
        return false;
      }
    };
    
    const fetchData = async () => {
      setLoading(true);
      
      const hasAccess = await checkAdminAccess();
      if (!hasAccess) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch course details
        const courseResponse = await axios.get(`${serverBaseUrl}/course/${courseId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setCourse(courseResponse.data);
        
        // Fetch existing assessments
        const assessmentsResponse = await axios.get(
          `${serverBaseUrl}/assessments/${courseId}`, 
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        setAssessments(assessmentsResponse.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load course data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [courseId, token, userId, serverBaseUrl]);
  
  // Generate assessment for a module
  const generateAssessment = async (moduleIndex) => {
    setGeneratingModuleIndex(moduleIndex);
    
    try {
      const response = await axios.post(
        `${serverBaseUrl}/assessment/generate`,
        { courseId, moduleIndex },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Add new assessment to the list
      setAssessments([...assessments, response.data.assessment]);
      
      // Show success message
      alert("Assessment generated successfully");
    } catch (error) {
      console.error("Error generating assessment:", error);
      
      // Show different messages based on error
      if (error.response?.status === 400 && 
          error.response?.data?.error?.includes("already exists")) {
        alert("Assessment already exists for this module");
      } else if (error.response?.status === 404 && 
                error.response?.data?.error?.includes("Study material not found")) {
        alert("Cannot generate assessment: No study material found for this module");
      } else {
        alert("Failed to generate assessment. Please try again.");
      }
    } finally {
      setGeneratingModuleIndex(null);
    }
  };
  
  // Delete assessment
  const deleteAssessment = async (assessmentId) => {
    if (!window.confirm("Are you sure you want to delete this assessment?")) {
      return;
    }
    
    try {
      await axios.delete(
        `${serverBaseUrl}/assessment/${assessmentId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Remove from list
      setAssessments(assessments.filter(a => a._id !== assessmentId));
      
      alert("Assessment deleted successfully");
    } catch (error) {
      console.error("Error deleting assessment:", error);
      alert("Failed to delete assessment");
    }
  };
  
  // Return to course management
  const returnToCourseManagement = () => {
    navigate(`/admin/courses`);
  };
  
  // View assessment details
  const viewAssessmentDetails = (assessmentId) => {
    navigate(`/admin/assessment/${assessmentId}`);
  };
  
  if (loading) {
    return (
      <div className="am__loading">
        <FaSpinner className="am__spinner" />
        <p>Loading assessment management...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="am__error">
        <div className="am__error-content">
          <div className="am__error-icon"><FaExclamationTriangle /></div>
          <h2>Access Error</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate("/admin/courses")}
            className="am__btn am__btn-primary"
          >
            Go to Courses
          </button>
        </div>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="am__error">
        <div className="am__error-content">
          <h2>Course Not Found</h2>
          <button
            onClick={() => navigate("/admin/courses")}
            className="am__btn am__btn-primary"
          >
            Go to Course Management
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="am__container">
      <header className="am__header">
        <h1>Assessment Management</h1>
        <div className="am__course-info">
          <span>{course.title}</span>
        </div>
        <button
          onClick={returnToCourseManagement}
          className="am__btn am__btn-secondary"
        >
          Back to Course Management
        </button>
      </header>
      
      <div className="am__content">
        <div className="am__modules-list">
          <h2>Course Modules</h2>
          
          {course.modules.map((module, index) => {
            // Find existing assessment for this module
            const moduleAssessment = assessments.find(a => a.moduleIndex === index);
            
            return (
              <div key={index} className="am__module-item">
                <div className="am__module-content">
                  <div className="am__module-header">
                    <div className="am__module-number">{index + 1}</div>
                    <div className="am__module-title">{module.title}</div>
                  </div>
                  
                  <div className="am__module-description">
                    {module.description}
                  </div>
                  
                  <div className="am__module-assessment">
                    {moduleAssessment ? (
                      <div className="am__assessment-info">
                        <div className="am__assessment-status am__assessment-exists">
                          Assessment Available
                        </div>
                        <div className="am__assessment-meta">
                          <div>Questions: {moduleAssessment.questionCount || 'Unknown'}</div>
                          <div>Time Limit: {moduleAssessment.timeLimit || 15} min</div>
                        </div>
                        <div className="am__assessment-actions">
                          <button
                            onClick={() => viewAssessmentDetails(moduleAssessment._id)}
                            className="am__btn am__btn-outline am__btn-sm"
                          >
                            <FaEdit /> View/Edit
                          </button>
                          <button
                            onClick={() => deleteAssessment(moduleAssessment._id)}
                            className="am__btn am__btn-danger am__btn-sm"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="am__assessment-info">
                        <div className="am__assessment-status am__assessment-missing">
                          No Assessment
                        </div>
                        <div className="am__assessment-actions">
                          <button
                            onClick={() => generateAssessment(index)}
                            disabled={generatingModuleIndex === index}
                            className="am__btn am__btn-primary am__btn-sm"
                          >
                            {generatingModuleIndex === index ? (
                              <>
                                <FaSpinner className="am__spinner" /> Generating...
                              </>
                            ) : (
                              <>
                                <FaRobot /> Generate with AI
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="am__stats-section">
          <h2>Assessment Statistics</h2>
          <div className="am__stats-card">
            <div className="am__stats-row">
              <div className="am__stats-label">Total Modules:</div>
              <div className="am__stats-value">{course.modules.length}</div>
            </div>
            <div className="am__stats-row">
              <div className="am__stats-label">Modules with Assessments:</div>
              <div className="am__stats-value">{assessments.length}</div>
            </div>
            <div className="am__stats-row">
              <div className="am__stats-label">Modules Needing Assessments:</div>
              <div className="am__stats-value">{course.modules.length - assessments.length}</div>
            </div>
            
            {assessments.length < course.modules.length && (
              <button
                onClick={() => {
                  if (window.confirm("Generate assessments for all remaining modules?")) {
                    course.modules.forEach((module, index) => {
                      // Check if assessment already exists
                      const exists = assessments.some(a => a.moduleIndex === index);
                      
                      if (!exists) {
                        setTimeout(() => {
                          generateAssessment(index);
                        }, index * 2000); // Stagger API calls to avoid rate limiting
                      }
                    });
                  }
                }}
                className="am__btn am__btn-primary am__btn-block"
              >
                <FaRobot /> Generate All Missing Assessments
              </button>
            )}
          </div>
          
          <div className="am__user-stats">
            <h3>Student Progress</h3>
            {assessments.length > 0 ? (
              <button
                onClick={() => navigate(`/admin/courses/${courseId}/student-progress`)}
                className="am__btn am__btn-outline am__btn-block"
              >
                <FaChartLine /> View Student Assessment Results
              </button>
            ) : (
              <p className="am__empty-message">
                No assessment data available yet. Generate assessments to track student progress.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentManagement;