import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FaChartLine, FaUsers, FaGraduationCap, FaBook, 
  FaClipboardList, FaCog, FaSignOutAlt, FaCalendarAlt,
  FaFileDownload, FaFilter, FaChartBar, FaChartPie, FaChartArea
} from 'react-icons/fa';
import './AdminPages.css';

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('last30days');
  const [chartType, setChartType] = useState('bar');
  const [reportData, setReportData] = useState({
    overview: {
      totalUsers: 0,
      adminCount: 0,
      userCount: 0,
      totalCourses: 0,
      publishedCourses: 0,
      enrollmentCount: 0,
      totalQueries: 0
    },
    userActivity: {
      recentUsers: [],
      enrollmentsByMonth: []
    },
    courseAnalytics: {
      coursesByCategory: [],
      coursesByLevel: [],
      popularCourses: []
    },
    learningMetrics: {
      moduleCompletionRates: [],
      averageProgress: 0,
      completedCourses: 0
    }
  });
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch overview statistics first
        const statsResponse = await axios.get("http://localhost:8080/admin/stats", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const overview = {
          totalUsers: statsResponse.data.totalUsers || 0,
          adminCount: statsResponse.data.adminCount || 0,
          userCount: statsResponse.data.userCount || 0,
          totalCourses: statsResponse.data.courseCount || 0
        };

        // Fetch all courses to get additional data
        const coursesResponse = await axios.get("http://localhost:8080/all", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const courses = coursesResponse.data || [];
        
        // Calculate derived course metrics
        const publishedCourses = courses.filter(course => course.isPublished).length;
        const totalEnrollments = courses.reduce((total, course) => total + (course.enrollmentCount || 0), 0);
        
        // Process course categories
        const categories = {};
        courses.forEach(course => {
          if (course.category) {
            categories[course.category] = (categories[course.category] || 0) + 1;
          }
        });
        
        const coursesByCategory = Object.entries(categories).map(([name, value]) => ({ name, value }));
        
        // Process course levels
        const levels = {};
        courses.forEach(course => {
          if (course.level) {
            levels[course.level] = (levels[course.level] || 0) + 1;
          }
        });
        
        const coursesByLevel = Object.entries(levels).map(([name, value]) => ({ name, value }));
        
        // Get popular courses based on enrollment count
        const popularCourses = [...courses]
          .sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
          .slice(0, 5)
          .map(course => ({
            name: course.title,
            value: course.enrollmentCount || 0
          }));
        
        // Get recent users
        const recentUsersResponse = await axios.get("http://localhost:8080/admin/recent-users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const recentUsers = recentUsersResponse.data || [];
        
        // Group users by creation date (month)
        const usersByMonth = {};
        recentUsers.forEach(user => {
          if (user.createdAt) {
            const date = new Date(user.createdAt);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            usersByMonth[monthYear] = (usersByMonth[monthYear] || 0) + 1;
          }
        });
        
        const userRegistrationsByMonth = Object.entries(usersByMonth)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => {
            const [aMonth, aYear] = a.name.split('/');
            const [bMonth, bYear] = b.name.split('/');
            return new Date(aYear, aMonth - 1) - new Date(bYear, bMonth - 1);
          });
        
        // Try to get query count data
        let totalQueries = 0;
        try {
          // This endpoint doesn't exist in your current setup, but we can include it as a future improvement
          // For now, we'll use a placeholder value
          totalQueries = recentUsers.reduce((total, user) => total + (user.queryCount || 0), 0);
        } catch (error) {
          console.log("Query count data not available");
        }
        
        // Set all the gathered data
        setReportData({
          overview: {
            ...overview,
            publishedCourses,
            enrollmentCount: totalEnrollments,
            totalQueries
          },
          userActivity: {
            recentUsers: userRegistrationsByMonth,
            enrollmentsByMonth: [] // This would require additional data that we don't have yet
          },
          courseAnalytics: {
            coursesByCategory,
            coursesByLevel,
            popularCourses
          },
          learningMetrics: {
            moduleCompletionRates: [], // This would need data from user progress
            averageProgress: 0, // This would need data from user progress
            completedCourses: 0 // This would need data from user progress
          }
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setError('Failed to load report data. Please try again later.');
        setLoading(false);
      }
    };

    fetchReportData();
  }, [navigate, dateRange]);

  // Handle navigation
  const handleNavigate = (path) => {
    navigate(path);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Handle chart type change
  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  // Handle export report
  const handleExportReport = () => {
    // Generate a simple CSV export
    const csvData = [];
    
    // Add headers
    csvData.push(['NeuraleLearn Analytics Report', `Generated on ${new Date().toLocaleDateString()}`]);
    csvData.push([]);
    
    // Add overview data
    csvData.push(['Overview']);
    csvData.push(['Metric', 'Value']);
    csvData.push(['Total Users', reportData.overview.totalUsers]);
    csvData.push(['Admin Users', reportData.overview.adminCount]);
    csvData.push(['Regular Users', reportData.overview.userCount]);
    csvData.push(['Total Courses', reportData.overview.totalCourses]);
    csvData.push(['Published Courses', reportData.overview.publishedCourses]);
    csvData.push(['Total Enrollments', reportData.overview.enrollmentCount]);
    csvData.push(['Total AI Queries', reportData.overview.totalQueries]);
    csvData.push([]);
    
    // Add popular courses
    csvData.push(['Popular Courses']);
    csvData.push(['Course Name', 'Enrollments']);
    reportData.courseAnalytics.popularCourses.forEach(course => {
      csvData.push([course.name, course.value]);
    });
    
    // Convert to CSV string
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `neuralelearn-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render chart based on type and data
  const renderChart = (data, title, type = chartType) => {
    if (!data || data.length === 0) {
      return (
        <div className="admin-chart">
          <h3 className="admin-chart-title">{title}</h3>
          <div className="admin-no-data">
            <p>No data available for this chart</p>
          </div>
        </div>
      );
    }
    
    // Normalize data for display
    const maxValue = Math.max(...data.map(item => item.value || 0));
    
    return (
      <div className="admin-chart">
        <h3 className="admin-chart-title">{title}</h3>
        <div className="admin-chart-container">
          {data.map((item, index) => {
            const value = item.value || 0;
            const label = item.name || `Item ${index + 1}`;
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            return (
              <div className="admin-chart-item" key={index}>
                <div className="admin-chart-label">{label}</div>
                <div className="admin-chart-bar-container">
                  <div 
                    className={`admin-chart-bar admin-chart-bar-${type}`} 
                    style={{ width: `${percentage}%` }}
                  >
                    <span className="admin-chart-value">{value}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // No data available component
  const NoDataAvailable = ({ message }) => (
    <div className="admin-no-data-section">
      <FaChartLine className="admin-no-data-icon" />
      <h3>Data Not Available</h3>
      <p>{message || "This data is not currently being tracked in the system."}</p>
      <p>Available metrics are shown in other sections.</p>
    </div>
  );

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
            <button className="admin-nav-item" onClick={() => handleNavigate('/admin/users')}>
              <FaUsers /> <span>Manage Users</span>
            </button>
            <button className="admin-nav-item" onClick={() => handleNavigate('/admin/courses')}>
              <FaGraduationCap /> <span>Manage Courses</span>
            </button>
            <button className="admin-nav-item" onClick={() => handleNavigate('/admin/study-materials')}>
              <FaBook /> <span>Study Materials</span>
            </button>
            <button className="admin-nav-item admin-nav-active">
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
              <h1>Analytics & Reports</h1>
              <p className="admin-subtitle">Monitor platform performance and user engagement</p>
            </div>
            <div className="admin-header-actions">
              <button className="admin-action-btn" onClick={handleExportReport}>
                <FaFileDownload /> Export Report
              </button>
            </div>
          </div>

          {/* Reports Controls */}
          <div className="admin-reports-controls">
            <div className="admin-tabs">
              <button 
                className={`admin-tab ${activeTab === 'overview' ? 'admin-tab-active' : ''}`}
                onClick={() => handleTabChange('overview')}
              >
                Overview
              </button>
              <button 
                className={`admin-tab ${activeTab === 'users' ? 'admin-tab-active' : ''}`}
                onClick={() => handleTabChange('users')}
              >
                User Activity
              </button>
              <button 
                className={`admin-tab ${activeTab === 'courses' ? 'admin-tab-active' : ''}`}
                onClick={() => handleTabChange('courses')}
              >
                Course Analytics
              </button>
             
            </div>
            
            
          </div>

          {/* Reports Content */}
          <div className="admin-reports-content">
            {loading ? (
              <div className="admin-loading">
                <div className="admin-loading-spinner"></div>
                <p>Loading report data...</p>
              </div>
            ) : error ? (
              <div className="admin-error">
                <p>{error}</p>
                <button 
                  className="admin-btn-primary" 
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div className="admin-reports-overview">
                    <div className="admin-stats-overview">
                      <div className="admin-stat-card" onClick={() => handleNavigate('/admin/users')}>
                        <div className="admin-stat-icon">👥</div>
                        <div className="admin-stat-content">
                          <h3>Total Users</h3>
                          <p className="admin-stat-number">{reportData.overview.totalUsers}</p>
                        </div>
                      </div>
                      
                      <div className="admin-stat-card" onClick={() => handleNavigate('/admin/users?role=admin')}>
                        <div className="admin-stat-icon">🛡️</div>
                        <div className="admin-stat-content">
                          <h3>Admins</h3>
                          <p className="admin-stat-number">{reportData.overview.adminCount}</p>
                        </div>
                      </div>
                      
                      <div className="admin-stat-card" onClick={() => handleNavigate('/admin/courses')}>
                        <div className="admin-stat-icon">📚</div>
                        <div className="admin-stat-content">
                          <h3>Total Courses</h3>
                          <p className="admin-stat-number">{reportData.overview.totalCourses}</p>
                        </div>
                      </div>
                      
                      <div className="admin-stat-card" onClick={() => handleNavigate('/admin/courses?filter=published')}>
                        <div className="admin-stat-icon">🚀</div>
                        <div className="admin-stat-content">
                          <h3>Published Courses</h3>
                          <p className="admin-stat-number">{reportData.overview.publishedCourses}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="admin-reports-charts">
                      <div className="admin-report-row">
                        {reportData.courseAnalytics.popularCourses.length > 0 ? (
                          renderChart(reportData.courseAnalytics.popularCourses, 'Popular Courses by Enrollment', 'bar')
                        ) : (
                          <NoDataAvailable message="No enrollment data available yet." />
                        )}
                      </div>
                      
                      <div className="admin-report-row admin-report-grid">
                        {reportData.courseAnalytics.coursesByCategory.length > 0 ? (
                          renderChart(reportData.courseAnalytics.coursesByCategory, 'Courses by Category', 'bar')
                        ) : (
                          <NoDataAvailable message="No category data available." />
                        )}
                        
                        {reportData.courseAnalytics.coursesByLevel.length > 0 ? (
                          renderChart(reportData.courseAnalytics.coursesByLevel, 'Courses by Level', 'bar')
                        ) : (
                          <NoDataAvailable message="No level data available." />
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'users' && (
                  <div className="admin-reports-section">
                    <div className="admin-report-row">
                      {reportData.userActivity.recentUsers.length > 0 ? (
                        renderChart(reportData.userActivity.recentUsers, 'User Registrations by Month', 'line')
                      ) : (
                        <NoDataAvailable message="User registration history is not available." />
                      )}
                    </div>
                    
                    <div className="admin-report-row">
                      <div className="admin-info-panel">
                        <h3>User Activity Tracking</h3>
                        <p>More detailed user activity tracking is not currently implemented in the platform. Consider adding the following metrics in future updates:</p>
                        <ul>
                          <li>Daily active users</li>
                          <li>Session duration</li>
                          <li>Feature usage statistics</li>
                          <li>User retention rates</li>
                        </ul>
                        <p>These metrics will require additional tracking in the User model or a separate analytics collection.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'courses' && (
                  <div className="admin-reports-section">
                    <div className="admin-report-row">
                      {reportData.courseAnalytics.popularCourses.length > 0 ? (
                        renderChart(reportData.courseAnalytics.popularCourses, 'Most Popular Courses', 'bar')
                      ) : (
                        <NoDataAvailable message="No enrollment data available yet." />
                      )}
                    </div>
                    
                    <div className="admin-report-row admin-report-grid">
                      {reportData.courseAnalytics.coursesByCategory.length > 0 ? (
                        renderChart(reportData.courseAnalytics.coursesByCategory, 'Courses by Category', chartType)
                      ) : (
                        <NoDataAvailable message="No category data available." />
                      )}
                      
                      {reportData.courseAnalytics.coursesByLevel.length > 0 ? (
                        renderChart(reportData.courseAnalytics.coursesByLevel, 'Courses by Level', chartType)
                      ) : (
                        <NoDataAvailable message="No level data available." />
                      )}
                    </div>
                    
                    <div className="admin-info-card">
                      <h3>Total Course Enrollments</h3>
                      <p className="admin-info-number">{reportData.overview.enrollmentCount}</p>
                    </div>
                  </div>
                )}
                
                
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;