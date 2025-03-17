import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import "./StudyMaterials.css";

// Import icons
import { 
  FaArrowLeft, 
  FaBookOpen, 
  FaSpinner, 
  FaGraduationCap, 
  FaFileDownload, 
  FaFont, 
  FaAdjust,
  FaList, 
  FaChevronDown, 
  FaChevronUp, 
  FaTimes,
  FaBars
} from "react-icons/fa";

const StudyMaterials = () => {
  // Route parameters
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef(null);
  
  // Get the selected module from location state if available
  const initialModule = location.state?.selectedModule || 0;
  
  // Data states
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [selectedModule, setSelectedModule] = useState(initialModule);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
  const [fontSize, setFontSize] = useState(16); // Default font size
  const [darkMode, setDarkMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tableOfContents, setTableOfContents] = useState([]);
  const [showTOC, setShowTOC] = useState(false);
  
  // PDF download state
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Get user token
  const token = localStorage.getItem("token");

  // API URL
  const API_URL = "http://localhost:8080";

  // Fix scrolling issues and prevent body scrolling
  useLayoutEffect(() => {
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Reset scroll position when component mounts
    if (contentRef.current) {
      setTimeout(() => {
        contentRef.current.scrollTop = 0;
      }, 0);
    }
    
    // Remove fix when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  // Reset scroll when changing modules
  useEffect(() => {
    if (contentRef.current) {
      setTimeout(() => {
        contentRef.current.scrollTop = 0;
      }, 0);
    }
  }, [selectedModule]);

  // Generate table of contents based on markdown content
  useEffect(() => {
    if (materials.length === 0) return;
    
    const currentMaterial = materials.find(m => m.moduleIndex === selectedModule);
    if (!currentMaterial) return;
    
    // Extract headings from markdown content
    const content = currentMaterial.content;
    const headingRegex = /#{1,3} (.+)/g;
    const toc = [];
    let match;
    
    while ((match = headingRegex.exec(content)) !== null) {
      // Determine heading level by counting #
      const headingText = match[0];
      const level = headingText.indexOf(' ') - 1; // Count # symbols
      const title = match[1].trim();
      
      toc.push({ title, level });
    }
    
    setTableOfContents(toc);
  }, [selectedModule, materials]);

  // Fetch course data and study materials
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      if (!courseId || courseId === "undefined") {
        setError("Invalid course ID");
        setLoading(false);
        return;
      }
      
      try {
        console.log("Fetching course with ID:", courseId);
        
        // Fetch course details - using the correct endpoint
        const courseResponse = await axios.get(`${API_URL}/course/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setCourse(courseResponse.data);
        
        // Fetch study materials
        const materialsResponse = await axios.get(`${API_URL}/study-materials/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setMaterials(materialsResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.error || "Failed to load course materials");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [courseId, API_URL, token]);

  // Handle module selection
  const handleModuleSelect = (index) => {
    setSelectedModule(index);
    setShowTOC(false);
    
    if (window.innerWidth < 768) {
      setMobileSidebarOpen(false);
    }
  };

  // Scroll to a heading
  const scrollToHeading = (title) => {
    if (!contentRef.current) return;
    
    const headings = contentRef.current.querySelectorAll('h1, h2, h3');
    for (let heading of headings) {
      if (heading.textContent.trim() === title) {
        // Use scrollTo for better control over scrolling behavior
        const headingTop = heading.offsetTop;
        contentRef.current.scrollTo({
          top: headingTop - 20, // Add some padding
          behavior: 'smooth'
        });
        break;
      }
    }
    
    if (window.innerWidth < 768) {
      setShowTOC(false);
    }
  };
  
  // Handle font size change
  const changeFontSize = (delta) => {
    setFontSize(prev => {
      const newSize = prev + delta;
      return newSize >= 12 && newSize <= 24 ? newSize : prev;
    });
  };
  
  // Handle PDF download
  const handlePdfDownload = async () => {
    if (!course || !currentMaterial) return;
    
    setDownloadingPdf(true);
    
    try {
      // Call server-side PDF generation
      const response = await axios({
        url: `${API_URL}/generate-pdf`,
        method: 'POST',
        responseType: 'blob', // Important for handling binary data
        data: {
          courseId: courseId,
          moduleIndex: selectedModule
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename
      const moduleName = course.modules[selectedModule].title;
      const fileName = `${course.title.replace(/[^a-z0-9]/gi, '_')}_${moduleName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };
  
  // Handle going back to course learning page
  const handleBackToCourse = () => {
    // Reset body overflow before navigating
    document.body.style.overflow = '';
    navigate(`/course/${courseId}/learn`);
  };
  
  // Toggle TOC on mobile
  const toggleTOC = () => {
    setShowTOC(prev => !prev);
  };

  // Get current material
  const currentMaterial = materials.find(m => m.moduleIndex === selectedModule);

  // Loading state
  if (loading) {
    return (
      <div className="study-materials-loading">
        <FaSpinner className="spinner" />
        <p>Loading study materials...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="study-materials-error">
        <h2>Error</h2>
        <p>{error}</p>
        {courseId && courseId !== "undefined" && (
          <button onClick={handleBackToCourse} className="back-button">
            <FaArrowLeft /> Back to Course
          </button>
        )}
        <button onClick={() => navigate('/courses')} className="back-button mt-2">
          <FaArrowLeft /> Browse Courses
        </button>
      </div>
    );
  }

  // Course not found
  if (!course) {
    return (
      <div className="study-materials-error">
        <h2>Course Not Found</h2>
        <p>The requested course could not be found.</p>
        <button onClick={() => navigate('/courses')} className="back-button">
          <FaArrowLeft /> Browse Courses
        </button>
      </div>
    );
  }

  return (
    <div className={`study-materials-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className="mobile-sidebar-toggle" 
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          <FaBars />
        </button>
        <h2 className="mobile-course-title">{course.title}</h2>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {mobileSidebarOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setMobileSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside className={`materials-sidebar ${showSidebar ? 'open' : 'collapsed'} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <button onClick={handleBackToCourse} className="back-button">
            <FaArrowLeft /> Back to Course
          </button>
          <button 
            className="sidebar-toggle desktop-only" 
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? <FaTimes /> : <FaBars />}
          </button>
          <button 
            className="sidebar-close mobile-only" 
            onClick={() => setMobileSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="course-title">
          <h2>{course.title}</h2>
          <p className="course-details">
            {course.level || 'Beginner'} · {course.duration || '0'} hours · {course.category || 'General'}
          </p>
        </div>
        
        <div className="modules-section">
          <h3>Course Modules</h3>
          <ul className="modules-list">
            {course.modules && course.modules.map((module, index) => (
              <li 
                key={index}
                className={`module-item ${selectedModule === index ? "active" : ""}`}
                onClick={() => handleModuleSelect(index)}
              >
                <span className="module-number">{index + 1}</span>
                <span className="module-title">{module.title}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="sidebar-footer">
          <button 
            onClick={() => navigate(`/course/${courseId}`)} 
            className="view-course-details"
          >
            <FaGraduationCap /> Course Details
          </button>
        </div>
      </aside>
      
      {/* Main content area */}
      <main className="materials-main">
        {/* Reading controls */}
        <div className="reading-controls">
          <button 
            className="toc-toggle mobile-only"
            onClick={toggleTOC}
          >
            <FaList /> {showTOC ? 'Hide Contents' : 'Contents'}
          </button>
          
          <div className="font-controls">
            <button onClick={() => changeFontSize(-1)} className="font-button small">
              <FaFont /> -
            </button>
            <button onClick={() => changeFontSize(1)} className="font-button large">
              <FaFont /> +
            </button>
          </div>
          
          <button onClick={() => setDarkMode(!darkMode)} className="theme-button">
            <FaAdjust /> {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          
          <button 
            onClick={handlePdfDownload} 
            className="download-button"
            disabled={downloadingPdf || !currentMaterial}
          >
            {downloadingPdf ? (
              <>
                <FaSpinner className="spinner" /> Preparing PDF...
              </>
            ) : (
              <>
                <FaFileDownload /> Download PDF
              </>
            )}
          </button>
        </div>
        
        {/* Table of contents - Mobile */}
        {showTOC && (
          <div className="mobile-toc">
            <h3>Contents</h3>
            <ul>
              {tableOfContents.map((heading, index) => (
                <li 
                  key={index} 
                  className={`toc-item level-${heading.level}`}
                  onClick={() => scrollToHeading(heading.title)}
                >
                  {heading.title}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Content wrapper */}
        <div className="content-wrapper">
          {/* Desktop TOC */}
          <div className="desktop-toc">
            <h3>Contents</h3>
            <ul>
              {tableOfContents.map((heading, index) => (
                <li 
                  key={index} 
                  className={`toc-item level-${heading.level}`}
                  onClick={() => scrollToHeading(heading.title)}
                >
                  {heading.title}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Main content */}
          <div 
            className="material-content" 
            ref={contentRef}
            style={{ fontSize: `${fontSize}px` }}
          >
            {course.modules && course.modules[selectedModule] ? (
              <>
                <div className="module-header">
                  <h1>
                    <FaBookOpen className="module-icon" />
                    {course.modules[selectedModule].title}
                  </h1>
                  <p className="module-description">
                    {course.modules[selectedModule].description}
                  </p>
                </div>
                
                <div className="study-material-content">
                  {currentMaterial ? (
                    <div className="markdown-content">
                      <ReactMarkdown>
                        {currentMaterial.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="no-materials-message">
                      No study materials available for this module yet.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="no-module-selected">
                <p>Please select a module from the sidebar to view study materials.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Module navigation */}
        <div className="module-navigation">
          <button 
            onClick={() => selectedModule > 0 && handleModuleSelect(selectedModule - 1)}
            disabled={selectedModule === 0}
            className="prev-module-btn"
          >
            <FaArrowLeft /> Previous Module
          </button>
          <button
            onClick={handleBackToCourse}
            className="return-to-course-btn"
          >
            Return to Course
          </button>
          <button 
            onClick={() => selectedModule < course.modules.length - 1 && handleModuleSelect(selectedModule + 1)}
            disabled={selectedModule === course.modules.length - 1}
            className="next-module-btn"
          >
            Next Module <FaArrowLeft style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default StudyMaterials;