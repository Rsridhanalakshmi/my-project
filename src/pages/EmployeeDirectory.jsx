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

function EmployeeDirectory() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [references, setReferences] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const fetchHolidays = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get("/api/auth/holiday-calendar?year=2026", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHolidays(response.data);
    } catch (err) {
      console.error("Error fetching holidays:", err);
    }
  }, []);

  const fetchLeaveRequests = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get("/api/auth/get-all-leave-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaveRequests(response.data);
    } catch (err) {
      console.error("Error fetching leave requests:", err);
    }
  }, []);

  const fetchMyProfile = useCallback(async () => {
    setMyProfileLoading(true);
    setMyProfileError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = decodeToken(token);
      const userId =
        decoded?.userId ||
        decoded?.id ||
        decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

      if (!userId) {
        throw new Error("Could not find user ID in token");
      }

      const response = await axios.get(`/api/auth/get-employee-byId/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      setMyProfileData(data);

      setMyProfileEditForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        mobileNumber: data.mobileNumber || "",
        dob: data.dob ? data.dob.substring(0, 10) : "",
        genderId: data.genderId || "",
        reportsToId: data.reportsToId || "",
        title: data.title || "",
        degree: data.degree || "",
        pictureUrl: data.pictureUrl || "",
      });
    } catch (err) {
      console.error("Error fetching my profile:", err);
      setMyProfileError(err.response?.data?.message || "Failed to load profile details.");
    } finally {
      setMyProfileLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    } else {
      Promise.resolve().then(() => {
        fetchMyProfile();
        fetchEmployees();
        fetchReferences();
        fetchHolidays();
        fetchLeaveRequests();
        
      });
    }
  }, [navigate, fetchMyProfile, fetchEmployees, fetchReferences, fetchHolidays, fetchLeaveRequests]);

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



        {/* Animated Hero Header */}
        <div className="relative w-full rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-8 sm:p-12 mb-8 shadow-2xl overflow-hidden group">
          {/* Animated Background Mesh/Blobs */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700 ease-in-out"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-400/20 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-1000 ease-in-out"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-2 drop-shadow-sm">
                Employee
              </h1>
              <p className="text-blue-100/90 text-lg max-w-xl font-medium">
                Manage your team, explore credentials, and connect with colleagues instantly.
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center min-w-[140px] shadow-lg">
                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Total Staff</p>
                <p className="text-4xl font-extrabold text-white">{employees.length}</p>
              </div>
            </div>
          </div>
        </div>

        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors duration-300">
          {/* Table Header Filter & Search Bar */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Filters & Search</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">Narrow down the list by typing or selecting a role.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative min-w-[240px]">
                <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 text-sm" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
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
                onChange={(e) => {
                  setTitleFilter(e.target.value);
                  setCurrentPage(1);
                }}
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
                    setCurrentPage(1);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1"
                >
                  Clear Filters
                </button>
              )}

            </div>
          </div>

          {/* Directory Content */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent transition-colors">
            {loading ? (
              /* Skeletal Loading Animation */
              <div className="p-8 space-y-5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4 items-center animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 shadow-sm border border-slate-100 dark:border-slate-800"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded w-1/4 shadow-sm"></div>
                      <div className="h-3 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded w-1/2 shadow-sm"></div>
                    </div>
                    <div className="w-24 h-6 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-lg shadow-sm"></div>
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
              /* Beautiful Empty State */
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="w-24 h-24 mb-6 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center relative shadow-inner">
                  <FaSearch className="text-4xl text-slate-300 dark:text-slate-600 absolute" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No employees found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  We couldn't find anyone matching "{searchTerm || titleFilter || 'your criteria'}". Try adjusting your search or filters to find what you're looking for.
                </p>
                {(searchTerm || titleFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setTitleFilter("");
                      setCurrentPage(1);
                    }}
                    className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              /* Interactive Card Grid View */
              <div className="p-6 bg-slate-50/30 dark:bg-slate-950/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col min-h-[260px]"
                    >
                      {/* Top decorative gradient line */}
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center text-xl font-bold text-blue-700 dark:text-blue-400 shadow-inner border border-white/50 dark:border-slate-700 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                          {getInitials(emp)}
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getTitleBadgeStyles(emp.title)}`}>
                          {emp.title || "No Title"}
                        </span>
                      </div>

                      <div className="mb-5 relative z-10">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {formatFullName(emp)}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                          @{emp.userName || "anonymous"} • ID: {emp.employeeId || "-"}
                        </p>
                      </div>

                      <div className="space-y-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/80 relative z-10">
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0"><FaEnvelope className="text-[10px]" /></div>
                          <span className="truncate text-xs font-medium">{emp.email || "-"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0"><FaUserTie className="text-[10px]" /></div>
                          <span className="truncate text-xs font-medium">{emp.managerName || "None"}</span>
                        </div>
                      </div>

                      {/* Action buttons on hover */}
                      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/employee/${emp.id}`);
                          }}
                          className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          title="Edit Employee"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Pagination Controls */}
          {!loading && !error && filteredEmployees.length > 0 && (() => {
            const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
            
            return (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30 dark:bg-slate-900/30">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Showing <span className="text-slate-900 dark:text-white font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-slate-900 dark:text-white font-semibold">{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</span> of <span className="text-slate-900 dark:text-white font-semibold">{filteredEmployees.length}</span> entries
                </span>
                
                <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  
                  <div className="flex gap-1 border-x border-slate-100 dark:border-slate-800 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      // Show limited pages: first, last, and around current
                      .filter(p => p === 1 || p === totalPages || Math.abs(currentPage - p) <= 1)
                      .map((page, index, array) => {
                        // Add ellipses if there are gaps
                        const showEllipsis = index > 0 && page - array[index - 1] > 1;
                        return (
                          <div key={page} className="flex">
                            {showEllipsis && <span className="px-2 py-1.5 text-slate-400">...</span>}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 ${
                                currentPage === page 
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105" 
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })
                    }
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || filteredEmployees.length === 0}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            );
          })()}
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
            <div className="w-screen max-w-md transform bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-l border-white/40 dark:border-white/10 shadow-[-10px_0_30px_0_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col justify-between">
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
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-3xl font-bold text-white mx-auto shadow-[0_10px_30px_rgba(59,130,246,0.4)] border border-white/20 transform hover:scale-105 transition-transform duration-300 cursor-default">
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

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => navigate("/employee/new")}
        title="Add New Employee"
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_10px_40px_rgba(37,99,235,0.6)] hover:shadow-[0_15px_50px_rgba(37,99,235,0.8)] flex items-center justify-center text-2xl font-bold transition-all duration-300 hover:scale-110 animate-[bounce_3s_infinite] group z-40"
      >
        <span className="group-hover:rotate-90 transition-transform duration-300">+</span>
      </button>

      {/* Floating Toast Notification */}
      <ToastContainer />
    </div>
  );
}

export default EmployeeDirectory;
