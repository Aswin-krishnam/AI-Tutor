import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FaChartLine, FaUsers, FaGraduationCap, FaBook, 
  FaCog, FaSignOutAlt, FaSave, FaLock, FaBell,
  FaPalette, FaDatabase, FaEnvelope, FaKey, FaTrash
} from 'react-icons/fa';
import './AdminPages.css';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  // General settings
  const [siteName, setSiteName] = useState('NeuraleLearn');
  const [siteDescription, setSiteDescription] = useState('AI-Powered Tutoring Platform');
  const [contactEmail, setContactEmail] = useState('support@neuralelearn.com');
  const [timezone, setTimezone] = useState('UTC');
  
  // Appearance settings
  const [primaryColor, setPrimaryColor] = useState('#4267B2');
  const [secondaryColor, setSecondaryColor] = useState('#28a745');
  const [fontFamily, setFontFamily] = useState('Poppins');
  const [darkMode, setDarkMode] = useState(false);
  
  // Email settings
  const [emailProvider, setEmailProvider] = useState('smtp');
  const [emailHost, setEmailHost] = useState('smtp.gmail.com');
  const [emailPort, setEmailPort] = useState('587');
  const [emailUsername, setEmailUsername] = useState('neuralearnhelp@gmail.com');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailEncryption, setEmailEncryption] = useState('tls');
  
  // Security settings
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [passwordRequireUppercase, setPasswordRequireUppercase] = useState(true);
  const [passwordRequireSpecial, setPasswordRequireSpecial] = useState(true);
  const [passwordRequireNumbers, setPasswordRequireNumbers] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  
  // Backup settings
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [backupRetention, setBackupRetention] = useState(30);
  const [backupLocation, setBackupLocation] = useState('local');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // In a real application, you would fetch actual settings from your API
        // For this example, we'll use the default values set in state
        
        // Simulate API call
        setTimeout(() => {
          setLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('Error fetching settings:', error);
        setIsError(true);
        setAlertMessage('Failed to load settings. Please try again.');
        setLoading(false);
      }
    };

    fetchSettings();
  }, [navigate]);

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

  // Handle settings save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // In a real application, you would make an API call to save settings
      // Here we'll simulate a successful save
      
      // Simulate API call
      setTimeout(() => {
        setSaving(false);
        setIsSuccess(true);
        setAlertMessage('Settings saved successfully!');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
      }, 1500);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaving(false);
      setIsError(true);
      setAlertMessage('Failed to save settings. Please try again.');
      
      // Hide error message after 3 seconds
      setTimeout(() => {
        setIsError(false);
      }, 3000);
    }
  };

  // Test email configuration
  const handleTestEmail = () => {
    setIsSuccess(true);
    setAlertMessage('Test email sent successfully!');
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setIsSuccess(false);
    }, 3000);
  };

  // Create backup
  const handleCreateBackup = () => {
    setIsSuccess(true);
    setAlertMessage('Backup created successfully!');
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setIsSuccess(false);
    }, 3000);
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
            <button className="admin-nav-item" onClick={() => handleNavigate('/admin/users')}>
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
            <button className="admin-nav-item admin-nav-active">
              <FaCog /> <span>Settings</span>
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
              <h1>System Settings</h1>
              <p className="admin-subtitle">Configure platform settings and preferences</p>
            </div>
            <div className="admin-header-actions">
              <button 
                className="admin-action-btn"
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? 'Saving...' : <><FaSave /> Save Settings</>}
              </button>
            </div>
          </div>

          {/* Success Message */}
          {isSuccess && (
            <div className="admin-alert admin-alert-success">
              <span>{alertMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {isError && (
            <div className="admin-alert admin-alert-error">
              <span>{alertMessage}</span>
            </div>
          )}

          {/* Settings Content */}
          <div className="admin-settings-container">
            <div className="admin-settings-sidebar">
              <button 
                className={`admin-settings-tab ${activeTab === 'general' ? 'admin-settings-tab-active' : ''}`}
                onClick={() => handleTabChange('general')}
              >
                <FaCog /> General
              </button>
              <button 
                className={`admin-settings-tab ${activeTab === 'appearance' ? 'admin-settings-tab-active' : ''}`}
                onClick={() => handleTabChange('appearance')}
              >
                <FaPalette /> Appearance
              </button>
              <button 
                className={`admin-settings-tab ${activeTab === 'email' ? 'admin-settings-tab-active' : ''}`}
                onClick={() => handleTabChange('email')}
              >
                <FaEnvelope /> Email
              </button>
              <button 
                className={`admin-settings-tab ${activeTab === 'security' ? 'admin-settings-tab-active' : ''}`}
                onClick={() => handleTabChange('security')}
              >
                <FaLock /> Security
              </button>
              <button 
                className={`admin-settings-tab ${activeTab === 'backup' ? 'admin-settings-tab-active' : ''}`}
                onClick={() => handleTabChange('backup')}
              >
                <FaDatabase /> Backup
              </button>
            </div>

            <div className="admin-settings-content">
              {loading ? (
                <div className="admin-loading">
                  <div className="admin-loading-spinner"></div>
                  <p>Loading settings...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveSettings}>
                  {activeTab === 'general' && (
                    <div className="admin-settings-panel">
                      <h2 className="admin-settings-title">General Settings</h2>
                      
                      <div className="admin-form-group">
                        <label htmlFor="siteName">Site Name</label>
                        <input
                          type="text"
                          id="siteName"
                          value={siteName}
                          onChange={(e) => setSiteName(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="siteDescription">Site Description</label>
                        <textarea
                          id="siteDescription"
                          value={siteDescription}
                          onChange={(e) => setSiteDescription(e.target.value)}
                          rows="3"
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="contactEmail">Contact Email</label>
                        <input
                          type="email"
                          id="contactEmail"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="timezone">Timezone</label>
                        <select
                          id="timezone"
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time (ET)</option>
                          <option value="America/Chicago">Central Time (CT)</option>
                          <option value="America/Denver">Mountain Time (MT)</option>
                          <option value="America/Los_Angeles">Pacific Time (PT)</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                          <option value="Australia/Sydney">Sydney</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'appearance' && (
                    <div className="admin-settings-panel">
                      <h2 className="admin-settings-title">Appearance Settings</h2>
                      
                      <div className="admin-form-group">
                        <label htmlFor="primaryColor">Primary Color</label>
                        <div className="admin-color-picker">
                          <input
                            type="color"
                            id="primaryColor"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                          />
                          <input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="secondaryColor">Secondary Color</label>
                        <div className="admin-color-picker">
                          <input
                            type="color"
                            id="secondaryColor"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                          />
                          <input
                            type="text"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="fontFamily">Font Family</label>
                        <select
                          id="fontFamily"
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value)}
                        >
                          <option value="Poppins">Poppins</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Open Sans">Open Sans</option>
                          <option value="Lato">Lato</option>
                          <option value="Montserrat">Montserrat</option>
                        </select>
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="darkMode">Dark Mode</label>
                        <div className="admin-toggle-switch">
                          <input
                            type="checkbox"
                            id="darkMode"
                            checked={darkMode}
                            onChange={(e) => setDarkMode(e.target.checked)}
                          />
                          <label htmlFor="darkMode" className="admin-toggle-label">
                            {darkMode ? 'Enabled' : 'Disabled'}
                          </label>
                        </div>
                      </div>
                      
                      <div className="admin-form-preview">
                        <h3>Preview</h3>
                        <div 
                          className="admin-theme-preview" 
                          style={{ 
                            backgroundColor: darkMode ? '#333' : '#fff',
                            color: darkMode ? '#fff' : '#333',
                            fontFamily: fontFamily
                          }}
                        >
                          <div 
                            className="admin-preview-header" 
                            style={{ backgroundColor: primaryColor }}
                          >
                            <div className="admin-preview-title">NeuraleLearn</div>
                          </div>
                          <div className="admin-preview-content">
                            <div 
                              className="admin-preview-button" 
                              style={{ backgroundColor: secondaryColor }}
                            >
                              Button
                            </div>
                            <div className="admin-preview-text">Sample Text</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'email' && (
                    <div className="admin-settings-panel">
                      <h2 className="admin-settings-title">Email Settings</h2>
                      
                      <div className="admin-form-group">
                        <label htmlFor="emailProvider">Email Provider</label>
                        <select
                          id="emailProvider"
                          value={emailProvider}
                          onChange={(e) => setEmailProvider(e.target.value)}
                        >
                          <option value="smtp">SMTP Server</option>
                          <option value="sendgrid">SendGrid</option>
                          <option value="mailgun">Mailgun</option>
                          <option value="ses">Amazon SES</option>
                        </select>
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="emailHost">SMTP Host</label>
                        <input
                          type="text"
                          id="emailHost"
                          value={emailHost}
                          onChange={(e) => setEmailHost(e.target.value)}
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="emailPort">SMTP Port</label>
                        <input
                          type="text"
                          id="emailPort"
                          value={emailPort}
                          onChange={(e) => setEmailPort(e.target.value)}
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="emailUsername">Email Username</label>
                        <input
                          type="text"
                          id="emailUsername"
                          value={emailUsername}
                          onChange={(e) => setEmailUsername(e.target.value)}
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="emailPassword">Email Password</label>
                        <input
                          type="password"
                          id="emailPassword"
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="emailEncryption">Encryption</label>
                        <select
                          id="emailEncryption"
                          value={emailEncryption}
                          onChange={(e) => setEmailEncryption(e.target.value)}
                        >
                          <option value="none">None</option>
                          <option value="ssl">SSL</option>
                          <option value="tls">TLS</option>
                        </select>
                      </div>
                      
                      <div className="admin-form-action">
                        <button 
                          type="button" 
                          className="admin-btn-secondary"
                          onClick={handleTestEmail}
                        >
                          <FaEnvelope /> Send Test Email
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'security' && (
                    <div className="admin-settings-panel">
                      <h2 className="admin-settings-title">Security Settings</h2>
                      
                      <h3 className="admin-settings-subtitle">Password Policy</h3>
                      
                      <div className="admin-form-group">
                        <label htmlFor="passwordMinLength">Minimum Password Length</label>
                        <input
                          type="number"
                          id="passwordMinLength"
                          min="6"
                          max="20"
                          value={passwordMinLength}
                          onChange={(e) => setPasswordMinLength(parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="passwordRequireUppercase">Require Uppercase Letters</label>
                        <div className="admin-toggle-switch">
                          <input
                            type="checkbox"
                            id="passwordRequireUppercase"
                            checked={passwordRequireUppercase}
                            onChange={(e) => setPasswordRequireUppercase(e.target.checked)}
                          />
                          <label htmlFor="passwordRequireUppercase" className="admin-toggle-label">
                            {passwordRequireUppercase ? 'Required' : 'Not Required'}
                          </label>
                        </div>
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="passwordRequireSpecial">Require Special Characters</label>
                        <div className="admin-toggle-switch">
                          <input
                            type="checkbox"
                            id="passwordRequireSpecial"
                            checked={passwordRequireSpecial}
                            onChange={(e) => setPasswordRequireSpecial(e.target.checked)}
                          />
                          <label htmlFor="passwordRequireSpecial" className="admin-toggle-label">
                            {passwordRequireSpecial ? 'Required' : 'Not Required'}
                          </label>
                        </div>
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="passwordRequireNumbers">Require Numbers</label>
                        <div className="admin-toggle-switch">
                          <input
                            type="checkbox"
                            id="passwordRequireNumbers"
                            checked={passwordRequireNumbers}
                            onChange={(e) => setPasswordRequireNumbers(e.target.checked)}
                          />
                          <label htmlFor="passwordRequireNumbers" className="admin-toggle-label">
                            {passwordRequireNumbers ? 'Required' : 'Not Required'}
                          </label>
                        </div>
                      </div>
                      
                      <h3 className="admin-settings-subtitle">Session Security</h3>
                      
                      <div className="admin-form-group">
                        <label htmlFor="sessionTimeout">Session Timeout (minutes)</label>
                        <input
                          type="number"
                          id="sessionTimeout"
                          min="5"
                          max="1440"
                          value={sessionTimeout}
                          onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="twoFactorAuth">Two-Factor Authentication</label>
                        <div className="admin-toggle-switch">
                          <input
                            type="checkbox"
                            id="twoFactorAuth"
                            checked={twoFactorAuth}
                            onChange={(e) => setTwoFactorAuth(e.target.checked)}
                          />
                          <label htmlFor="twoFactorAuth" className="admin-toggle-label">
                            {twoFactorAuth ? 'Enabled' : 'Disabled'}
                          </label>
                        </div>
                      </div>
                      
                      <div className="admin-form-action">
                        <button 
                          type="button" 
                          className="admin-btn-secondary"
                          onClick={() => alert('Password reset email sent to all inactive users')}
                        >
                          <FaKey /> Force Password Reset for Inactive Users
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'backup' && (
                    <div className="admin-settings-panel">
                      <h2 className="admin-settings-title">Backup Settings</h2>
                      
                      <div className="admin-form-group">
                        <label htmlFor="backupFrequency">Backup Frequency</label>
                        <select
                          id="backupFrequency"
                          value={backupFrequency}
                          onChange={(e) => setBackupFrequency(e.target.value)}
                        >
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="backupRetention">Backup Retention (days)</label>
                        <input
                          type="number"
                          id="backupRetention"
                          min="1"
                          max="365"
                          value={backupRetention}
                          onChange={(e) => setBackupRetention(parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label htmlFor="backupLocation">Backup Location</label>
                        <select
                          id="backupLocation"
                          value={backupLocation}
                          onChange={(e) => setBackupLocation(e.target.value)}
                        >
                          <option value="local">Local Storage</option>
                          <option value="s3">Amazon S3</option>
                          <option value="gcs">Google Cloud Storage</option>
                          <option value="azure">Azure Blob Storage</option>
                        </select>
                      </div>
                      
                      <div className="admin-form-action">
                        <button 
                          type="button" 
                          className="admin-btn-secondary"
                          onClick={handleCreateBackup}
                        >
                          <FaDatabase /> Create Manual Backup
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;