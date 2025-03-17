// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import "./AcademicTutor.css";

// const AcademicTutor = () => {
//   const [question, setQuestion] = useState("");
//   const [conversations, setConversations] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [suggestionsVisible, setSuggestionsVisible] = useState(true);
//   const [error, setError] = useState(null);
//   const chatEndRef = useRef(null);
//   const inputRef = useRef(null);
//   const userId = localStorage.getItem("userId") || "guest-user";
//   const [isRequesting, setIsRequesting] = useState(false);

//   const [currentStreamingContent, setCurrentStreamingContent] = useState("");
//   const [assistantResponse, setAssistantResponse] = useState("");
//   const [responseId, setResponseId] = useState(null);
//   const suggestions = [
//     "Explain the concept of machine learning",
//     "How do neural networks work?",
//     "What's the difference between supervised and unsupervised learning?",
//     "What are vector embeddings used for in AI?",
//     "Explain the concept of backpropagation"
//   ];

//   useEffect(() => {
//     scrollToBottom();
//   }, [conversations]);

//   const scrollToBottom = () => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   const handleInputChange = (e) => {
//     setQuestion(e.target.value);
//     if (error) setError(null);
//   };

//   const requestInProgress = useRef(false);
//   const abortControllerRef = useRef(null);


//   const handleAskAI = async (userQuestion = question) => {
//     if (!userQuestion.trim() || loading) return;
    
//     setLoading(true);
//     setQuestion("");
//     setSuggestionsVisible(false);
//     setAssistantResponse(""); // Reset the response
    
//     // Add user message immediately
//     setConversations(prev => [
//       ...prev, 
//       { 
//         role: "user", 
//         content: userQuestion, 
//         timestamp: new Date() 
//       }
//     ]);
    
//     try {
//       // First, send the request to start generating the response
//       const response = await axios.post("http://localhost:8080/start-response", {
//         userId,
//         question: userQuestion
//       });
      
//       if (response.data && response.data.responseId) {
//         const id = response.data.responseId;
//         setResponseId(id);
        
//         // Add an empty assistant message
//         setConversations(prev => [
//           ...prev,
//           {
//             role: "assistant",
//             content: "",
//             timestamp: new Date(),
//             isStreaming: true
//           }
//         ]);
        
//         // Start polling for the response
//         pollForResponse(id);
//       }
//     } catch (error) {
//       console.error("Error starting response:", error);
      
//       // Add error message
//       setConversations(prev => [
//         ...prev, 
//         { 
//           role: "assistant", 
//           content: "I'm having trouble connecting to my knowledge base. Please try again.", 
//           isError: true,
//           timestamp: new Date() 
//         }
//       ]);
      
//       setLoading(false);
//     }
//   };
  
//   // Add this polling function
//   const pollForResponse = async (id) => {
//     let isDone = false;
    
//     while (!isDone) {
//       try {
//         const response = await axios.get(`http://localhost:8080/get-response/${id}`);
        
//         if (response.data) {
//           // Update the assistant message with the current content
//           setAssistantResponse(response.data.content || "");
          
//           // Update the streaming message
//           setConversations(prev => {
//             return prev.map(msg => {
//               if (msg.role === "assistant" && msg.isStreaming) {
//                 return {
//                   ...msg,
//                   content: response.data.content || ""
//                 };
//               }
//               return msg;
//             });
//           });
          
//           // Check if generation is complete
//           if (response.data.done) {
//             isDone = true;
            
//             // Finalize the message
//             setConversations(prev => {
//               return prev.map(msg => {
//                 if (msg.role === "assistant" && msg.isStreaming) {
//                   return {
//                     ...msg,
//                     content: response.data.content || "",
//                     isStreaming: false
//                   };
//                 }
//                 return msg;
//               });
//             });
            
//             setLoading(false);
//           }
//         }
//       } catch (error) {
//         console.error("Error polling for response:", error);
//         isDone = true;
//         setLoading(false);
        
//         // Update with error
//         setConversations(prev => {
//           return prev.map(msg => {
//             if (msg.role === "assistant" && msg.isStreaming) {
//               return {
//                 ...msg,
//                 content: "Error retrieving response. Please try again.",
//                 isError: true,
//                 isStreaming: false
//               };
//             }
//             return msg;
//           });
//         });
//       }
      
//       // Wait a short time before polling again
//       await new Promise(resolve => setTimeout(resolve, 500));
//     }
//   };


//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       console.log("Enter key pressed");
//       e.preventDefault();
//       handleAskAI();
//     }
//   };

