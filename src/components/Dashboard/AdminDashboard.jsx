import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import { FaBook, FaPlus } from "react-icons/fa"; // Import icons

const AdminDashboard = () => {
    const [stats, setStats] = useState({});
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const statsRes = await axios.get("http://localhost:8080/admin/stats", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setStats(statsRes.data);

                const usersRes = await axios.get("http://localhost:8080/admin/recent-users", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRecentUsers(usersRes.data);
            } catch (error) {
                console.error("Error fetching admin data", error);
                navigate("/");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    // Mock data for additional analytics
    const mockAnalytics = {
        dailyActiveUsers: 47,
        averageSessionTime: 28,
        completionRate: 68,
        questionFrequency: 5.2
    };

    if (loading) {
        return <div className="aitut_admin_loading">Loading admin dashboard...</div>;
    }

    return (
        <div className="aitut_admin_container">
            <div className="aitut_admin_header">
                <div className="aitut_admin_title">
                    <h1>Admin Dashboard</h1>
                    <p className="aitut_admin_subtitle">Monitor and manage your AI tutoring platform</p>
                </div>
                <div className="aitut_admin_actions">
                    <button className="aitut_admin_action_btn" onClick={() => navigate("/admin/users")}>
                        Manage Users
                    </button>
                    <button className="aitut_admin_action_btn" onClick={() => navigate("/admin/content")}>
                        Manage Content
                    </button>
                    <button className="aitut_admin_action_btn" onClick={() => navigate("/admin/courses")}>
                        Manage Courses
                    </button>
                    {/* Study Materials button with unique class name */}
                    <button className="aitut_admin_action_btn aitut_admin_studymat_btn" onClick={() => navigate("/admin/study-materials")}>
                        <FaBook /> Study Materials
                    </button>
                    <button className="aitut_admin_logout_btn" onClick={() => { localStorage.removeItem("token"); navigate("/"); }}>
                        Logout
                    </button>
                </div>
            </div>

            <div className="aitut_admin_stats_overview">
                <div className="aitut_admin_stat_card">
                    <div className="aitut_admin_stat_icon">👥</div>
                    <div className="aitut_admin_stat_content">
                        <h3>Total Users</h3>
                        <p className="aitut_admin_stat_number">{stats.totalUsers}</p>
                    </div>
                </div>
                
                <div className="aitut_admin_stat_card">
                    <div className="aitut_admin_stat_icon">🛡️</div>
                    <div className="aitut_admin_stat_content">
                        <h3>Admins</h3>
                        <p className="aitut_admin_stat_number">{stats.adminCount}</p>
                    </div>
                </div>
                
                <div className="aitut_admin_stat_card">
                    <div className="aitut_admin_stat_icon">👤</div>
                    <div className="aitut_admin_stat_content">
                        <h3>Regular Users</h3>
                        <p className="aitut_admin_stat_number">{stats.userCount}</p>
                    </div>
                </div>
                
                <div className="aitut_admin_stat_card">
                    <div className="aitut_admin_stat_icon">📚</div>
                    <div className="aitut_admin_stat_content">
                        <h3>Total Courses</h3>
                        <p className="aitut_admin_stat_number">{stats.courseCount || "0"}</p>
                    </div>
                </div>
            </div>

            <div className="aitut_admin_main_content">
                <div className="aitut_admin_content_section">
                    <div className="aitut_admin_section_header">
                        <h2>Recent Users</h2>
                        <button className="aitut_admin_view_all_btn" onClick={() => navigate("/admin/users")}>
                            View All
                        </button>
                    </div>
                    
                    <div className="aitut_admin_recent_users">
                        <table className="aitut_admin_table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentUsers.map(user => (
                                    <tr key={user._id}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`aitut_admin_role_badge ${user.role === 'admin' ? 'aitut_admin_role_admin' : 'aitut_admin_role_user'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="aitut_admin_edit_btn" onClick={() => navigate(`/admin/users/edit/${user._id}`)}>
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* Add Course section - comes before Study Materials */}
                <div className="aitut_admin_content_section">
                    <div className="aitut_admin_section_header">
                        <h2>Course Management</h2>
                        <button className="aitut_admin_view_all_btn" onClick={() => navigate("/admin/courses")}>
                            View All
                        </button>
                    </div>
                    
                    <div className="aitut_admin_course_preview">
                        <div className="aitut_admin_preview_card aitut_admin_addcourse_card">
                            <div className="aitut_admin_preview_icon">
                                <FaPlus />
                            </div>
                            <div className="aitut_admin_preview_content">
                                <h3>Add New Course</h3>
                                <p>Create and publish new courses to expand your learning catalog.</p>
                                <button 
                                    className="aitut_admin_preview_btn" 
                                    onClick={() => navigate("/admin/courses")}
                                >
                                    Add Course
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Study Materials section */}
                <div className="aitut_admin_content_section">
                    <div className="aitut_admin_section_header">
                        <h2>Study Materials</h2>
                        <button className="aitut_admin_view_all_btn" onClick={() => navigate("/admin/study-materials")}>
                            View All
                        </button>
                    </div>
                    
                    <div className="aitut_admin_course_preview">
                        <div className="aitut_admin_preview_card aitut_admin_studymat_card">
                            <div className="aitut_admin_preview_icon">
                                <FaBook />
                            </div>
                            <div className="aitut_admin_preview_content">
                                <h3>Learning Materials</h3>
                                <p>Create and organize study materials and podcast audio content for your courses.</p>
                                <button 
                                    className="aitut_admin_preview_btn" 
                                    onClick={() => navigate("/admin/study-materials")}
                                >
                                    Go to Study Materials
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Existing Recent Courses section */}
                <div className="aitut_admin_content_section">
                    <div className="aitut_admin_section_header">
                        <h2>Recent Courses</h2>
                        <button className="aitut_admin_view_all_btn" onClick={() => navigate("/admin/courses")}>
                            View All
                        </button>
                    </div>
                    
                    <div className="aitut_admin_course_preview">
                        <div className="aitut_admin_preview_card aitut_admin_courses_card">
                            <div className="aitut_admin_preview_content">
                                <h3>Manage Your Course Catalog</h3>
                                <p>Edit, organize and publish your learning materials in one place.</p>
                                <button 
                                    className="aitut_admin_preview_btn" 
                                    onClick={() => navigate("/admin/courses")}
                                >
                                    Go to Course Management
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="aitut_admin_content_section">
                    <div className="aitut_admin_section_header">
                        <h2>Platform Analytics</h2>
                    </div>
                    
                    <div className="aitut_admin_analytics_grid">
                        <div className="aitut_admin_analytics_card">
                            <h3>Avg. Session Time</h3>
                            <p className="aitut_admin_analytics_value">{mockAnalytics.averageSessionTime}<span className="aitut_admin_analytics_unit">min</span></p>
                            <p className="aitut_admin_analytics_desc">Average time users spend in each learning session</p>
                        </div>
                        
                        <div className="aitut_admin_analytics_card">
                            <h3>Course Completion</h3>
                            <p className="aitut_admin_analytics_value">{mockAnalytics.completionRate}<span className="aitut_admin_analytics_unit">%</span></p>
                            <p className="aitut_admin_analytics_desc">Percentage of users who complete their courses</p>
                        </div>
                        
                        <div className="aitut_admin_analytics_card">
                            <h3>Questions Per User</h3>
                            <p className="aitut_admin_analytics_value">{mockAnalytics.questionFrequency}</p>
                            <p className="aitut_admin_analytics_desc">Average number of questions asked per session</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="aitut_admin_quick_actions">
                <h2>Quick Actions</h2>
                <div className="aitut_admin_action_buttons">
                    <button className="aitut_admin_quick_action_btn aitut_admin_user_btn" onClick={() => navigate("/admin/users/new")}>
                        Add New User
                    </button>
                    <button className="aitut_admin_quick_action_btn aitut_admin_coursemanage_btn" onClick={() => navigate("/admin/courses")}>
                        Manage Courses
                    </button>
                    <button className="aitut_admin_quick_action_btn aitut_admin_studymaterial_btn" onClick={() => navigate("/admin/study-materials")}>
                        <FaBook /> Study Materials
                    </button>
                    <button className="aitut_admin_quick_action_btn aitut_admin_coursecreate_btn" onClick={() => navigate("/admin/courses")}>
                        Create Course
                    </button>
                    <button className="aitut_admin_quick_action_btn aitut_admin_reports_btn" onClick={() => navigate("/admin/reports")}>
                        View Reports
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;