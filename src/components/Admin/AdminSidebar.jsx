// AdminSidebar.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaChartLine, 
  FaUsers, 
  FaGraduationCap, 
  FaBook, 
  FaClipboardList,
  FaSignOutAlt 
} from 'react-icons/fa';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Check if the current path matches the navigation item
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <div className="aitut_admin_sidebar aitut_admin_sidebar_component">
      <div className="aitut_admin_sidebar_logo">
        <h2>NeuraleLearn</h2>
        <p>Admin Portal</p>
      </div>
      <div className="aitut_admin_sidebar_nav">
        <button 
          className={`aitut_admin_sidebar_nav_item ${isActive('/admin-dashboard') ? 'aitut_admin_sidebar_nav_active' : ''}`} 
          onClick={() => navigate('/admin-dashboard')}
        >
          <FaChartLine /> <span>Dashboard</span>
        </button>
        <button 
          className={`aitut_admin_sidebar_nav_item ${isActive('/admin/users') ? 'aitut_admin_sidebar_nav_active' : ''}`} 
          onClick={() => navigate('/admin/users')}
        >
          <FaUsers /> <span>Manage Users</span>
        </button>
        <button 
          className={`aitut_admin_sidebar_nav_item ${isActive('/admin/courses') ? 'aitut_admin_sidebar_nav_active' : ''}`} 
          onClick={() => navigate('/admin/courses')}
        >
          <FaGraduationCap /> <span>Manage Courses</span>
        </button>
        <button 
          className={`aitut_admin_sidebar_nav_item ${isActive('/admin/study-materials') ? 'aitut_admin_sidebar_nav_active' : ''}`} 
          onClick={() => navigate('/admin/study-materials')}
        >
          <FaBook /> <span>Study Materials</span>
        </button>
       
        <button 
          className={`aitut_admin_sidebar_nav_item ${isActive('/admin/reports') ? 'aitut_admin_sidebar_nav_active' : ''}`} 
          onClick={() => navigate('/admin/reports')}
        >
          <FaChartLine /> <span>Reports</span>
        </button>
      </div>
      <div className="aitut_admin_sidebar_footer">
        <button className="aitut_admin_sidebar_logout_btn" onClick={handleLogout}>
          <FaSignOutAlt /> <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;