import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  FaEdit, FaSave, FaArrowLeft, FaHeadphones, 
  FaPlus, FaTrash, FaSearch, FaFilter, 
  FaClipboardCheck, FaChartLine 
} from "react-icons/fa";
import { marked } from 'marked';
import "./StudyMaterialsManager.css";

const StudyMaterialsManager = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [course, setCourse] = useState(null);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModule, setSelectedModule] = useState(0);
  
  // Edit mode states
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState("");
  
  // Audio upload states
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [audioTitle, setAudioTitle] = useState("");
  const [audioDescription, setAudioDescription] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  
  // Content filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filteredContent, setFilteredContent] = useState("");
  const [renderedContent, setRenderedContent] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Configure marked options
  useEffect(() => {
    marked.setOptions({
      breaks: true,        // Render line breaks as <br>
      gfm: true,           // GitHub Flavored Markdown
      headerIds: true,     // Add IDs to headers
      mangle: false,       // Don't escape HTML
      sanitize: false      // Don't sanitize HTML
    });
  }, []);
  
  useEffect(() => {
    fetchCourseData();
    fetchStudyMaterials();
    fetchAssessments();
    
    // Check for module param in URL
    const searchParams = new URLSearchParams(location.search);
    const moduleParam = searchParams.get('module');
    if (moduleParam && !isNaN(parseInt(moduleParam))) {
      setSelectedModule(parseInt(moduleParam));
    }
    
    // Check for podcastModal param in URL
    const podcastModalParam = searchParams.get('podcastModal');
    if (podcastModalParam === 'true') {
      setShowAudioModal(true);
    }
  }, [courseId, location]);
  
  const fetchCourseData = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/course/${courseId}`);
      setCourse(response.data);
    } catch (error) {
      console.error("Error fetching course data:", error);
      setError("Failed to load course details.");
    }
  };
  
  const fetchStudyMaterials = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8080/study-materials/${courseId}`);
      console.log("Study materials response:", response.data);
      
      setStudyMaterials(response.data);
      
      // If materials exist, select appropriate module for viewing
      if (response.data.length > 0) {
        // Only set if not already set from URL params
        const moduleToDisplay = selectedModule || 0;
        const moduleMaterial = response.data.find(m => m.moduleIndex === moduleToDisplay);
        
        if (moduleMaterial) {
          console.log("Current module material:", moduleMaterial);
          console.log("Podcasts for this module:", moduleMaterial.podcasts);
          
          setEditContent(moduleMaterial.content);
          applyContentFilters(moduleMaterial.content);
        } else if (response.data[0]) {
          // If specific module not found, use the first available module
          const firstMaterial = response.data[0];
          setSelectedModule(firstMaterial.moduleIndex);
          setEditContent(firstMaterial.content);
          applyContentFilters(firstMaterial.content);
        }
      }
    } catch (error) {
      console.error("Error fetching study materials:", error);
      setError("Failed to load study materials.");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAssessments = async () => {
  try {
    console.log(`Fetching assessments for course: ${courseId}`);
    const response = await axios.get(`http://localhost:8080/assessments/${courseId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    setAssessments(response.data || []);
    console.log("Assessments loaded:", response.data);
  } catch (error) {
    console.error("Error fetching assessments:", error);
    // Show a more informative message in the UI
    if (error.response?.status === 404) {
      console.error("Assessment endpoint not found. Check backend implementation.");
    }
    setAssessments([]); // Set empty array on error
  }
};
  
  const getCurrentMaterial = () => {
    if (!studyMaterials || studyMaterials.length === 0) {
      console.log("No study materials available");
      return null;
    }
    
    const material = studyMaterials.find(m => m.moduleIndex === selectedModule);
    
    if (material) {
      console.log("Found current material:", material);
      console.log("Podcasts in current material:", material.podcasts);
    } else {
      console.log("No material found for module index:", selectedModule);
    }
    
    return material;
  };
  
  const hasAssessmentForModule = (moduleIndex) => {
    return assessments.some(a => a.moduleIndex === moduleIndex);
  };
  
  const handleModuleChange = (index) => {
    setSelectedModule(index);
    const material = studyMaterials.find(m => m.moduleIndex === index);
    
    if (material) {
      setEditContent(material.content);
      applyContentFilters(material.content);
      setSearchTerm("");
      setFilterCategory("all");
    } else {
      // If no material exists for this module, set empty content
      const emptyContent = "# Study Material\n\nAdd content for this module.";
      setEditContent(emptyContent);
      applyContentFilters(emptyContent);
    }
    
    // Exit edit mode when changing modules
    setEditMode(false);
  };
  
  const handleEditToggle = () => {
    setEditMode(!editMode);
  };
  
  const handleContentChange = (e) => {
    setEditContent(e.target.value);
  };
  
  const handleSaveContent = async () => {
    try {
      const material = getCurrentMaterial();
      
      if (material) {
        // Update existing study material
        await axios.put(`http://localhost:8080/study-materials/${material._id}`, {
          content: editContent
        });
      } else {
        // Create new study material for this module
        await axios.post(`http://localhost:8080/study-materials`, {
          courseId,
          moduleIndex: selectedModule,
          content: editContent
        });
      }
      
      // Refresh data
      await fetchStudyMaterials();
      setEditMode(false);
      
      // Update filtered content
      applyContentFilters(editContent);
    } catch (error) {
      console.error("Error saving study material:", error);
      setError("Failed to save study material content.");
    }
  };
  
  const handleGenerateAssessment = async () => {
    try {
      // Check if there's study material for this module
      const material = getCurrentMaterial();
      if (!material) {
        alert("Please create study material for this module before generating an assessment.");
        return;
      }
      
      // Check if assessment already exists
      if (hasAssessmentForModule(selectedModule)) {
        const confirmOverwrite = window.confirm(
          "An assessment already exists for this module. Do you want to view/edit it?"
        );
        
        if (confirmOverwrite) {
          // Find existing assessment
          const existingAssessment = assessments.find(a => a.moduleIndex === selectedModule);
          if (existingAssessment) {
            navigate(`/admin/assessment/${existingAssessment._id}`);
          }
          return;
        } else {
          return; // User canceled
        }
      }
      
      const confirmed = window.confirm(
        "This will generate a multiple-choice assessment based on the study material for this module. Continue?"
      );
      
      if (!confirmed) return;
      
      // Show loading message
      alert("Generating assessment. This may take a moment...");
      
      // Call API to generate assessment
      const response = await axios.post(
        `http://localhost:8080/assessment/generate`,
        { courseId, moduleIndex: selectedModule },
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Refresh assessments list
      await fetchAssessments();
      
      // Show success message
      alert("Assessment generated successfully!");
      
      // Navigate to the edit page for the new assessment
      if (response.data && response.data.assessment && response.data.assessment._id) {
        navigate(`/admin/assessment/${response.data.assessment._id}`);
      }
    } catch (error) {
      console.error("Error generating assessment:", error);
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert("Failed to generate assessment. Please try again.");
      }
    }
  };
  
  const handleAudioUpload = async (e) => {
    e.preventDefault();
    
    if (!audioFile) {
      setError("Please select an audio file to upload.");
      return;
    }
    
    setUploadingAudio(true);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("title", audioTitle);
      formData.append("description", audioDescription);
      formData.append("courseId", courseId);
      formData.append("moduleIndex", selectedModule);
      
      // Send to backend
      await axios.post("http://localhost:8080/upload-podcast", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      // Reset form and close modal
      setAudioFile(null);
      setAudioTitle("");
      setAudioDescription("");
      setShowAudioModal(false);
      
      // Refresh study materials
      fetchStudyMaterials();
    } catch (error) {
      console.error("Error uploading podcast:", error);
      setError("Failed to upload podcast audio.");
    } finally {
      setUploadingAudio(false);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("audio/")) {
        setError("Please select a valid audio file.");
        return;
      }
      
      setAudioFile(file);
    }
  };
  
  const handleDeletePodcast = async (podcastId) => {
    if (!window.confirm("Are you sure you want to delete this podcast?")) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:8080/podcasts/${podcastId}`);
      fetchStudyMaterials();
    } catch (error) {
      console.error("Error deleting podcast:", error);
      setError("Failed to delete podcast.");
    }
  };
  
  // Apply search and category filters to content
  const applyContentFilters = (originalContent) => {
    let content = originalContent || "";
    let filteredLines = content.split('\n');
    
    // Apply search term filter if present
    if (searchTerm.trim()) {
      const searchPattern = new RegExp(searchTerm.trim(), 'gi');
      filteredLines = filteredLines.filter(line => searchPattern.test(line));
    }
    
    // Apply category filter if not set to "all"
    if (filterCategory !== "all") {
      // Store sections we're currently collecting (for multi-line matching)
      let collectingSection = false;
      let collectedLines = [];
      
      switch (filterCategory) {
        case "headings":
          // Match lines starting with #, ##, etc.
          filteredLines = filteredLines.filter(line => /^#{1,6}\s+.+/.test(line));
          break;
          
        case "code":
          // Match code blocks and their content
          filteredLines = filteredLines.reduce((acc, line) => {
            if (line.trim().startsWith('```')) {
              collectingSection = !collectingSection;
              acc.push(line);
            } else if (collectingSection) {
              acc.push(line);
            }
            return acc;
          }, []);
          break;
          
        case "examples":
          // Match lines containing "example" or "instance" case insensitive
          filteredLines = filteredLines.filter(line => 
            /example|instance|e\.g\./i.test(line)
          );
          break;
          
        case "definitions":
          // Match lines containing "definition", "defined as", or "means" case insensitive
          filteredLines = filteredLines.filter(line => 
            /definition|defined as|means|refers to|is a/i.test(line)
          );
          break;
      }
    }
    
    // Combine filtered lines back into content
    const updatedContent = filteredLines.join('\n');
    setFilteredContent(updatedContent);
    
    // Render markdown to HTML
    renderMarkdown(updatedContent);
  };
  
  // Function to render markdown
  const renderMarkdown = (markdownContent) => {
    if (!markdownContent) {
      setRenderedContent("");
      return;
    }
    
    try {
      // Highlight search terms if present
      let processedContent = markdownContent;
      
      if (searchTerm.trim()) {
        // Escape special regex characters in search term
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchPattern = new RegExp(`(${escapedSearchTerm})`, 'gi');
        
        // Replace instances of search term with marked version
        processedContent = processedContent.replace(
          searchPattern, 
          '<mark class="aitut_studymat_highlight">$1</mark>'
        );
      }
      
      // Convert markdown to HTML
      const html = marked(processedContent);
      setRenderedContent(html);
    } catch (error) {
      console.error("Error rendering markdown:", error);
      setRenderedContent(`<p>Error rendering content: ${error.message}</p>`);
    }
  };
  
  // Apply filters when filter settings change
  useEffect(() => {
    const currentMaterial = getCurrentMaterial();
    if (currentMaterial) {
      applyContentFilters(currentMaterial.content);
    }
  }, [searchTerm, filterCategory]);
  
  // Render podcast section
  const renderPodcastsSection = () => {
    const currentMaterial = getCurrentMaterial();
    
    return (
      <div className="aitut_studymat_podcasts_section">
        <h3>Module Podcasts</h3>
        
        {currentMaterial && currentMaterial.podcasts && currentMaterial.podcasts.length > 0 ? (
          <div className="aitut_studymat_podcasts_list">
            {currentMaterial.podcasts.map((podcast, index) => (
              <div key={index} className="aitut_studymat_podcast_item">
                <div className="aitut_studymat_podcast_info">
                  <h4>{podcast.title}</h4>
                  <p>{podcast.description}</p>
                </div>
                <div className="aitut_studymat_podcast_player">
                  <audio controls src={podcast.fileUrl}>
                    Your browser does not support the audio element.
                  </audio>
                  <button 
                    className="aitut_studymat_delete_podcast_btn" 
                    onClick={() => handleDeletePodcast(podcast._id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="aitut_studymat_no_podcasts">No podcasts available for this module</p>
        )}
      </div>
    );
  };
  
  // Render assessment section
  const renderAssessmentSection = () => {
    const hasAssessment = hasAssessmentForModule(selectedModule);
    const assessment = assessments.find(a => a.moduleIndex === selectedModule);
    
    return (
      <div className="aitut_studymat_assessment_section">
        <h3>Module Assessment</h3>
        
        {hasAssessment ? (
          <div className="aitut_studymat_assessment_info">
            <div className="aitut_studymat_assessment_status">
              <FaClipboardCheck className="aitut_studymat_assessment_icon" />
              <div className="aitut_studymat_assessment_details">
                <span className="aitut_studymat_assessment_badge">Assessment Available</span>
                <p>Questions: {assessment?.questionCount || assessment?.questions?.length || 'N/A'}</p>
                <p>Time Limit: {assessment?.timeLimit || 15} minutes</p>
              </div>
            </div>
            
            <div className="aitut_studymat_assessment_actions">
              <button
                className="aitut_studymat_edit_assessment_btn"
                onClick={() => navigate(`/admin/assessment/${assessment._id}`)}
              >
                <FaEdit /> Edit Assessment
              </button>
              
              <button
                className="aitut_studymat_view_results_btn"
                onClick={() => navigate(`/admin/courses/${courseId}/assessment-results?moduleIndex=${selectedModule}`)}
              >
                <FaChartLine /> View Results
              </button>
            </div>
          </div>
        ) : (
          <div className="aitut_studymat_no_assessment">
            <p>No assessment available for this module.</p>
            <button
              className="aitut_studymat_generate_assessment_btn"
              onClick={handleGenerateAssessment}
            >
              <FaClipboardCheck /> Generate Assessment
            </button>
          </div>
        )}
      </div>
    );
  };
  
  if (loading && !course) {
    return <div className="aitut_studymat_loading">Loading course data...</div>;
  }
  
  if (error) {
    return (
      <div className="aitut_studymat_error_container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/admin/courses")}>Back to Courses</button>
      </div>
    );
  }
  
  if (!course) {
    return <div className="aitut_studymat_error_container">Course not found</div>;
  }
  
  const currentMaterial = getCurrentMaterial();
  
  return (
    <div className="aitut_studymat_manager">
      <div className="aitut_studymat_manager_header">
        <button 
          className="aitut_studymat_back_button"
          onClick={() => navigate("/admin/courses")}
        >
          <FaArrowLeft /> Back to Courses
        </button>
        <h1>Study Materials - Course Title: {course.title}</h1>
      </div>
      
      <div className="aitut_studymat_manager_container">
        <div className="aitut_studymat_modules_sidebar">
          <h2>Modules</h2>
          <div className="aitut_studymat_modules_list">
            {course.modules && course.modules.map((module, index) => {
              // Find if this module has study materials and assessments
              const hasMaterial = studyMaterials.some(m => m.moduleIndex === index);
              const hasAssessment = hasAssessmentForModule(index);
              
              return (
                <div 
                  key={index}
                  className={`aitut_studymat_module_item ${selectedModule === index ? 'selected' : ''} ${hasMaterial ? 'has-material' : 'no-material'}`}
                  onClick={() => handleModuleChange(index)}
                >
                  <div className="aitut_studymat_module_number">{index + 1}</div>
                  <div className="aitut_studymat_module_info">
                    <div className="aitut_studymat_module_title">{module.title}</div>
                    <div className="aitut_studymat_module_badges">
                      {hasMaterial ? (
                        <span className="aitut_studymat_material_status">Has Materials</span>
                      ) : (
                        <span className="aitut_studymat_material_status missing">No Materials</span>
                      )}
                      
                      {hasAssessment ? (
                        <span className="aitut_studymat_assessment_status">Has Assessment</span>
                      ) : (
                        <span className="aitut_studymat_assessment_status missing">No Assessment</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="aitut_studymat_module_actions">
                    <button
                      className="aitut_studymat_module_assessment_btn"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent click
                        
                        // If assessment exists, navigate to editor, otherwise offer to generate
                        const assessment = assessments.find(a => a.moduleIndex === index);
                        if (assessment) {
                          navigate(`/admin/assessment/${assessment._id}`);
                        } else {
                          setSelectedModule(index);
                          setTimeout(() => {
                            handleGenerateAssessment();
                          }, 100);
                        }
                      }}
                      title={hasAssessment ? "Edit assessment" : "Generate assessment"}
                    >
                      <FaClipboardCheck />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Assessment Management Button */}
          <div className="aitut_studymat_sidebar_actions">
            <button 
              className="aitut_studymat_assessment_mgmt_button"
              onClick={() => navigate(`/admin/courses/${courseId}/assessments`)}
            >
              <FaClipboardCheck /> Manage All Assessments
            </button>
          </div>
        </div>
        
        <div className="aitut_studymat_content_area">
          <div className="aitut_studymat_module_title_bar">
            <h2>
              Module {selectedModule + 1}: {course.modules && course.modules[selectedModule] 
                ? course.modules[selectedModule].title 
                : 'Unknown Module'}
            </h2>
          </div>
          
          <div className="aitut_studymat_content_actions">
            {!editMode ? (
              <>
                <button 
                  className="aitut_studymat_filter_button" 
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                >
                  <FaFilter /> Filter Content
                </button>
                <button 
                  className="aitut_studymat_edit_button" 
                  onClick={handleEditToggle}
                >
                  <FaEdit /> Edit Content
                </button>
              </>
            ) : (
              <button 
                className="aitut_studymat_save_button" 
                onClick={handleSaveContent}
              >
                <FaSave /> Save Changes
              </button>
            )}
            
            <button 
              className="aitut_studymat_add_podcast_button"
              onClick={() => setShowAudioModal(true)}
            >
              <FaHeadphones /> Add Podcast
            </button>
            
            <button 
              className="aitut_studymat_assessment_button" 
              onClick={() => hasAssessmentForModule(selectedModule) 
                ? navigate(`/admin/assessment/${assessments.find(a => a.moduleIndex === selectedModule)._id}`)
                : handleGenerateAssessment()
              }
            >
              <FaClipboardCheck /> {hasAssessmentForModule(selectedModule) ? 'Edit Assessment' : 'Generate Assessment'}
            </button>
          </div>
          
          {showFilterPanel && !editMode && (
            <div className="aitut_studymat_filter_panel">
              <div className="aitut_studymat_search_box">
                <FaSearch className="aitut_studymat_search_icon" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="aitut_studymat_category_filter">
                <label>Filter by:</label>
                <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Content</option>
                  <option value="headings">Headings Only</option>
                  <option value="code">Code Examples</option>
                  <option value="examples">Examples</option>
                  <option value="definitions">Definitions</option>
                </select>
              </div>
              
              {(searchTerm || filterCategory !== "all") && (
                <button 
                  className="aitut_studymat_clear_filters_btn"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCategory("all");
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
          
          {editMode ? (
            <div className="aitut_studymat_editor_container">
              <textarea
                className="aitut_studymat_markdown_editor"
                value={editContent}
                onChange={handleContentChange}
                placeholder="Enter study material content in Markdown format..."
              />
              <div className="aitut_studymat_editor_help">
                <h3>Markdown Tips</h3>
                <p># Heading 1</p>
                <p>## Heading 2</p>
                <p>**Bold Text**</p>
                <p>*Italic Text*</p>
                <p>- Bullet points</p>
                <p>1. Numbered list</p>
                <p>```code blocks```</p>
                <p>[Link text](url)</p>
              </div>
            </div>
          ) : (
            <div className="aitut_studymat_content_display">
              {currentMaterial ? (
                <>
                  {(searchTerm || filterCategory !== "all") && (
                    <div className="aitut_studymat_filter_info">
                      <p>
                        {searchTerm && filterCategory !== "all" ? (
                          <>Showing filtered content: <span className="aitut_studymat_filter_term">"{searchTerm}"</span> in category <span className="aitut_studymat_filter_category">{filterCategory}</span></>
                        ) : searchTerm ? (
                          <>Showing content with: <span className="aitut_studymat_filter_term">"{searchTerm}"</span></>
                        ) : (
                          <>Showing content category: <span className="aitut_studymat_filter_category">{filterCategory}</span></>
                        )}
                      </p>
                    </div>
                  )}
                  
                  <div className="aitut_studymat_markdown_content">
                    {renderedContent ? (
                      <div 
                        className="aitut_studymat_rendered_markdown"
                        dangerouslySetInnerHTML={{ __html: renderedContent }} 
                      />
                    ) : (
                      <p className="aitut_studymat_no_matches">No content matches your filter criteria.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="aitut_studymat_no_content">
                  <p>No study material exists for this module.</p>
                  <button 
                    className="aitut_studymat_create_button"
                    onClick={handleEditToggle}
                  >
                    <FaPlus /> Create Study Material
                  </button>
                </div>
              )}
              
              {/* Podcasts section */}
              {renderPodcastsSection()}
              
              {/* Assessment section */}
              {renderAssessmentSection()}
            </div>
          )}
        </div>
      </div>
      
      {/* Audio Upload Modal */}
      {showAudioModal && (
        <div className="aitut_studymat_modal_overlay">
          <div className="aitut_studymat_modal_content">
            <div className="aitut_studymat_modal_header">
              <h2>Add Podcast Audio</h2>
              <button 
                className="aitut_studymat_close_modal_btn"
                onClick={() => setShowAudioModal(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAudioUpload} className="aitut_studymat_podcast_form">
              <div className="aitut_studymat_form_group">
                <label htmlFor="audio-title">Title</label>
                <input
                  id="audio-title"
                  type="text"
                  value={audioTitle}
                  onChange={(e) => setAudioTitle(e.target.value)}
                  placeholder="Enter podcast title"
                  required
                />
              </div>
              
              <div className="aitut_studymat_form_group">
                <label htmlFor="audio-description">Description</label>
                <textarea
                  id="audio-description"
                  value={audioDescription}
                  onChange={(e) => setAudioDescription(e.target.value)}
                  placeholder="Enter podcast description"
                  rows="3"
                  required
                ></textarea>
              </div>
              
                              <div className="aitut_studymat_form_group">
                <label htmlFor="audio-file">Audio File (MP3, WAV, etc.)</label>
                <input
                  id="audio-file"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  required
                />
                {audioFile && (
                  <div className="aitut_studymat_file_info">
                    Selected file: {audioFile.name} ({Math.round(audioFile.size / 1024)} KB)
                  </div>
                )}
              </div>
              
              <div className="aitut_studymat_form_actions">
                <button 
                  type="button" 
                  className="aitut_studymat_cancel_btn"
                  onClick={() => setShowAudioModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="aitut_studymat_submit_btn"
                  disabled={uploadingAudio || !audioFile}
                >
                  {uploadingAudio ? "Uploading..." : "Upload Podcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMaterialsManager;