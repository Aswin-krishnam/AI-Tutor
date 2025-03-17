import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animatedSections, setAnimatedSections] = useState({});
  const sectionsRef = useRef({});

  // Testimonials data - culturally diverse Indian names
  const testimonials = [
    {
      quote: "Neurale Learn has transformed my learning experience. I went from struggling with advanced mathematics to excelling in my competitive exams in just two months!",
      author: "Arjun Sharma",
      role: "IIT Aspirant",
      icon: "🎓"
    },
    {
      quote: "As a professor, I've integrated Neurale Learn into my classroom. The personalized insights help me identify which students need additional support in specific concepts.",
      author: "Dr. Priya Patel",
      role: "Computer Science Professor",
      icon: "👩‍🏫"
    },
    {
      quote: "The 24/7 availability of Neurale Learn means I can prepare for UPSC at my own pace and get help whenever I need it. It's like having a personal tutor that never sleeps!",
      author: "Vikram Reddy",
      role: "UPSC Aspirant",
      icon: "📚"
    }
  ];

  // Initialize section refs
  useEffect(() => {
    sectionsRef.current = {
      hero: document.getElementById('hero'),
      features: document.getElementById('features'),
      howItWorks: document.getElementById('how-it-works'),
      about: document.getElementById('about'),
      users: document.getElementById('users'),
      testimonials: document.getElementById('testimonials'),
      cta: document.getElementById('cta')
    };
  }, []);

  // Track scroll for navbar effects and section animations
  useEffect(() => {
    const handleScroll = () => {
      // Navbar effect
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Section animations
      Object.entries(sectionsRef.current).forEach(([key, section]) => {
        if (section && isElementInViewport(section) && !animatedSections[key]) {
          setAnimatedSections(prev => ({ ...prev, [key]: true }));
        }
      });
    };

    const isElementInViewport = (el) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.75
      );
    };

    window.addEventListener('scroll', handleScroll);
    
    // Auto-rotate testimonials
    const testimonialInterval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);

    // Initial check for elements in viewport
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(testimonialInterval);
    };
  }, [testimonials.length, animatedSections]);

  // Scroll to section function
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="neurale-home">
      {/* Navbar */}
      <nav className={`neurale-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="neurale-container neurale-navbar-container">
          <div className="neurale-logo">
            <span className="neurale-logo-icon">🧠</span>
            <span>Neurale Learn</span>
          </div>
          
          <div className={`neurale-nav-links ${mobileMenuOpen ? 'active' : ''}`}>
            <ul>
              <li><button onClick={() => scrollToSection('hero')}>Home</button></li>
              <li><button onClick={() => scrollToSection('features')}>Features</button></li>
              <li><button onClick={() => scrollToSection('about')}>About</button></li>
              <li><button onClick={() => scrollToSection('testimonials')}>Success Stories</button></li>
              <li className="neurale-nav-cta">
                <button className="neurale-btn neurale-btn-login" onClick={() => navigate('/login')}>
                  Login
                </button>
              </li>
            </ul>
          </div>
          
          <button 
            className="neurale-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className={`neurale-hero ${animatedSections.hero ? 'animate' : ''}`}>
        <div className="neurale-particles">
          {Array(20).fill().map((_, index) => (
            <div key={index} className="particle"></div>
          ))}
        </div>
        <div className="neurale-container">
          <div className="neurale-hero-content">
            
            <h1>
              <span className="text-gradient">Unlock Your Potential</span>
              <br />with AI-Powered Learning
            </h1>
            <p className="neurale-hero-subtitle">
              Experience the future of education with our advanced AI tutor that adapts to your unique learning style and pace.
            </p>
            <div className="neurale-hero-cta">
              <button className="neurale-btn neurale-btn-primary" onClick={() => navigate('/signup')}>
                <span>Start Learning</span>
                <span className="icon">→</span>
              </button>
              <button className="neurale-btn neurale-btn-secondary" onClick={() => scrollToSection('how-it-works')}>
                <span className="icon">❯</span>
                <span>See How It Works</span>
              </button>
            </div>
            <div className="neurale-hero-stats">
              <div className="neurale-stat">
                <span className="neurale-stat-number counter">1,00,000+</span>
                <span className="neurale-stat-label">Active Students</span>
              </div>
              <div className="neurale-stat">
                <span className="neurale-stat-number counter">98%</span>
                <span className="neurale-stat-label">Satisfaction Rate</span>
              </div>
              <div className="neurale-stat">
                <span className="neurale-stat-number counter">500+</span>
                <span className="neurale-stat-label">Subject Areas</span>
              </div>
            </div>
          </div>
          <div className="neurale-hero-visual">
            <div className="neurale-brain-animation">
              <div className="neurale-brain-container">
                <div className="neurale-brain-neuron n1"></div>
                <div className="neurale-brain-neuron n2"></div>
                <div className="neurale-brain-neuron n3"></div>
                <div className="neurale-brain-neuron n4"></div>
                <div className="neurale-brain-neuron n5"></div>
                <div className="neurale-brain-connections"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="neurale-hero-wave"></div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className={`neurale-how-it-works ${animatedSections.howItWorks ? 'animate' : ''}`}>
        <div className="neurale-container">
          <div className="neurale-section-header">
            <h2>How Neurale Learn <span className="text-gradient">Works</span></h2>
            <p>Our AI-powered platform makes learning intuitive, effective, and enjoyable</p>
          </div>
          
          <div className="neurale-steps">
            <div className="neurale-step">
              <div className="neurale-step-icon">
                <div className="neurale-step-number">1</div>
                <div className="neurale-icon-container">
                  <span className="neurale-icon">❓</span>
                </div>
              </div>
              <h3>Ask Anything</h3>
              <p>Type your question or description of any problem you're struggling with.</p>
            </div>
            <div className="neurale-connector"></div>
            <div className="neurale-step">
              <div className="neurale-step-icon">
                <div className="neurale-step-number">2</div>
                <div className="neurale-icon-container">
                  <span className="neurale-icon">💡</span>
                </div>
              </div>
              <h3>Receive Personalized Guidance</h3>
              <p>Our AI analyzes your question and provides clear, step-by-step explanations.</p>
            </div>
            <div className="neurale-connector"></div>
            <div className="neurale-step">
              <div className="neurale-step-icon">
                <div className="neurale-step-number">3</div>
                <div className="neurale-icon-container">
                  <span className="neurale-icon">🚀</span>
                </div>
              </div>
              <h3>Master Through Practice</h3>
              <p>Solidify your understanding with personalized practice questions and assessments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`neurale-features ${animatedSections.features ? 'animate' : ''}`}>
        <div className="neurale-container">
          <div className="neurale-section-header">
            <h2>Powerful <span className="text-gradient">Learning Features</span></h2>
            <p>Tools designed to accelerate your educational journey</p>
          </div>
          
          <div className="neurale-feature-grid">
            <div className="neurale-feature-card">
              <div className="neurale-feature-icon">
                <span>🤖</span>
              </div>
              <h3>Adaptive AI Tutoring</h3>
              <p>Our AI continuously adapts to your learning style and knowledge gaps for truly personalized education.</p>
              <div className="neurale-feature-hover-effect"></div>
            </div>
            <div className="neurale-feature-card">
              <div className="neurale-feature-icon">
                <span>📚</span>
              </div>
              <h3>Comprehensive Subject Coverage</h3>
              <p>From IIT-JEE preparation to UPSC, NEET, and all academic subjects - we cover all your educational needs.</p>
              <div className="neurale-feature-hover-effect"></div>
            </div>
            <div className="neurale-feature-card">
              <div className="neurale-feature-icon">
                <span>📊</span>
              </div>
              <h3>Progress Analytics</h3>
              <p>Detailed insights into your learning patterns, strengths, and areas needing improvement.</p>
              <div className="neurale-feature-hover-effect"></div>
            </div>
            <div className="neurale-feature-card">
              <div className="neurale-feature-icon">
                <span>📱</span>
              </div>
              <h3>Learn Anywhere</h3>
              <p>Access your AI tutor from any device, whether you're at home, in college, or on the metro.</p>
              <div className="neurale-feature-hover-effect"></div>
            </div>
            <div className="neurale-feature-card">
              <div className="neurale-feature-icon">
                <span>🔍</span>
              </div>
              <h3>Problem Solving</h3>
              <p>Upload photos of homework problems for instant step-by-step solutions and explanations.</p>
              <div className="neurale-feature-hover-effect"></div>
            </div>
            <div className="neurale-feature-card">
              <div className="neurale-feature-icon">
                <span>🗣️</span>
              </div>
              <h3>Multilingual Support</h3>
              <p>Learn in your preferred language with support for Hindi, English, Tamil, Bengali, and 10+ Indian languages.</p>
              <div className="neurale-feature-hover-effect"></div>
            </div>
          </div>
        </div>
        <div className="neurale-features-bg-animation">
          <div className="neurale-shapes-container">
            <div className="neurale-shape s1"></div>
            <div className="neurale-shape s2"></div>
            <div className="neurale-shape s3"></div>
            <div className="neurale-shape s4"></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={`neurale-about ${animatedSections.about ? 'animate' : ''}`}>
        <div className="neurale-container">
          <div className="neurale-about-content">
            <div className="neurale-about-text">
              <h2>About <span className="text-gradient">Neurale Learn</span></h2>
              <p className="neurale-about-intro">
                We're on a mission to democratize education across India through artificial intelligence.
              </p>
              <p>
                Neurale Learn combines cutting-edge AI technology with educational expertise to create 
                a learning experience that's personalized, interactive, and effective. Our platform isn't 
                just about providing answers—it's about fostering deep understanding and critical thinking skills.
              </p>
              <p>
                Founded by a team of IIT and IIM alumni, Neurale Learn is designed to make quality education 
                accessible to every Indian student, regardless of location or background. Our AI has been trained 
                on Indian education board syllabi and competitive exam patterns.
              </p>
              <button className="neurale-btn neurale-btn-outline" onClick={() => navigate('/about')}>
                <span>Our Story</span>
                <span className="icon">→</span>
              </button>
            </div>
            <div className="neurale-about-visual">
              <div className="neurale-india-map-container">
                <div className="neurale-india-map">
                  <div className="neurale-map-dot d1"></div>
                  <div className="neurale-map-dot d2"></div>
                  <div className="neurale-map-dot d3"></div>
                  <div className="neurale-map-dot d4"></div>
                  <div className="neurale-map-dot d5"></div>
                  <div className="neurale-map-dot d6"></div>
                  <div className="neurale-map-connections"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Users Section */}
      <section id="users" className={`neurale-users ${animatedSections.users ? 'animate' : ''}`}>
        <div className="neurale-container">
          <div className="neurale-section-header">
            <h2>Who Benefits from <span className="text-gradient">Neurale Learn</span>?</h2>
            <p>Our platform supports learners and educators at all levels</p>
          </div>
          
          <div className="neurale-users-grid">
            <div className="neurale-user-card">
              <div className="neurale-user-icon">👨‍🎓</div>
              <h3>Students</h3>
              <ul className="neurale-user-benefits">
                <li>24/7 homework help and exam preparation</li>
                <li>Personalized learning paths based on your needs</li>
                <li>Interactive explanations for complex concepts</li>
                <li>Practice questions and immediate feedback</li>
              </ul>
              <div className="neurale-card-decoration"></div>
            </div>
            <div className="neurale-user-card">
              <div className="neurale-user-icon">👩‍🏫</div>
              <h3>Teachers</h3>
              <ul className="neurale-user-benefits">
                <li>Detailed analytics on student progress and challenges</li>
                <li>Automated grading and feedback on assignments</li>
                <li>Supplementary resources for classroom instruction</li>
                <li>Time-saving tools for lesson planning and assessment</li>
              </ul>
              <div className="neurale-card-decoration"></div>
            </div>
            <div className="neurale-user-card">
              <div className="neurale-user-icon">👨‍👩‍👧‍👦</div>
              <h3>Parents</h3>
              <ul className="neurale-user-benefits">
                <li>Monitor your child's learning progress</li>
                <li>Support for helping with homework challenges</li>
                <li>Insights into learning strengths and weaknesses</li>
                <li>Peace of mind with safe, educational screen time</li>
              </ul>
              <div className="neurale-card-decoration"></div>
            </div>
            <div className="neurale-user-card">
              <div className="neurale-user-icon">🧠</div>
              <h3>Lifelong Learners</h3>
              <ul className="neurale-user-benefits">
                <li>Brush up on forgotten concepts or skills</li>
                <li>Learn at your own pace without pressure</li>
                <li>Explore new subjects and interests</li>
                <li>Prepare for career advancement opportunities</li>
              </ul>
              <div className="neurale-card-decoration"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className={`neurale-testimonials ${animatedSections.testimonials ? 'animate' : ''}`}>
        <div className="neurale-container">
          <div className="neurale-section-header">
            <h2>Success <span className="text-gradient">Stories</span></h2>
            <p>Hear from students and educators from across India who've transformed their learning experience</p>
          </div>
          
          <div className="neurale-testimonial-slider">
            <div className="neurale-testimonial-inner" style={{transform: `translateX(-${activeTestimonial * 100}%)`}}>
              {testimonials.map((testimonial, index) => (
                <div key={index} className="neurale-testimonial-slide">
                  <div className="neurale-testimonial-content">
                    <div className="neurale-testimonial-quote">{testimonial.quote}</div>
                    <div className="neurale-testimonial-author">
                      <div className="neurale-author-avatar">
                        {testimonial.icon}
                      </div>
                      <div>
                        <div className="neurale-author-name">{testimonial.author}</div>
                        <div className="neurale-author-role">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="neurale-testimonial-dots">
              {testimonials.map((_, index) => (
                <button 
                  key={index} 
                  className={`neurale-dot ${activeTestimonial === index ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(index)}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section id="cta" className={`neurale-cta ${animatedSections.cta ? 'animate' : ''}`}>
        <div className="neurale-container">
          <div className="neurale-cta-content">
            <div className="neurale-cta-decoration">
              <div className="neurale-cta-circles c1"></div>
              <div className="neurale-cta-circles c2"></div>
              <div className="neurale-cta-circles c3"></div>
            </div>
            <h2>Ready to Transform Your <span className="text-gradient">Learning Journey</span>?</h2>
            <p>Join thousands of students across India who are mastering subjects faster and more effectively with Neurale Learn.</p>
            <button className="neurale-btn neurale-btn-cta" onClick={() => navigate('/signup')}>
              <span>Start Learning Now</span>
              <span className="icon">→</span>
            </button>
           
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="neurale-footer">
        <div className="neurale-footer-wave"></div>
        <div className="neurale-container">
          <div className="neurale-footer-grid">
            <div className="neurale-footer-col neurale-footer-brand">
              <div className="neurale-logo">
                <span className="neurale-logo-icon">🧠</span>
                <span>Neurale Learn</span>
              </div>
              <p>Empowering India's education through artificial intelligence.</p>
              <div className="neurale-social-links">
                <button onClick={() => navigate('/social/facebook')} aria-label="Facebook" className="neurale-social-btn">
                  <i className="social-icon">👤</i>
                </button>
                <button onClick={() => navigate('/social/twitter')} aria-label="Twitter" className="neurale-social-btn">
                  <i className="social-icon">🐦</i>
                </button>
                <button onClick={() => navigate('/social/linkedin')} aria-label="LinkedIn" className="neurale-social-btn">
                  <i className="social-icon">💼</i>
                </button>
                <button onClick={() => navigate('/social/instagram')} aria-label="Instagram" className="neurale-social-btn">
                  <i className="social-icon">📷</i>
                </button>
              </div>
            </div>
            
            <div className="neurale-footer-col">
              <h4>Product</h4>
              <ul>
                <li><button onClick={() => scrollToSection('features')}>Features</button></li>
                <li><button >For Schools</button></li>
                <li><button >For Colleges</button></li>
                <li><button >For Coaching Institutes</button></li>
              </ul>
            </div>
            
            <div className="neurale-footer-col">
              <h4>Resources</h4>
              <ul>
                <li><button >Help Center</button></li>
                <li><button >Blog</button></li>
                <li><button >Tutorials</button></li>
                <li><button >Community</button></li>
              </ul>
            </div>
            
            <div className="neurale-footer-col">
              <h4>Company</h4>
              <ul>
                <li><button >About Us</button></li>
                <li><button >Careers</button></li>
                <li><button >Privacy Policy</button></li>
                <li><button >Terms of Service</button></li>
              </ul>
            </div>
          </div>
          
          <div className="neurale-footer-bottom">
            <p>&copy; 2025 Neurale Learn. All Rights Reserved. <span className="made-in-india">🇮🇳 Made in India</span></p>
            <div className="neurale-language-selector">
              <select>
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="ta">தமிழ்</option>
                <option value="te">తెలుగు</option>
                <option value="bn">বাংলা</option>
              </select>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;