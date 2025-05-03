import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUsers, FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaSort, FaChartLine, FaGraduationCap, FaBook, FaClipboardList, FaCog, FaSignOutAlt } from 'react-icons/fa';
import './AdminPages.css';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Extract role filter from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const role = params.get('role');
    if (role) {
      setRoleFilter(role);
    }
  }, [location]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // In a real app, you'd have a proper API endpoint for this
        // This uses the recent users endpoint as a fallback
        const response = await axios.get('http://localhost:8080/admin/recent-users', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // If your API supports pagination, you would use that instead
        setUsers(response.data);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setIsError(true);
        setErrorMessage('Failed to fetch users. Please try again.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate, itemsPerPage]);

  // Filter and sort users when users array, search term, or filters change
  useEffect(() => {
    // Filter based on search term and role
    let result = [...users];
    
    if (searchTerm) {
      result = result.filter(
        user => 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Sort users
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'email') {
        comparison = a.email.localeCompare(b.email);
      } else if (sortField === 'role') {
        comparison = a.role.localeCompare(b.role);
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredUsers(result);
    setTotalPages(Math.ceil(result.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, roleFilter, sortField, sortDirection, itemsPerPage]);

  // Get current page items
  const getCurrentItems = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle sort change
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Select/Deselect all users
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(getCurrentItems().map(user => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Select/Deselect a single user
  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Open edit modal for a user
  const handleEditUser = (user) => {
    setCurrentUser(user);
    setEditModalOpen(true);
  };

  // Save edited user
  const handleSaveUser = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      // In a real application, you would have a proper API endpoint
      await axios.put(`http://localhost:8080/admin/users/${currentUser._id}`, 
        {
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user._id === currentUser._id ? currentUser : user
      ));
      
      setEditModalOpen(false);
      setIsSuccess(true);
      setSuccessMessage('User updated successfully!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error updating user:', error);
      setIsError(true);
      setErrorMessage('Failed to update user. Please try again.');
      
      // Hide error message after 3 seconds
      setTimeout(() => {
        setIsError(false);
      }, 3000);
    }
  };

  // Open delete confirmation modal
  const handleDeleteConfirm = (user) => {
    setCurrentUser(user);
    setConfirmDeleteOpen(true);
  };

  // Delete user
  const handleDeleteUser = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // In a real application, you would have a proper API endpoint
      await axios.delete(`http://localhost:8080/admin/users/${currentUser._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove user from the local state
      setUsers(users.filter(user => user._id !== currentUser._id));
      setSelectedUsers(selectedUsers.filter(id => id !== currentUser._id));
      
      setConfirmDeleteOpen(false);
      setIsSuccess(true);
      setSuccessMessage('User deleted successfully!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting user:', error);
      setIsError(true);
      setErrorMessage('Failed to delete user. Please try again.');
      
      // Hide error message after 3 seconds
      setTimeout(() => {
        setIsError(false);
      }, 3000);
    }
  };

  // Delete selected users
  const handleDeleteSelected = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // In a real application, you would use a bulk delete endpoint
      for (const userId of selectedUsers) {
        await axios.delete(`http://localhost:8080/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Remove deleted users from the local state
      setUsers(users.filter(user => !selectedUsers.includes(user._id)));
      setSelectedUsers([]);
      
      setIsSuccess(true);
      setSuccessMessage(`${selectedUsers.length} users deleted successfully!`);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting users:', error);
      setIsError(true);
      setErrorMessage('Failed to delete users. Please try again.');
      
      // Hide error message after 3 seconds
      setTimeout(() => {
        setIsError(false);
      }, 3000);
    }
  };

  // Handle navigation
  const handleNavigate = (path) => {
    navigate(path);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="admin-app">
      <div className="admin-dashboard">
        {/* Sidebar */}
        <div className="admin-sidebar">
          <div className="admin-logo">
            <h2>NeuraleLearn</h2>
            <p>Admin Portal</p>
          </div>
          <div className="admin-nav">
            <button className="admin-nav-item" onClick={() => handleNavigate('/admin-dashboard')}>
              <FaChartLine /> <span>Dashboard</span>
            </button>
            <button className="admin-nav-item admin-nav-active">
              <FaUsers /> <span>Manage Users</span>
            </button>
            <button className="admin-nav-item" onClick={() => handleNavigate('/admin/courses')}>
              <FaGraduationCap /> <span>Manage Courses</span>
            </button>
            <button className="admin-nav-item" onClick={() => handleNavigate('/admin/study-materials')}>
              <FaBook /> <span>Study Materials</span>
            </button>
            <button className="admin-nav-item" onClick={() => handleNavigate('/admin/reports')}>
              <FaChartLine /> <span>Reports</span>
            </button>
            
          </div>
          <div className="admin-sidebar-footer">
            <button className="admin-logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="admin-main">
          <div className="admin-header">
            <div className="admin-title">
              <h1>Manage Users</h1>
              <p className="admin-subtitle">View, add, edit, and manage user accounts</p>
            </div>
            <div className="admin-header-actions">
              <button className="admin-action-btn" onClick={() => handleNavigate('/admin/users/new')}>
                <FaPlus /> Add New User
              </button>
            </div>
          </div>

          {/* Success Message */}
          {isSuccess && (
            <div className="admin-alert admin-alert-success">
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {isError && (
            <div className="admin-alert admin-alert-error">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Users Management Panel */}
          <div className="admin-panel">
            {/* Filter and Search Section */}
            <div className="admin-filters">
              <div className="admin-search">
                <FaSearch className="admin-search-icon" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="admin-filter-group">
                <div className="admin-filter">
                  <FaFilter />
                  <select 
                    value={roleFilter} 
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div className="admin-filter">
                  <FaSort />
                  <select 
                    value={`${sortField}-${sortDirection}`} 
                    onChange={(e) => {
                      const [field, direction] = e.target.value.split('-');
                      setSortField(field);
                      setSortDirection(direction);
                    }}
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="email-asc">Email (A-Z)</option>
                    <option value="email-desc">Email (Z-A)</option>
                    <option value="role-asc">Role (A-Z)</option>
                    <option value="role-desc">Role (Z-A)</option>
                    <option value="createdAt-asc">Date Created (Oldest)</option>
                    <option value="createdAt-desc">Date Created (Newest)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="admin-bulk-actions">
                <span>{selectedUsers.length} users selected</span>
                <button 
                  className="admin-delete-btn"
                  onClick={handleDeleteSelected}
                >
                  <FaTrash /> Delete Selected
                </button>
              </div>
            )}

            {/* Users Table */}
            {loading ? (
              <div className="admin-loading">
                <div className="admin-loading-spinner"></div>
                <p>Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="admin-no-data">
                <p>No users found matching your filters.</p>
                <button 
                  className="admin-action-btn"
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>
                        <input 
                          type="checkbox" 
                          onChange={handleSelectAll}
                          checked={getCurrentItems().length > 0 && getCurrentItems().every(user => selectedUsers.includes(user._id))}
                        />
                      </th>
                      <th onClick={() => handleSort('name')} className="admin-sortable-th">
                        Name {sortField === 'name' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th onClick={() => handleSort('email')} className="admin-sortable-th">
                        Email {sortField === 'email' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th onClick={() => handleSort('role')} className="admin-sortable-th">
                        Role {sortField === 'role' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th onClick={() => handleSort('createdAt')} className="admin-sortable-th">
                        Date Created {sortField === 'createdAt' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentItems().map(user => (
                      <tr key={user._id}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => handleSelectUser(user._id)}
                          />
                        </td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`admin-role-badge ${user.role === 'admin' ? 'admin-role-admin' : 'admin-role-user'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="admin-table-actions">
                            <button 
                              className="admin-edit-btn"
                              onClick={() => handleEditUser(user)}
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className="admin-delete-btn"
                              onClick={() => handleDeleteConfirm(user)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {filteredUsers.length > 0 && (
              <div className="admin-pagination">
                <button 
                  onClick={() => handlePageChange(1)} 
                  disabled={currentPage === 1}
                  className="admin-pagination-btn"
                >
                  First
                </button>
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="admin-pagination-btn"
                >
                  Previous
                </button>
                
                <div className="admin-pagination-info">
                  Page {currentPage} of {totalPages}
                </div>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="admin-pagination-btn"
                >
                  Next
                </button>
                <button 
                  onClick={() => handlePageChange(totalPages)} 
                  disabled={currentPage === totalPages}
                  className="admin-pagination-btn"
                >
                  Last
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {editModalOpen && currentUser && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Edit User</h2>
              <button 
                className="admin-modal-close"
                onClick={() => setEditModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={currentUser.name}
                    onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={currentUser.email}
                    onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    value={currentUser.role}
                    onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  className="admin-btn-secondary"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="admin-btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteOpen && currentUser && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Confirm Delete</h2>
              <button 
                className="admin-modal-close"
                onClick={() => setConfirmDeleteOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <p>Are you sure you want to delete user <strong>{currentUser.name}</strong>?</p>
              <p className="admin-warning">This action cannot be undone.</p>
            </div>
            <div className="admin-modal-footer">
              <button 
                className="admin-btn-secondary"
                onClick={() => setConfirmDeleteOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="admin-btn-danger"
                onClick={handleDeleteUser}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;