import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import Input from "../components/common/Input";
import { useToast } from "../components/common/Toast";

function ForgotPassword() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      setErrors({ email: "Email address is required." });
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const response = await axios.post(`/api/auth/send-otp?email=${encodeURIComponent(email)}`);
      
      const msg = response.data?.message || "OTP sent to your email.";
      showSuccess(msg);
      setStep(2);
    } catch (error) {
      console.error(error);
      if (error.response) {
        const errorMsg = error.response.data?.error || error.response.data?.message || "An error occurred while sending OTP.";
        showError(errorMsg);
      } else {
        showError("Unable to connect to the server: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const newErrors = {};
    if (!otpCode) newErrors.otpCode = "OTP is required.";
    if (!newPassword) newErrors.newPassword = "New password is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const response = await axios.post("/api/auth/reset-password", {
        email,
        otpCode,
        newPassword,
      });

      const msg = response.data?.message || "Password has been reset successfully.";
      showSuccess(msg);

      navigate("/");
    } catch (error) {
      console.error(error);
      if (error.response) {
        const errorMsg = error.response.data?.error || error.response.data?.message || "An error occurred while resetting password.";
        showError(errorMsg);
      } else {
        showError("Unable to connect to the server: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_0_20px_rgba(0,150,255,0.1)] dark:shadow-[0_0_20px_rgba(0,150,255,0.3)] transition-colors duration-300">
        
        <button
          onClick={() => navigate("/")}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-medium"
        >
          <FaArrowLeft /> Back to Login
        </button>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">
          Reset Password
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 transition-colors">
          {step === 1 ? "Enter your email address to receive a one-time password." : "Enter the OTP sent to your email and your new password."}
        </p>

        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition mt-4"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Input
              label="OTP Code"
              name="otpCode"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              error={errors.otpCode}
            />

            <Input
              label="New Password"
              name="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.newPassword}
              endNode={
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center justify-center p-1"
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              }
            />

            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition mt-4"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
