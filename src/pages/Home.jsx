import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useToast } from "../components/common/Toast";

function Home() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "/api/auth/login",
        {
          employeeId,
          password,
        },
      );

      showSuccess(response.data.message || "Login successful!");

      localStorage.setItem("token", response.data.token);

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      if (error.response) {
        showError(error.response.data?.message || "Invalid Employee ID or Password");
      } else {
        showError("Unable to connect to the server: " + error.message);
      }
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="w-[350px] rounded-2xl bg-white dark:bg-slate-800 p-9 shadow-[0_0_20px_rgba(0,150,255,0.1)] dark:shadow-[0_0_20px_rgba(0,150,255,0.3)] border border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <div className="text-center text-5xl mb-4">🔒</div>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white text-center transition-colors">
          Welcome Back
        </h1>

        <p className="text-slate-600 dark:text-slate-300 text-center mt-2 mb-6 transition-colors">
          Sign in to access your account
        </p>

        <label className="block text-slate-800 dark:text-white mb-2 font-medium transition-colors">Username</label>

        <input
          type="text"
          placeholder="Enter Employee ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="w-full p-3 mb-5 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none transition-colors duration-200"
        />

        <label className="block text-slate-800 dark:text-white mb-2 font-medium transition-colors">Password</label>

        <div className="relative mb-6">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none pr-10 transition-colors duration-200"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Sign In
        </button>
        <button
          onClick={() => navigate("/change-password")}
          className="w-full mt-3 border border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 py-3 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-colors"
        >
          Change Password
        </button>
        
        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Trouble signing in?{" "}
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Forgot Password
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
