import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaBook, FaExclamationTriangle, FaPlus, FaPodcast, FaFilePdf, FaChevronRight } from "react-icons/fa";
import "./StudyMaterialsDashboard.css";

const StudyMaterialsDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studyMaterials, setStudyMaterials] = useState({});
  const [podcasts, setPodcasts] = useState({});

  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch all courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8080/all");
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch study materials and podcasts for a course
  const fetchCourseContent = async (courseId) => {
    try {
      // Fetch study materials
      const materialsResponse = await axios.get(`http://localhost:8080/study-materials/${courseId}`);
      setStudyMaterials({
        ...studyMaterials,
        [courseId]: materialsResponse.data
      });
      
      // We'll fetch podcasts for each module as needed
      setPodcasts({
        ...podcasts,
        [courseId]: {}
      });
    } catch (error) {
      console.error("Error fetching course content:", error);
    }
  };

  // Fetch podcasts for a specific module
  const fetchModulePodcasts = async (courseId, moduleIndex) => {
    try {
      const response = await axios.get(`http://localhost:8080/podcasts/${courseId}/${moduleIndex}`);
      
      setPodcasts(prev => ({
        ...prev,
        [courseId]: {
          ...prev[courseId],
          [moduleIndex]: response.data
        }
      }));
    } catch (error) {
      console.error("Error fetching podcasts:", error);
    }
  };

  // Toggle course expansion
  const toggleCourseExpansion = (courseId) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(courseId);
      
      // Fetch content if we don't have it yet
      if (!studyMaterials[courseId]) {
        fetchCourseContent(courseId);
      }
    }
  };

  // Check if module has study material
  const hasStudyMaterial = (courseId, moduleIndex) => {
    if (!studyMaterials[courseId]) return false;
    
    return studyMaterials[courseId].some(
      material => material.moduleIndex === moduleIndex
    );
  };

  // Get podcasts for a module
  const getModulePodcasts = (courseId, moduleIndex) => {
    if (!podcasts[courseId] || !podcasts[courseId][moduleIndex]) {
      return [];
    }
    return podcasts[courseId][moduleIndex];
  };

  // Handle click on module row
  const handleModuleClick = (courseId, moduleIndex) => {
    // Fetch podcasts if we don't have them yet
    if (!podcasts[courseId] || !podcasts[courseId][moduleIndex]) {
      fetchModulePodcasts(courseId, moduleIndex);
    }
  };

  if (loading && courses.length === 0) {
    return <div className="aitut_studymat_dash_loading">Loading courses...</div>;
  }

  if (error) {
    return (
      <div className="aitut_studymat_dash_error">
        <FaExclamationTriangle />
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="aitut_studymat_dashboard">
      <div className="aitut_studymat_dash_header">
        <h1>
          <FaBook /> Study Materials Dashboard
        </h1>
        <p>Manage study materials and podcasts for all courses</p>
      </div>

      <div className="aitut_studymat_dash_courses_list">
        {courses.length > 0 ? (
          courses.map(course => (
            <div key={course._id} className="aitut_studymat_dash_course_card">
              <div 
                className="aitut_studymat_dash_course_header"
                onClick={() => toggleCourseExpansion(course._id)}
              >
                <div className="aitut_studymat_dash_course_info">
                  <h2>{course.title}</h2>
                  <div className="aitut_studymat_dash_course_meta">
                    <span className="aitut_studymat_dash_course_category">{course.category}</span>
                    <span className="aitut_studymat_dash_course_level">{course.level}</span>
                    <span className={`aitut_studymat_dash_course_status ${course.isPublished ? 'published' : 'draft'}`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className={`aitut_studymat_dash_expansion_icon ${expandedCourse === course._id ? 'expanded' : ''}`}>
                  <FaChevronRight />
                </div>
              </div>

              {expandedCourse === course._id && (
                <div className="aitut_studymat_dash_course_details">
                  <div className="aitut_studymat_dash_details_header">
                    <h3>Modules and Study Materials</h3>
                    <Link 
                      to={`/admin/course/${course._id}/study-materials`}
                      className="aitut_studymat_dash_manage_link"
                    >
                      Manage Study Materials
                    </Link>
                  </div>

                  {course.modules && course.modules.length > 0 ? (
                    <div className="aitut_studymat_dash_modules_table_container">
                      <table className="aitut_studymat_dash_modules_table">
                        <thead>
                          <tr>
                            <th>Module</th>
                            <th>Study Material</th>
                            <th>Podcasts</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {course.modules.map((module, index) => {
                            const hasMaterial = hasStudyMaterial(course._id, index);
                            const modulePodcasts = getModulePodcasts(course._id, index);
                            
                            return (
                              <tr 
                                key={index}
                                onClick={() => handleModuleClick(course._id, index)}
                                className={hasMaterial ? 'has-material' : 'no-material'}
                              >
                                <td>
                                  <div className="aitut_studymat_dash_module_name">
                                    <span className="aitut_studymat_dash_module_number">{index + 1}</span>
                                    {module.title}
                                  </div>
                                </td>
                                <td>
                                  {hasMaterial ? (
                                    <span className="aitut_studymat_dash_material_status available">
                                      Available
                                    </span>
                                  ) : (
                                    <span className="aitut_studymat_dash_material_status missing">
                                      Not Available
                                    </span>
                                  )}
                                </td>
                                <td>
                                  {podcasts[course._id] && podcasts[course._id][index] ? (
                                    <span className="aitut_studymat_dash_podcast_count">
                                      {modulePodcasts.length} podcast{modulePodcasts.length !== 1 ? 's' : ''}
                                    </span>
                                  ) : (
                                    <span className="aitut_studymat_dash_podcast_count empty">None</span>
                                  )}
                                </td>
                                <td>
                                  <div className="aitut_studymat_dash_module_actions">
                                    <Link 
                                      to={`/admin/course/${course._id}/study-materials?module=${index}`}
                                      className="aitut_studymat_dash_action_btn edit-btn"
                                      title="Edit Study Material"
                                    >
                                      <FaBook />
                                    </Link>
                                    <Link 
                                      to={`/admin/course/${course._id}/study-materials?module=${index}&podcastModal=true`}
                                      className="aitut_studymat_dash_action_btn podcast-btn"
                                      title="Add Podcast"
                                    >
                                      <FaPodcast />
                                    </Link>
                                    <button 
                                      className="aitut_studymat_dash_action_btn pdf-btn"
                                      title="Generate PDF"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`http://localhost:8080/generate-pdf?courseId=${course._id}&moduleIndex=${index}`, '_blank');
                                      }}
                                      disabled={!hasMaterial}
                                    >
                                      <FaFilePdf />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="aitut_studymat_dash_no_modules">
                      <p>This course doesn't have any modules yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="aitut_studymat_dash_no_courses">
            <p>No courses found. Create a course to add study materials.</p>
            <Link to="/admin/courses" className="aitut_studymat_dash_create_course_btn">
              <FaPlus /> Create Course
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterialsDashboard;