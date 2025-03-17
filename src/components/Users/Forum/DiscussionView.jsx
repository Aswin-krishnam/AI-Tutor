// DiscussionView.jsx (Fixed)
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./DiscussionView.css";
import {
  FaArrowLeft, FaSpinner, FaUser, FaCalendarAlt,
  FaClock, FaEye, FaThumbsUp, FaThumbsDown, FaReply,
  FaBrain, FaRobot, FaTags, FaComments, FaCheckCircle
} from "react-icons/fa";
import AIInsightsFormatter from "./AIInsightsFormatter";

const DiscussionView = () => {
  const { courseId, moduleIndex, discussionId } = useParams();
  const navigate = useNavigate();
  const commentInputRef = useRef(null);
  
  // State variables
  const [discussion, setDiscussion] = useState(null);
  const [comments, setComments] = useState([]);
  const [course, setCourse] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [useAI, setUseAI] = useState(false);
  const [showAiAssistDialog, setShowAiAssistDialog] = useState(false);
  const [aiAssistQuestion, setAiAssistQuestion] = useState("");
  const [submittingAiAssist, setSubmittingAiAssist] = useState(false);
  
  // Get user info from localStorage
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");
  const serverBaseUrl = "http://localhost:8080"; // Update with your server URL
  
  useEffect(() => {
    if (!token || !userId) {
      navigate("/login", { 
        state: { from: `/course/${courseId}/forum/${moduleIndex}/discussion/${discussionId}` } 
      });
      return;
    }
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Basic validation
        if (!discussionId || discussionId === "undefined") {
          console.error("Invalid discussion ID:", discussionId);
          setError("Invalid discussion ID");
          setLoading(false);
          return;
        }
        
        console.log("Fetching discussion with ID:", discussionId);
        
        // First fetch course details
        try {
          const courseResponse = await axios.get(`${serverBaseUrl}/course/${courseId}`);
          setCourse(courseResponse.data);
          
          if (courseResponse.data.modules && courseResponse.data.modules[moduleIndex]) {
            setCurrentModule(courseResponse.data.modules[moduleIndex]);
          }
        } catch (courseError) {
          console.warn("Error fetching course:", courseError);
          // Continue even if course fetch fails
        }
        
        // Clear URL and build it properly
        const discussionApiUrl = `${serverBaseUrl}/api/forum/discussion/${discussionId}`;
        
        console.log("Making request to:", discussionApiUrl);
        
        // Fetch discussion with proper error handling
        const discussionResponse = await axios.get(
          discussionApiUrl,
          { 
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        console.log("Discussion data received:", discussionResponse.data);
        
        if (discussionResponse.data && discussionResponse.data.discussion) {
          setDiscussion(discussionResponse.data.discussion);
          setComments(discussionResponse.data.comments || []);
        } else {
          setError("Invalid response format from server");
        }
      } catch (error) {
        console.error("Error loading discussion:", error);
        
        // Detailed error reporting
        if (error.response) {
          console.error("Response data:", error.response.data);
          console.error("Response status:", error.response.status);
          setError(error.response.data?.error || `Error ${error.response.status}: Failed to load discussion`);
        } else if (error.request) {
          console.error("No response received:", error.request);
          setError("No response from server. Please try again later.");
        } else {
          console.error("Error details:", error.message);
          setError(`Error: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [courseId, moduleIndex, discussionId, token, userId, navigate]);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error("Date formatting error:", e);
      return dateString; // Return original string if parsing fails
    }
  };
  
  // Get relative time string (e.g., "2 hours ago")
  const getTimeAgo = (dateString) => {
    if (!dateString) return "Unknown time";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSeconds = Math.floor(diffMs / 1000);
      
      if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
      
      const diffMinutes = Math.floor(diffSeconds / 60);
      if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} hours ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays} days ago`;
      
      const diffMonths = Math.floor(diffDays / 30);
      if (diffMonths < 12) return `${diffMonths} months ago`;
      
      const diffYears = Math.floor(diffMonths / 12);
      return `${diffYears} years ago`;
    } catch (e) {
      console.error("Time ago calculation error:", e);
      return "some time ago"; // Fallback
    }
  };
  
  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!commentContent.trim()) {
      return;
    }
    
    setSubmittingComment(true);
    
    try {
      const response = await axios.post(
        `${serverBaseUrl}/api/forum/comment`,
        {
          discussionId,
          content: commentContent,
          userId,
          parentId: replyingTo,
          useAI
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Update comments state
      if (replyingTo) {
        // If replying to a comment, add to its replies
        setComments(comments.map(comment => {
          if (comment._id === replyingTo) {
            // Create replies array if it doesn't exist
            const replies = comment.replies || [];
            return {
              ...comment,
              replies: [...replies, response.data]
            };
          }
          return comment;
        }));
      } else {
        // Top-level comment
        setComments([...comments, { ...response.data, replies: [] }]);
      }
      
      // Reset form
      setCommentContent("");
      setReplyingTo(null);
      setUseAI(false);
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to submit comment. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  };
  
  // Handle reply to comment
  const handleReply = (commentId) => {
    setReplyingTo(commentId);
    // Scroll to comment form and focus it
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };
  
  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };
  
  // Handle vote on comment
  const handleVote = async (commentId, voteType) => {
    try {
      const response = await axios.post(
        `${serverBaseUrl}/api/forum/comment/vote`,
        {
          commentId,
          userId,
          voteType
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Update comment in state
      setComments(comments.map(comment => {
        if (comment._id === commentId) {
          return { ...response.data, replies: comment.replies };
        }
        
        // Check in replies
        if (comment.replies && comment.replies.length > 0) {
          const updatedReplies = comment.replies.map(reply =>
            reply._id === commentId ? response.data : reply
          );
          
          if (updatedReplies.some(r => r._id === commentId)) {
            return { ...comment, replies: updatedReplies };
          }
        }
        
        return comment;
      }));
    } catch (error) {
      console.error("Error voting on comment:", error);
      alert("Failed to register vote. Please try again.");
    }
  };
  
  // Handle mark as answer
  const handleMarkAsAnswer = async (commentId) => {
    try {
      const response = await axios.post(
        `${serverBaseUrl}/api/forum/comment/mark-answer`,
        {
          commentId,
          discussionId,
          userId
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Update comments to reflect the answer status
      setComments(comments.map(comment => {
        // Reset isAnswer for all comments
        const updatedComment = { ...comment, isAnswer: false };
        
        // Set isAnswer for the marked comment
        if (comment._id === commentId) {
          updatedComment.isAnswer = true;
        }
        
        // Check replies
        if (updatedComment.replies && updatedComment.replies.length > 0) {
          updatedComment.replies = updatedComment.replies.map(reply => ({
            ...reply,
            isAnswer: reply._id === commentId
          }));
        }
        
        return updatedComment;
      }));
      
      alert("Comment marked as the answer!");
    } catch (error) {
      console.error("Error marking as answer:", error);
      alert("Failed to mark answer. Please try again.");
    }
  };
  
  // Handle AI assist
  const handleAiAssist = async (e) => {
    e.preventDefault();
    
    if (!aiAssistQuestion.trim()) {
      return;
    }
    
    setSubmittingAiAssist(true);
    
    try {
      const response = await axios.post(
        `${serverBaseUrl}/api/forum/ai-assist`,
        {
          discussionId,
          query: aiAssistQuestion,
          userId
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Add AI-generated comment to the list
      setComments([...comments, { ...response.data.comment, replies: [] }]);
      
      // Reset and close dialog
      setAiAssistQuestion("");
      setShowAiAssistDialog(false);
    } catch (error) {
      console.error("Error getting AI assistance:", error);
      alert("Failed to get AI assistance. Please try again.");
    } finally {
      setSubmittingAiAssist(false);
    }
  };
  
  // Navigate back to forum
  const navigateBack = () => {
    navigate(`/course/${courseId}/forum/${moduleIndex}`);
  };
  
  // Find a comment by ID (recursive function)
  const findCommentById = (comments, id) => {
    if (!comments || !Array.isArray(comments)) return null;
    
    for (const comment of comments) {
      if (comment._id === id) {
        return comment;
      }
      if (comment.replies && comment.replies.length > 0) {
        const found = findCommentById(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  };
  
  if (loading) {
    return (
      <div className="dv__loading">
        <FaSpinner className="dv__spinner" />
        <p>Loading discussion...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="dv__error">
        <h2>Error</h2>
        <p>{error}</p>
        <button
          onClick={navigateBack}
          className="dv__button dv__button-primary"
        >
          Return to Forum
        </button>
      </div>
    );
  }
  
  if (!discussion) {
    return (
      <div className="dv__error">
        <h2>Discussion Not Found</h2>
        <p>The discussion you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={navigateBack}
          className="dv__button dv__button-primary"
        >
          Return to Forum
        </button>
      </div>
    );
  }
  
  // Get the comment being replied to
  const replyingToComment = replyingTo ? findCommentById(comments, replyingTo) : null;
  
  // Check if user is the discussion creator
  const isDiscussionCreator = discussion.createdBy?._id === userId;
  
  return (
    <div className="dv__container">
      <header className="dv__header">
        <button
          className="dv__back-button"
          onClick={navigateBack}
          aria-label="Back to forum"
        >
          <FaArrowLeft />
        </button>
        <div className="dv__breadcrumbs">
          <Link to={`/course/${courseId}/learn`} className="dv__breadcrumb-link">
            {course?.title || "Course"}
          </Link>
          <span className="dv__breadcrumb-separator">›</span>
          <Link to={`/course/${courseId}/forum/${moduleIndex}`} className="dv__breadcrumb-link">
            Module {parseInt(moduleIndex) + 1} Forum
          </Link>
        </div>
      </header>

      <div className="dv__discussion-container">
        <div className="dv__discussion-header">
          <h1 className="dv__discussion-title">{discussion.title}</h1>

          <div className="dv__discussion-meta">
            <div className="dv__author-info">
              <div className="dv__author-avatar">
                <FaUser />
              </div>
              <span className="dv__author-name">{discussion.createdBy?.name || "Unknown"}</span>
            </div>

            <div className="dv__discussion-stats">
              <span className="dv__stat">
                <FaCalendarAlt /> {formatDate(discussion.createdAt)}
              </span>
              <span className="dv__stat">
                <FaEye /> {discussion.views || 0} views
              </span>
              <span className="dv__stat">
                <FaComments /> {comments.length} comments
              </span>
            </div>
          </div>

          {discussion.tags && discussion.tags.length > 0 && (
            <div className="dv__tags">
              <FaTags className="dv__tags-icon" />
              {discussion.tags.map((tag, index) => (
                <span key={index} className="dv__tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="dv__discussion-content">
          {discussion.content}
        </div>

        {discussion.aiAssisted && discussion.aiSummary && (
           <AIInsightsFormatter content={discussion.aiSummary} />
        )}

        <div className="dv__discussion-actions">
          <button
            className="dv__ai-assist-button"
            onClick={() => setShowAiAssistDialog(true)}
          >
            <FaBrain /> Ask AI About This Topic
          </button>
        </div>
      </div>

      <div className="dv__comments-header">
        <h2>
          <FaComments /> Comments ({comments.length})
        </h2>
      </div>

      <div className="dv__comments-container">
        {comments.length > 0 ? (
          <div className="dv__comments-list">
            {comments.map(comment => (
              <div
                key={comment._id}
                className={`dv__comment ${comment.isAnswer ? 'dv__comment-answer' : ''}`}
                id={`comment-${comment._id}`}
              >
                {comment.isAnswer && (
                  <div className="dv__answer-badge">
                    <FaCheckCircle /> Marked as Answer
                  </div>
                )}

                <div className="dv__comment-header">
                  <div className="dv__comment-author">
                    <div className="dv__author-avatar">
                      <FaUser />
                    </div>
                    <div className="dv__author-details">
                      <span className="dv__author-name">
                        {comment.createdBy?.name || "Unknown"}
                        {comment.aiGenerated && (
                          <span className="dv__ai-badge">
                            <FaRobot /> AI Assisted
                          </span>
                        )}
                      </span>
                      <span className="dv__comment-time">
                        {getTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="dv__comment-votes">
                    <button
                      className={`dv__vote-button ${comment.votes?.up?.includes(userId) ? 'dv__voted' : ''}`}
                      onClick={() => handleVote(comment._id, 'up')}
                      aria-label="Upvote"
                    >
                      <FaThumbsUp />
                      <span>{comment.votes?.up?.length || 0}</span>
                    </button>
                    <button
                      className={`dv__vote-button ${comment.votes?.down?.includes(userId) ? 'dv__voted' : ''}`}
                      onClick={() => handleVote(comment._id, 'down')}
                      aria-label="Downvote"
                    >
                      <FaThumbsDown />
                      <span>{comment.votes?.down?.length || 0}</span>
                    </button>
                  </div>
                </div>

                <div className="dv__comment-content">
                  {comment.content}
                </div>

                <div className="dv__comment-actions">
                  <button
                    className="dv__reply-button"
                    onClick={() => handleReply(comment._id)}
                  >
                    <FaReply /> Reply
                  </button>

                  {isDiscussionCreator && !comment.isAnswer && (
                    <button
                      className="dv__mark-answer-button"
                      onClick={() => handleMarkAsAnswer(comment._id)}
                    >
                      <FaCheckCircle /> Mark as Answer
                    </button>
                  )}
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="dv__replies">
                    {comment.replies.map(reply => (
                      <div
                        key={reply._id}
                        className={`dv__reply ${reply.isAnswer ? 'dv__comment-answer' : ''}`}
                        id={`comment-${reply._id}`}
                      >
                        {reply.isAnswer && (
                          <div className="dv__answer-badge">
                            <FaCheckCircle /> Marked as Answer
                          </div>
                        )}

                        <div className="dv__reply-header">
                          <div className="dv__comment-author">
                            <div className="dv__author-avatar">
                              <FaUser />
                            </div>
                            <div className="dv__author-details">
                              <span className="dv__author-name">
                                {reply.createdBy?.name || "Unknown"}
                                {reply.aiGenerated && (
                                  <span className="dv__ai-badge">
                                    <FaRobot /> AI Assisted
                                  </span>
                                )}
                              </span>
                              <span className="dv__comment-time">
                                {getTimeAgo(reply.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="dv__comment-votes">
                            <button
                              className={`dv__vote-button ${reply.votes?.up?.includes(userId) ? 'dv__voted' : ''}`}
                              onClick={() => handleVote(reply._id, 'up')}
                              aria-label="Upvote"
                            >
                              <FaThumbsUp />
                              <span>{reply.votes?.up?.length || 0}</span>
                            </button>
                            <button
                              className={`dv__vote-button ${reply.votes?.down?.includes(userId) ? 'dv__voted' : ''}`}
                              onClick={() => handleVote(reply._id, 'down')}
                              aria-label="Downvote"
                            >
                              <FaThumbsDown />
                              <span>{reply.votes?.down?.length || 0}</span>
                            </button>
                          </div>
                        </div>

                        <div className="dv__reply-content">
                          {reply.content}
                        </div>

                        <div className="dv__reply-actions">
                          <button
                            className="dv__reply-button"
                            onClick={() => handleReply(comment._id)}
                          >
                            <FaReply /> Reply
                          </button>

                          {isDiscussionCreator && !reply.isAnswer && (
                            <button
                              className="dv__mark-answer-button"
                              onClick={() => handleMarkAsAnswer(reply._id)}
                            >
                              <FaCheckCircle /> Mark as Answer
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="dv__no-comments">
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>

      <div className="dv__add-comment">
        {replyingTo && replyingToComment && (
          <div className="dv__replying-to">
            <p>
              Replying to <strong>{replyingToComment?.createdBy?.name || "comment"}</strong>:
              <span className="dv__quoted-text">
                "{replyingToComment?.content?.substring(0, 100) || ""}
                {replyingToComment?.content?.length > 100 ? '...' : ''}"
              </span>
            </p>
            <button className="dv__cancel-reply" onClick={cancelReply}>
              Cancel Reply
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitComment}>
          <div className="dv__comment-input-container">
            <textarea
              ref={commentInputRef}
              className="dv__comment-input"
              placeholder={replyingTo ? "Write your reply..." : "Add a comment..."}
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="dv__comment-actions-row">
            <label className="dv__ai-assist-checkbox">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
              />
              <span className="dv__checkbox-text">
                <FaBrain /> Use AI to enhance my comment
              </span>
            </label>

            <button
              type="submit"
              className="dv__submit-comment"
              disabled={submittingComment || !commentContent.trim()}
            >
              {submittingComment ? (
                <>
                  <FaSpinner className="dv__spinner" />
                  Submitting...
                </>
              ) : (
                "Post Comment"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* AI Assist Dialog */}
      {showAiAssistDialog && (
        <div className="dv__ai-dialog-overlay">
          <div className="dv__ai-dialog">
            <div className="dv__ai-dialog-header">
              <h2><FaBrain /> Ask AI About This Topic</h2>
              <button
                className="dv__ai-dialog-close"
                onClick={() => setShowAiAssistDialog(false)}
              >
                &times;
              </button>
            </div>

            <div className="dv__ai-dialog-content">
              <p className="dv__ai-dialog-info">
                Our AI assistant can help answer questions about this topic based on the course content and discussion.
              </p>

              <form onSubmit={handleAiAssist}>
                <textarea
                  className="dv__ai-question-input"
                  placeholder="Ask your question here..."
                  value={aiAssistQuestion}
                  onChange={(e) => setAiAssistQuestion(e.target.value)}
                  required
                ></textarea>

                <div className="dv__ai-dialog-actions">
                  <button
                    type="button"
                    className="dv__button dv__button-secondary"
                    onClick={() => setShowAiAssistDialog(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="dv__button dv__button-primary"
                    disabled={submittingAiAssist || !aiAssistQuestion.trim()}
                  >
                    {submittingAiAssist ? (
                      <>
                        <FaSpinner className="dv__spinner" />
                        Getting Answer...
                      </>
                    ) : (
                      <>
                        <FaBrain /> Get AI Response
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionView;