import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Using the same color scheme from landing page
  const colors = {
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
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      await forgotPassword(email);
      navigate(`/verify-otp?reset=true&email=${encodeURIComponent(email)}`);
    } catch (error) {
      setError(error.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6" style={{ backgroundColor: colors.background }}>
      {/* Back Button */}
      

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-xl shadow-lg p-8"
        style={{ borderColor: colors.border }}
      >
        <div className="text-center mb-8">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-semibold mb-2"
            style={{ color: colors.primary }}
          >
            Reset Your Password
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ color: colors.textLight }}
          >
            Enter your email to receive a reset code
          </motion.p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-100 px-4 py-3 rounded-lg mb-6 text-sm"
            style={{ color: '#dc2626', border: '1px solid #fecaca' }}
          >
            {error}
          </motion.div>
        )}

        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.textLight }}>Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ color: colors.textLighter }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                style={{ 
                  borderColor: colors.border,
                  color: colors.text
                }}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Code...
              </>
            ) : 'Send Reset Code'}
          </motion.button>
        </motion.form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="inline-flex items-center text-sm"
            style={{ color: colors.primary }}
          >
            <ArrowLeft className="mr-1" size={16} />
            Back to Login
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;