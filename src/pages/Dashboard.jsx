import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumb from "../components/Breadcrumb";
import Header from "../components/Header";
import {
  FaSearch,
  FaSignOutAlt,
  FaUserTie,
  FaUsers,
  FaBriefcase,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTimes,
  FaUserAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaGraduationCap,
  FaCalendarAlt,
  FaEye,
  FaEdit,
} from "react-icons/fa";

// Helper to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error decoding token:", e);
    return null;
  }
};

function Dashboard() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile management states
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
  const [isMyProfileEditing, setIsMyProfileEditing] = useState(false);
  const [myProfileData, setMyProfileData] = useState(null);
  const [myProfileEditForm, setMyProfileEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    mobileNumber: "",
    dob: "",
    genderId: "",
    reportsToId: "",
    title: "",
    degree: "",
    pictureUrl: "",
  });
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [myProfileErrors, setMyProfileErrors] = useState({});
  const [myProfileLoading, setMyProfileLoading] = useState(false);
  const [myProfileError, setMyProfileError] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    if (type === "error") {
      toast.error(message, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    } else {
      toast.success(message, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    }
  }, []);

  const handleProfilePictureChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
    if (!acceptedTypes.includes(file.type)) {
      showToast("Only JPEG, PNG, WEBP, and GIF formats are accepted.", "error");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Profile picture must be less than 2MB.", "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicturePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, [showToast]);


  const validateMyProfileForm = () => {
    const errors = {};
    if (!myProfileEditForm.firstName.trim()) {
      errors.firstName = "First name is required.";
    }
    if (!myProfileEditForm.lastName.trim()) {
      errors.lastName = "Last name is required.";
    }
    if (!myProfileEditForm.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(myProfileEditForm.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (myProfileEditForm.phoneNumber) {
      const cleanPhone = myProfileEditForm.phoneNumber.replace(/\D/g, "");
      if (cleanPhone.length > 0 && cleanPhone.length < 10) {
        errors.phoneNumber = "Phone number must be at least 10 digits.";
      }
    }
    if (myProfileEditForm.mobileNumber) {
      const cleanMobile = myProfileEditForm.mobileNumber.replace(/\D/g, "");
      if (cleanMobile.length > 0 && cleanMobile.length < 10) {
        errors.mobileNumber = "Mobile number must be at least 10 digits.";
      }
    }

    setMyProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setMyProfileEditForm((prev) => {
      const updated = { ...prev, [name]: value };
      
      const errors = { ...myProfileErrors };
      if (name === "firstName") {
        if (!value.trim()) errors.firstName = "First name is required.";
        else delete errors.firstName;
      }
      if (name === "lastName") {
        if (!value.trim()) errors.lastName = "Last name is required.";
        else delete errors.lastName;
      }
      if (name === "email") {
        if (!value.trim()) errors.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = "Please enter a valid email address.";
        else delete errors.email;
      }
      if (name === "phoneNumber") {
        const cleanVal = value.replace(/\D/g, "");
        if (cleanVal.length > 0 && cleanVal.length < 10) {
          errors.phoneNumber = "Phone number must be at least 10 digits.";
        } else {
          delete errors.phoneNumber;
        }
      }
      if (name === "mobileNumber") {
        const cleanVal = value.replace(/\D/g, "");
        if (cleanVal.length > 0 && cleanVal.length < 10) {
          errors.mobileNumber = "Mobile number must be at least 10 digits.";
        } else {
          delete errors.mobileNumber;
        }
      }
      
      setMyProfileErrors(errors);
      return updated;
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateMyProfileForm()) {
      showToast("Please fix the validation errors before saving.", "error");
      return;
    }

    setMyProfileLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const payload = {
        userName: myProfileData.userName,
        email: myProfileEditForm.email,
        phoneNumber: myProfileEditForm.phoneNumber,
        mobileNumber: myProfileEditForm.mobileNumber,
        firstName: myProfileEditForm.firstName,
        lastName: myProfileEditForm.lastName,
        dob: myProfileEditForm.dob || null,
        reportsToId: myProfileEditForm.reportsToId || null,
        title: myProfileEditForm.title,
        degree: myProfileEditForm.degree,
        genderId: myProfileEditForm.genderId || null,
        userTypeId: myProfileData.userTypeId,
        pictureUrl: profilePicturePreview !== null ? profilePicturePreview : myProfileEditForm.pictureUrl,
      };

      await axios.put("/api/auth/update-profile", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showToast("information edited successfully");
      setIsMyProfileEditing(false);
      fetchMyProfile();
      fetchEmployees();
    } catch (err) {
      console.error("Error updating profile:", err);
      const apiErrorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to update profile.";
      showToast(apiErrorMsg, "error");
    } finally {
      setMyProfileLoading(false);
    }
  };

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [sortField, setSortField] = useState("employeeId");
  const [sortOrder, setSortOrder] = useState("asc");

  // Selected employee for the side drawer
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Fetch all employees from the API
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await axios.get("/api/auth/get-all-employees", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEmployees(response.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
      // In case of authentication token issues, clear token and redirect to login
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem("token");
        navigate("/");
      } else {
        setError(err.response?.data?.message || "Failed to load employee directory. Please verify server connection.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Fetch all references from the API
  const fetchReferences = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get("/api/auth/get-all-references", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReferences(response.data);
    } catch (err) {
      console.error("Error fetching references:", err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    } else {
      Promise.resolve().then(() => {
        fetchEmployees();
        fetchReferences();
        
      });
    }
  }, [navigate, fetchEmployees, fetchReferences ]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Helper functions to resolve reference descriptions
  const getGenderName = (genderId) => {
    if (!references || references.length === 0) return genderId;
    const genderType = references.find((ref) => ref.name === "GenderType");
    if (!genderType) return genderId;
    const matched = genderType.referenceItems?.find((item) => item.id === genderId);
    return matched ? matched.description : genderId;
  };

  const getUserTypeName = (userTypeId) => {
    if (!references || references.length === 0) return userTypeId;
    const userType = references.find((ref) => ref.name === "UserType");
    if (!userType) return userTypeId;
    const matched = userType.referenceItems?.find((item) => item.id === userTypeId);
    return matched ? matched.description : userTypeId;
  };

  const getManagerNameById = (reportsToId) => {
    if (!employees || employees.length === 0) return reportsToId;
    const manager = employees.find((emp) => emp.id === reportsToId);
    if (!manager) return reportsToId;
    const fullName = `${manager.firstName || ""} ${manager.lastName || ""}`.trim();
    return fullName || manager.userName || reportsToId;
  };

  // Extract unique roles / titles for filtering
  const getUniqueTitles = () => {
    const titles = employees
      .map((emp) => emp.title)
      .filter((t) => t !== null && t !== "");
    return [...new Set(titles)];
  };

  // Trigger sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Filter and sort employees logic
  const filteredEmployees = employees
    .filter((emp) => {
      const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
      const userName = (emp.userName || "").toLowerCase();
      const email = (emp.email || "").toLowerCase();
      const employeeId = (emp.employeeId || "").toLowerCase();
      const title = (emp.title || "").toLowerCase();
      const managerName = (emp.managerName || "").toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        fullName.includes(term) ||
        userName.includes(term) ||
        email.includes(term) ||
        employeeId.includes(term) ||
        title.includes(term) ||
        managerName.includes(term);

      const matchesTitle = titleFilter === "" || emp.title === titleFilter;

      return matchesSearch && matchesTitle;
    })
    .sort((a, b) => {
      let valA;
      let valB;

      if (sortField === "name") {
        valA = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
        valB = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
      } else {
        valA = (a[sortField] || "").toLowerCase();
        valB = (b[sortField] || "").toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  // KPI Statistics calculations
  const totalEmployees = employees.length;
  const totalManagers = [...new Set(employees.map((e) => e.managerName).filter(Boolean))].length;
  const totalRoles = getUniqueTitles().length;

  const renderSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ml-1.5 inline text-slate-500 hover:text-slate-300 transition-colors" />;
    return sortOrder === "asc" ? (
      <FaSortUp className="ml-1.5 inline text-blue-400" />
    ) : (
      <FaSortDown className="ml-1.5 inline text-blue-400" />
    );
  };

  const getTitleBadgeStyles = (title) => {
    if (!title) return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50";
    const lower = title.toLowerCase();
    if (lower.includes("manager")) return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40";
    if (lower.includes("developer")) return "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40";
    if (lower.includes("hr")) return "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40";
    return "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40";
  };

  const formatFullName = (emp) => {
    const full = `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
    return full || emp.userName || "Unknown Employee";
  };

  const getInitials = (emp) => {
    const first = emp.firstName ? emp.firstName.charAt(0) : "";
    const last = emp.lastName ? emp.lastName.charAt(0) : "";
    if (first || last) return (first + last).toUpperCase();
    return emp.userName ? emp.userName.substring(0, 2).toUpperCase() : "?";
  };

  const formatPhone = (phone, mobile) => {
    if (!phone && !mobile) return "-";
    if (phone && mobile) return `${phone} / ${mobile}`;
    return phone || mobile;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased pb-12 transition-colors duration-300">
      {/* Dashboard Top Header */}
      <Header
        myProfileData={myProfileData}
        setIsMyProfileOpen={setIsMyProfileOpen}
        setIsMyProfileEditing={setIsMyProfileEditing}
        handleLogout={handleLogout}
        getInitials={getInitials}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <Breadcrumb />

        {/* KPI Dashboard Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-900/50 transition-all duration-300">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition duration-300"></div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider transition-colors">Total Employees</p>
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1 transition-colors">{loading ? "..." : totalEmployees}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner transition-colors">
              <FaUsers className="text-xl" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-900/50 transition-all duration-300">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition duration-300"></div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider transition-colors">Active Managers</p>
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1 transition-colors">{loading ? "..." : totalManagers}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner transition-colors">
              <FaUserTie className="text-xl" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-violet-300 dark:hover:border-violet-900/50 transition-all duration-300">
          
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition duration-300"></div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider transition-colors">Unique Job Roles</p>
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1 transition-colors">{loading ? "..." : totalRoles}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-100 dark:border-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-inner transition-colors">
              <FaBriefcase className="text-xl" />
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors duration-300">
          {/* Table Header Filter & Search Bar */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white transition-colors">Employee Directory</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">Search, filter, and view detailed credentials of your staff.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative min-w-[240px]">
                <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 text-sm" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-blue-500 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                )}
              </div>

              {/* Title Filter Dropdown */}
              <select
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 outline-none cursor-pointer transition duration-200"
              >
                <option value="">All Roles</option>
                {getUniqueTitles().map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>

              {/* Reset button if filter is active */}
              {(searchTerm || titleFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setTitleFilter("");
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1"
                >
                  Clear Filters
                </button>
              )}

              {/* Add Employee Button */}
              <button
                onClick={() => navigate("/employee/new")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition duration-200 ml-auto border border-transparent whitespace-nowrap"
              >
                <span>+ Add Employee</span>
              </button>
            </div>
          </div>

          {/* Directory Content */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent transition-colors">
            {loading ? (
              /* Skeletal Loading Animation */
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4 items-center animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                    </div>
                    <div className="w-24 h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              /* Error Display */
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-red-950/40 text-red-500 border border-red-900/50 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
                  ⚠
                </div>
                <h3 className="text-lg font-semibold text-white">Something went wrong</h3>
                <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">{error}</p>
                <button
                  onClick={fetchEmployees}
                  className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition duration-200"
                >
                  Retry Fetching
                </button>
              </div>
            ) : filteredEmployees.length === 0 ? (
              /* No Results Match */
              <div className="p-12 text-center text-slate-400">
                <p className="text-lg font-medium text-slate-300">No employees match your criteria.</p>
                <p className="text-sm mt-1">Try resetting the search terms or role filters.</p>
              </div>
            ) : (
              /* Actual Data Table */
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider transition-colors">
                    <th
                      onClick={() => handleSort("employeeId")}
                      className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors select-none"
                    >
                      Emp ID {renderSortIcon("employeeId")}
                    </th>
                    <th
                      onClick={() => handleSort("name")}
                      className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors select-none"
                    >
                      Employee Name {renderSortIcon("name")}
                    </th>
                    <th className="px-6 py-4">Email Address</th>
                    <th
                      onClick={() => handleSort("title")}
                      className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors select-none"
                    >
                      Job Title {renderSortIcon("title")}
                    </th>
                    <th className="px-6 py-4">Manager</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 transition-colors">
                  {filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className="hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/30 dark:active:bg-slate-800/50 cursor-pointer group transition duration-150"
                    >
                      {/* Employee ID */}
                      <td className="px-6 py-4 font-mono text-sm text-blue-600 dark:text-blue-400 font-semibold group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
                        {emp.employeeId || "-"}
                      </td>

                      {/* Name & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700/60 group-hover:border-blue-300 dark:group-hover:border-blue-500/50 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition duration-150">
                            {getInitials(emp)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition duration-150">
                              {formatFullName(emp)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              @{emp.userName || "anonymous"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 transition-colors">
                        {emp.email || "-"}
                      </td>

                      {/* Title badge */}
                      <td className="px-6 py-4 text-xs font-medium">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-block ${getTitleBadgeStyles(emp.title)}`}>
                          {emp.title || "No Title"}
                        </span>
                      </td>

                      {/* Manager */}
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 transition-colors">
                        {emp.managerName ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{emp.managerName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-xs">None (Executive)</span>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 transition-colors">
                        {formatPhone(emp.phoneNumber, emp.mobileNumber)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployee(emp);
                            }}
                            title="View Profile"
                            className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white rounded-lg border border-blue-200 dark:border-blue-900/50 hover:border-blue-500 transition duration-200 flex items-center justify-center"
                          >
                            <FaEye className="text-sm" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/employee/${emp.id}`);
                            }}
                            title="Edit Employee"
                            className="p-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white rounded-lg border border-amber-200 dark:border-amber-900/50 hover:border-amber-500 transition duration-200 flex items-center justify-center"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* Side Slide-Over Drawer for Employee Details */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Dark Overlay backdrop */}
          <div
            onClick={() => setSelectedEmployee(null)}
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
          ></div>

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md transform bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 flex flex-col justify-between">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-900/40 transition-colors">
                <div className="flex items-center gap-2">
                  <FaUserAlt className="text-blue-500 text-sm" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white transition-colors">Employee Profile</h2>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors duration-150"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Banner & Avatar section */}
                <div className="text-center relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-3xl font-bold text-white mx-auto shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                    {getInitials(selectedEmployee)}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4 transition-colors">
                    {formatFullName(selectedEmployee)}
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-semibold mt-1 transition-colors">
                    {selectedEmployee.title || "No Specified Title"}
                  </p>
                  <span className="inline-block mt-2 font-mono text-xs text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-950/80 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800 transition-colors">
                    ID: {selectedEmployee.employeeId || "N/A"}
                  </span>
                </div>

                <hr className="border-slate-200 dark:border-slate-800/80 transition-colors" />

                {/* Details Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">Contact & Work Information</h4>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 transition-colors">
                      <div className="text-slate-500 dark:text-slate-400 w-8 text-center"><FaEnvelope className="inline" /></div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase transition-colors">Email</div>
                        <div className="text-sm text-slate-900 dark:text-slate-200 transition-colors">{selectedEmployee.email || "N/A"}</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 transition-colors">
                      <div className="text-slate-500 dark:text-slate-400 w-8 text-center"><FaPhoneAlt className="inline" /></div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase transition-colors">Phone Details</div>
                        <div className="text-sm text-slate-900 dark:text-slate-200 transition-colors">
                          {formatPhone(selectedEmployee.phoneNumber, selectedEmployee.mobileNumber)}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 transition-colors">
                      <div className="text-slate-500 dark:text-slate-400 w-8 text-center"><FaGraduationCap className="inline text-base" /></div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase transition-colors">Degree Qualification</div>
                        <div className="text-sm text-slate-900 dark:text-slate-200 transition-colors">{selectedEmployee.degree || "N/A"}</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 transition-colors">
                      <div className="text-slate-500 dark:text-slate-400 w-8 text-center"><FaCalendarAlt className="inline" /></div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase transition-colors">Date of Birth</div>
                        <div className="text-sm text-slate-900 dark:text-slate-200 transition-colors">{selectedEmployee.dob || "N/A"}</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 transition-colors">
                      <div className="text-slate-500 dark:text-slate-400 w-8 text-center"><FaUserTie className="inline" /></div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase transition-colors">Reports To Manager</div>
                        <div className="text-sm text-slate-900 dark:text-slate-200 transition-colors">{selectedEmployee.managerName || "None"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-slate-800/80 transition-colors" />

                {/* System IDs / Database metadata */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">System Metadata</h4>

                  <div className="space-y-3 font-mono text-xs text-slate-500 dark:text-slate-400 transition-colors">
                    <div>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase mb-1 transition-colors">Record ID (UUID)</span>
                      <code className="block bg-slate-50 dark:bg-slate-950/90 p-2 rounded border border-slate-200 dark:border-slate-800 break-all select-all text-blue-600 dark:text-blue-400 transition-colors">
                        {selectedEmployee.id}
                      </code>
                    </div>

                    {selectedEmployee.reportsToId && selectedEmployee.reportsToId !== "00000000-0000-0000-0000-000000000000" && (
                      <div>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase mb-1 transition-colors">Reports To</span>
                        <code className="block bg-slate-50 dark:bg-slate-950/90 p-2 rounded border border-slate-200 dark:border-slate-800 break-all select-all transition-colors text-slate-800 dark:text-slate-200">
                          {getManagerNameById(selectedEmployee.reportsToId)}
                        </code>
                      </div>
                    )}

                    {selectedEmployee.genderId && selectedEmployee.genderId !== "00000000-0000-0000-0000-000000000000" && (
                      <div>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase mb-1 transition-colors">Gender</span>
                        <code className="block bg-slate-50 dark:bg-slate-950/90 p-2 rounded border border-slate-200 dark:border-slate-800 break-all select-all transition-colors text-slate-800 dark:text-slate-200">
                          {getGenderName(selectedEmployee.genderId)}
                        </code>
                      </div>
                    )}

                    {selectedEmployee.userTypeId && selectedEmployee.userTypeId !== "00000000-0000-0000-0000-000000000000" && (
                      <div>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase mb-1 transition-colors">User Type</span>
                        <code className="block bg-slate-50 dark:bg-slate-950/90 p-2 rounded border border-slate-200 dark:border-slate-800 break-all select-all transition-colors text-slate-800 dark:text-slate-200">
                          {getUserTypeName(selectedEmployee.userTypeId)}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex justify-end transition-colors">
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="w-full md:w-auto px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm font-semibold transition-colors duration-150"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Drawer for "My Profile" */}
      {isMyProfileOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Dark Overlay backdrop */}
          <div
            onClick={() => {
              if (!myProfileLoading) {
                setIsMyProfileOpen(false);
                setIsMyProfileEditing(false);
              }
            }}
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
          ></div>

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg transform bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 flex flex-col justify-between">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-900/40 transition-colors">
                <div className="flex items-center gap-2">
                  <FaUserAlt className="text-blue-500 text-sm" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white transition-colors">
                    {isMyProfileEditing ? "Edit My Profile" : "My Profile Details"}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    if (!myProfileLoading) {
                      setIsMyProfileOpen(false);
                      setIsMyProfileEditing(false);
                    }
                  }}
                  className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors duration-150"
                  disabled={myProfileLoading}
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {myProfileLoading && !myProfileData ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Fetching profile details...</p>
                  </div>
                ) : myProfileError && !myProfileData ? (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-900/50 rounded-full flex items-center justify-center mx-auto text-xl mb-4 transition-colors">
                      ⚠
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white transition-colors">Failed to Load Profile</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 transition-colors">{myProfileError}</p>
                    <button
                      onClick={fetchMyProfile}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Retry
                    </button>
                  </div>
                ) : myProfileData ? (
                  <>
                    {/* Header profile info */}
                    <div className="text-center relative">
                      {!isMyProfileEditing ? (
                        /* View Mode Avatar */
                        myProfileData.pictureUrl ? (
                          <img
                            src={myProfileData.pictureUrl}
                            alt="Profile"
                            className="w-20 h-20 rounded-2xl object-cover mx-auto shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-slate-200 dark:border-slate-800 transition-colors"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white mx-auto shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                            {getInitials(myProfileData)}
                          </div>
                        )
                      ) : (
                        /* Edit Mode Avatar with Preview & Upload */
                        <div className="flex flex-col items-center">
                          <div className="relative w-20 h-20 group">
                            {profilePicturePreview !== null ? (
                              profilePicturePreview ? (
                                <img
                                  src={profilePicturePreview}
                                  alt="Preview"
                                  className="w-20 h-20 rounded-2xl object-cover mx-auto shadow-[0_0_20px_rgba(59,130,246,0.4)] border-2 border-dashed border-blue-500"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-[10px] font-semibold text-slate-500 border border-slate-300 dark:border-slate-800 mx-auto transition-colors">
                                  No Image
                                </div>
                              )
                            ) : myProfileEditForm.pictureUrl ? (
                              <img
                                src={myProfileEditForm.pictureUrl}
                                alt="Profile"
                                className="w-20 h-20 rounded-2xl object-cover mx-auto shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white mx-auto shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                                {getInitials(myProfileData)}
                              </div>
                            )}

                            {/* Hover overlay file input */}
                            <label className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition text-white text-[10px] font-bold">
                              <span>Change</span>
                              <input
                                type="file"
                                accept="image/jpeg, image/png, image/webp, image/gif, image/jpg"
                                onChange={handleProfilePictureChange}
                                className="hidden"
                              />
                            </label>
                          </div>
                          
                          {/* Remove button */}
                          {((profilePicturePreview !== null && profilePicturePreview !== "") || 
                            (profilePicturePreview === null && myProfileEditForm.pictureUrl)) && (
                            <button
                              type="button"
                              onClick={() => setProfilePicturePreview("")}
                              className="text-[10px] text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-semibold mt-2 inline-block transition-colors"
                            >
                              Remove Picture
                            </button>
                          )}
                        </div>
                      )}

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4 transition-colors">
                        {formatFullName(myProfileData)}
                      </h3>
                      <p className="text-blue-600 dark:text-blue-400 text-xs font-semibold mt-1 transition-colors">
                        {myProfileData.title || "No Specified Title"}
                      </p>
                      <span className="inline-block mt-2 font-mono text-[10px] text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-950/80 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800 transition-colors">
                        Employee ID: {myProfileData.employeeId || "N/A"}
                      </span>
                    </div>

                    <hr className="border-slate-200 dark:border-slate-800 transition-colors" />

                    {!isMyProfileEditing ? (
                      /* VIEW MODE */
                      <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 transition-colors">
                          <div className="text-slate-500 dark:text-slate-400 w-8 text-center"><FaEnvelope className="inline" /></div>
                          <div>
                            <div className="text-[9px] text-slate-500 font-semibold uppercase transition-colors">Email</div>
                            <div className="text-sm text-slate-900 dark:text-slate-200 transition-colors">{myProfileData.email || "N/A"}</div>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 transition-colors">
                          <div className="text-slate-500 dark:text-slate-400 w-8 text-center"><FaPhoneAlt className="inline" /></div>
                          <div>
                            <div className="text-[9px] text-slate-500 font-semibold uppercase transition-colors">Phone Number</div>
                            <div className="text-sm text-slate-900 dark:text-slate-200 transition-colors">{myProfileData.phoneNumber || "-"}</div>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 transition-colors">
                          <div className="text-slate-500 dark:text-slate-400 w-8 text-center"><FaPhoneAlt className="inline" /></div>
                          <div>
                            <div className="text-[9px] text-slate-500 font-semibold uppercase transition-colors">Mobile Number</div>
                            <div className="text-sm text-slate-900 dark:text-slate-200 transition-colors">{myProfileData.mobileNumber || "-"}</div>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 transition-colors">
                          <div className="text-slate-500 dark:text-slate-400 w-8 text-center"><FaGraduationCap className="inline text-base" /></div>
                          <div>
                            <div className="text-[9px] text-slate-500 font-semibold uppercase transition-colors">Degree / Qualification</div>
                            <div className="text-sm text-slate-900 dark:text-slate-200 transition-colors">{myProfileData.degree || "N/A"}</div>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 transition-colors">
                          <div className="text-slate-500 dark:text-slate-400 w-8 text-center"><FaCalendarAlt className="inline" /></div>
                          <div>
                            <div className="text-[9px] text-slate-500 font-semibold uppercase transition-colors">Date of Birth</div>
                            <div className="text-sm text-slate-900 dark:text-slate-200 transition-colors">{myProfileData.dob ? myProfileData.dob.substring(0, 10) : "N/A"}</div>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 transition-colors">
                          <div className="text-slate-500 dark:text-slate-400 w-8 text-center"><FaUserTie className="inline" /></div>
                          <div>
                            <div className="text-[9px] text-slate-500 font-semibold uppercase transition-colors">Reports To Manager</div>
                            <div className="text-sm text-slate-900 dark:text-slate-200 transition-colors">{myProfileData.managerName || "None"}</div>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 transition-colors">
                          <div className="text-slate-500 dark:text-slate-400 w-8 text-center"><FaBriefcase className="inline" /></div>
                          <div>
                            <div className="text-[9px] text-slate-500 font-semibold uppercase transition-colors">Gender</div>
                            <div className="text-sm text-slate-900 dark:text-slate-200 transition-colors">{getGenderName(myProfileData.genderId) || "N/A"}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* EDIT MODE */
                      <form onSubmit={handleSaveProfile} className="space-y-4 text-left">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 transition-colors">First Name *</label>
                            <input
                              type="text"
                              name="firstName"
                              value={myProfileEditForm.firstName}
                              onChange={handleProfileInputChange}
                              className={`w-full bg-white dark:bg-slate-950 border ${myProfileErrors.firstName ? 'border-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-800 focus:border-blue-500'} rounded-xl p-2.5 text-sm outline-none text-slate-900 dark:text-white transition-colors`}
                            />
                            {myProfileErrors.firstName && (
                              <p className="text-red-500 dark:text-red-400 text-[10px] mt-1 transition-colors">{myProfileErrors.firstName}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Last Name *</label>
                            <input
                              type="text"
                              name="lastName"
                              value={myProfileEditForm.lastName}
                              onChange={handleProfileInputChange}
                              className={`w-full bg-white dark:bg-slate-950 border ${myProfileErrors.lastName ? 'border-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-800 focus:border-blue-500'} rounded-xl p-2.5 text-sm outline-none text-slate-900 dark:text-white transition-colors`}
                            />
                            {myProfileErrors.lastName && (
                              <p className="text-red-500 dark:text-red-400 text-[10px] mt-1 transition-colors">{myProfileErrors.lastName}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Email Address (Not Editable)</label>
                          <input
                            type="email"
                            name="email"
                            value={myProfileEditForm.email}
                            disabled
                            className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Phone Number</label>
                            <input
                              type="text"
                              name="phoneNumber"
                              placeholder="e.g. 9876543210"
                              value={myProfileEditForm.phoneNumber}
                              onChange={handleProfileInputChange}
                              className={`w-full bg-white dark:bg-slate-950 border ${myProfileErrors.phoneNumber ? 'border-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-800 focus:border-blue-500'} rounded-xl p-2.5 text-sm outline-none text-slate-900 dark:text-white transition-colors`}
                            />
                            {myProfileErrors.phoneNumber && (
                              <p className="text-red-500 dark:text-red-400 text-[10px] mt-1 transition-colors">{myProfileErrors.phoneNumber}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Mobile Number</label>
                            <input
                              type="text"
                              name="mobileNumber"
                              placeholder="e.g. 9876543210"
                              value={myProfileEditForm.mobileNumber}
                              onChange={handleProfileInputChange}
                              className={`w-full bg-white dark:bg-slate-950 border ${myProfileErrors.mobileNumber ? 'border-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-800 focus:border-blue-500'} rounded-xl p-2.5 text-sm outline-none text-slate-900 dark:text-white transition-colors`}
                            />
                            {myProfileErrors.mobileNumber && (
                              <p className="text-red-500 dark:text-red-400 text-[10px] mt-1 transition-colors">{myProfileErrors.mobileNumber}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Job Title</label>
                            <input
                              type="text"
                              name="title"
                              value={myProfileEditForm.title}
                              onChange={handleProfileInputChange}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-blue-500 rounded-xl p-2.5 text-sm outline-none text-slate-900 dark:text-white transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Degree / Qualification</label>
                            <input
                              type="text"
                              name="degree"
                              value={myProfileEditForm.degree}
                              onChange={handleProfileInputChange}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-blue-500 rounded-xl p-2.5 text-sm outline-none text-slate-900 dark:text-white transition-colors"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Date of Birth</label>
                            <input
                              type="date"
                              name="dob"
                              value={myProfileEditForm.dob}
                              onChange={handleProfileInputChange}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-blue-500 rounded-xl p-2.5 text-sm outline-none text-slate-900 dark:text-white transition-colors [&::-webkit-calendar-picker-indicator]:dark:invert"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Gender</label>
                            <select
                              name="genderId"
                              value={myProfileEditForm.genderId}
                              onChange={handleProfileInputChange}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-blue-500 rounded-xl p-2.5 text-sm outline-none text-slate-900 dark:text-white transition-colors cursor-pointer"
                            >
                              <option value="">Select Gender</option>
                              {((references || []).find((r) => r.name === "GenderType")?.referenceItems || []).map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.description}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Reports To Manager</label>
                          <select
                            name="reportsToId"
                            value={myProfileEditForm.reportsToId}
                            onChange={handleProfileInputChange}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-blue-500 rounded-xl p-2.5 text-sm outline-none text-slate-900 dark:text-white transition-colors cursor-pointer"
                          >
                            <option value="">No Manager (Executive)</option>
                            {(employees || [])
                              .filter((emp) => emp.id !== myProfileData?.id)
                              .map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {formatFullName(emp)}
                                </option>
                              ))}
                          </select>
                        </div>
                      </form>
                    )}
                  </>
                ) : null}
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex gap-3 justify-end transition-colors">
                {isMyProfileEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMyProfileEditing(false);
                        setMyProfileErrors({});
                        if (myProfileData) {
                          setMyProfileEditForm({
                            firstName: myProfileData.firstName || "",
                            lastName: myProfileData.lastName || "",
                            email: myProfileData.email || "",
                            phoneNumber: myProfileData.phoneNumber || "",
                            mobileNumber: myProfileData.mobileNumber || "",
                            dob: myProfileData.dob ? myProfileData.dob.substring(0, 10) : "",
                            genderId: myProfileData.genderId || "",
                            reportsToId: myProfileData.reportsToId || "",
                            title: myProfileData.title || "",
                            degree: myProfileData.degree || "",
                          });
                        }
                      }}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-sm font-semibold transition-colors"
                      disabled={myProfileLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800/80 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      disabled={myProfileLoading}
                    >
                      {myProfileLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsMyProfileOpen(false)}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMyProfileEditing(true)}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
                      disabled={myProfileLoading || !myProfileData}
                    >
                      Edit Profile
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
      {/* Floating Toast Notification */}
      <ToastContainer />
    </div>
  );
}

export default Dashboard;
