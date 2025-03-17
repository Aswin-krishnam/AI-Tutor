import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPaperPlane, FaBrain } from "react-icons/fa";
import "./AITutorChat.css";

const AITutorChat = () => {
    const [question, setQuestion] = useState("");
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [currentStreamingContent, setCurrentStreamingContent] = useState("");
    const [streamingContext, setStreamingContext] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    
    // Navigation
    const navigate = useNavigate();
    
    // Refs
    const chatEndRef = useRef(null);
    const requestInProgressRef = useRef(false);
    const abortControllerRef = useRef(null);
    const streamedContentRef = useRef(""); 
    const updateTimerRef = useRef(null);
    const textareaRef = useRef(null);
    
    // User identification
    const userId = localStorage.getItem("userId") || "guest-user";
    
    // Sample learning suggestions - can be personalized based on user profile
    const generateSuggestions = () => {
        const defaultSuggestions = [
            "Explain the concept of machine learning",
            "How do neural networks work?",
            "What's the difference between supervised and unsupervised learning?",
            "Explain vector embeddings in simple terms"
        ];
        
        // If we have user profile data, personalize suggestions
        if (userProfile?.subjects?.length > 0) {
            const userSubjects = userProfile.subjects.slice(0, 3);
            return [
                ...userSubjects.map(subject => `Tell me more about ${subject.name}`),
                ...defaultSuggestions.slice(0, 2)
            ];
        }
        
        return defaultSuggestions;
    };

    // Auto-scroll to bottom when messages update
    useEffect(() => {
        scrollToBottom();
    }, [conversations, currentStreamingContent]);

    // Fetch user profile on component mount
    useEffect(() => {
        fetchUserProfile();
    }, [userId]);

    // Auto-resize textarea as user types
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [question]);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            
            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current);
            }
        };
    }, []);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Function to navigate back to dashboard
    const handleBackToDashboard = () => {
        navigate("/dashboard");
    };

    // Function to fetch user profile
    const fetchUserProfile = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/user/${userId}/profile`);
            if (response.data) {
                setUserProfile(response.data);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    };

    const handleAskAI = async (userQuestion = question) => {
        // Validate input and prevent duplicate requests
        if (!userQuestion.trim() || requestInProgressRef.current) {
            return;
        }
        
        // Set request flag
        requestInProgressRef.current = true;
        
        // Handle abort controller
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        
        // Clear any pending updates
        if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
            updateTimerRef.current = null;
        }
        
        // Reset UI states
        setLoading(true);
        setQuestion("");
        setShowSuggestions(false);
        setCurrentStreamingContent("");
        setStreamingContext(false);
        streamedContentRef.current = "";
        
        // Auto-reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        
        // Add user message to conversation
        setConversations(prev => [
            ...prev, 
            { 
                role: "user", 
                content: userQuestion, 
                timestamp: new Date() 
            }
        ]);
        
        try {
            console.log("Sending request to server:", userQuestion);
            
            // Using fetch API for streaming support
            const response = await fetch("http://localhost:8080/ask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId,
                    question: userQuestion
                }),
                signal: abortControllerRef.current.signal
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // Start UI update timer for smooth content rendering
            const startUIUpdateTimer = () => {
                if (updateTimerRef.current) {
                    clearTimeout(updateTimerRef.current);
                }
                
                updateTimerRef.current = setInterval(() => {
                    if (streamedContentRef.current) {
                        setCurrentStreamingContent(streamedContentRef.current);
                    }
                }, 50);
            };
            
            startUIUpdateTimer();
            
            // Process the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let hasContext = false;
            
            while (true) {
                const { value, done } = await reader.read();
                
                if (done) {
                    console.log("Stream complete");
                    break;
                }
                
                // Decode and add to buffer
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                
                // Process complete messages (split by double newline)
                const messages = buffer.split("\n\n");
                buffer = messages.pop() || "";
                
                for (const message of messages) {
                    if (message.trim().startsWith("data: ")) {
                        const data = message.trim().substring(6);
                        
                        if (data === "[DONE]") {
                            console.log("Received DONE marker");
                            continue;
                        }
                        
                        try {
                            const parsedData = JSON.parse(data);
                            
                            if (parsedData.chunk !== undefined) {
                                // Append to our ref
                                streamedContentRef.current += parsedData.chunk;
                                
                                // Store context flag
                                hasContext = parsedData.hasContext;
                                setStreamingContext(hasContext);
                            }
                        } catch (e) {
                            console.error("Error parsing SSE data:", e);
                        }
                    }
                }
            }
            
            // Clear the UI update timer
            if (updateTimerRef.current) {
                clearInterval(updateTimerRef.current);
                updateTimerRef.current = null;
            }
            
            // Ensure final content is displayed
            setCurrentStreamingContent(streamedContentRef.current);
            
            // Add the complete AI response to conversations
            if (streamedContentRef.current) {
                const finalContent = streamedContentRef.current;
                setTimeout(() => {
                    setConversations(prev => [
                        ...prev,
                        {
                            role: "assistant",
                            content: finalContent,
                            hasContext: streamingContext,
                            timestamp: new Date()
                        }
                    ]);
                    
                    // Clear streaming content after adding to conversations
                    setCurrentStreamingContent("");
                    
                    // Refresh user profile after each conversation
                    fetchUserProfile();
                }, 100);
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log("Request was aborted");
                return;
            }
            
            console.error("Error:", error);
            setConversations(prev => [
                ...prev, 
                { 
                    role: "assistant", 
                    content: "I'm having trouble connecting to my knowledge base. Please try again later.", 
                    isError: true,
                    timestamp: new Date() 
                }
            ]);
            setCurrentStreamingContent("");
            
            // Clear the UI update timer if there was an error
            if (updateTimerRef.current) {
                clearInterval(updateTimerRef.current);
                updateTimerRef.current = null;
            }
        } finally {
            // Reset states
            setLoading(false);
            requestInProgressRef.current = false;
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Component to display user profile information
    const ProfileSummary = ({ profile }) => {
        if (!profile || !profile.personalDetails) return null;
        
        const { personalDetails, subjects } = profile;
        
        // Check if there's any meaningful profile data to show
        const hasName = personalDetails.name || personalDetails.preferredName;
        const hasInterests = personalDetails.interests && personalDetails.interests.length > 0;
        const hasSubjects = subjects && subjects.length > 0;
        
        if (!hasName && !hasInterests && !hasSubjects) return null;
        
        return (
            <div className="eduai__profile-summary">
                <h3 className="eduai__profile-title">
                    {hasName ? 
                        `Hello, ${personalDetails.preferredName || personalDetails.name}!` : 
                        'Your Learning Profile'}
                </h3>
                
                {hasInterests && (
                    <div className="eduai__interests">
                        <span className="eduai__interests-label">Interests: </span>
                        {personalDetails.interests.join(', ')}
                    </div>
                )}
                
                {hasSubjects && (
                    <div className="eduai__subject-tags">
                        <span className="eduai__subject-label">Topics you've explored: </span>
                        {subjects.slice(0, 5).map((subject, idx) => (
                            <span key={idx} className="eduai__subject-tag">
                                {subject.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Generate suggestions based on user profile
    const suggestions = generateSuggestions();

    return (
        <div className="eduai__container">
            <header className="eduai__header">
                <div className="eduai__header-left">
                    <button 
                        className="eduai__back-btn" 
                        onClick={handleBackToDashboard}
                        aria-label="Back to dashboard"
                    >
                        <FaArrowLeft />
                        <span>Dashboard</span>
                    </button>
                </div>
                <div className="eduai__logo">
                    <span className="eduai__logo-icon"><FaBrain /></span>
                    <h1 className="eduai__logo-text">AI Tutor</h1>
                </div>
                <div className="eduai__header-right">
                    <p className="eduai__tagline">Your personal learning assistant</p>
                </div>
            </header>
            
            {/* User profile summary */}
            {userProfile && <ProfileSummary profile={userProfile} />}
            
            <main className="eduai__chat-area">
                {conversations.length === 0 && !currentStreamingContent && (
                    <div className="eduai__welcome-card">
                        <h2 className="eduai__welcome-title">Welcome to AI Tutor!</h2>
                        <p className="eduai__welcome-text">I'm here to help you learn. Ask me anything about your studies.</p>
                        {!userProfile?.personalDetails?.name && (
                            <p className="eduai__intro-prompt">Feel free to introduce yourself so I can personalize our conversations!</p>
                        )}
                    </div>
                )}
                
                {conversations.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`eduai__message eduai__message-${msg.role} ${msg.isError ? 'eduai__message-error' : ''}`}
                    >
                        <div className="eduai__message-avatar">
                            {msg.role === "user" ? "👤" : <FaBrain />}
                        </div>
                        <div className="eduai__message-bubble">
                            {msg.hasContext && (
                                <div className="eduai__context-badge">
                                    Using relevant context from previous conversations
                                </div>
                            )}
                            <div className="eduai__message-text">{msg.content}</div>
                            <div className="eduai__message-timestamp">{formatTime(msg.timestamp)}</div>
                        </div>
                    </div>
                ))}
                
                {/* Streaming message display */}
                {currentStreamingContent && (
                    <div className="eduai__message eduai__message-assistant eduai__message-streaming">
                        <div className="eduai__message-avatar"><FaBrain /></div>
                        <div className="eduai__message-bubble">
                            {streamingContext && (
                                <div className="eduai__context-badge">
                                    Using relevant context from previous conversations
                                </div>
                            )}
                            <div className="eduai__message-text">{currentStreamingContent}</div>
                            <div className="eduai__message-timestamp">{formatTime(new Date())}</div>
                        </div>
                    </div>
                )}
                
                {/* Loading indicator (only shown before streaming starts) */}
                {loading && !currentStreamingContent && (
                    <div className="eduai__message eduai__message-assistant">
                        <div className="eduai__message-avatar"><FaBrain /></div>
                        <div className="eduai__message-bubble">
                            <div className="eduai__typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={chatEndRef} />
            </main>
            
            {showSuggestions && conversations.length === 0 && !currentStreamingContent && (
                <section className="eduai__suggestions-panel">
                    <h3 className="eduai__suggestions-title">Try asking about:</h3>
                    <div className="eduai__suggestions-grid">
                        {suggestions.map((text, idx) => (
                            <button
                                key={idx}
                                className="eduai__suggestion-btn"
                                onClick={() => handleAskAI(text)}
                                disabled={loading}
                            >
                                {text}
                            </button>
                        ))}
                    </div>
                </section>
            )}
            
            <div className="eduai__input-container">
                <textarea
                    ref={textareaRef}
                    className="eduai__input-textarea"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask your question here..."
                    disabled={loading}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAskAI();
                        }
                    }}
                    rows={1}
                />
                <button 
                    className="eduai__send-btn" 
                    onClick={() => handleAskAI()}
                    disabled={loading || !question.trim()}
                    aria-label="Send message"
                >
                    <FaPaperPlane />
                </button>
            </div>
            
            <footer className="eduai__footer">
                <p className="eduai__footer-text">AI Tutor • Powered by LLM Technology</p>
            </footer>
        </div>
    );
};

export default AITutorChat;