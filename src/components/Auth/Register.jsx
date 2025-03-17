import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [currentStep, setCurrentStep] = useState(1);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const navigate = useNavigate();

    // Animated background effect
    useEffect(() => {
        const canvas = document.getElementById('particles-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            let particles = [];
            
            // Set canvas size
            const resizeCanvas = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };
            
            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();
            
            // Create particles
            for (let i = 0; i < 100; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 3 + 1,
                    color: `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`,
                    speedX: Math.random() * 0.5 - 0.25,
                    speedY: Math.random() * 0.5 - 0.25
                });
            }
            
            // Animation function
            const animate = () => {
                requestAnimationFrame(animate);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                particles.forEach(particle => {
                    // Move particles
                    particle.x += particle.speedX;
                    particle.y += particle.speedY;
                    
                    // Bounce off edges
                    if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
                    if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
                    
                    // Draw particle
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                    ctx.fillStyle = particle.color;
                    ctx.fill();
                });
                
                // Draw connections
                particles.forEach((p1, i) => {
                    particles.slice(i + 1).forEach(p2 => {
                        const distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
                        if (distance < 100) {
                            ctx.beginPath();
                            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance / 100)})`;
                            ctx.lineWidth = 0.5;
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.stroke();
                        }
                    });
                });
            };
            
            animate();
            
            return () => {
                window.removeEventListener('resize', resizeCanvas);
            };
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Check password strength when password changes
        if (name === 'password') {
            calculatePasswordStrength(value);
        }

        // Clear related error when user types
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: ''
            });
        }
    };

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength += 1;
        
        // Contains uppercase
        if (/[A-Z]/.test(password)) strength += 1;
        
        // Contains lowercase
        if (/[a-z]/.test(password)) strength += 1;
        
        // Contains number
        if (/[0-9]/.test(password)) strength += 1;
        
        // Contains special character
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        setPasswordStrength(strength);
    };

    const validateForm = () => {
        const errors = {};
        
        // Validate name
        if (formData.name.trim().length < 2) {
            errors.name = "Name must be at least 2 characters";
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            errors.email = "Please enter a valid email address";
        }
        
        // Validate password
        if (formData.password.length < 4) {
            errors.password = "Password must be at least 4 characters";
        }
        
        // Validate confirm password
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = (e) => {
        e.preventDefault();
        
        if (currentStep === 1) {
            if (formData.name && formData.email) {
                setCurrentStep(2);
            } else {
                setFormErrors({
                    ...formErrors,
                    name: !formData.name ? "Name is required" : "",
                    email: !formData.email ? "Email is required" : ""
                });
                
                // Error shake animation
                const form = document.querySelector('.eduai-auth-form');
                form.classList.add('error-shake');
                setTimeout(() => form.classList.remove('error-shake'), 500);
            }
        }
    };

    const handleBack = () => {
        setCurrentStep(1);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            // Error shake animation
            const form = document.querySelector('.eduai-auth-form');
            form.classList.add('error-shake');
            setTimeout(() => form.classList.remove('error-shake'), 500);
            return;
        }
        
        setError("");
        setIsLoading(true);
        
        try {
            await axios.post("http://localhost:8080/register", { 
                name: formData.name, 
                email: formData.email, 
                password: formData.password 
            });
            
            // Success animation
            document.querySelector('.eduai-auth-box').classList.add('success-animation');
            
            setTimeout(() => {
                navigate("/");
            }, 1000);
            
        } catch (error) {
            setError("Registration failed. Email may already be in use.");
            // Error shake animation
            const form = document.querySelector('.eduai-auth-form');
            form.classList.add('error-shake');
            setTimeout(() => form.classList.remove('error-shake'), 500);
            setIsLoading(false);
        }
    };

    // Get strength color
    const getStrengthColor = () => {
        if (passwordStrength <= 1) return "#ff4d4d";
        if (passwordStrength <= 3) return "#ffa500";
        return "#00cc66";
    };

    // Get strength text
    const getStrengthText = () => {
        if (passwordStrength <= 1) return "Weak";
        if (passwordStrength <= 3) return "Moderate";
        return "Strong";
    };

    return (
        <div className="eduai-auth-container">
            <canvas id="particles-canvas" className="eduai-particles"></canvas>
            
            <div className="eduai-auth-box">
                <div className="eduai-auth-logo">
                    <span className="eduai-logo-icon">🧠</span>
                    <h1>EduAI Tutor</h1>
                </div>
                
                <h2 className="eduai-auth-title">Create an Account</h2>
                <p className="eduai-auth-subtitle">Join our community of learners today</p>
                
                {error && (
                    <div className="eduai-auth-error">
                        <span className="eduai-error-icon">⚠️</span>
                        {error}
                    </div>
                )}
                
                <div className="eduai-progress-container">
                    <div className="eduai-progress-step completed">
                        <span className="eduai-step-number">1</span>
                        <span className="eduai-step-text">Account</span>
                    </div>
                    <div className="eduai-progress-line">
                        <div className={`eduai-progress-inner ${currentStep === 2 ? 'completed' : ''}`}></div>
                    </div>
                    <div className={`eduai-progress-step ${currentStep === 2 ? 'active' : ''}`}>
                        <span className="eduai-step-number">2</span>
                        <span className="eduai-step-text">Security</span>
                    </div>
                </div>
                
                <form className="eduai-auth-form" onSubmit={currentStep === 1 ? handleNext : handleRegister}>
                    {currentStep === 1 ? (
                        <>
                            <div className="eduai-form-group">
                                <label htmlFor="name">Full Name</label>
                                <div className="eduai-input-wrapper">
                                    <span className="eduai-input-icon">👤</span>
                                    <input 
                                        id="name"
                                        name="name"
                                        type="text" 
                                        placeholder="Enter your full name" 
                                        value={formData.name} 
                                        onChange={handleChange} 
                                        className={formErrors.name ? 'input-error' : ''}
                                        required 
                                    />
                                </div>
                                {formErrors.name && <div className="eduai-field-error">{formErrors.name}</div>}
                            </div>
                            
                            <div className="eduai-form-group">
                                <label htmlFor="email">Email Address</label>
                                <div className="eduai-input-wrapper">
                                    <span className="eduai-input-icon">✉️</span>
                                    <input 
                                        id="email"
                                        name="email"
                                        type="email" 
                                        placeholder="yourname@example.com" 
                                        value={formData.email} 
                                        onChange={handleChange} 
                                        className={formErrors.email ? 'input-error' : ''}
                                        required 
                                    />
                                </div>
                                {formErrors.email && <div className="eduai-field-error">{formErrors.email}</div>}
                            </div>
                            
                            <button 
                                type="submit" 
                                className="eduai-auth-button"
                            >
                                Continue
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="eduai-form-group">
                                <label htmlFor="password">Create Password</label>
                                <div className="eduai-input-wrapper">
                                    <span className="eduai-input-icon">🔒</span>
                                    <input 
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Create a strong password" 
                                        value={formData.password} 
                                        onChange={handleChange} 
                                        className={formErrors.password ? 'input-error' : ''}
                                        required 
                                    />
                                    <button 
                                        type="button" 
                                        className="eduai-password-toggle" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? "👁️" : "👁️‍🗨️"}
                                    </button>
                                </div>
                                {formErrors.password && <div className="eduai-field-error">{formErrors.password}</div>}
                                
                                {formData.password && (
                                    <div className="eduai-password-strength">
                                        <div className="eduai-strength-text">
                                            Password strength: <span style={{ color: getStrengthColor() }}>{getStrengthText()}</span>
                                        </div>
                                        <div className="eduai-strength-meter">
                                            <div 
                                                className="eduai-strength-indicator" 
                                                style={{ 
                                                    width: `${(passwordStrength / 5) * 100}%`,
                                                    backgroundColor: getStrengthColor() 
                                                }}
                                            ></div>
                                        </div>
                                        <div className="eduai-password-tips">
                                            Tips: Include uppercase, lowercase, numbers, and special characters
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="eduai-form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <div className="eduai-input-wrapper">
                                    <span className="eduai-input-icon">🔒</span>
                                    <input 
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Re-enter your password" 
                                        value={formData.confirmPassword} 
                                        onChange={handleChange} 
                                        className={formErrors.confirmPassword ? 'input-error' : ''}
                                        required 
                                    />
                                </div>
                                {formErrors.confirmPassword && <div className="eduai-field-error">{formErrors.confirmPassword}</div>}
                            </div>
                            
                            <div className="eduai-form-buttons">
                                <button 
                                    type="button" 
                                    className="eduai-back-button"
                                    onClick={handleBack}
                                >
                                    Back
                                </button>
                                <button 
                                    type="submit" 
                                    className={`eduai-auth-button ${isLoading ? 'loading' : ''}`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <span className="eduai-spinner"></span> : 'Create Account'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
                
                <p className="eduai-auth-redirect">
                    Already have an account? 
                    <button className="eduai-redirect-link" onClick={() => navigate("/")}>
                        Log in
                    </button>
                </p>
                
                {/* <p className="eduai-terms">
                    By signing up, you agree to our 
                    <a href="#" className="eduai-terms-link">Terms of Service</a> and 
                    <a href="#" className="eduai-terms-link">Privacy Policy</a>
                </p> */}
            </div>
        </div>
    );
};

export default Register;