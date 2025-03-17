import React, { useState, useEffect } from "react";
import "./AdminCourses.css";
import axios from "axios";

// Icons for UI
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaRobot,
  FaBook
} from "react-icons/fa";
import { MdPublish, MdUnpublished } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const AdminCourses = () => {
  // State management
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  // Modal state management
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    instructor: "",
    duration: 0,
    level: "Beginner",
    isPublished: false,
    thumbnail: "",
    modules: []
  });

  // AI generation state
  const [generateWithAI, setGenerateWithAI] = useState(false);
  const [generatingAIContent, setGeneratingAIContent] = useState(false);

  // Current editing status
  const [editingId, setEditingId] = useState(null);

  // Track module being edited
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    order: 0
  });

  // Modal for module editing
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModuleIndex, setEditingModuleIndex] = useState(null);

  const navigate = useNavigate();

  // Fetch data on component mount
  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const API_URL = "http://localhost:8080";

  // Fetch courses with filters
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      // Building the URL with query parameters for filtering
      let url = `${API_URL}/all`;

      const params = new URLSearchParams();
      if (filterCategory) params.append("category", filterCategory);
      if (filterLevel) params.append("level", filterLevel);
      if (searchTerm) params.append("search", searchTerm);

      const queryString = params.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }

      const response = await axios.get(url);
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleManageStudyMaterials = (courseId) => {
    navigate(`/admin/course/${courseId}/study-materials`);
  };
  // Fetch unique categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  // Generate content using AI
  const generateContentWithAI = async () => {
    if (!form.title || !form.description || !form.category) {
      setError("Please provide at least title, description, and category to generate content");
      return;
    }

    setGeneratingAIContent(true);
    try {
      const response = await axios.post(`${API_URL}/generate-content`, {
        title: form.title,
        description: form.description,
        category: form.category,
        level: form.level,
        duration: form.duration
      });

      if (response.data && response.data.modules) {
        setForm({
          ...form,
          modules: response.data.modules.map(module => ({
            title: module.title,
            description: module.description,
            order: module.order
          }))
        });
      }
    } catch (error) {
      console.error("Error generating AI content:", error);
      setError("Failed to generate content with AI. Please try again or add modules manually.");
    } finally {
      setGeneratingAIContent(false);
    }
  };

  // Handle form submission for course
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = {
        ...form,
        generateContentWithAI: generateWithAI
      };

      if (editingId) {
        await axios.put(`${API_URL}/update/${editingId}`, formData);
      } else {
        await axios.post(`${API_URL}/add`, formData);
      }

      fetchCourses();
      resetForm();
      setShowModal(false);
      setGenerateWithAI(false);
    } catch (error) {
      console.error("Error submitting course:", error);
      setError("Failed to save course. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset the form to default values
  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      category: "",
      instructor: "",
      duration: 0,
      level: "Beginner",
      isPublished: false,
      thumbnail: "",
      modules: []
    });
    setEditingId(null);
    setGenerateWithAI(false);
  };

  // Prepare form for editing
  const handleEdit = (course) => {
    setForm({
      title: course.title,
      description: course.description,
      category: course.category,
      instructor: course.instructor || "",
      duration: course.duration || 0,
      level: course.level || "Beginner",
      isPublished: course.isPublished || false,
      thumbnail: course.thumbnail || "",
      modules: course.modules || []
    });
    setEditingId(course._id);
    setShowModal(true);
  };

  // Show delete confirmation
  const handleDeleteConfirm = (id) => {
    setConfirmDelete(id);
  };

  // Execute course deletion
  const handleDelete = async () => {
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/delete/${confirmDelete}`);
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      setError("Failed to delete course. Please try again.");
    } finally {
      setLoading(false);
      setConfirmDelete(null);
    }
  };

  // Toggle publish status
  const handleTogglePublish = async (id) => {
    setLoading(true);
    try {
      await axios.patch(`${API_URL}/toggle-publish/${id}`);
      fetchCourses();
    } catch (error) {
      console.error("Error toggling publish status:", error);
      setError("Failed to update publish status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle module form changes
  const handleModuleChange = (e) => {
    const { name, value } = e.target;
    setModuleForm({
      ...moduleForm,
      [name]: name === "order" ? parseInt(value, 10) : value
    });
  };

  // Add/edit module
  const handleModuleSubmit = (e) => {
    e.preventDefault();

    const updatedModules = [...form.modules];

    if (editingModuleIndex !== null) {
      // Update existing module
      updatedModules[editingModuleIndex] = moduleForm;
    } else {
      // Add new module
      updatedModules.push({
        ...moduleForm,
        order: form.modules.length + 1
      });
    }

    // Sort modules by order
    updatedModules.sort((a, b) => a.order - b.order);

    setForm({
      ...form,
      modules: updatedModules
    });

    setShowModuleModal(false);
    setEditingModuleIndex(null);
    setModuleForm({ title: "", description: "", order: 0 });
  };

  // Edit existing module
  const handleEditModule = (index) => {
    setModuleForm({ ...form.modules[index] });
    setEditingModuleIndex(index);
    setShowModuleModal(true);
  };

  // Remove module
  const handleRemoveModule = (index) => {
    const updatedModules = form.modules.filter((_, i) => i !== index);

    // Update order for remaining modules
    const reorderedModules = updatedModules.map((module, idx) => ({
      ...module,
      order: idx + 1
    }));

    setForm({
      ...form,
      modules: reorderedModules
    });
  };

  // Apply search and filters
  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  // Clear search and filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterCategory("");
    setFilterLevel("");
    fetchCourses();
  };

  return (
    <div className="admin-courses-container">
      {/* Header */}
      <header className="admin-courses-header">
        <h1>Course Management</h1>
        <button
          className="add-course-btn"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <FaPlus /> Add New Course
        </button>
      </header>

      {/* Filters and Search */}
      <div className="filters-container">
        <form onSubmit={handleApplyFilters} className="filters-form">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-select">
            <FaFilter className="filter-icon" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-select">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="filter-buttons">
            <button type="submit" className="apply-filters-btn">
              Apply Filters
            </button>
            <button
              type="button"
              className="clear-filters-btn"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading State */}
      {loading && <div className="loading-spinner">Loading...</div>}

      {/* Course List */}
      <div className="courses-table-container">
        {courses.length > 0 ? (
          <table className="courses-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Level</th>
                <th>Duration (hrs)</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id} className={course.isPublished ? "published-row" : "unpublished-row"}>
                  <td>{course.title}</td>
                  <td>{course.category}</td>
                  <td>{course.level || "Beginner"}</td>
                  <td>{course.duration || 0}</td>
                  <td>
                    <span className={`status-badge ${course.isPublished ? "published" : "unpublished"}`}>
                      {course.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td>{new Date(course.updatedAt || course.createdAt).toLocaleDateString()}</td>
                  <td className="action-buttons">
                    <button
                      className="aitut_admin_materials_btn"
                      title="Manage Study Materials"
                      onClick={() => handleManageStudyMaterials(course._id)}
                    >
                      <FaBook />
                    </button>
                    <button
                      className="view-btn"
                      title="View Course"
                      onClick={() => window.open(`/courses/${course._id}`, '_blank')}
                    >
                      <FaEye />
                    </button>
                    <button
                      className="edit-btn"
                      title="Edit Course"
                      onClick={() => handleEdit(course)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className={`publish-btn ${course.isPublished ? "unpublish" : "publish"}`}
                      title={course.isPublished ? "Unpublish Course" : "Publish Course"}
                      onClick={() => handleTogglePublish(course._id)}
                    >
                      {course.isPublished ? <MdUnpublished /> : <MdPublish />}
                    </button>
                    <button
                      className="delete-btn"
                      title="Delete Course"
                      onClick={() => handleDeleteConfirm(course._id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-courses">
            {!loading && <p>No courses found. Add a new course to get started.</p>}
          </div>
        )}
      </div>

      {/* Course Form Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? "Edit Course" : "Add New Course"}</h2>
              <button
                className="close-modal-btn"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="course-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">Course Title</label>
                  <input
                    id="title"
                    type="text"
                    placeholder="Enter course title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <input
                    id="category"
                    type="text"
                    list="category-list"
                    placeholder="Enter or select category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  />
                  <datalist id="category-list">
                    {categories.map((category, index) => (
                      <option key={index} value={category} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="instructor">Instructor</label>
                  <input
                    id="instructor"
                    type="text"
                    placeholder="Enter instructor name"
                    value={form.instructor}
                    onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="level">Level</label>
                  <select
                    id="level"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="duration">Duration (hours)</label>
                  <input
                    id="duration"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Course duration"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  rows="4"
                  placeholder="Enter course description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="thumbnail">Thumbnail URL</label>
                <input
                  id="thumbnail"
                  type="text"
                  placeholder="Enter thumbnail image URL"
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group publish-toggle">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                    />
                    <span className="checkmark"></span>
                    Publish course immediately
                  </label>
                </div>

                {/* New AI Generation Checkbox */}
                <div className="form-group ai-generate-toggle">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={generateWithAI}
                      onChange={(e) => setGenerateWithAI(e.target.checked)}
                      disabled={editingId !== null}
                    />
                    <span className="checkmark"></span>
                    Auto-generate study materials with AI
                  </label>
                </div>
              </div>

              {/* AI Generate button */}
              {!editingId && (
                <div className="ai-generate-container">
                  <button
                    type="button"
                    className="ai-generate-btn"
                    onClick={generateContentWithAI}
                    disabled={generatingAIContent || !form.title || !form.description || !form.category}
                  >
                    <FaRobot /> {generatingAIContent ? "Generating..." : "Generate Modules with AI"}
                  </button>
                  <p className="ai-generate-info">
                    Generate module structure based on your course details
                  </p>
                </div>
              )}

              {/* Course Modules Section */}
              <div className="modules-section">
                <div className="modules-header">
                  <h3>Course Modules</h3>
                  <button
                    type="button"
                    className="add-module-btn"
                    onClick={() => {
                      setModuleForm({ title: "", description: "", order: form.modules.length + 1 });
                      setEditingModuleIndex(null);
                      setShowModuleModal(true);
                    }}
                  >
                    <FaPlus /> Add Module
                  </button>
                </div>

                {form.modules.length > 0 ? (
                  <div className="modules-list">
                    {form.modules.map((module, index) => (
                      <div key={index} className="module-item">
                        <div className="module-info">
                          <span className="module-order">{module.order}.</span>
                          <div className="module-details">
                            <h4>{module.title}</h4>
                            <p>{module.description}</p>
                          </div>
                        </div>
                        <div className="module-actions">
                          <button
                            type="button"
                            className="edit-module-btn"
                            onClick={() => handleEditModule(index)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            className="remove-module-btn"
                            onClick={() => handleRemoveModule(index)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-modules">
                    {generatingAIContent ? "Generating modules..." : "No modules added yet. Add modules to structure your course."}
                  </p>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loading || generatingAIContent}>
                  {loading ? "Saving..." : (editingId ? "Update Course" : "Add Course")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Form Modal */}
      {showModuleModal && (
        <div className="modal-overlay">
          <div className="modal-content module-modal">
            <div className="modal-header">
              <h2>{editingModuleIndex !== null ? "Edit Module" : "Add Module"}</h2>
              <button
                className="close-modal-btn"
                onClick={() => {
                  setShowModuleModal(false);
                  setEditingModuleIndex(null);
                  setModuleForm({ title: "", description: "", order: 0 });
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleModuleSubmit} className="module-form">
              <div className="form-group">
                <label htmlFor="module-title">Module Title</label>
                <input
                  id="module-title"
                  type="text"
                  name="title"
                  placeholder="Enter module title"
                  value={moduleForm.title}
                  onChange={handleModuleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="module-description">Module Description</label>
                <textarea
                  id="module-description"
                  name="description"
                  rows="3"
                  placeholder="Enter module description"
                  value={moduleForm.description}
                  onChange={handleModuleChange}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="module-order">Order</label>
                <input
                  id="module-order"
                  type="number"
                  name="order"
                  min="1"
                  placeholder="Module order"
                  value={moduleForm.order}
                  onChange={handleModuleChange}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowModuleModal(false);
                  setEditingModuleIndex(null);
                  setModuleForm({ title: "", description: "", order: 0 });
                }}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingModuleIndex !== null ? "Update Module" : "Add Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button
                className="close-modal-btn"
                onClick={() => setConfirmDelete(null)}
              >
                &times;
              </button>
            </div>

            <div className="delete-confirmation">
              <p>Are you sure you want to delete this course? This action cannot be undone.</p>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="delete-confirm-btn"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete Course"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;