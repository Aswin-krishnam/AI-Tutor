import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import "./ProfessionalStudyMaterials.css";

// Import icons
import { 
  FaArrowLeft, 
  FaArrowRight,
  FaBookOpen, 
  FaSpinner, 
  FaFileDownload, 
  FaFont, 
  FaMoon,
  FaSun,
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";

const ProfessionalStudyMaterials = () => {
  // Route and navigation
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef(null);
  
  // Get the selected module from location state if available
  const initialModuleIndex = location.state?.selectedModule || 0;
  
  // Data states
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [activeModuleIndex, setActiveModuleIndex] = useState(initialModuleIndex);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);
  const [showModules, setShowModules] = useState(true);
  const [showContents, setShowContents] = useState(true);
  const [tableOfContents, setTableOfContents] = useState([]);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Authentication
  const token = localStorage.getItem("token");
  const API_URL = "http://localhost:8080";

  // Detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setShowModules(false);
        setShowContents(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch course data and study materials
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      if (!courseId) {
        setError("Invalid course ID");
        setLoading(false);
        return;
      }
      
      try {
        // Fetch course details
        const courseResponse = await axios.get(`${API_URL}/course/${courseId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Fetch study materials
        const materialsResponse = await axios.get(`${API_URL}/study-materials/${courseId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setCourse(courseResponse.data);
        setMaterials(materialsResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load study materials. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [courseId, token]);

  // Extract table of contents from markdown content
  useEffect(() => {
    if (!materials.length) return;
    
    const currentMaterial = materials.find(m => m.moduleIndex === activeModuleIndex);
    if (!currentMaterial) return;
    
    const content = currentMaterial.content;
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const toc = [];
    let match;
    
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      toc.push({ level, title });
    }
    
    setTableOfContents(toc);
  }, [activeModuleIndex, materials]);

  // Reset scroll position when changing modules
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeModuleIndex]);

  // Handle changing modules
  const handleModuleChange = (index) => {
    if (index >= 0 && index < (course?.modules?.length || 0)) {
      setActiveModuleIndex(index);
      
      // Close sidebar on mobile after selecting module
      if (isMobileView) {
        setShowModules(false);
      }
    }
  };

  // Handle going back to course
  const handleBackToCourse = () => {
    navigate(`/course/${courseId}/learn`);
  };

  // Handle font size change
  const changeFontSize = (delta) => {
    setFontSize(prev => {
      const newSize = prev + delta;
      return newSize >= 14 && newSize <= 22 ? newSize : prev;
    });
  };
  
  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!course || !currentMaterial) return;
    
    setIsDownloading(true);
    
    try {
      const response = await axios({
        url: `${API_URL}/generate-pdf`,
        method: 'POST',
        responseType: 'blob',
        data: {
          courseId,
          moduleIndex: activeModuleIndex
        },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename
      const moduleName = course.modules[activeModuleIndex].title;
      const fileName = `${course.title.replace(/[^a-z0-9]/gi, '_')}_${moduleName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Scroll to heading
  const scrollToHeading = (title) => {
    if (!contentRef.current) return;
    
    const headings = contentRef.current.querySelectorAll('h1, h2, h3');
    for (let heading of headings) {
      if (heading.textContent.trim() === title) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
    }
    
    // Close contents panel on mobile
    if (isMobileView) {
      setShowContents(false);
    }
  };

  // Current material
  const currentMaterial = materials.find(m => m.moduleIndex === activeModuleIndex);
  const currentModule = course?.modules?.[activeModuleIndex];

  // Render loading state
  if (loading) {
    return (
      <div className="prof-study-loading">
        <FaSpinner className="spinning-icon" />
        <p>Loading study materials...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="prof-study-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={handleBackToCourse} className="prof-back-btn">
          <FaArrowLeft /> Back to Course
        </button>
      </div>
    );
  }

  // Render main interface
  return (
    <div className={`prof-study-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Top Header Bar */}
      <header className="prof-study-header">
        <div className="header-left">
          <button 
            className="back-btn" 
            onClick={handleBackToCourse}
          >
            <FaArrowLeft /> Back to Course
          </button>
          <h1 className="course-title">{course?.title || 'Course'}</h1>
        </div>
        
        <div className="header-right">
          <button 
            className={`header-btn ${showModules ? 'active' : ''}`} 
            onClick={() => setShowModules(!showModules)}
          >
            <FaBars /> Modules {showModules ? '▲' : '▼'}
          </button>
          
          <button 
            className={`header-btn ${showContents ? 'active' : ''}`} 
            onClick={() => setShowContents(!showContents)}
          >
            <FaBars /> Contents {showContents ? '▲' : '▼'}
          </button>
          
          <div className="font-size-controls">
            <button 
              className="header-btn" 
              onClick={() => changeFontSize(-1)}
              title="Decrease font size"
            >
              <FaFont style={{ fontSize: '0.8em' }} />
            </button>
            <button 
              className="header-btn" 
              onClick={() => changeFontSize(1)}
              title="Increase font size"
            >
              <FaFont style={{ fontSize: '1.2em' }} />
            </button>
          </div>
          
          <button 
            className="header-btn" 
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          
          <button 
            className="download-btn" 
            onClick={handleDownloadPDF}
            disabled={isDownloading || !currentMaterial}
            title="Download as PDF"
          >
            {isDownloading ? <FaSpinner className="spinning-icon" /> : <FaFileDownload />} PDF
          </button>
        </div>
      </header>
      
      <div className="prof-study-body">
        {/* Modules Sidebar */}
        <aside className={`modules-sidebar ${showModules ? 'visible' : 'hidden'}`}>
          <div className="sidebar-header">
            <h2>Course Modules</h2>
            {isMobileView && (
              <button className="close-sidebar" onClick={() => setShowModules(false)}>
                <FaTimes />
              </button>
            )}
          </div>
          
          <ul className="module-list">
            {course?.modules?.map((module, index) => (
              <li 
                key={index} 
                className={`module-item ${index === activeModuleIndex ? 'active' : ''}`}
                onClick={() => handleModuleChange(index)}
              >
                <span className="module-number">{index + 1}</span>
                <span className="module-name">{module.title}</span>
              </li>
            ))}
          </ul>
        </aside>
        
        {/* Main Content Area */}
        <main className={`study-content ${!showModules && !showContents ? 'full-width' : ''}`}>
          <div className="current-module-info">
            <h2>
              <FaBookOpen className="module-icon" /> 
              {currentModule?.title || 'Module'}
            </h2>
            <div className="module-navigation">
              <button
                className="nav-btn"
                onClick={() => handleModuleChange(activeModuleIndex - 1)}
                disabled={activeModuleIndex === 0}
              >
                <FaChevronLeft /> Previous
              </button>
              <span className="module-position">
                Module {activeModuleIndex + 1} of {course?.modules?.length || 0}
              </span>
              <button
                className="nav-btn"
                onClick={() => handleModuleChange(activeModuleIndex + 1)}
                disabled={activeModuleIndex >= (course?.modules?.length || 0) - 1}
              >
                Next <FaChevronRight />
              </button>
            </div>
          </div>
          
          <div className="module-content-wrapper">
            <div 
              className="module-content" 
              ref={contentRef}
              style={{ fontSize: `${fontSize}px` }}
            >
              {currentMaterial ? (
                <ReactMarkdown>{currentMaterial.content}</ReactMarkdown>
              ) : (
                <div className="no-content-message">
                  <p>No study materials are available for this module.</p>
                </div>
              )}
            </div>
          </div>
        </main>
        
        {/* Table of Contents Sidebar */}
        <aside className={`contents-sidebar ${showContents ? 'visible' : 'hidden'}`}>
          <div className="sidebar-header">
            <h2>Table of Contents</h2>
            {isMobileView && (
              <button className="close-sidebar" onClick={() => setShowContents(false)}>
                <FaTimes />
              </button>
            )}
          </div>
          
          <ul className="toc-list">
            {tableOfContents.length > 0 ? (
              tableOfContents.map((item, index) => (
                <li 
                  key={index} 
                  className={`toc-item level-${item.level}`}
                  onClick={() => scrollToHeading(item.title)}
                >
                  {item.title}
                </li>
              ))
            ) : (
              <li className="no-toc-message">
                No headings found in this material
              </li>
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default ProfessionalStudyMaterials;