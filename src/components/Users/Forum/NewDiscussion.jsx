// NewDiscussion.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./NewDiscussion.css";
import {
  FaArrowLeft, FaSpinner, FaBrain, FaTags,
  FaCheckCircle, FaTimesCircle, FaQuestionCircle
} from "react-icons/fa";

const NewDiscussion = () => {
  const { courseId, moduleIndex } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [course, setCourse] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [useAI, setUseAI] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [aiHelp, setAiHelp] = useState(null);
  const [showAiHelpDialog, setShowAiHelpDialog] = useState(false);
  const [loadingAiHelp, setLoadingAiHelp] = useState(false);
  
  // Get user info from localStorage
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const serverBaseUrl = "http://localhost:8080"; // Update with your server URL
  
  useEffect(() => {
    if (!token || !userId) {
      navigate("/login", { 
        state: { from: `/course/${courseId}/forum/${moduleIndex}/new` } 
      });
      return;
    }
    
    const loadCourseData = async () => {
      try {
        // Fetch course details
        const courseResponse = await axios.get(`${serverBaseUrl}/course/${courseId}`);
        setCourse(courseResponse.data);
        
        if (courseResponse.data.modules && courseResponse.data.modules[moduleIndex]) {
          setCurrentModule(courseResponse.data.modules[moduleIndex]);
        } else {
          setError("Module not found");
        }
      } catch (error) {
        console.error("Error loading course data:", error);
        setError("Failed to load course data");
      } finally {
        setLoading(false);
      }
    };
    
    loadCourseData();
  }, [courseId, moduleIndex, token, userId, navigate]);
  
  // Handle tag addition
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };
  
  // Handle tag input key press
  const handleTagKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  // Handle tag removal
  const handleRemoveTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };
  
  // Get AI help with content creation
  const getAIHelp = async () => {
    if (!title.trim()) {
      setError("Please enter a discussion title first");
      return;
    }
    
    setLoadingAiHelp(true);
    setShowAiHelpDialog(true);
    
    try {
      // Create AI prompt with course context
      const moduleContext = currentModule ? 
        `The discussion is related to the module: "${currentModule.title}" - ${currentModule.description}` : 
        "";
      
      const aiPrompt = `
        You are helping a student create a thoughtful discussion post for an educational forum.
        
        Course: "${course?.title}"
        ${moduleContext}
        
        Discussion Title: "${title}"
        
        Please provide a well-structured and thoughtful discussion post about this topic.
        The post should:
        1. Start with a clear introduction to the topic
        2. Include relevant concepts from the course material
        3. Ask 1-2 thoughtful questions at the end to encourage responses
        4. Be about 200-300 words in length
        
        Return ONLY the discussion post content without any explanations or additional formatting.
      `;
      
      // Call AI service
      const aiResponse = await axios.post("http://localhost:5001/api/generate", {
        model: "mistral",
        prompt: aiPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2048,
          top_k: 40,
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      });
      
      setAiHelp(aiResponse.data.response.trim());
    } catch (error) {
      console.error("Error getting AI help:", error);
      setAiHelp("Sorry, I couldn't generate content at this time. Please try again later.");
    } finally {
      setLoadingAiHelp(false);
    }
  };
  
  // Use AI generated content
  const useAiContent = () => {
    setContent(aiHelp);
    setShowAiHelpDialog(false);
    setUseAI(true); // Mark as AI assisted
  };
  
  // Submit the discussion
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${serverBaseUrl}/api/forum/discussion`,
        {
          courseId,
          moduleIndex,
          title,
          content,
          useAI,
          userId,
          tags
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Navigate to the newly created discussion
      navigate(`/course/${courseId}/forum/${moduleIndex}/discussion/${response.data._id}`);
    } catch (error) {
      console.error("Error creating discussion:", error);
      setError("Failed to create discussion. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Navigate back to forum
  const navigateBack = () => {
    navigate(`/course/${courseId}/forum/${moduleIndex}`);
  };
  
  if (loading) {
    return (
      <div className="nd__loading">
        <FaSpinner className="nd__spinner" />
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="nd__container">
      <header className="nd__header">
        <button 
          className="nd__back-button" 
          onClick={navigateBack}
          aria-label="Back to forum"
        >
          <FaArrowLeft />
        </button>
        <div className="nd__title-container">
          <h1 className="nd__title">New Discussion</h1>
          <p className="nd__subtitle">
            {course?.title} • Module {parseInt(moduleIndex) + 1}: {currentModule?.title}
          </p>
        </div>
      </header>
      
      {error && (
        <div className="nd__error-message">
          <FaTimesCircle />
          <span>{error}</span>
        </div>
      )}
      
      <form className="nd__form" onSubmit={handleSubmit}>
        <div className="nd__form-group">
          <label htmlFor="title" className="nd__label">Discussion Title</label>
          <input
            id="title"
            type="text"
            className="nd__input"
            placeholder="Enter a clear, specific title for your discussion"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="nd__form-group">
          <div className="nd__content-header">
            <label htmlFor="content" className="nd__label">Content</label>
            <button 
              type="button"
              className="nd__ai-help-button"
              onClick={getAIHelp}
              disabled={loadingAiHelp}
            >
              {loadingAiHelp ? (
                <>
                  <FaSpinner className="nd__spinner" />
                  Getting AI Help...
                </>
              ) : (
                <>
                  <FaBrain /> Get AI Help
                </>
              )}
            </button>
          </div>
          <textarea
            id="content"
            className="nd__textarea"
            placeholder="Share your thoughts, questions, or insights about this topic..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="8"
            required
          ></textarea>
        </div>
        
        <div className="nd__form-group">
          <label className="nd__label">
            <FaTags /> Tags (optional)
          </label>
          <div className="nd__tags-container">
            <div className="nd__tags-input-container">
              <input
                type="text"
                className="nd__tags-input"
                placeholder="Add tags (press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
              />
              <button 
                type="button"
                className="nd__add-tag-button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 5}
              >
                Add
              </button>
            </div>
            <div className="nd__tags-list">
              {tags.map((tag, index) => (
                <div key={index} className="nd__tag">
                  <span>{tag}</span>
                  <button 
                    type="button"
                    className="nd__remove-tag"
                    onClick={() => handleRemoveTag(index)}
                    aria-label="Remove tag"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <p className="nd__tags-hint">You can add up to 5 tags to help others find your discussion.</p>
          </div>
        </div>
        
        <div className="nd__form-group nd__ai-assist-toggle">
          <label className="nd__checkbox-container">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
            />
            <span className="nd__checkbox-label">
              <FaBrain /> Use AI to enhance this discussion
            </span>
          </label>
          <div className="nd__tooltip">
            <FaQuestionCircle />
            <span className="nd__tooltip-text">
              AI will analyze your post and add a summary, additional insights, and thoughtful questions to encourage responses.
            </span>
          </div>
        </div>
        
        <div className="nd__form-actions">
          <button 
            type="button" 
            className="nd__button nd__button-secondary"
            onClick={navigateBack}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="nd__button nd__button-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <FaSpinner className="nd__spinner" />
                Creating...
              </>
            ) : (
              "Create Discussion"
            )}
          </button>
        </div>
      </form>
      
      {/* AI Help Dialog */}
      {showAiHelpDialog && (
        <div className="nd__ai-dialog-overlay">
          <div className="nd__ai-dialog">
            <div className="nd__ai-dialog-header">
              <h2><FaBrain /> AI Generated Content</h2>
              <button 
                className="nd__ai-dialog-close"
                onClick={() => setShowAiHelpDialog(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="nd__ai-dialog-content">
              {loadingAiHelp ? (
                <div className="nd__ai-loading">
                  <FaSpinner className="nd__spinner" />
                  <p>Generating thoughtful content...</p>
                </div>
              ) : (
                <>
                  <div className="nd__ai-content">
                    {aiHelp}
                  </div>
                  <div className="nd__ai-dialog-actions">
                    <button 
                      className="nd__button nd__button-secondary"
                      onClick={() => setShowAiHelpDialog(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="nd__button nd__button-primary"
                      onClick={useAiContent}
                    >
                      <FaCheckCircle /> Use This Content
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewDiscussion;