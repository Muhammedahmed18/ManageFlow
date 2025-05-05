import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/authService";
import { Clock, XCircle } from "lucide-react";

const PendingApprovalPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending"); // 'pending', 'approved', 'rejected'

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.get("/auth/customer-dashboard/");
        if (response.status === 200 && response.data.is_approved) {
          setStatus("approved");
          navigate("/dashboard/customer");
        }
      } catch (err) {
        if (err.response?.status === 403) {
          const data = err.response.data;
          if (data.rejected) {
            setStatus("rejected");
          } else {
            setStatus("pending");
          }
        } else {
          console.warn("Unexpected error during approval check:", err);
          setStatus("pending");
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  if (status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
        <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-red-700">Approval Rejected</h1>
            <p className="text-gray-600">Your account request has been rejected by the manufacturer.</p>
          </div>

          <div className="pt-4 border-t border-gray-100 text-sm text-gray-500">
            <p>Please contact your manufacturer for more information.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-sm text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <Clock className="w-8 h-8 text-blue-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Pending Approval</h1>
          <p className="text-gray-500">Your account is being reviewed. We'll notify you once approved.</p>
        </div>

        <div className="pt-4 border-t border-gray-100 text-sm text-gray-500">
          <p>This usually takes 1-2 business days.</p>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
