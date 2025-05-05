import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowUp, BarChart2, Bell, BookOpen, Briefcase,
  ChevronRight, ClipboardList, Cloud, CreditCard, Factory,
  Facebook, FileText, HelpCircle, Home, Instagram,
  LayoutDashboard, Lightbulb, Linkedin, Mail, MapPin, Menu,
  MessageSquare, Moon, Phone, PieChart, Rocket, Settings, Shield,
  ShoppingCart, Sun, TrendingUp, Truck, Twitter, Users, X, CheckCircle
} from 'lucide-react';

// Logo imports
import LogoDark from '../assets/LogoDark.png';
import LogoLight from '../assets/LogoLight.png';

// Modern Dashboard Illustration Component
const DashboardIllustration = ({ isDarkMode }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" className="w-full h-auto">
    <defs>
      <linearGradient id="a" x1="400" y1="300" x2="400" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={isDarkMode ? "#394652" : "#1C2E4A"} stopOpacity=".1"/>
        <stop offset="1" stopColor={isDarkMode ? "#394652" : "#1C2E4A"} stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={isDarkMode ? "#3B82F6" : "#1C2E4A"} stopOpacity="0.1"/>
        <stop offset="100%" stopColor={isDarkMode ? "#3B82F6" : "#1C2E4A"} stopOpacity="0.3"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill={isDarkMode ? "#060B13" : "#F8F9FA"} opacity=".2"/>
    <path fill={isDarkMode ? "#394652" : "#1C2E4A"} d="M680 450H120a10 10 0 0 1-10-10V120a10 10 0 0 1 10-10h560a10 10 0 0 1 10 10v320a10 10 0 0 1-10 10Z" opacity=".1"/>
    <rect width="600" height="400" x="100" y="100" fill={isDarkMode ? "#0A1324" : "#FFF"} rx="10"/>
    <rect width="600" height="60" x="100" y="100" fill={isDarkMode ? "#394652" : "#1C2E4A"} rx="10"/>
    <circle cx="130" cy="130" r="10" fill={isDarkMode ? "#060B13" : "#F8F9FA"}/>
    <circle cx="160" cy="130" r="10" fill={isDarkMode ? "#394652" : "#BDC4D4"}/>
    <circle cx="190" cy="130" r="10" fill={isDarkMode ? "#A7B2C2" : "#52677D"}/>
    <rect width="200" height="20" x="450" y="125" fill={isDarkMode ? "#060B13" : "#F8F9FA"} rx="10"/>
    <rect width="250" height="15" x="100" y="200" fill={isDarkMode ? "#394652" : "#BDC4D4"} rx="7.5" opacity=".6"/>
    <rect width="150" height="15" x="100" y="230" fill={isDarkMode ? "#394652" : "#BDC4D4"} rx="7.5" opacity=".4"/>
    <rect width="120" height="120" x="120" y="280" fill="url(#cardGradient)" rx="10"/>
    <rect width="120" height="120" x="280" y="280" fill="url(#cardGradient)" rx="10"/>
    <rect width="120" height="120" x="440" y="280" fill="url(#cardGradient)" rx="10"/>
    <rect width="80" height="80" x="140" y="300" fill={isDarkMode ? "#A7B2C2" : "#52677D"} opacity=".2" rx="10"/>
    <rect width="80" height="80" x="300" y="300" fill={isDarkMode ? "#A7B2C2" : "#52677D"} opacity=".2" rx="10"/>
    <rect width="80" height="80" x="460" y="300" fill={isDarkMode ? "#A7B2C2" : "#52677D"} opacity=".2" rx="10"/>
    <rect width="550" height="15" x="125" y="450" fill={isDarkMode ? "#394652" : "#BDC4D4"} rx="7.5" opacity=".3"/>
    <rect width="400" height="15" x="125" y="480" fill={isDarkMode ? "#394652" : "#BDC4D4"} rx="7.5" opacity=".2"/>
    <rect width="300" height="15" x="125" y="510" fill={isDarkMode ? "#394652" : "#BDC4D4"} rx="7.5" opacity=".1"/>
  </svg>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNavbarFloating, setIsNavbarFloating] = useState(false);
  const [isThemeChanging, setIsThemeChanging] = useState(false);
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);

  // Set initial theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      setIsDarkMode(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  // Update theme when isDarkMode changes
  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.classList.toggle('dark', isDarkMode);
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      setTimeout(() => {
        setIsThemeChanging(false);
      }, 500);
    };

    if (isThemeChanging) {
      applyTheme();
    }
  }, [isDarkMode, isThemeChanging]);

  // Modern color scheme with gradients
  const colors = isDarkMode ? {
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    secondary: '#394652',
    accent: '#A7B2C2',
    background: '#060B13',
    cardBg: '#0A1324',
    text: '#F9FAFB',
    textLight: '#A7B2C2',
    textLighter: '#A8A79F',
    border: '#394652',
    white: '#F9FAFB',
    success: '#10B981',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
  } : {
    primary: '#1C2E4A',
    primaryLight: '#3A4D6B',
    secondary: '#52677D',
    accent: '#D1CFC9',
    background: '#FFFFFF',
    cardBg: '#F8F9FA',
    text: '#1C2E4A',
    textLight: '#52677D',
    textLighter: '#8A9CB0',
    border: '#E0E4E9',
    white: '#FFFFFF',
    success: '#10B981',
    gradient: 'linear-gradient(135deg, #1C2E4A 0%, #3A4D6B 100%)',
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'howItWorks', label: 'How It Works' },
    { id: 'contact', label: 'Contact' }
  ];

  // Scroll handling effect
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
      setIsNavbarFloating(window.scrollY > 50);
      
      const sections = navItems.map(item => item.id);
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { top, bottom } = element.getBoundingClientRect();
          const elementTop = top + window.scrollY;
          const elementBottom = bottom + window.scrollY;
          if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll function
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
      setMobileMenuOpen(false);
    }
  };

  // Enhanced motion variants
  const fadeIn = { 
    hidden: { opacity: 0, y: 20 }, 
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1] 
      } 
    } 
  };
  
  const staggerChildren = { 
    hidden: { opacity: 0 }, 
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.15, 
        delayChildren: 0.2 
      } 
    } 
  };
  
  const cardHover = { 
    y: -8, 
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 15 
    } 
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const email = e.target.email.value;
    const message = e.target.message.value;

    if (name && email && message) {
      console.log('Form submitted:', { name, email, subject: e.target.subject.value, message });
      setFormSubmitted(true);
    } else {
      alert('Please fill in all required fields.');
    }
  };

  const toggleDarkMode = () => {
    setIsThemeChanging(true);
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`} 
         style={{ backgroundColor: colors.background, color: colors.text }}>
      {/* Theme transition overlay */}
      <AnimatePresence>
        {isThemeChanging && (
          <motion.div
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{ backgroundColor: isDarkMode ? colors.background : colors.background }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 p-3 rounded-full shadow-xl z-50"
            style={{ 
              background: colors.gradient,
              color: colors.white 
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Scroll back to top"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modern Floating Navbar with Centered Navigation */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 md:px-8 flex justify-between items-center transition-all duration-300 ${
          isNavbarFloating ? 'shadow-lg backdrop-blur-md bg-opacity-90' : ''
        }`}
        style={{ 
          backgroundColor: isNavbarFloating 
            ? isDarkMode ? 'rgba(6, 11, 19, 0.85)' : 'rgba(255, 255, 255, 0.85)' 
            : colors.background,
          borderBottom: isNavbarFloating ? `1px solid ${colors.border}` : 'none'
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo with hover animation */}
        <motion.div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => scrollToSection('home')}
          onHoverStart={() => setIsHoveringLogo(true)}
          onHoverEnd={() => setIsHoveringLogo(false)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.img 
            src={isDarkMode ? LogoLight : LogoDark} 
            alt="ManageFlow Logo" 
            className="h-14 w-14 object-contain" // Increased logo size
            key={isDarkMode ? "dark-logo" : "light-logo"}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              rotate: isHoveringLogo ? [0, 10, -10, 0] : 0
            }}
            transition={{ 
              opacity: { duration: 0.3 },
              rotate: { duration: 0.5, type: "spring" }
            }}
          />
        </motion.div>

        {/* Centered Desktop Navigation */}
        <motion.div 
          className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-1 bg-opacity-10 backdrop-blur-sm rounded-full p-1.5"
               style={{ backgroundColor: isDarkMode ? 'rgba(167, 178, 194, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}>
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-5 py-2 rounded-full font-medium relative overflow-hidden group transition-all duration-300`}
                style={{ 
                  color: activeSection === item.id ? colors.white : colors.textLight,
                  backgroundColor: activeSection === item.id ? colors.primary : 'transparent'
                }}
                whileHover={{
                  backgroundColor: activeSection !== item.id ? (isDarkMode ? 'rgba(167, 178, 194, 0.2)' : 'rgba(0, 0, 0, 0.1)') : colors.primaryLight
                }}
                aria-current={activeSection === item.id ? 'page' : undefined}
              >
                <span className="relative z-10">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
        
        {/* Right Side Controls */}
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {/* Dark Mode Toggle */}
          <motion.button
            onClick={toggleDarkMode}
            className="p-2 rounded-full flex items-center justify-center overflow-hidden"
            style={{ 
              backgroundColor: isDarkMode ? 'rgba(167, 178, 194, 0.1)' : 'rgba(0, 0, 0, 0.05)', 
              color: colors.textLight 
            }}
            whileHover={{ scale: 1.1, backgroundColor: colors.primary, color: colors.white }}
            whileTap={{ scale: 0.9 }}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isDarkMode ? "dark-icon" : "light-icon"}
                initial={{ y: -20, opacity: 0, rotate: -30 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 20, opacity: 0, rotate: 30 }}
                transition={{ duration: 0.3 }}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
          
          {/* Sign In Button */}
          <motion.button
            onClick={() => navigate('/login')}
            className="px-6 py-2 rounded-full font-semibold shadow-sm flex items-center gap-2"
            style={{ 
              background: colors.gradient,
              color: colors.white 
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Sign In</span>
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </motion.div>

        {/* Mobile Menu Controls */}
        <div className="md:hidden flex items-center gap-2">
          <motion.button
            onClick={toggleDarkMode}
            className="p-2 rounded-full flex items-center justify-center overflow-hidden"
            style={{ 
              backgroundColor: isDarkMode ? 'rgba(167, 178, 194, 0.1)' : 'rgba(0, 0, 0, 0.05)', 
              color: colors.textLight 
            }}
            whileHover={{ backgroundColor: colors.primary, color: colors.white }}
            whileTap={{ scale: 0.9 }}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </motion.button>
          
          <motion.button
            className="focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            style={{ color: colors.text }}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed top-16 left-0 right-0 z-40 shadow-lg md:hidden border-t"
            style={{ 
              backgroundColor: isDarkMode ? 'rgba(6, 11, 19, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderColor: colors.border 
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 py-4 space-y-2">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition-colors`}
                  style={{ 
                    color: activeSection === item.id ? colors.primary : colors.textLight,
                    backgroundColor: activeSection === item.id 
                      ? isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(28, 46, 74, 0.1)'
                      : 'transparent'
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05, duration: 0.3 } }}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                >
                  {item.label}
                </motion.button>
              ))}
              <motion.button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-6 py-3 rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2 mt-4"
                style={{ 
                  background: colors.gradient,
                  color: colors.white 
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: navItems.length * 0.05, duration: 0.3 } }}
                whileHover={{ scale: 1.02 }}
              >
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section
        id="home"
        className="min-h-screen pt-32 pb-16 px-6 md:px-12 lg:px-16 flex flex-col md:flex-row items-center justify-between relative overflow-hidden"
        style={{ backgroundColor: colors.background }}
      >
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl" 
            style={{ backgroundColor: colors.primary }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <motion.div 
            className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl" 
            style={{ backgroundColor: colors.secondary }}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.18, 0.1]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 2
            }}
          />
          <motion.div 
            className="absolute top-1/3 right-1/3 w-72 h-72 rounded-full opacity-5 blur-3xl" 
            style={{ backgroundColor: colors.primary }}
            animate={{ 
              scale: [1, 1.25, 1],
              opacity: [0.05, 0.12, 0.05]
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 4
            }}
          />
        </div>

        <motion.div
          className="max-w-2xl text-center md:text-left mb-12 md:mb-0 relative z-10"
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
        >
          <motion.div
            className="inline-block px-4 py-2 rounded-full mb-6 text-sm font-medium"
            style={{ 
              backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(28, 46, 74, 0.1)',
              color: colors.primary
            }}
            variants={fadeIn}
          >
            All-in-One Business Solution
          </motion.div>
          <motion.h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight"
            style={{ color: colors.text }}
            variants={fadeIn}
          >
            Transform Your <span 
              className="bg-clip-text text-transparent"
              style={{ 
                backgroundImage: colors.gradient
              }}
            >Business</span> Operations
          </motion.h1>
          <motion.p
            className="text-xl mb-8 leading-relaxed max-w-lg"
            style={{ color: colors.textLight }}
            variants={fadeIn}
          >
            Effortlessly manage orders, track payments, and predict trends. Connect suppliers and customers seamlessly on one powerful platform.
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start" variants={fadeIn}>
            <motion.button
              onClick={() => navigate('/register')}
              className="px-8 py-4 rounded-lg font-semibold shadow-sm flex items-center gap-2 justify-center"
              style={{ 
                background: colors.gradient,
                color: colors.white 
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>Get Started Free</span>
              <Rocket className="h-5 w-5" />
            </motion.button>
            <motion.button
              onClick={() => scrollToSection('features')}
              className="border px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 justify-center"
              style={{ 
                borderColor: colors.primary, 
                color: colors.primary,
                backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(28, 46, 74, 0.1)'
              }}
              whileHover={{ scale: 1.03, backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(28, 46, 74, 0.2)' }}
              whileTap={{ scale: 0.97 }}
            >
              <span>Explore Features</span>
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Dashboard Illustration */}
        <motion.div
          className="flex justify-center md:justify-end relative z-10 w-full max-w-2xl mt-12 md:mt-0"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <motion.div
            className="rounded-2xl overflow-hidden shadow-2xl w-full border"
            style={{ borderColor: colors.border }}
            whileHover={cardHover}
            key={isDarkMode ? "dark-dashboard" : "light-dashboard"}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <DashboardIllustration isDarkMode={isDarkMode} />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 px-6 md:px-12 lg:px-16 relative overflow-hidden"
        style={{ backgroundColor: colors.cardBg }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full opacity-5"
               style={{ 
                 backgroundImage: isDarkMode 
                   ? 'radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)' 
                   : 'radial-gradient(circle at 20% 30%, rgba(28, 46, 74, 0.1) 0%, transparent 50%)'
               }} />
        </div>

        <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
          <motion.div
            className="inline-block px-4 py-2 rounded-full mb-6 text-sm font-medium"
            style={{ 
              backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(28, 46, 74, 0.1)',
              color: colors.primary
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Powerful Features
          </motion.div>
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ color: colors.text }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Everything You Need to <span 
              className="bg-clip-text text-transparent"
              style={{ 
                backgroundImage: colors.gradient
              }}
            >Succeed</span>
          </motion.h2>
          <motion.p
            className="text-xl max-w-2xl mx-auto"
            style={{ color: colors.textLight }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Comprehensive tools designed to streamline your operations and drive business growth.
          </motion.p>
        </div>

        <motion.div
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerChildren}
        >
          {[
            {
              icon: <Briefcase className="w-8 h-8" />,
              title: 'Business Management',
              text: 'Oversee all your ventures, locations, and customer bases from a single, unified dashboard.'
            },
            {
              icon: <ShoppingCart className="w-8 h-8" />,
              title: 'Order Tracking',
              text: 'Stay on top of every order, manage stock levels, and monitor shipments with live updates.'
            },
            {
              icon: <CreditCard className="w-8 h-8" />,
              title: 'Financial Control',
              text: 'Effortlessly record payments, generate invoices, and access insightful financial reports.'
            },
            {
              icon: <TrendingUp className="w-8 h-8" />,
              title: 'Data Analytics',
              text: 'Utilize powerful analytics to understand market trends and optimize your business strategy.'
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="rounded-2xl p-8 transition-all duration-300 flex flex-col border"
              style={{ 
                backgroundColor: isDarkMode ? 'rgba(10, 19, 36, 0.7)' : colors.white,
                borderColor: colors.border
              }}
              variants={fadeIn}
              whileHover={cardHover}
            >
              <div className="flex items-center mb-4">
                <motion.div
                  className="p-3 rounded-xl mr-4 flex items-center justify-center"
                  style={{ 
                    background: colors.gradient,
                    color: colors.white 
                  }}
                  whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold" style={{ color: colors.text }}>
                  {feature.title}
                </h3>
              </div>
              <p className="text-base" style={{ color: colors.textLight }}>
                {feature.text}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section
        id="howItWorks"
        className="py-24 px-6 md:px-12 lg:px-16 relative overflow-hidden"
        style={{ backgroundColor: colors.background }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-full opacity-5"
               style={{ 
                 backgroundImage: isDarkMode 
                   ? 'radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)' 
                   : 'radial-gradient(circle at 80% 50%, rgba(28, 46, 74, 0.1) 0%, transparent 50%)'
               }} />
        </div>

        <div className="max-w-4xl mx-auto mb-16 text-center relative z-10">
          <motion.div
            className="inline-block px-4 py-2 rounded-full mb-6 text-sm font-medium"
            style={{ 
              backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(28, 46, 74, 0.1)',
              color: colors.primary
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Simple Process
          </motion.div>
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ color: colors.text }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Get Started in <span 
              className="bg-clip-text text-transparent"
              style={{ 
                backgroundImage: colors.gradient
              }}
            >Minutes</span>
          </motion.h2>
          <motion.p
            className="text-xl"
            style={{ color: colors.textLight }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Our intuitive platform is designed for businesses of all sizes to get up and running quickly.
          </motion.p>
        </div>

        <motion.div
          className="max-w-5xl mx-auto relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerChildren}
        >
          {[
            {
              step: '01',
              title: 'Create Your Account',
              description: 'Sign up in minutes with our streamlined onboarding process. No technical expertise required.',
              icon: <Users className="w-8 h-8" />
            },
            {
              step: '02',
              title: 'Configure Your Workspace',
              description: 'Customize the platform to match your business needs, add team members, and set permissions.',
              icon: <Settings className="w-8 h-8" />
            },
            {
              step: '03',
              title: 'Connect Your Systems',
              description: 'Integrate existing tools, import data, and connect with suppliers and customers.',
              icon: <Cloud className="w-8 h-8" />
            },
            {
              step: '04',
              title: 'Start Growing Your Business',
              description: 'Use powerful analytics and automation to streamline operations and boost profitability.',
              icon: <BarChart2 className="w-8 h-8" />
            }
          ].map((step, i) => (
            <motion.div
              key={i}
              className="flex flex-col md:flex-row items-start mb-16 relative"
              variants={fadeIn}
            >
              <div className="flex-shrink-0 mr-8 mb-4 md:mb-0">
                <motion.div
                  className="w-16 h-16 rounded-full flex items-center justify-center relative z-10 shadow-lg"
                  style={{ 
                    background: colors.gradient,
                    color: colors.white 
                  }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  {step.icon}
                </motion.div>
                {i < 3 && (
                  <motion.div
                    className="absolute left-8 top-16 w-0.5 h-20 hidden md:block"
                    style={{ backgroundColor: colors.primary }}
                    initial={{ height: 0 }}
                    whileInView={{ height: 80 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    viewport={{ once: true }}
                  />
                )}
              </div>
              <div className="bg-opacity-50 backdrop-blur-sm p-6 rounded-xl border"
                   style={{ 
                     backgroundColor: isDarkMode ? 'rgba(10, 19, 36, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                     borderColor: colors.border 
                   }}>
                <div className="flex items-center mb-2">
                  <span className="text-sm font-bold mr-2" style={{ color: colors.primary }}>
                    {step.step}
                  </span>
                  <h3 className="text-2xl font-semibold" style={{ color: colors.text }}>
                    {step.title}
                  </h3>
                </div>
                <p className="text-lg" style={{ color: colors.textLight }}>
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-24 px-6 md:px-12 lg:px-16 relative overflow-hidden"
        style={{ backgroundColor: colors.cardBg }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full opacity-5"
               style={{ 
                 backgroundImage: isDarkMode 
                   ? 'radial-gradient(circle at 50% 70%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)' 
                   : 'radial-gradient(circle at 50% 70%, rgba(28, 46, 74, 0.1) 0%, transparent 50%)'
               }} />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <motion.div
              className="flex flex-col justify-center"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <motion.div
                className="inline-block px-4 py-2 rounded-full mb-6 text-sm font-medium"
                style={{ 
                  backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(28, 46, 74, 0.1)',
                  color: colors.primary
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                Get In Touch
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: colors.text }}>
                Ready to <span 
                  className="bg-clip-text text-transparent"
                  style={{ 
                    backgroundImage: colors.gradient
                  }}
                >Transform</span> Your Business?
              </h2>
              <p className="text-xl mb-8" style={{ color: colors.textLight }}>
                Reach out to our team for a personalized demo or to discuss how ManageFlow can help streamline your operations.
              </p>
              <div className="space-y-6">
                <div className="flex items-start bg-opacity-50 backdrop-blur-sm p-6 rounded-xl border"
                     style={{ 
                       backgroundColor: isDarkMode ? 'rgba(10, 19, 36, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                       borderColor: colors.border 
                     }}>
                  <div
                    className="p-3 rounded-full mr-4 flex items-center justify-center"
                    style={{ 
                      background: colors.gradient,
                      color: colors.white 
                    }}
                  >
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-lg" style={{ color: colors.text }}>Email</h4>
                    <p style={{ color: colors.textLight }}>contact@manageflow.com</p>
                  </div>
                </div>
                <div className="flex items-start bg-opacity-50 backdrop-blur-sm p-6 rounded-xl border"
                     style={{ 
                       backgroundColor: isDarkMode ? 'rgba(10, 19, 36, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                       borderColor: colors.border 
                     }}>
                  <div
                    className="p-3 rounded-full mr-4 flex items-center justify-center"
                    style={{ 
                      background: colors.gradient,
                      color: colors.white 
                    }}
                  >
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-lg" style={{ color: colors.text }}>Phone</h4>
                    <p style={{ color: colors.textLight }}>+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start bg-opacity-50 backdrop-blur-sm p-6 rounded-xl border"
                     style={{ 
                       backgroundColor: isDarkMode ? 'rgba(10, 19, 36, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                       borderColor: colors.border 
                     }}>
                  <div
                    className="p-3 rounded-full mr-4 flex items-center justify-center"
                    style={{ 
                      background: colors.gradient,
                      color: colors.white 
                    }}
                  >
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-lg" style={{ color: colors.text }}>Location</h4>
                    <p style={{ color: colors.textLight }}>123 Business Ave, San Francisco, CA 94107</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {formSubmitted ? (
                <motion.div
                  className="flex flex-col items-center justify-center rounded-2xl p-8 h-full border"
                  style={{ 
                    backgroundColor: isDarkMode ? 'rgba(10, 19, 36, 0.7)' : colors.white,
                    borderColor: colors.border
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex flex-col items-center text-center">
                    <motion.div
                      className="w-16 h-16 mb-6 rounded-full flex items-center justify-center shadow-lg"
                      style={{ 
                        background: colors.gradient,
                        color: colors.white 
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                    >
                      <CheckCircle className="w-8 h-8" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>
                      Thank You!
                    </h3>
                    <p className="text-lg mb-6" style={{ color: colors.textLight }}>
                      Your message has been received. Our team will get back to you shortly.
                    </p>
                    <motion.button
                      onClick={() => setFormSubmitted(false)}
                      className="px-6 py-3 rounded-lg font-medium"
                      style={{ 
                        background: colors.gradient,
                        color: colors.white 
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      Send Another Message
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  onSubmit={handleContactSubmit}
                  className="rounded-2xl p-8 border"
                  style={{ 
                    backgroundColor: isDarkMode ? 'rgba(10, 19, 36, 0.7)' : colors.white,
                    borderColor: colors.border
                  }}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <h3 className="text-2xl font-semibold mb-6" style={{ color: colors.text }}>
                    Send Us a Message
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-2 transition-all duration-300"
                        style={{ 
                          backgroundColor: isDarkMode ? 'rgba(10, 19, 36, 0.4)' : colors.white,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-2 transition-all duration-300"
                        style={{ 
                          backgroundColor: isDarkMode ? 'rgba(10, 19, 36, 0.4)' : colors.white,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-2 transition-all duration-300"
                        style={{ 
                          backgroundColor: isDarkMode ? 'rgba(10, 19, 36, 0.4)' : colors.white,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-2 transition-all duration-300"
                        style={{ 
                          backgroundColor: isDarkMode ? 'rgba(10, 19, 36, 0.4)' : colors.white,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                        required
                      ></textarea>
                    </div>
                  </div>
                  <motion.button
                    type="submit"
                    className="mt-6 w-full px-6 py-3 rounded-lg font-semibold shadow-sm flex items-center justify-center"
                    style={{ 
                      background: colors.gradient,
                      color: colors.white 
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Send Message
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="py-16 px-6 md:px-12 lg:px-16 border-t" style={{ 
        backgroundColor: colors.background,
        borderColor: colors.border 
      }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            <div className="md:col-span-1">
              <motion.div 
                className="flex items-center mb-6"
                whileHover={{ scale: 1.03 }}
              >
                <span className="text-xl font-bold" style={{ color: colors.text }}>ManageFlow</span>
              </motion.div>
              <p className="mb-6 text-lg" style={{ color: colors.textLight }}>
                Simplifying business management for businesses of all sizes.
              </p>
              <div className="flex space-x-4">
                {[
                  { icon: <Twitter className="w-5 h-5" />, label: "Twitter" },
                  { icon: <Facebook className="w-5 h-5" />, label: "Facebook" },
                  { icon: <Instagram className="w-5 h-5" />, label: "Instagram" },
                  { icon: <Linkedin className="w-5 h-5" />, label: "LinkedIn" }
                ].map((social, i) => (
                  <motion.a
                    key={i}
                    href="#"
                    className="p-2 rounded-full"
                    style={{ color: colors.textLight, backgroundColor: colors.border + '30' }}
                    whileHover={{ scale: 1.1, backgroundColor: colors.primary, color: colors.white }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={social.label}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Product</h4>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Integrations', 'Updates', 'Roadmap'].map((item, i) => (
                  <motion.li key={i} whileHover={{ x: 5 }}>
                    <a href="#" className="hover:underline text-lg" style={{ color: colors.textLight }}>
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Company</h4>
              <ul className="space-y-3">
                {['About Us', 'Careers', 'Partners', 'Press', 'Blog'].map((item, i) => (
                  <motion.li key={i} whileHover={{ x: 5 }}>
                    <a href="#" className="hover:underline text-lg" style={{ color: colors.textLight }}>
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Resources</h4>
              <ul className="space-y-3">
                {['Documentation', 'Help Center', 'Community', 'Case Studies', 'Legal'].map((item, i) => (
                  <motion.li key={i} whileHover={{ x: 5 }}>
                    <a href="#" className="hover:underline text-lg" style={{ color: colors.textLight }}>
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-6 flex flex-col md:flex-row justify-between items-center" style={{ borderColor: colors.border }}>
            <p className="text-sm mb-4 md:mb-0" style={{ color: colors.textLighter }}>
              © {new Date().getFullYear()} ManageFlow. All rights reserved.
            </p>
            <div className="flex space-x-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item, i) => (
                <motion.a 
                  key={i} 
                  href="#" 
                  className="text-sm hover:underline" 
                  style={{ color: colors.textLighter }}
                  whileHover={{ color: colors.primary }}
                >
                  {item}
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;