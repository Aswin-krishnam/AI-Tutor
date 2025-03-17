import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AssessmentEditor.css";
import { 
  FaArrowLeft, FaSpinner, FaSave, FaTrash, 
  FaPlus, FaPencilAlt, FaCheck, FaTimes 
} from "react-icons/fa";

const AssessmentEditor = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  
  // States
  const [assessment, setAssessment] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [timeLimit, setTimeLimit] = useState(15);
  const [passPercentage, setPassPercentage] = useState(70);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  const [questionForm, setQuestionForm] = useState({
    questionText: "",
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false }
    ],
    explanation: ""
  });
  
  // Get admin token from localStorage
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const serverBaseUrl = "http://localhost:8080";
  
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        
        // Fetch assessment
        const response = await axios.get(
          `${serverBaseUrl}/assessment/admin/${assessmentId}`, 
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        setAssessment(response.data);
        setTimeLimit(response.data.timeLimit || 15);
        setPassPercentage(response.data.passPercentage || 70);
        
        // Fetch course details
        const courseResponse = await axios.get(
          `${serverBaseUrl}/course/${response.data.courseId}`, 
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        setCourse(courseResponse.data);
      } catch (error) {
        console.error("Error fetching assessment:", error);
        setError("Failed to load assessment details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssessment();
  }, [assessmentId, token, serverBaseUrl]);
  
  // Save assessment
  const saveAssessment = async () => {
    setSaving(true);
    
    try {
      const updatedAssessment = {
        ...assessment,
        timeLimit,
        passPercentage
      };
      
      await axios.put(
        `${serverBaseUrl}/assessment/${assessmentId}`,
        updatedAssessment,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      alert("Assessment saved successfully");
    } catch (error) {
      console.error("Error saving assessment:", error);
      alert("Failed to save assessment");
    } finally {
      setSaving(false);
    }
  };
  
  // Handle editing a question
  const startEditingQuestion = (index) => {
    setEditingQuestionIndex(index);
    
    if (index === -1) {
      // New question
      setQuestionForm({
        questionText: "",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false }
        ],
        explanation: ""
      });
    } else {
      // Edit existing
      const question = assessment.questions[index];
      
      // Ensure we have at least 4 options
      const options = [...question.options];
      while (options.length < 4) {
        options.push({ text: "", isCorrect: false });
      }
      
      setQuestionForm({
        questionText: question.questionText,
        options,
        explanation: question.explanation || ""
      });
    }
  };
  
  // Update question form
  const updateQuestionText = (value) => {
    setQuestionForm({
      ...questionForm,
      questionText: value
    });
  };
  
  const updateOptionText = (index, value) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = {
      ...newOptions[index],
      text: value
    };
    
    setQuestionForm({
      ...questionForm,
      options: newOptions
    });
  };
  
  const updateOptionCorrect = (index) => {
    const newOptions = questionForm.options.map((option, i) => ({
      ...option,
      isCorrect: i === index
    }));
    
    setQuestionForm({
      ...questionForm,
      options: newOptions
    });
  };
  
  const updateExplanation = (value) => {
    setQuestionForm({
      ...questionForm,
      explanation: value
    });
  };
  
  // Save question
  const saveQuestion = () => {
    // Validate form
    if (!questionForm.questionText.trim()) {
      alert("Question text is required");
      return;
    }
    
    const filledOptions = questionForm.options.filter(o => o.text.trim());
    if (filledOptions.length < 2) {
      alert("At least two options are required");
      return;
    }
    
    const hasCorrectOption = questionForm.options.some(o => o.isCorrect);
    if (!hasCorrectOption) {
      alert("Please select a correct answer");
      return;
    }
    
    // Update questions array
    const newQuestions = [...assessment.questions];
    
    // Filter out empty options
    const validOptions = questionForm.options.filter(o => o.text.trim());
    
    const updatedQuestion = {
      ...questionForm,
      options: validOptions
    };
    
    if (editingQuestionIndex === -1) {
      // Add new
      newQuestions.push(updatedQuestion);
    } else {
      // Update existing
      newQuestions[editingQuestionIndex] = updatedQuestion;
    }
    
    setAssessment({
      ...assessment,
      questions: newQuestions
    });
    
    setEditingQuestionIndex(-1);
  };
  
  // Delete question
  const deleteQuestion = (index) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }
    
    const newQuestions = [...assessment.questions];
    newQuestions.splice(index, 1);
    
    setAssessment({
      ...assessment,
      questions: newQuestions
    });
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingQuestionIndex(-1);
  };
  
  // Return to assessment management
  const returnToAssessmentManagement = () => {
    navigate(`/admin/courses/${assessment.courseId}/assessments`);
  };
  
  if (loading) {
    return (
      <div className="ae__loading">
        <FaSpinner className="ae__spinner" />
        <p>Loading assessment editor...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="ae__error">
        <div className="ae__error-content">
          <h2>Error</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate("/admin/courses")}
            className="ae__btn ae__btn-primary"
          >
            Go to Course Management
          </button>
        </div>
      </div>
    );
  }
  
  if (!assessment || !course) {
    return (
      <div className="ae__error">
        <div className="ae__error-content">
          <h2>Assessment Not Found</h2>
          <button
            onClick={() => navigate("/admin/courses")}
            className="ae__btn ae__btn-primary"
          >
            Go to Course Management
          </button>
        </div>
      </div>
    );
  }
  
  // Find module
  const module = course.modules[assessment.moduleIndex] || { title: "Unknown Module" };
  
  return (
    <div className="ae__container">
      <header className="ae__header">
        <button
          onClick={returnToAssessmentManagement}
          className="ae__btn ae__btn-outline"
        >
          <FaArrowLeft /> Back to Assessment Management
        </button>
        <h1>Edit Assessment</h1>
        <div className="ae__meta">
          <div className="ae__course-title">{course.title}</div>
          <div className="ae__module-title">Module {assessment.moduleIndex + 1}: {module.title}</div>
        </div>
      </header>
      
      <div className="ae__content">
        <div className="ae__settings-section">
          <h2>Assessment Settings</h2>
          <div className="ae__settings-card">
            <div className="ae__form-group">
              <label>Time Limit (minutes):</label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Math.max(5, parseInt(e.target.value) || 5))}
                className="ae__input"
                min="5"
              />
            </div>
            
            <div className="ae__form-group">
              <label>Pass Percentage:</label>
              <input
                type="number"
                value={passPercentage}
                onChange={(e) => setPassPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 70)))}
                className="ae__input"
                min="0"
                max="100"
              />
            </div>
            
            <button
              onClick={saveAssessment}
              disabled={saving}
              className="ae__btn ae__btn-primary ae__btn-block"
            >
              {saving ? <FaSpinner className="ae__spinner" /> : <FaSave />} Save Settings
            </button>
          </div>
        </div>
        
        <div className="ae__questions-section">
          <div className="ae__section-header">
            <h2>Questions ({assessment.questions.length})</h2>
            <button
              onClick={() => startEditingQuestion(-1)}
              className="ae__btn ae__btn-primary ae__btn-sm"
              disabled={editingQuestionIndex !== -1}
            >
              <FaPlus /> Add Question
            </button>
          </div>
          
          {editingQuestionIndex !== -1 && (
            <div className="ae__question-form">
              <h3>{editingQuestionIndex === -1 ? 'Add New Question' : 'Edit Question'}</h3>
              
              <div className="ae__form-group">
                <label>Question:</label>
                <textarea
                  value={questionForm.questionText}
                  onChange={(e) => updateQuestionText(e.target.value)}
                  className="ae__textarea"
                  placeholder="Enter question text"
                />
              </div>
              
              <div className="ae__form-group">
                <label>Options:</label>
                <div className="ae__options-list">
                  {questionForm.options.map((option, index) => (
                    <div key={index} className="ae__option-item">
                      <input
                        type="radio"
                        checked={option.isCorrect}
                        onChange={() => updateOptionCorrect(index)}
                        className="ae__radio"
                        id={`option-${index}`}
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOptionText(index, e.target.value)}
                        className="ae__input"
                        placeholder={`Option ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="ae__helper-text">Select the correct option with the radio button</div>
              </div>
              
              <div className="ae__form-group">
                <label>Explanation (optional):</label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(e) => updateExplanation(e.target.value)}
                  className="ae__textarea"
                  placeholder="Explain why the correct answer is right"
                />
              </div>
              
              <div className="ae__form-actions">
                <button
                  onClick={saveQuestion}
                  className="ae__btn ae__btn-primary"
                >
                  <FaCheck /> Save Question
                </button>
                <button
                  onClick={cancelEditing}
                  className="ae__btn ae__btn-secondary"
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          )}
          
          <div className="ae__questions-list">
            {assessment.questions.length === 0 ? (
              <div className="ae__empty-message">
                No questions yet. Click "Add Question" to create the first question.
              </div>
            ) : (
              assessment.questions.map((question, index) => (
                <div key={index} className="ae__question-item">
                  <div className="ae__question-header">
                    <div className="ae__question-number">Question {index + 1}</div>
                    <div className="ae__question-actions">
                      <button
                        onClick={() => startEditingQuestion(index)}
                        className="ae__btn ae__btn-outline ae__btn-xs"
                        disabled={editingQuestionIndex !== -1}
                      >
                        <FaPencilAlt /> Edit
                      </button>
                      <button
                        onClick={() => deleteQuestion(index)}
                        className="ae__btn ae__btn-danger ae__btn-xs"
                        disabled={editingQuestionIndex !== -1}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="ae__question-text">{question.questionText}</div>
                  
                  <div className="ae__question-options">
                    {question.options.map((option, optIndex) => (
                      <div 
                        key={optIndex} 
                        className={`ae__question-option ${option.isCorrect ? 'ae__correct' : ''}`}
                      >
                        {option.text}
                        {option.isCorrect && <span className="ae__correct-mark">✓</span>}
                      </div>
                    ))}
                  </div>
                  
                  {question.explanation && (
                    <div className="ae__question-explanation">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentEditor;