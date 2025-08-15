import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  BarChart2,
  Briefcase,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  Sun,
  Moon,
  Menu,
  X,
  Rocket,
  Users,
  Settings,
  Cloud,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";
import MyHeroSVG from "../../src/assets/herosvg.svg";
import LogoDark from "../assets/LogoDark.png";
import LogoLight from "../assets/LogoLight.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNavbarFloating, setIsNavbarFloating] = useState(false);
  const [isThemeChanging, setIsThemeChanging] = useState(false);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (!savedTheme) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    } else {
      setIsDarkMode(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.classList.toggle("dark", isDarkMode);
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
      setTimeout(() => setIsThemeChanging(false), 500);
    };
    if (isThemeChanging) applyTheme();
  }, [isDarkMode, isThemeChanging]);

  // Color scheme
  const colors = isDarkMode
    ? {
        primary: "#3B82F6",
        primaryLight: "#60A5FA",
        background: "#0A0F1C",
        cardBg: "#111827",
        text: "#F9FAFB",
        textLight: "#A7B2C2",
        border: "#374151",
        white: "#F9FAFB",
        gradient: "linear-gradient(135deg, #3B82F6 0%, #1E40AF 50%, #1E3A8A 100%)",
        gradientHover: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #2563EB 100%)",
        glass: "rgba(17, 24, 39, 0.8)",
      }
    : {
        primary: "#1C2E4A",
        primaryLight: "#3A4D6B",
        background: "#FFFFFF",
        cardBg: "#F8FAFC",
        text: "#0F172A",
        textLight: "#475569",
        border: "#E2E8F0",
        white: "#FFFFFF",
        gradient: "linear-gradient(135deg, #1C2E4A 0%, #3A4D6B 50%, #475569 100%)",
        gradientHover: "linear-gradient(135deg, #3A4D6B 0%, #1C2E4A 50%, #0F172A 100%)",
        glass: "rgba(248, 250, 252, 0.8)",
      };

  const navItems = [
    { id: "home", label: "Home" },
    { id: "features", label: "Features" },
    { id: "howItWorks", label: "How It Works" },
    { id: "contact", label: "Contact" },
  ];

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
      setIsNavbarFloating(window.scrollY > 50);

      const scrollPosition = window.scrollY + window.innerHeight / 2;
      for (const item of navItems) {
        const element = document.getElementById(item.id);
        if (element) {
          const { top, bottom } = element.getBoundingClientRect();
          if (scrollPosition >= top + window.scrollY && scrollPosition < bottom + window.scrollY) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: elementPosition, behavior: "smooth" });
      setActiveSection(id);
      setMobileMenuOpen(false);
    }
  };

  const toggleDarkMode = () => {
    setIsThemeChanging(true);
    setIsDarkMode(!isDarkMode);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    if (formData.get("name") && formData.get("email") && formData.get("message")) {
      console.log("Form submitted:", Object.fromEntries(formData));
      setFormSubmitted(true);
    } else {
      alert("Please fill in all required fields.");
    }
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  const cardHover = {
    y: -12,
    scale: 1.02,
    boxShadow: isDarkMode ? "0 25px 50px -12px rgba(0, 0, 0, 0.4)" : "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
    transition: { type: "spring", stiffness: 300, damping: 20 },
  };

  const staggerChildren = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        delayChildren: 0.2,
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div
      className={`min-h-screen font-sans overflow-x-hidden transition-colors duration-300 ${
        isDarkMode ? "dark" : ""
      }`}
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {/* Theme transition overlay */}
      <AnimatePresence>
        {isThemeChanging && (
          <motion.div
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{ backgroundColor: colors.background }}
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
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-8 right-8 p-3 rounded-full shadow-xl z-50"
            style={{ background: colors.gradient, color: colors.white }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modern Floating Navbar */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-4 flex justify-between items-center transition-all duration-500 ${
          isNavbarFloating ? "backdrop-blur-xl shadow-lg" : ""
        }`}
        style={{
          backgroundColor: isNavbarFloating ? colors.glass : colors.background,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => scrollToSection("home")}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.img
            src={isDarkMode ? LogoLight : LogoDark}
            alt="Logo"
            className="h-12 w-12 object-contain"
            key={isDarkMode ? "dark-logo" : "light-logo"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ rotate: 10 }}
          />
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="relative px-2 py-1 font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">{item.label}</span>
              {activeSection === item.id && (
                <motion.span
                  layoutId="navHighlight"
                  className="absolute bottom-0 left-0 w-full h-0.5 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                  transition={{ type: "spring", bounce: 0.25 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Desktop Right Controls */}
        <div className="hidden md:flex items-center gap-6">
          {/* Dark Mode Toggle */}
          <motion.button
            onClick={toggleDarkMode}
            className="p-2 rounded-full border"
            style={{
              backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(28, 46, 74, 0.1)",
              borderColor: colors.border,
              color: colors.text,
            }}
            whileHover={{ 
              backgroundColor: colors.primary,
              color: colors.white,
              rotate: isDarkMode ? 20 : -20
            }}
            whileTap={{ scale: 0.9 }}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </motion.button>

          {/* Sign In Button */}
          <motion.button
            onClick={() => navigate("/login")}
            className="px-6 py-2 rounded-xl font-semibold shadow-lg flex items-center gap-2 border border-transparent"
            style={{
              background: colors.gradient,
              color: colors.white,
            }}
            whileHover={{ 
              background: colors.gradientHover,
              scale: 1.05 
            }}
            whileTap={{ scale: 0.95 }}
          >
            Sign In <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Mobile Controls */}
        <div className="md:hidden flex items-center gap-4">
          <motion.button
            onClick={toggleDarkMode}
            className="p-2 rounded-full border"
            style={{
              backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(28, 46, 74, 0.1)",
              borderColor: colors.border,
              color: colors.text,
            }}
            whileHover={{ backgroundColor: colors.primary, color: "#fff" }}
            whileTap={{ scale: 0.9 }}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </motion.button>
          <motion.button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full border"
            style={{
              backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(28, 46, 74, 0.1)",
              borderColor: colors.border,
              color: colors.text,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="fixed top-16 left-0 right-0 z-40 p-4"
              style={{
                backgroundColor: isDarkMode ? "rgba(6, 11, 19, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                borderBottom: `1px solid ${colors.border}`,
              }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full px-4 py-3 rounded-lg text-left font-medium ${
                      activeSection === item.id ? "bg-opacity-20" : ""
                    }`}
                    style={{
                      backgroundColor:
                        activeSection === item.id
                          ? isDarkMode
                            ? "rgba(59, 130, 246, 0.2)"
                            : "rgba(28, 46, 74, 0.2)"
                          : "transparent",
                      color: colors.text,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {item.label}
                  </motion.button>
                ))}
                <motion.button
                  onClick={() => {
                    navigate("/login");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full mt-4 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                  style={{
                    background: colors.gradient,
                    color: colors.white,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign In <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section
        id="home"
        className="min-h-screen max-w-7xl mx-auto pt-32 pb-16 px-6 md:px-12 lg:px-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden"
        style={{ backgroundColor: colors.background }}
      >
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
            style={{ backgroundColor: colors.primary }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 12, repeat: Infinity, repeatType: "reverse" }}
          />
        </div>

        <motion.div
          className="max-w-2xl text-center md:text-left mb-12 md:mb-0 relative z-10"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
        >
          <motion.div
            className="inline-block px-4 py-2 rounded-full mb-6 text-sm font-medium border"
            style={{
              backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.15)" : "rgba(28, 46, 74, 0.1)",
              color: colors.primary,
              borderColor: isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(28, 46, 74, 0.2)",
            }}
            variants={fadeIn}
          >
            ✨ All-in-One Business Solution
          </motion.div>
          <motion.h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 tracking-tight"
            style={{ color: colors.text }}
            variants={fadeIn}
          >
            Connect with{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: colors.gradient,
              }}
            >
              Business Partners
            </span>{" "}
            & Manage Operations
          </motion.h1>
          <motion.p
            className="text-xl mb-8 leading-relaxed max-w-lg"
            style={{ color: colors.textLight }}
            variants={fadeIn}
          >
            The ultimate B2B marketplace where manufacturers discover customers and both parties manage their business operations seamlessly in one powerful platform.
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start" variants={fadeIn}>
            <motion.button
              onClick={() => navigate("/register")}
              className="px-8 py-4 rounded-xl font-semibold shadow-lg flex items-center gap-2 justify-center border"
              style={{
                background: colors.gradient,
                color: colors.white,
                borderColor: isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(28, 46, 74, 0.2)",
              }}
              whileHover={{ scale: 1.05, background: colors.gradientHover }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Get Started Free</span>
              <Rocket className="h-5 w-5" />
            </motion.button>
            <motion.button
              onClick={() => scrollToSection("features")}
              className="border-2 px-8 py-4 rounded-xl font-semibold flex items-center gap-2 justify-center backdrop-blur-sm"
              style={{
                borderColor: colors.primary,
                color: colors.primary,
                backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(28, 46, 74, 0.08)",
              }}
              whileHover={{
                scale: 1.05,
                backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(28, 46, 74, 0.15)",
                borderColor: colors.primaryLight,
              }}
              whileTap={{ scale: 0.95 }}
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
            className="rounded-3xl overflow-hidden w-3/4 backdrop-blur-sm"
            whileHover={cardHover}
            key={isDarkMode ? "dark-dashboard" : "light-dashboard"}
          >
            <img src={MyHeroSVG} alt="Business Dashboard" className="w-full h-auto" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 px-6 md:px-12 lg:px-16 relative overflow-hidden"
        style={{ backgroundColor: colors.cardBg }}
      >
        <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
          <motion.div
            className="inline-block px-4 py-2 rounded-full mb-6 text-sm font-medium border"
            style={{
              backgroundColor: isDarkMode
                ? "rgba(59, 130, 246, 0.15)"
                : "rgba(28, 46, 74, 0.1)",
              color: colors.primary,
              borderColor: isDarkMode
                ? "rgba(59, 130, 246, 0.3)"
                : "rgba(28, 46, 74, 0.2)",
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            🚀 Marketplace + Management
          </motion.div>
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ color: colors.text }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Connect Partners &{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: colors.gradient,
              }}
            >
              Streamline Operations
            </span>
          </motion.h2>
          <motion.p
            className="text-xl max-w-2xl mx-auto"
            style={{ color: colors.textLight }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            The only platform that combines B2B marketplace discovery with comprehensive business management tools.
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
              icon: <Users className="w-8 h-8" />,
              title: "Business Discovery",
              text: "Manufacturers discover customers and customers find reliable partners through our intelligent matching system.",
            },
            {
              icon: <ShoppingCart className="w-8 h-8" />,
              title: "Order Management",
              text: "Complete order lifecycle management with real-time tracking, status updates, and automated workflows.",
            },
            {
              icon: <CreditCard className="w-8 h-8" />,
              title: "Financial Control",
              text: "Comprehensive invoicing, payment tracking, and financial analytics for both parties in the marketplace.",
            },
            {
              icon: <TrendingUp className="w-8 h-8" />,
              title: "AI-Powered Insights",
              text: "Advanced analytics and AI predictions to optimize business decisions and market opportunities.",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="rounded-2xl p-8 transition-all duration-300 flex flex-col border backdrop-blur-sm"
              style={{
                backgroundColor: isDarkMode ? "rgba(17, 24, 39, 0.8)" : "rgba(255, 255, 255, 0.9)",
                borderColor: colors.border,
              }}
              variants={fadeIn}
              whileHover={cardHover}
            >
              <div className="flex items-center mb-4">
                <motion.div
                  className="p-3 rounded-xl mr-4 flex items-center justify-center shadow-lg"
                  style={{ background: colors.gradient, color: colors.white }}
                  whileHover={{ rotate: [0, -5, 5, -5, 0], scale: 1.1 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold" style={{ color: colors.text }}>
                  {feature.title}
                </h3>
              </div>
              <p className="text-base leading-relaxed" style={{ color: colors.textLight }}>
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
        <div className="max-w-4xl mx-auto mb-16 text-center relative z-10">
          <motion.div
            className="inline-block px-4 py-2 rounded-full mb-6 text-sm font-medium border"
            style={{
              backgroundColor: isDarkMode
                ? "rgba(59, 130, 246, 0.15)"
                : "rgba(28, 46, 74, 0.1)",
              color: colors.primary,
              borderColor: isDarkMode
                ? "rgba(59, 130, 246, 0.3)"
                : "rgba(28, 46, 74, 0.2)",
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            ⚡ Marketplace Process
          </motion.div>
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ color: colors.text }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Connect &{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: colors.gradient,
              }}
            >
              Collaborate
            </span>
          </motion.h2>
          <motion.p
            className="text-xl"
            style={{ color: colors.textLight }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            From discovery to collaboration - our platform streamlines the entire B2B partnership journey.
          </motion.p>
        </div>
        <motion.div
          className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerChildren}
        >
          {[
            {
              title: "Discover Partners",
              description:
                "Manufacturers browse customer businesses and customers find reliable manufacturing partners through our intelligent discovery system.",
              icon: <Users className="w-10 h-10" />,
            },
            {
              title: "Connect Securely",
              description:
                "Use invite codes or send connection requests to establish secure business partnerships with built-in verification.",
              icon: <Settings className="w-10 h-10" />,
            },
            {
              title: "Collaborate Seamlessly",
              description:
                "Real-time chat, proposal systems, and shared workspaces enable smooth collaboration between partners.",
              icon: <Cloud className="w-10 h-10" />,
            },
            {
              title: "Manage Operations",
              description:
                "Complete business management including orders, invoices, products, and analytics - all in one unified platform.",
              icon: <BarChart2 className="w-10 h-10" />,
            },
          ].map((step, i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center text-center relative group"
              variants={fadeIn}
              whileHover={{ y: -8 }}
            >
              <motion.div
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl border-2 mb-6"
                style={{
                  background: colors.gradient,
                  color: colors.white,
                  borderColor: isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(28, 46, 74, 0.2)",
                }}
                whileHover={{
                  scale: 1.15,
                  background: colors.gradientHover,
                  boxShadow: isDarkMode
                    ? "0 25px 50px -12px rgba(59, 130, 246, 0.4)"
                    : "0 25px 50px -12px rgba(28, 46, 74, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                {step.icon}
              </motion.div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
                {step.title}
              </h3>
              <p className="text-base leading-relaxed" style={{ color: colors.textLight }}>
                {step.description}
              </p>
              {i < 3 && (
                <div
                  className="hidden md:block absolute top-10 right-[-40px] w-20 h-1 rounded-full"
                  style={{ background: colors.gradient }}
                ></div>
              )}
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
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            className="inline-block px-6 py-2 rounded-full text-sm font-medium border mb-8"
            style={{
              backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.15)" : "rgba(28, 46, 74, 0.1)",
              color: colors.primary,
              borderColor: isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(28, 46, 74, 0.2)",
            }}
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            📞 Get In Touch
          </motion.div>
          {/* Heading */}
          <motion.h2
            className="text-4xl md:text-5xl font-bold leading-tight mb-4"
            style={{ color: colors.text }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Ready to{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: colors.gradient }}
            >
              Connect
            </span>{" "}
            & Grow Together?
          </motion.h2>

          {/* Subheading */}
          <motion.p
            className="text-lg mb-12 max-w-2xl mx-auto"
            style={{ color: colors.textLight }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Join the B2B marketplace that connects manufacturers with customers and provides powerful business management tools for both parties.
          </motion.p>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {[
              {
                icon: <Mail className="w-6 h-6" />,
                title: "Email",
                value: "contact@manageflow.com",
              },
              {
                icon: <Phone className="w-6 h-6" />,
                title: "Phone",
                value: "+1 (555) 123-4567",
              },
              {
                icon: <MapPin className="w-6 h-6" />,
                title: "Location",
                value: "123 Business Ave, San Francisco",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center p-6 rounded-2xl shadow-lg border transition-all hover:scale-105"
                style={{
                  backgroundColor: isDarkMode ? "rgba(17, 24, 39, 0.8)" : "rgba(255, 255, 255, 0.95)",
                  borderColor: colors.border,
                }}
              >
                <div
                  className="p-4 rounded-full mb-3"
                  style={{ background: colors.gradient, color: colors.white }}
                >
                  {item.icon}
                </div>
                <h4 className="font-semibold" style={{ color: colors.text }}>
                  {item.title}
                </h4>
                <p className="text-sm" style={{ color: colors.textLight }}>
                  {item.value}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Contact Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Google Map */}
          <motion.div
            className="rounded-3xl overflow-hidden shadow-xl border"
            style={{ borderColor: colors.border }}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <iframe
              title="Google Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.293427258137!2d-122.4013770846817!3d37.7936179797568!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80858064f76f2a2f%3A0xf7308a5e6b7b2a4f!2sSalesforce%20Tower!5e0!3m2!1sen!2sus!4v1694028456418!5m2!1sen!2sus"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </motion.div>

          {/* Contact Form */}
          <AnimatePresence mode="wait">
            {formSubmitted ? (
              <motion.div
                className="flex flex-col items-center justify-center rounded-2xl p-8 h-full text-center"
                style={{ backgroundColor: isDarkMode ? "rgba(10, 19, 36, 0.7)" : colors.white }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="w-16 h-16 mb-6 rounded-full flex items-center justify-center"
                  style={{ background: colors.gradient, color: colors.white }}
                >
                  <CheckCircle className="w-8 h-8" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>
                  Thank You!
                </h3>
                <p className="text-lg mb-6" style={{ color: colors.textLight }}>
                  Your message has been received.
                </p>
                <motion.button
                  onClick={() => setFormSubmitted(false)}
                  className="px-6 py-3 rounded-lg font-medium"
                  style={{ background: colors.gradient, color: colors.white }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Send Another Message
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                onSubmit={handleContactSubmit}
                className="rounded-3xl p-8 shadow-xl backdrop-blur-xl"
                style={{
                  backgroundColor: isDarkMode ? "rgba(17, 24, 39, 0.8)" : "rgba(255, 255, 255, 0.95)",
                }}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-3xl font-bold mb-8 text-center md:text-left" style={{ color: colors.text }}>
                  Send Us a Message
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full px-6 py-4 rounded-xl border-2 focus:ring-2 transition-all"
                      style={{
                        backgroundColor: isDarkMode ? "rgba(17, 24, 39, 0.6)" : "rgba(255, 255, 255, 0.8)",
                        borderColor: colors.border,
                        color: colors.text,
                      }}
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
                      required
                      className="w-full px-6 py-4 rounded-xl border-2 focus:ring-2 transition-all"
                      style={{
                        backgroundColor: isDarkMode ? "rgba(17, 24, 39, 0.6)" : "rgba(255, 255, 255, 0.8)",
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="subject" className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className="w-full px-6 py-4 rounded-xl border-2 focus:ring-2 transition-all"
                      style={{
                        backgroundColor: isDarkMode ? "rgba(17, 24, 39, 0.6)" : "rgba(255, 255, 255, 0.8)",
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="message" className="block text-sm font-medium mb-2" style={{ color: colors.textLight }}>
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      className="w-full px-6 py-4 rounded-xl border-2 focus:ring-2 transition-all resize-none"
                      style={{
                        backgroundColor: isDarkMode ? "rgba(17, 24, 39, 0.6)" : "rgba(255, 255, 255, 0.8)",
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    ></textarea>
                  </div>
                </div>
                <motion.button
                  type="submit"
                  className="mt-8 w-full px-8 py-4 rounded-xl font-bold shadow-lg flex items-center justify-center border-2"
                  style={{
                    background: colors.gradient,
                    color: colors.white,
                    borderColor: isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(28, 46, 74, 0.2)",
                  }}
                  whileHover={{ background: colors.gradientHover }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Send Message</span>
                  <ArrowRight className="ml-3 h-5 w-5" />
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-16 px-6 md:px-12 lg:px-16 border-t"
        style={{ backgroundColor: colors.background, borderColor: colors.border }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            <div className="md:col-span-1">
              <motion.div className="flex items-center mb-6" whileHover={{ scale: 1.03 }}>
                <span className="text-xl font-bold" style={{ color: colors.text }}>
                  ManageFlow
                </span>
              </motion.div>
              <p className="mb-6 text-lg" style={{ color: colors.textLight }}>
                The ultimate B2B marketplace connecting manufacturers with customers while providing comprehensive business management tools for both parties.
              </p>
              <div className="flex space-x-4">
                {[
                  { icon: <Twitter className="w-5 h-5" />, label: "Twitter" },
                  { icon: <Facebook className="w-5 h-5" />, label: "Facebook" },
                  { icon: <Instagram className="w-5 h-5" />, label: "Instagram" },
                  { icon: <Linkedin className="w-5 h-5" />, label: "LinkedIn" },
                ].map((social, i) => (
                  <motion.a
                    key={i}
                    href="#"
                    className="p-2 rounded-full"
                    style={{
                      color: colors.textLight,
                      backgroundColor: colors.border + "30",
                    }}
                    whileHover={{
                      scale: 1.1,
                      backgroundColor: colors.primary,
                      color: colors.white,
                    }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={social.label}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                Product
              </h4>
              <ul className="space-y-3">
                {["Features", "Pricing", "Integrations", "Updates"].map((item, i) => (
                  <motion.li key={i} whileHover={{ x: 5 }}>
                    <a
                      href="#"
                      className="hover:underline text-lg"
                      style={{ color: colors.textLight }}
                    >
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                Company
              </h4>
              <ul className="space-y-3">
                {["About Us", "Careers", "Partners", "Blog"].map((item, i) => (
                  <motion.li key={i} whileHover={{ x: 5 }}>
                    <a
                      href="#"
                      className="hover:underline text-lg"
                      style={{ color: colors.textLight }}
                    >
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                Resources
              </h4>
              <ul className="space-y-3">
                {["Documentation", "Help Center", "Community", "Legal"].map((item, i) => (
                  <motion.li key={i} whileHover={{ x: 5 }}>
                    <a
                      href="#"
                      className="hover:underline text-lg"
                      style={{ color: colors.textLight }}
                    >
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
          <div
            className="border-t mt-12 pt-6 flex flex-col md:flex-row justify-between items-center"
            style={{ borderColor: colors.border }}
          >
            <p className="text-sm mb-4 md:mb-0" style={{ color: colors.textLighter }}>
              © {new Date().getFullYear()} ManageFlow. All rights reserved.
            </p>
            <div className="flex space-x-6">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item, i) => (
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