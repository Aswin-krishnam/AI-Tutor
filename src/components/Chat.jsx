import React, { useState } from "react";
import axios from "axios";
import "./Chat.css";

const Chat = () => {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/ask-ai", { question });
      setResponse(res.data.answer);
    } catch (error) {
      setResponse("Error: Unable to fetch response");
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="chat-container-unique">
      <h2>AI Tutor</h2>
      <form onSubmit={handleSubmit} className="chat-form-unique">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask me anything..."
          className="chat-input-unique"
        />
        <button type="submit" className="chat-button-unique" disabled={loading}>
          {loading ? "Thinking..." : "Ask"}
        </button>
      </form>
      {response && <div className="chat-response-unique">{response}</div>}
    </div>
  );
};

export default Chat;
