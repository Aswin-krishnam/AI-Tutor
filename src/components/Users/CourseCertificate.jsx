import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "react-toastify";
import "./CourseCertificate.css";
import {
  FaArrowLeft,
  FaDownload,
  FaPrint,
  FaShare,
  FaSpinner,
  FaGraduationCap,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUniversity,
  FaQrcode,
  FaEnvelope,
  FaMedal,
  FaShieldAlt
} from "react-icons/fa";

const CourseCertificate = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const certificateRef = useRef(null);

  // States
  const [certificateData, setCertificateData] = useState(
    location.state?.certificateDetails || null
  );
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Get user info from localStorage
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const userEmail = localStorage.getItem("userEmail");
  const serverBaseUrl = "http://localhost:8080";

  // Format the current date once, not on every render
  const formattedDate = useMemo(() => {
    const currentDate = new Date();
    return currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);
  
  // Generate a certificate ID once
  const certificateId = useMemo(() => {
    return `CERT-${courseId?.substring(0, 6) || '000000'}-${userId?.substring(0, 6) || '000000'}-${Date.now().toString(36)}`;
  }, [courseId, userId]);
  
  useEffect(() => {
    if (!token || !userId) {
      navigate("/login", { state: { from: `/course/${courseId}/certificate` } });
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use Promise.all to fetch user and course data in parallel
        const [userResponse, courseResponse] = await Promise.all([
          axios.get(`${serverBaseUrl}/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${serverBaseUrl}/course/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setUserData(userResponse.data);
        setCourse(courseResponse.data);
        
        // If we don't have certificate data from location state, fetch/create it
        if (!certificateData) {
          // Check eligibility first
          const eligibilityResponse = await axios.get(
            `${serverBaseUrl}/course/${courseId}/certificate/check?userId=${userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (!eligibilityResponse.data.eligible) {
            setError("You are not eligible for this certificate yet. Complete all modules and assessments first.");
            setLoading(false);
            return;
          }
          
          if (!eligibilityResponse.data.certificateIssued) {
            // Issue certificate
            const issueResponse = await axios.post(
              `${serverBaseUrl}/course/${courseId}/certificate/issue`,
              { userId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setCertificateData(issueResponse.data.certificateDetails);
          } else {
            // Create certificate data with user's name from API
            setCertificateData({
              courseId,
              courseTitle: courseResponse.data.title,
              studentName: userResponse.data.name,
              issueDate: new Date(),
              certificateId
            });
          }
        }
      } catch (error) {
        console.error("Error fetching certificate data:", error);
        setError("Failed to load certificate. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, userId, token, navigate, certificateData, certificateId, serverBaseUrl]);

  // Optimize PDF generation with a debounced function
  const handleDownloadPDF = async () => {
    if (!certificateRef.current || generatingPDF) return;
    
    setGeneratingPDF(true);
    
    try {
      // Use higher scale for better quality but optimize settings for performance
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: false,
        backgroundColor: null,
        imageTimeout: 15000
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95); // Slight compression for better performance
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `${course?.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_') || 'Course'}_Certificate.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Handle print certificate
  const handlePrint = () => {
    window.print();
  };

  // Handle email certificate
  const handleSendEmail = async () => {
    if (!certificateRef.current || sendingEmail) return;
    
    setSendingEmail(true);
    
    try {
      // Notify user that we're processing
      toast?.info?.("Preparing your certificate...", { autoClose: 3000 }) || alert("Preparing your certificate...");
      
      // Generate optimized image with reduced quality to avoid "entity too large" errors
      const canvas = await html2canvas(certificateRef.current, {
        scale: 1.5, // Reduced scale for email (still good quality but smaller file)
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Compress more aggressively for email
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      
      // Send email request to server
      await axios.post(`${serverBaseUrl}/send-certificate-email`, {
        userId,
        certificateId: certificateData.certificateId || certificateId,
        courseId,
        courseName: course.title,
        certificateImage: imgData,
        recipientName: certificateData.studentName || userData?.name || "Student",
        email: userEmail || userData?.email || ''
      }, {
        headers: { 'Authorization': `Bearer ${token}` },
        // Add timeout to prevent long-hanging requests
        timeout: 30000
      });
      
      setEmailSent(true);
      
      // Success notification
      toast?.success?.("Certificate sent to your email!", { autoClose: 5000 }) || alert("Certificate sent to your email!");
      
      // Reset email sent status after 5 seconds
      setTimeout(() => {
        setEmailSent(false);
      }, 5000);
      
    } catch (error) {
      console.error("Error sending certificate email:", error);
      
      // More helpful error messaging
      if (error.response?.status === 413) {
        toast?.error?.("Certificate file is too large. Try downloading instead.", { autoClose: 7000 }) || 
          alert("Certificate file is too large. Try downloading instead.");
      } else {
        toast?.error?.("Failed to send certificate email. Please try again or download instead.", { autoClose: 7000 }) || 
          alert("Failed to send certificate email. Please try again or download instead.");
      }
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="certificate__loading">
        <FaSpinner className="certificate__spinner" />
        <p>Loading your certificate...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="certificate__error">
        <div className="certificate__error-icon">
          <FaExclamationTriangle />
        </div>
        <h2>Certificate Unavailable</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate(`/course/${courseId}/progress`)}
          className="certificate__btn certificate__btn-primary"
        >
          <FaArrowLeft /> Return to Progress Dashboard
        </button>
      </div>
    );
  }

  if (!certificateData || !course) {
    return (
      <div className="certificate__error">
        <p>Certificate information not available.</p>
        <button
          onClick={() => navigate(`/course/${courseId}/progress`)}
          className="certificate__btn certificate__btn-primary"
        >
          <FaArrowLeft /> Return to Progress Dashboard
        </button>
      </div>
    );
  }

  // Ensure we have a proper student name displayed
  const displayName = certificateData.studentName || userData?.name || "Student";

  return (
    <div className="certificate__container">
      <div className="certificate__actions">
        <button
          onClick={() => navigate(`/course/${courseId}/progress`)}
          className="certificate__action-btn certificate__btn-back"
        >
          <FaArrowLeft /> Back to Progress
        </button>
        
        <div className="certificate__action-group">
          <button
            onClick={handleDownloadPDF}
            className="certificate__action-btn certificate__btn-download"
            disabled={generatingPDF}
          >
            {generatingPDF ? (
              <>
                <FaSpinner className="certificate__spinner-inline" /> Generating PDF...
              </>
            ) : (
              <>
                <FaDownload /> Download PDF
              </>
            )}
          </button>
          
          <button
            onClick={handlePrint}
            className="certificate__action-btn certificate__btn-print"
          >
            <FaPrint /> Print Certificate
          </button>
          
          <button
            onClick={handleSendEmail}
            className="certificate__action-btn certificate__btn-email"
            disabled={sendingEmail}
          >
            {sendingEmail ? (
              <>
                <FaSpinner className="certificate__spinner-inline" /> Sending...
              </>
            ) : (
              <>
                <FaEnvelope /> Email Certificate
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${course.title} Certificate`,
                  text: `I've completed the ${course.title} course!`,
                  url: window.location.href
                });
              } else {
                alert("Sharing is not supported on this browser");
              }
            }}
            className="certificate__action-btn certificate__btn-share"
          >
            <FaShare /> Share
          </button>
        </div>
      </div>
      
      {/* Email success notification */}
      {emailSent && (
        <div className="certificate__email-success">
          <FaCheckCircle className="certificate__success-icon" />
          <p>Certificate has been sent to your email!</p>
        </div>
      )}
      
      <div className="certificate__wrapper">
        <div className="certificate__document" ref={certificateRef}>
          {/* Modern certificate design with new color theme */}
          <div className="certificate__modern">
            <div className="certificate__modern-background"></div>
            
            {/* Header with branding */}
            <div className="certificate__modern-header">
              <div className="certificate__modern-logo">
                <FaShieldAlt className="certificate__modern-logo-icon" />
                <div className="certificate__modern-brand">NeuraleLearn</div>
              </div>
              <div className="certificate__modern-achievement">
                <FaMedal className="certificate__modern-medal" />
              </div>
            </div>
            
            {/* Certificate title */}
            <div className="certificate__modern-title-section">
              <h1 className="certificate__modern-title">Certificate of Achievement</h1>
              <div className="certificate__modern-subtitle">OFFICIAL RECOGNITION OF COURSE COMPLETION</div>
            </div>
            
            {/* Main content */}
            <div className="certificate__modern-body">
              <div className="certificate__modern-presented">Proudly Presented To</div>
              
              <h2 className="certificate__modern-name">{displayName}</h2>
              
              <div className="certificate__modern-completion">
                for successfully completing all requirements of
              </div>
              
              <div className="certificate__modern-course">
                {certificateData.courseTitle}
              </div>
              
              {/* Certificate details in a modern layout */}
              <div className="certificate__modern-details">
                <div className="certificate__modern-detail">
                  <div className="certificate__modern-detail-icon">
                    <FaGraduationCap />
                  </div>
                  <div className="certificate__modern-detail-content">
                    <div className="certificate__modern-detail-label">Course Level</div>
                    <div className="certificate__modern-detail-value">{course.level || "Advanced"}</div>
                  </div>
                </div>
                
                <div className="certificate__modern-detail">
                  <div className="certificate__modern-detail-icon">
                    <FaCalendarAlt />
                  </div>
                  <div className="certificate__modern-detail-content">
                    <div className="certificate__modern-detail-label">Issue Date</div>
                    <div className="certificate__modern-detail-value">{formattedDate}</div>
                  </div>
                </div>
                
                <div className="certificate__modern-detail">
                  <div className="certificate__modern-detail-icon">
                    <FaCheckCircle />
                  </div>
                  <div className="certificate__modern-detail-content">
                    <div className="certificate__modern-detail-label">Status</div>
                    <div className="certificate__modern-detail-value">Completed</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Signatures and verification */}
            <div className="certificate__modern-footer">
              <div className="certificate__modern-signatures">
                <div className="certificate__modern-signature">
                  <div className="certificate__modern-signature-line"></div>
                  <div className="certificate__modern-signature-title">Course Instructor</div>
                </div>
                
                <div className="certificate__modern-verification">
                  <div className="certificate__modern-qr">
                    <FaQrcode className="certificate__modern-qr-icon" />
                  </div>
                  <div className="certificate__modern-verification-info">
                    <div className="certificate__modern-verification-text">Certificate ID</div>
                    <div className="certificate__modern-verification-id">
                      {certificateData.certificateId || certificateId}
                    </div>
                   
                  </div>
                </div>
                
                <div className="certificate__modern-signature">
                  <div className="certificate__modern-signature-line"></div>
                  <div className="certificate__modern-signature-title">Program Director</div>
                </div>
              </div>
            </div>
            
            <div className="certificate__modern-copyright">
              © {new Date().getFullYear()} NeuraleLearn • Excellence in Online Education • All Rights Reserved
            </div>
          </div>
        </div>
      </div>
      
      {/* Add CSS for the new design */}
      <style jsx="true">{`
        .certificate__modern {
          position: relative;
          width: 100%;
          height: 100%;
          background: #ffffff;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          color: #333;
        }
        
        .certificate__modern-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(66, 103, 178, 0.08) 0%, rgba(66, 103, 178, 0.02) 100%);
          z-index: 0;
        }
        
        .certificate__modern-background:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(66, 103, 178, 0.05) 0%, transparent 20%),
            radial-gradient(circle at 90% 80%, rgba(66, 103, 178, 0.05) 0%, transparent 20%),
            radial-gradient(circle at 50% 50%, rgba(66, 103, 178, 0.03) 0%, transparent 40%);
        }
        
        .certificate__modern-header {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          z-index: 1;
        }
        
        .certificate__modern-logo {
          display: flex;
          align-items: center;
        }
        
        .certificate__modern-logo-icon {
          font-size: 32px;
          color: #4267B2;
          margin-right: 10px;
        }
        
        .certificate__modern-brand {
          font-size: 24px;
          font-weight: 700;
          color: #4267B2;
          letter-spacing: 1px;
        }
        
        .certificate__modern-achievement {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .certificate__modern-medal {
          font-size: 36px;
          color: #FFD700;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }
        
        .certificate__modern-title-section {
          position: relative;
          text-align: center;
          margin: 30px 0;
          z-index: 1;
        }
        
        .certificate__modern-title-section:before,
        .certificate__modern-title-section:after {
          content: '';
          position: absolute;
          top: 50%;
          width: 100px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #4267B2, transparent);
        }
        
        .certificate__modern-title-section:before {
          left: 20%;
        }
        
        .certificate__modern-title-section:after {
          right: 20%;
        }
        
        .certificate__modern-title {
          font-size: 36px;
          font-weight: 700;
          color: #4267B2;
          margin: 0;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        .certificate__modern-subtitle {
          font-size: 14px;
          color: #666;
          letter-spacing: 3px;
          margin-top: 5px;
        }
        
        .certificate__modern-body {
          position: relative;
          text-align: center;
          margin: 40px 0;
          z-index: 1;
        }
        
        .certificate__modern-presented {
          font-size: 16px;
          color: #666;
          margin-bottom: 10px;
        }
        
        .certificate__modern-name {
          font-size: 36px;
          font-weight: 700;
          color: #333;
          margin: 10px 0;
          font-family: 'Brush Script MT', cursive;
          letter-spacing: 1px;
        }
        
        .certificate__modern-completion {
          font-size: 16px;
          color: #666;
          margin: 10px 0;
        }
        
        .certificate__modern-course {
          font-size: 24px;
          font-weight: 600;
          color: #4267B2;
          margin: 20px 0;
          padding: 10px 20px;
          display: inline-block;
          border: 2px solid #4267B2;
          border-radius: 30px;
        }
        
        .certificate__modern-details {
          display: flex;
          justify-content: space-around;
          margin: 30px 0;
        }
        
        .certificate__modern-detail {
          display: flex;
          align-items: center;
          padding: 0 20px;
        }
        
        .certificate__modern-detail-icon {
          font-size: 24px;
          color: #4267B2;
          margin-right: 10px;
        }
        
        .certificate__modern-detail-content {
          text-align: left;
        }
        
        .certificate__modern-detail-label {
          font-size: 14px;
          color: #666;
        }
        
        .certificate__modern-detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        
        .certificate__modern-footer {
          position: relative;
          margin-top: 40px;
          z-index: 1;
        }
        
        .certificate__modern-signatures {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        
        .certificate__modern-signature {
          text-align: center;
          width: 180px;
        }
        
        .certificate__modern-signature-line {
          width: 100%;
          height: 1px;
          background: #333;
          margin-bottom: 5px;
        }
        
        .certificate__modern-signature-title {
          font-size: 14px;
          color: #666;
        }
        
        .certificate__modern-verification {
          display: flex;
          align-items: center;
        }
        
        .certificate__modern-qr {
          width: 80px;
          height: 80px;
          background: #f1f1f1;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 15px;
          border-radius: 8px;
        }
        
        .certificate__modern-qr-icon {
          font-size: 50px;
          color: #333;
        }
        
        .certificate__modern-verification-info {
          text-align: left;
        }
        
        .certificate__modern-verification-text {
          font-size: 12px;
          color: #666;
        }
        
        .certificate__modern-verification-id {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin: 5px 0;
        }
        
        .certificate__modern-verification-url {
          font-size: 12px;
          color: #4267B2;
        }
        
        .certificate__modern-copyright {
          position: absolute;
          bottom: 20px;
          left: 0;
          width: 100%;
          text-align: center;
          font-size: 12px;
          color: #999;
          z-index: 1;
        }
        
        @media print {
          .certificate__actions, 
          .certificate__email-success {
            display: none !important;
          }
          
          .certificate__wrapper {
            margin: 0;
            padding: 0;
          }
          
          .certificate__container {
            padding: 0;
            background: none;
          }
          
          .certificate__document {
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
};

export default CourseCertificate;