//   const formatTime = (date) => {
//     return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   const clearConversation = () => {
//     setConversations([]);
//     setSuggestionsVisible(true);
//   };

//   return (
//     <div className="acatut__container">
//       <div className="acatut__sidebar">
//         <div className="acatut__logo">
//           <span className="acatut__logo-icon">🎓</span>
//           <h1>Academic<br />Tutor</h1>
//         </div>

//         <div className="acatut__nav">
//           <button className="acatut__nav-btn acatut__nav-btn--active">
//             <span className="acatut__nav-icon">💬</span>
//             <span>Chat</span>
//           </button>
//           <button className="acatut__nav-btn">
//             <span className="acatut__nav-icon">📚</span>
//             <span>Resources</span>
//           </button>
//           <button className="acatut__nav-btn">
//             <span className="acatut__nav-icon">📊</span>
//             <span>Progress</span>
//           </button>
//         </div>

//         <div className="acatut__actions">
//           <button
//             className="acatut__action-btn"
//             onClick={clearConversation}
//             disabled={conversations.length === 0}
//           >
//             <span className="acatut__action-icon">🗑️</span>
//             <span>New Chat</span>
//           </button>
//         </div>
//       </div>

//       <div className="acatut__main">
//         <div className="acatut__header">
//           <h2>AI Learning Assistant</h2>
//           <p>Ask any question about your studies</p>
//         </div>

//         <div className="acatut__chat-area">
//           {conversations.length === 0 ? (
//             <div className="acatut__welcome">
//               <div className="acatut__welcome-icon">🧠</div>
//               <h2>Welcome to Academic Tutor</h2>
//               <p>Your AI-powered learning assistant. Ask me anything related to your studies!</p>

//               {suggestionsVisible && (
//                 <div className="acatut__welcome-suggestions">
//                   <h3>Try asking about:</h3>
//                   <div className="acatut__suggestion-grid">
//                     {suggestions.map((text, idx) => (
//                       <button
//                         key={idx}
//                         className="acatut__suggestion-btn"
//                         onClick={() => handleAskAI(text)}
//                       >
//                         {text}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="acatut__messages">
//               {conversations.map((msg, index) => (
//                 <div key={index} className={`acatut__message acatut__message--${msg.role} ${msg.isError ? 'acatut__message--error' : ''} ${msg.isStreaming ? 'acatut__message--streaming' : ''}`}>
//                   <div className="acatut__message-avatar">
//                     {msg.role === "user" ? "👤" : "🤖"}
//                   </div>
//                   <div className="acatut__message-bubble">
//                     {msg.hasContext && (
//                       <div className="acatut__context-badge">
//                         Using previous knowledge
//                       </div>
//                     )}
//                     <div className="acatut__message-content">{msg.content}</div>
//                     <div className="acatut__message-meta">
//                       <span className="acatut__message-time">{formatTime(msg.timestamp)}</span>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               {currentStreamingContent && (
//                 <div className="acatut__message acatut__message--assistant acatut__message--streaming">
//                   <div className="acatut__message-avatar">🤖</div>
//                   <div className="acatut__message-bubble">
//                     <div className="acatut__message-content">{currentStreamingContent}</div>
//                     <div className="acatut__message-meta">
//                       <span className="acatut__message-time">{formatTime(new Date())}</span>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Loading indicator (only shown before any content appears) */}
//               {loading && conversations.length > 0 && conversations[conversations.length - 1].content === "" && (
//                 <div className="acatut__message acatut__message--assistant acatut__message--typing">
//                   <div className="acatut__message-avatar">🤖</div>
//                   <div className="acatut__message-bubble">
//                     <div className="acatut__typing-indicator">
//                       <span></span><span></span><span></span>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div ref={chatEndRef} />
//             </div>
//           )}
//         </div>

//         <div className="acatut__input-area">
//           <textarea
//             ref={inputRef}
//             className={`acatut__input ${error ? 'acatut__input--error' : ''}`}
//             value={question}
//             onChange={handleInputChange}
//             onKeyDown={handleKeyDown}
//             placeholder="Ask your question here..."
//             rows={1}
//             disabled={loading}
//           />
//           {error && <div className="acatut__error-message">{error}</div>}
//           <button
//             className="acatut__send-btn"
//             onClick={() => {
//               console.log("Send button clicked"); // Add this log
//               handleAskAI();
//             }}
//             disabled={loading || !question.trim()}
//           >
//             <span className="acatut__send-icon">📤</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AcademicTutor;