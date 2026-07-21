import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Breadcrumb from "../components/Breadcrumb";
import SearchableDropdown from "../components/common/SearchableDropdown";
import Stepper from "../components/common/Stepper";
import {
  FaArrowLeft,
  FaTrash,
  FaUser,
  FaEnvelope,
  FaLock,
  FaBriefcase,
} from "react-icons/fa";

function ManageEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    phoneNumber: "",
    mobileNumber: "",
    password: "",
    firstName: "",
    lastName: "",
    dob: "",
    genderId: "",
    userTypeId: "",
    reportsToId: "",
    title: "",
    degree: "",
  });

  // Reference lists for dropdowns
  const [genders, setGenders] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [managers, setManagers] = useState([]);

  // Fetch initial dropdowns data
  const fetchDropdownData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const refResponse = await axios.get("/api/auth/get-all-references", { headers });
      const references = refResponse.data;

      const genderGroup = references.find((r) => r.name === "GenderType");
      if (genderGroup) setGenders(genderGroup.referenceItems || []);

      const userTypeGroup = references.find((r) => r.name === "UserType");
      if (userTypeGroup) setUserTypes(userTypeGroup.referenceItems || []);

      const empResponse = await axios.get("/api/auth/get-all-employees", { headers });
      setManagers(empResponse.data || []);
    } catch (err) {
      console.error("Error fetching form dropdown options:", err);
      setError("Failed to load reference metadata. Please verify server connection.");
    }
  }, [navigate]);

  // Fetch employee details if editing
  const fetchEmployeeDetails = useCallback(async () => {
    if (isNew) return;

    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const response = await axios.get(`/api/auth/get-employee-byId/${id}`, { headers });
      const emp = response.data;

      setFormData({
        userName: emp.userName || "",
        email: emp.email || "",
        phoneNumber: emp.phoneNumber || "",
        mobileNumber: emp.mobileNumber || "",
        password: "", // Keep blank during updates
        firstName: emp.firstName || "",
        lastName: emp.lastName || "",
        dob: emp.dob ? emp.dob.substring(0, 10) : "",
        genderId: emp.genderId || "",
        userTypeId: emp.userTypeId || "",
        reportsToId: emp.reportsToId || "",
        title: emp.title || "",
        degree: emp.degree || "",
      });
    } catch (err) {
      console.error("Error fetching employee details:", err);
      setError(err.response?.data?.message || "Failed to load employee details.");
    } finally {
      setLoading(false);
    }
  }, [id, isNew, navigate]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (isMounted) {
        await fetchDropdownData();
        await fetchEmployeeDetails();
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [fetchDropdownData, fetchEmployeeDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (isNew) {
        const payload = { ...formData };
        if (!payload.reportsToId) payload.reportsToId = null;

        await axios.post("/api/auth/create-employee", payload, { headers });
        setSuccess("Employee created successfully!");
        alert("Employee created successfully!");
        navigate("/dashboard");
      } else {
        const payload = {
          userName: formData.userName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          mobileNumber: formData.mobileNumber,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dob: formData.dob || null,
          reportsToId: formData.reportsToId || null,
          title: formData.title,
          degree: formData.degree,
        };

        await axios.put(`/api/auth/update-employee/${id}`, payload, { headers });
        setSuccess("Employee details updated successfully!");
        alert("Employee details updated successfully!");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Error saving employee details:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      try {
        await axios.delete(`/api/auth/delete-employee/${id}`, { headers });
        alert("Employee deleted successfully.");
        navigate("/dashboard");
      } catch (err) {
        console.error("Error deleting employee:", err);
        setError(err.response?.data?.message || "Failed to delete employee.");
        setLoading(false);
      }
    }
  };

  const stepperSteps = [
    {
      title: "Personal Details",
      description: "Basic info",
      content: (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2 transition-colors">
            <FaUser /> Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ""}
                onChange={handleChange}
                placeholder="John"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ""}
                onChange={handleChange}
                placeholder="Doe"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob || ""}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-colors [&::-webkit-calendar-picker-indicator]:dark:invert"
              />
            </div>
            {isNew ? (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Gender</label>
                <SearchableDropdown
                  name="genderId"
                  value={formData.genderId}
                  onChange={(val) => setFormData(prev => ({...prev, genderId: val}))}
                  options={genders.map(g => ({ label: g.description, value: g.id }))}
                  placeholder="Select Gender"
                  className="w-full"
                />
              </div>
            ) : (
              <div className="opacity-50">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Gender (Not Editable)</label>
                <input
                  type="text"
                  disabled
                  value={genders.find((g) => g.id === formData.genderId)?.description || "Gender"}
                  className="w-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-500 cursor-not-allowed transition-colors"
                />
              </div>
            )}
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.firstName.trim()) throw new Error("First Name is required.");
        if (!formData.lastName.trim()) throw new Error("Last Name is required.");
        if (!formData.dob) throw new Error("Date of Birth is required.");
        if (isNew && !formData.genderId) throw new Error("Gender is required.");
        return true;
      }
    },
    {
      title: "Account Details",
      description: "Credentials",
      content: (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2 transition-colors">
            <FaLock /> Account & Credentials
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Username</label>
              <input
                type="text"
                name="userName"
                value={formData.userName || ""}
                onChange={handleChange}
                placeholder="johndoe"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-colors"
              />
            </div>
            {isNew ? (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password || ""}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-colors"
                />
              </div>
            ) : (
              <div className="opacity-50">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Password (Managed separately)</label>
                <input
                  type="text"
                  disabled
                  placeholder="••••••••"
                  className="w-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-500 cursor-not-allowed transition-colors"
                />
              </div>
            )}
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.userName.trim()) throw new Error("Username is required.");
        if (isNew && !formData.password.trim()) throw new Error("Password is required for new accounts.");
        return true;
      }
    },
    {
      title: "Contact Info",
      description: "How to reach",
      content: (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2 transition-colors">
            <FaEnvelope /> Contact Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                placeholder="johndoe@example.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Phone Number</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={handleChange}
                placeholder="Phone"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Mobile Number</label>
              <input
                type="text"
                name="mobileNumber"
                value={formData.mobileNumber || ""}
                onChange={handleChange}
                placeholder="Mobile"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-colors"
              />
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.email.trim()) throw new Error("Email Address is required.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) throw new Error("Invalid email format.");
        return true;
      }
    },
    {
      title: "Work Metadata",
      description: "Corporate details",
      content: (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2 transition-colors">
            <FaBriefcase /> Work Metadata
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Job Title</label>
              <input
                type="text"
                name="title"
                value={formData.title || ""}
                onChange={handleChange}
                placeholder="Software Engineer"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Degree</label>
              <input
                type="text"
                name="degree"
                value={formData.degree || ""}
                onChange={handleChange}
                placeholder="B.E Computer Science"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-colors"
              />
            </div>
            {isNew ? (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">User Type</label>
                <SearchableDropdown
                  name="userTypeId"
                  value={formData.userTypeId}
                  onChange={(val) => setFormData(prev => ({...prev, userTypeId: val}))}
                  options={userTypes.map(u => ({ label: u.description, value: u.id }))}
                  placeholder="Select User Type"
                  className="w-full"
                />
              </div>
            ) : (
              <div className="opacity-50">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">User Type (Not Editable)</label>
                <input
                  type="text"
                  disabled
                  value={userTypes.find((u) => u.id === formData.userTypeId)?.description || "User Type"}
                  className="w-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-500 cursor-not-allowed transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Reports To Manager</label>
              <SearchableDropdown
                name="reportsToId"
                value={formData.reportsToId}
                onChange={(val) => setFormData(prev => ({...prev, reportsToId: val}))}
                options={[
                  { label: "No Manager (Executive / Top Level)", value: "" },
                  ...managers
                    .filter((m) => m.id !== id)
                    .map((m) => ({
                      label: `${`${m.firstName || ""} ${m.lastName || ""}`.trim() || m.userName} (@${m.userName})`,
                      value: m.id
                    }))
                ]}
                placeholder="Select Manager"
                className="w-full"
              />
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.title.trim()) throw new Error("Job Title is required.");
        if (isNew && !formData.userTypeId) throw new Error("User Type is required.");
        return true;
      }
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased pb-12 transition-colors">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-4 sm:gap-0 items-center justify-between transition-colors">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">
              {isNew ? "Create New Employee" : "Edit Employee Profile"}
            </h1>
            <p className="text-xs text-blue-600 dark:text-blue-400 transition-colors">
              {isNew ? "Register a new staff member" : "Modify employee attributes and credentials"}
            </p>
          </div>
        </div>

        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-semibold border border-red-200 dark:border-red-900/50 rounded-lg transition-colors"
          >
            <FaTrash className="text-xs" />
            <span>Delete Employee</span>
          </button>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        <Breadcrumb />
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm transition-colors">
            ⚠ {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm transition-colors">
            ✔ {success}
          </div>
        )}

        {loading && !success && !error ? (
          <div className="flex justify-center p-12">
             <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></span>
          </div>
        ) : (
          <Stepper steps={stepperSteps} onComplete={() => handleSubmit()} />
        )}
      </main>
    </div>
  );
}

export default ManageEmployee;
