import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import Breadcrumb from "../components/Breadcrumb";
import Input from "../components/common/Input";
import { useToast } from "../components/common/Toast";

function ChangePassword() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChangePassword = async () => {
    const newErrors = {};
    if (!email) newErrors.email = "Email address is required.";
    if (!currentPassword) newErrors.currentPassword = "Current password is required.";
    if (!newPassword) newErrors.newPassword = "New password is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      const response = await axios.post(
        "/api/auth/change-password",
        {
          email,
          currentPassword,
          newPassword,
        }
      );

      const msg = response.data?.message || (typeof response.data === "string" ? response.data : "Password changed successfully.");
      showSuccess(msg);

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      if (error.response) {
        const errorMsg = error.response.data?.error || error.response.data?.message || (typeof error.response.data === "string" ? error.response.data : "An error occurred.");
        showError(errorMsg);
      } else {
        showError("Unable to connect to the server: " + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased pb-12 transition-colors duration-300">
      {/* Header section */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Change Account Password</h1>
            <p className="text-xs text-blue-400">Ensure security by using a strong, unique password</p>
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 mt-8">
        <Breadcrumb />

        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 transition-colors duration-300">
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <Input
            label="Current Password"
            name="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            placeholder="Enter Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={errors.currentPassword}
            endNode={
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center justify-center p-1"
                title={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            }
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
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center justify-center p-1"
                title={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            }
          />

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleChangePassword}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition"
            >
              Change Password
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ChangePassword;