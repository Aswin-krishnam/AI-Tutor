import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Assessment.css";
import { 
  FaClock, FaCheckCircle, FaTimesCircle, 
  FaArrowLeft, FaArrowRight, FaSpinner, FaChartLine,
  FaTrophy, FaMedal
} from "react-icons/fa";

const Assessment = () => {
  const { courseId, moduleIndex } = useParams();
  const navigate = useNavigate();
  
  // States
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [courseName, setCourseName] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [alreadyPassed, setAlreadyPassed] = useState(false);
  const [previousScore, setPreviousScore] = useState(null);
  
  // Refs
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  
  // Get user info from localStorage
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const serverBaseUrl = "http://localhost:8080"; // Update with your actual server URL
  
  // Format time display (seconds -> MM:SS)
  const formatTimeDisplay = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Load assessment data
  useEffect(() => {
    if (!token || !userId) {
      navigate("/login", { state: { from: `/course/${courseId}/assessment/${moduleIndex}` } });
      return;
    }
    
    const fetchAssessment = async () => {
        try {
          setLoading(true);
          
          // First fetch course details to get module name
          const courseResponse = await axios.get(`${serverBaseUrl}/course/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (courseResponse.data) {
            setCourseName(courseResponse.data.title);
            
            // Get module name
            if (courseResponse.data.modules && 
                courseResponse.data.modules[moduleIndex]) {
              setModuleName(courseResponse.data.modules[moduleIndex].title);
            }
          }
          
          // Check if user has already passed this assessment
          try {
            const progressResponse = await axios.get(
              `${serverBaseUrl}/user/${userId}/progress/${courseId}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            if (progressResponse.data && progressResponse.data.courseProgress) {
              const progress = progressResponse.data.courseProgress;
              
              // Look for assessment scores in moduleData
              if (progress.moduleData && Array.isArray(progress.moduleData)) {
                const moduleData = progress.moduleData.find(
                  m => m.moduleIndex === parseInt(moduleIndex, 10)
                );
                
                if (moduleData && moduleData.quizScores && moduleData.quizScores.length > 0) {
                  // Find highest score
                  const highestScore = Math.max(...moduleData.quizScores.map(q => q.score));
                  
                  if (highestScore >= 70) {
                    setAlreadyPassed(true);
                    setPreviousScore(highestScore);
                  }
                }
              }
            }
          } catch (progressError) {
            console.warn("Error checking previous assessment scores:", progressError);
          }
          
          // Log the parameters being sent for debugging
          console.log("Sending assessment request with:", {
            courseId,
            moduleIndex,
            userId,
            endpoint: `${serverBaseUrl}/assessment/${courseId}/${moduleIndex}?userId=${userId}`
          });
          
          // Then fetch assessment - ensure numeric module index
          const response = await axios.get(
            `${serverBaseUrl}/assessment/${courseId}/${parseInt(moduleIndex, 10)}?userId=${userId}`, 
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          setAssessment(response.data);
          
          // Initialize answers object
          const initialAnswers = {};
          response.data.questions.forEach(q => {
            initialAnswers[q._id] = null;
          });
          setAnswers(initialAnswers);
          
          // Set timer
          setTimeLeft(response.data.timeLimit * 60); // Convert minutes to seconds
          
        } catch (error) {
          console.error("Error fetching assessment:", error);
          // More detailed error logging
          if (error.response) {
            console.error("Response error data:", error.response.data);
            console.error("Response error status:", error.response.status);
          }
          
          if (error.response?.status === 400 && 
              error.response?.data?.error?.includes("must be completed")) {
            setError("You must complete this module before taking the assessment.");
          } else if (error.response?.status === 404) {
            setError("Assessment not available. Ask your instructor to generate it.");
          } else {
            setError("Failed to load assessment. Please try again.");
          }
        } finally {
          setLoading(false);
        }
      };
    
    fetchAssessment();
  }, [courseId, moduleIndex, navigate, token, userId, serverBaseUrl]);
  
  // Timer effect
  useEffect(() => {
    if (assessment && timeLeft > 0 && !results) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Auto-submit when time runs out
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [assessment, timeLeft, results]);
  
  // Handle answer selection
  const selectAnswer = (questionId, optionId) => {
    setAnswers({
      ...answers,
      [questionId]: optionId
    });
  };
  
  // Navigate to previous/next question
  const goToPrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  const goToNextQuestion = () => {
    if (assessment && currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  // Submit assessment
  const handleSubmit = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    
    try {
      // Calculate time spent
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      
      // Prepare answers in the format expected by the API
      const answersArray = Object.keys(answers).map(questionId => ({
        questionId,
        selectedOptionId: answers[questionId]
      })).filter(answer => answer.selectedOptionId !== null);
      
      // Check if all questions are answered
      if (answersArray.length < assessment.questions.length) {
        const confirmed = window.confirm(
          `You have ${assessment.questions.length - answersArray.length} unanswered questions. Submit anyway?`
        );
        
        if (!confirmed) {
          setSubmitting(false);
          return;
        }
      }
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Submit to server
      const response = await axios.post(
        `${serverBaseUrl}/assessment/submit`,
        {
          assessmentId: assessment._id,
          userId,
          answers: answersArray,
          timeSpent
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Store results
      setResults(response.data);
      
    } catch (error) {
      console.error("Error submitting assessment:", error);
      alert("Failed to submit assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle return to module
  const returnToModule = () => {
    navigate(`/course/${courseId}/learn`);
  };
  
  // Calculate progress
  const answeredQuestionsCount = Object.values(answers).filter(v => v !== null).length;
  const progressPercentage = assessment
    ? Math.round((answeredQuestionsCount / assessment.questions.length) * 100)
    : 0;
  
  // Render quiz interface
  const renderQuiz = () => {
    if (!assessment || !assessment.questions || assessment.questions.length === 0) {
      return <div>No questions available</div>;
    }

    const question = assessment.questions[currentQuestion];
    
    return (
      <div className="assessment__quiz">
        <div className="assessment__quiz-header">
          <div className="assessment__progress-container">
            <div className="assessment__progress-bar" style={{ width: `${progressPercentage}%` }}></div>
            <span className="assessment__progress-text">{answeredQuestionsCount} of {assessment.questions.length} answered</span>
          </div>
          
          <div className="assessment__timer">
            <FaClock /> {formatTimeDisplay(timeLeft)}
          </div>
        </div>
        
        <div className="assessment__question-container">
          <div className="assessment__question-number">
            Question {currentQuestion + 1} of {assessment.questions.length}
          </div>
          <h2 className="assessment__question-text">{question.questionText}</h2>
          
          <div className="assessment__options">
            {question.options.map(option => (
              <div 
                key={option._id}
                className={`assessment__option ${answers[question._id] === option._id ? 'assessment__selected' : ''}`}
                onClick={() => selectAnswer(question._id, option._id)}
              >
                {option.text}
              </div>
            ))}
          </div>
        </div>
        
        <div className="assessment__navigation">
          <button 
            onClick={goToPrevQuestion}
            disabled={currentQuestion === 0}
            className="assessment__nav-btn"
          >
            <FaArrowLeft /> Previous
          </button>
          
          {currentQuestion < assessment.questions.length - 1 ? (
            <button 
              onClick={goToNextQuestion}
              className="assessment__nav-btn"
            >
              Next <FaArrowRight />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="assessment__submit-btn"
            >
              {submitting ? <FaSpinner className="assessment__spinner" /> : 'Submit Assessment'}
            </button>
          )}
        </div>
        
        <div className="assessment__questions-overview">
          {assessment.questions.map((q, index) => (
            <div 
              key={index}
              className={`assessment__question-marker 
                ${index === currentQuestion ? 'assessment__current' : ''} 
                ${answers[q._id] ? 'assessment__answered' : ''}`}
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render "already passed" banner
  const renderAlreadyPassedBanner = () => {
    if (!alreadyPassed) return null;
    
    return (
      <div className="assessment__already-passed">
        <div className="assessment__already-passed-icon">
          <FaTrophy />
        </div>
        <div className="assessment__already-passed-content">
          <h3>You've Already Passed This Assessment</h3>
          <p>Your previous score: <span className="assessment__previous-score">{Math.round(previousScore)}%</span></p>
          <p>You can retake this assessment to improve your score if you'd like.</p>
        </div>
      </div>
    );
  };
  
  // If still loading
  if (loading) {
    return (
      <div className="assessment__loading">
        <FaSpinner className="assessment__spinner" />
        <p>Loading assessment...</p>
      </div>
    );
  }
  
  // If there's an error
  if (error) {
    return (
      <div className="assessment__error">
        <div className="assessment__error-content">
          <div className="assessment__error-icon">!</div>
          <h2>Assessment Unavailable</h2>
          <p>{error}</p>
          <button
            onClick={returnToModule}
            className="assessment__btn assessment__btn-primary"
          >
            <FaArrowLeft /> Return to Module
          </button>
        </div>
      </div>
    );
  }
  
  // If assessment isn't loaded yet
  if (!assessment) {
    return (
      <div className="assessment__loading">
        <p>Initializing assessment...</p>
      </div>
    );
  }
  
  // Render results screen if assessment is completed
  if (results) {
    const isPassed = results.passed;
    
    return (
      <div className="assessment__container">
        <div className="assessment__results">
          <div className={`assessment__results-header ${isPassed ? 'assessment__passed' : 'assessment__failed'}`}>
            <div className="assessment__results-icon">
              {isPassed ? <FaCheckCircle /> : <FaTimesCircle />}
            </div>
            <h1>{isPassed ? 'Assessment Passed!' : 'Assessment Not Passed'}</h1>
            <div className="assessment__score">
              <span className="assessment__score-value">{Math.round(results.score)}%</span>
              <span className="assessment__score-label">Your Score</span>
            </div>
            <div className="assessment__results-summary">
              <div>Correct answers: {results.correct} of {results.total}</div>
              <div>Required to pass: 70%</div>
            </div>
          </div>
          
          <div className="assessment__review-section">
            <h2>Review Your Answers</h2>
            {results.results.map((result, index) => {
              const question = assessment.questions.find(q => q._id === result.questionId);
              if (!question) return null;
              
              return (
                <div key={result.questionId} className={`assessment__review-item ${result.isCorrect ? 'assessment__correct' : 'assessment__incorrect'}`}>
                  <div className="assessment__review-question">
                    <span className="assessment__question-number">{index + 1}.</span>
                    <span className="assessment__question-text">{question.questionText}</span>
                    <span className="assessment__result-icon">
                      {result.isCorrect ? <FaCheckCircle /> : <FaTimesCircle />}
                    </span>
                  </div>
                  
                  <div className="assessment__review-options">
                    {question.options.map(option => {
                      const isSelected = answers[question._id] === option._id;
                      const isCorrect = option._id === result.correctOptionId;
                      
                      return (
                        <div 
                          key={option._id} 
                          className={`assessment__review-option 
                            ${isSelected ? 'assessment__selected' : ''}
                            ${isCorrect ? 'assessment__correct-option' : ''}
                          `}
                        >
                          {option.text}
                          {isCorrect && <span className="assessment__correct-mark">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                  
                  {result.explanation && (
                    <div className="assessment__explanation">
                      <h4>Explanation:</h4>
                      <p>{result.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="assessment__results-actions">
            <button 
              onClick={returnToModule}
              className="assessment__btn assessment__btn-primary"
            >
              <FaArrowLeft /> Return to Course
            </button>
            {!isPassed && (
              <button 
                onClick={() => window.location.reload()}
                className="assessment__btn assessment__btn-secondary"
              >
                Retry Assessment
              </button>
            )}
            <Link 
              to={`/course/${courseId}/progress`}
              className="assessment__btn assessment__btn-outline"
            >
              <FaChartLine /> View Progress
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Main render - assessment instructions or quiz
  return (
    <div className="assessment__container">
      <header className="assessment__header">
        <h1>Module Assessment</h1>
        <div className="assessment__course-info">
          <span>{courseName}</span>
          <span className="assessment__divider">›</span>
          <span>{moduleName}</span>
        </div>
      </header>
      
      {renderAlreadyPassedBanner()}
      {renderQuiz()}
    </div>
  );
};

export default Assessment;