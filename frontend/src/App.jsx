// ✅ 4. App.jsx (route config fix)
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ManufacturerDashboard from './pages/ManufacturerDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import BusinessManager from "./pages/BusinessManager";
import CustomerManager from './pages/CustomerManager';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <ToastContainer position="top-center" autoClose={5000} />

          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<OtpVerificationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Manufacturer-only routes */}
            <Route element={<ProtectedRoute allowedRoles={['manufacturer']} />}> 
              <Route path="/dashboard/manufacturer" element={<ManufacturerDashboard />} />
              <Route path="/manage/:businessId" element={<BusinessManager />} />
            </Route>

            {/* Customer-only routes */}
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}> 
              <Route path="/dashboard/customer" element={<CustomerDashboard />} />
              <Route path="/manage/customer/:id" element={<CustomerManager />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
