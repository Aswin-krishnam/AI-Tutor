import React from 'react';
import { FaRobot } from 'react-icons/fa';
import './AIInsightsFormatter.css';

/**
 * Formats AI-generated content for better readability
 * 
 * @param {Object} props
 * @param {string} props.content - The AI-generated content from the database
 */
const AIInsightsFormatter = ({ content }) => {
  if (!content) return null;

  // Function to format the content
  const formatContent = () => {
    // Split content into sections based on ### markers
    let sections = content.split('###');
    
    if (sections.length <= 1) {
      // If no sections found, just render the content as is
      return <p>{content}</p>;
    }

    return sections.map((section, index) => {
      if (index === 0 && !section.trim()) return null; // Skip empty first section
      
      // Process each section
      let sectionContent = section.trim();
      
      if (sectionContent.includes('Enhanced Discussion Post')) {
        // Handle summary section
        const titleEndIndex = sectionContent.indexOf('###');
        const title = titleEndIndex !== -1 
          ? sectionContent.substring(0, titleEndIndex).trim()
          : sectionContent.split('\n')[0].trim();
          
        const summaryContent = titleEndIndex !== -1
          ? sectionContent.substring(titleEndIndex).trim()
          : sectionContent.substring(title.length).trim();
          
        return (
          <div key={index} className="ai-section">
            <h4 className="ai-section-title">{title}</h4>
            <div className="ai-section-content">
              {summaryContent.split('\n\n').map((paragraph, pIndex) => (
                <p key={pIndex}>{paragraph.trim()}</p>
              ))}
            </div>
          </div>
        );
      } else if (sectionContent.includes('Additional Insights')) {
        // Handle insights section
        const lines = sectionContent.split('\n');
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();
        
        return (
          <div key={index} className="ai-section">
            <h4 className="ai-section-title">{title}</h4>
            <div className="ai-section-content">
              {content.split('\n\n').map((paragraph, pIndex) => (
                <p key={pIndex}>{paragraph.trim()}</p>
              ))}
            </div>
          </div>
        );
      } else if (sectionContent.includes('Thoughtful Questions')) {
        // Handle questions section
        const lines = sectionContent.split('\n');
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();
        
        return (
          <div key={index} className="ai-section">
            <h4 className="ai-section-title">{title}</h4>
            <div className="ai-section-content">
              {content.split('\n\n').map((paragraph, pIndex) => (
                <p key={pIndex}>{paragraph.trim()}</p>
              ))}
            </div>
          </div>
        );
      } else {
        // Default handling for other sections
        const lines = sectionContent.split('\n');
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();
        
        return (
          <div key={index} className="ai-section">
            <h4 className="ai-section-title">{title}</h4>
            <div className="ai-section-content">
              {content.split('\n\n').map((paragraph, pIndex) => (
                <p key={pIndex}>{paragraph.trim()}</p>
              ))}
            </div>
          </div>
        );
      }
    }).filter(Boolean); // Remove null entries
  };

  return (
    <div className="ai-insights-container">
      <div className="ai-insights-header">
        <span className="ai-icon"><FaRobot /></span>
        <h3>AI Insights</h3>
      </div>
      <div className="ai-insights-content">
        {formatContent()}
      </div>
    </div>
  );
};

export default AIInsightsFormatter;