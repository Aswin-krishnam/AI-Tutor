import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./ProgressDashboard.css";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaCircle,
  FaSpinner,
  FaBars,
  FaChartLine,
  FaPencilAlt,
  FaTrophy,
  FaBook,
  FaCertificate,
  FaExclamationTriangle
} from "react-icons/fa";

const ProgressDashboard = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // States
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessmentStatus, setAssessmentStatus] = useState({});
  const [certificateEligibility, setCertificateEligibility] = useState({
    eligible: false,
    certificateIssued: false,
    message: "",
    completedModules: 0,
    totalModules: 0,
    completedAssessments: 0
  });
  const [issuingCertificate, setIssuingCertificate] = useState(false);

  // Get user info from localStorage
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const serverBaseUrl = "http://localhost:8080"; // Update with your actual server URL

  useEffect(() => {
    if (!token || !userId) {
      navigate("/login", { state: { from: `/course/${courseId}/progress` } });
      return;
    }

    if (!courseId) {
      setError("Invalid course ID");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch course details
        const courseResponse = await axios.get(`${serverBaseUrl}/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourse(courseResponse.data);

        // Fetch user progress for this course
        const progressResponse = await axios.get(
          `${serverBaseUrl}/user/${userId}/progress/${courseId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (progressResponse.data && progressResponse.data.courseProgress) {
          setProgress(progressResponse.data.courseProgress);
        }

        // Check certificate eligibility
        const certificateResponse = await axios.get(
          `${serverBaseUrl}/course/${courseId}/certificate/check?userId=${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setCertificateEligibility(certificateResponse.data);

        // Fetch assessment status for each module
        const moduleIndexes = courseResponse.data.modules.map((_, index) => index);
        
        const assessmentPromises = moduleIndexes.map(async (moduleIndex) => {
          try {
            // Check if assessment exists for this module
            const response = await axios.get(
              `${serverBaseUrl}/assessment/${courseId}/${moduleIndex}?userId=${userId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // If we get here, assessment exists
            // Now find the highest score in progress data
            let highestScore = 0;
            let passed = false;
            
            if (progressResponse.data && 
                progressResponse.data.courseProgress && 
                progressResponse.data.courseProgress.moduleData) {
              
              const moduleData = progressResponse.data.courseProgress.moduleData.find(
                m => m.moduleIndex === moduleIndex
              );
              
              if (moduleData && moduleData.quizScores && moduleData.quizScores.length > 0) {
                highestScore = Math.max(...moduleData.quizScores.map(q => q.score));
                passed = highestScore >= 70;
              }
            }
            
            return {
              moduleIndex,
              exists: true,
              passed,
              highestScore,
              assessmentId: response.data._id
            };
          } catch (error) {
            // Assessment doesn't exist or not accessible
            return {
              moduleIndex,
              exists: false,
              passed: false,
              highestScore: 0,
              assessmentId: null
            };
          }
        });
        
        const assessmentResults = await Promise.all(assessmentPromises);
        
        // Convert array to object keyed by moduleIndex
        const statusObject = {};
        assessmentResults.forEach(result => {
          statusObject[result.moduleIndex] = result;
        });
        
        setAssessmentStatus(statusObject);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load progress data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, userId, token, navigate, serverBaseUrl]);

  const calculateOverallProgress = () => {
    if (!course || !progress) return 0;

    const totalModules = course.modules.length;
    const completedModules = progress.completedModules ? progress.completedModules.length : 0;

    return Math.round((completedModules / totalModules) * 100);
  };

  const isModuleCompleted = (moduleIndex) => {
    if (!progress || !progress.completedModules) return false;

    // Different ways the module ID might be stored
    const possibleIds = [
      `module-${moduleIndex}`,
      `${moduleIndex}`,
      moduleIndex.toString()
    ];

    return possibleIds.some(id => progress.completedModules.includes(id));
  };

  const getModuleStatus = (moduleIndex) => {
    const completed = isModuleCompleted(moduleIndex);
    const assessmentForModule = assessmentStatus[moduleIndex];
    
    if (!completed) {
      return { status: "not-started", label: "Completed" };
    }
    
    if (!assessmentForModule || !assessmentForModule.exists) {
      return { status: "completed", label: "Completed" };
    }
    
    if (assessmentForModule.passed) {
      return { status: "passed", label: "Passed", score: assessmentForModule.highestScore };
    }
    
    return { status: "assessment-pending", label: "Assessment Pending" };
  };

  const handleIssueCertificate = async () => {
    if (!certificateEligibility.eligible || issuingCertificate) return;
    
    setIssuingCertificate(true);
    
    try {
      const response = await axios.post(
        `${serverBaseUrl}/course/${courseId}/certificate/issue`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Navigate to certificate page
      navigate(`/course/${courseId}/certificate`, { 
        state: { certificateDetails: response.data.certificateDetails } 
      });
      
    } catch (error) {
      console.error("Error issuing certificate:", error);
      alert("Failed to issue certificate. Please try again.");
      setIssuingCertificate(false);
    }
  };

  if (loading) {
    return (
      <div className="progress__loading">
        <FaSpinner className="progress__spinner" />
        <p>Loading progress data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="progress__error">
        <div className="progress__error-icon">
          <FaExclamationTriangle />
        </div>
        <h2>Error</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          className="progress__btn progress__btn-primary"
        >
          Return to Course
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="progress__error">
        <p>Course not found</p>
        <button
          onClick={() => navigate("/courses")}
          className="progress__btn progress__btn-primary"
        >
          Browse Courses
        </button>
      </div>
    );
  }

  return (
    <div className="progress__container">
      <header className="progress__header">
        <div className="progress__header-left">
          <button
            className="progress__back-btn"
            onClick={() => navigate(`/course/${courseId}/learn`)}
          >
            <FaArrowLeft /> Back to Course
          </button>
          <h1>{course.title} - Progress</h1>
        </div>
        <div className="progress__header-right">
          <div className="progress__overall">
            <div className="progress__overall-label">Overall Progress:</div>
            <div className="progress__overall-bar-container">
              <div
                className="progress__overall-bar"
                style={{ width: `${calculateOverallProgress()}%` }}
              ></div>
            </div>
            <div className="progress__overall-percentage">
              {calculateOverallProgress()}%
            </div>
          </div>
        </div>
      </header>

      {/* Certificate Eligibility Banner */}
      {certificateEligibility.eligible && (
        <div className="progress__certificate-banner">
          <div className="progress__certificate-icon">
            <FaCertificate />
          </div>
          <div className="progress__certificate-content">
            <h2>Congratulations! You've completed this course!</h2>
            <p>
              You have successfully completed all modules and passed all assessments.
              {certificateEligibility.certificateIssued 
                ? ' Your certificate has been issued.' 
                : ' You are eligible to receive a course completion certificate.'}
            </p>
            {!certificateEligibility.certificateIssued && (
              <button 
                className="progress__certificate-btn"
                onClick={handleIssueCertificate}
                disabled={issuingCertificate}
              >
                {issuingCertificate ? (
                  <>
                    <FaSpinner className="progress__spinner-inline" /> Generating Certificate...
                  </>
                ) : (
                  <>
                    <FaCertificate /> Get Your Certificate
                  </>
                )}
              </button>
            )}
            {certificateEligibility.certificateIssued && (
              <Link 
                to={`/course/${courseId}/certificate`}
                className="progress__view-certificate-btn"
              >
                <FaCertificate /> View Certificate
              </Link>
            )}
          </div>
        </div>
      )}

      <main className="progress__content">
        <div className="progress__modules-list">
          <h2>
            <FaBook /> Course Modules
          </h2>
          
          <div className="progress__module-cards">
            {course.modules.map((module, index) => {
              const moduleStatus = getModuleStatus(index);
              const statusClass = `progress__status-${moduleStatus.status}`;
              
              return (
                <div key={index} className="progress__module-card">
                  <div className="progress__module-header">
                    <div className="progress__module-number">{index + 1}</div>
                    <div className="progress__module-title">{module.title}</div>
                  </div>
                  
                  <div className="progress__module-content">
                    <div className="progress__module-description">
                      {module.description.substring(0, 120)}
                      {module.description.length > 120 ? '...' : ''}
                    </div>
                    
                    {/* <div className={`progress__module-status ${statusClass}`}>
                      <div className="progress__status-icon">
                        {moduleStatus.status === 'passed' ? (
                          <FaCheckCircle />
                        ) : moduleStatus.status === 'completed' ? (
                          <FaCheckCircle />
                        ) : (
                          <FaCircle />
                        )}
                      </div>
                      <div className="progress__status-label">
                        {moduleStatus.label}
                        {moduleStatus.score && ` (${Math.round(moduleStatus.score)}%)`}
                      </div>
                    </div> */}
                    
                    <div className="progress__module-actions">
                      <button
                        className="progress__action-btn progress__action-view"
                        onClick={() => navigate(`/course/${courseId}/learn`)}
                      >
                        <FaBook /> View Module
                      </button>
                      
                      {moduleStatus.status === 'completed' && assessmentStatus[index]?.exists && !assessmentStatus[index]?.passed && (
                        <Link
                          to={`/course/${courseId}/assessment/${index}`}
                          className="progress__action-btn progress__action-assessment"
                        >
                          <FaPencilAlt /> Take Assessment
                        </Link>
                      )}
                      
                      {assessmentStatus[index]?.passed && (
                        <div className="progress__score-badge">
                          <FaTrophy /> {Math.round(assessmentStatus[index].highestScore)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Assessment Summary */}
          <div className="progress__assessment-summary">
            <h2>
              <FaPencilAlt /> Assessment Progress
            </h2>
            <div className="progress__assessment-stats">
              <div className="progress__stat-item">
                <div className="progress__stat-value">
                  {certificateEligibility.completedAssessments}
                </div>
                <div className="progress__stat-label">
                  Assessments Passed
                </div>
              </div>
              <div className="progress__stat-item">
                <div className="progress__stat-value">
                  {certificateEligibility.totalModules}
                </div>
                <div className="progress__stat-label">
                  Total Assessments
                </div>
              </div>
              <div className="progress__stat-item">
                <div className="progress__stat-value">
                  {certificateEligibility.completedModules}
                </div>
                <div className="progress__stat-label">
                  Modules Completed
                </div>
              </div>
            </div>
          </div>
          
          {/* Certificate Status */}
          <div className="progress__certificate-status">
            <h2>
              <FaCertificate /> Certificate Status
            </h2>
            <div className={`progress__certificate-card ${certificateEligibility.eligible ? 'progress__eligible' : 'progress__not-eligible'}`}>
              <div className="progress__certificate-status-icon">
                {certificateEligibility.eligible ? <FaCheckCircle /> : <FaExclamationTriangle />}
              </div>
              <div className="progress__certificate-status-content">
                <h3>
                  {certificateEligibility.eligible 
                    ? 'You are eligible for a certificate!' 
                    : 'Complete all modules and assessments for a certificate'}
                </h3>
                <p>{certificateEligibility.message}</p>
                
                {certificateEligibility.eligible && !certificateEligibility.certificateIssued && (
                  <button 
                    className="progress__get-certificate-btn"
                    onClick={handleIssueCertificate}
                    disabled={issuingCertificate}
                  >
                    {issuingCertificate ? (
                      <>
                        <FaSpinner className="progress__spinner-inline" /> Generating...
                      </>
                    ) : (
                      <>
                        <FaCertificate /> Get Certificate
                      </>
                    )}
                  </button>
                )}
                
                {certificateEligibility.certificateIssued && (
                  <Link 
                    to={`/course/${courseId}/certificate`}
                    className="progress__view-certificate-btn"
                  >
                    <FaCertificate /> View Your Certificate
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProgressDashboard;