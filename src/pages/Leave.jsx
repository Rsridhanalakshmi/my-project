import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Breadcrumb from "../components/Breadcrumb";
import Modal from "../components/common/Modal";
import { useToast } from "../components/common/Toast";
import DataTable from "../components/common/DataTable";
import {
  FaPlaneDeparture,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSearch,
  FaTrash,
  FaArrowLeft,
  FaCalendarAlt,
  FaRegFileAlt,
  FaCheck,
  FaTimes
} from "react-icons/fa";

import axios from "axios";

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

function Leave() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile data states for header integration
  const [myProfileData, setMyProfileData] = useState(null);
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
  const [isMyProfileEditing, setIsMyProfileEditing] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leaveIdToDelete, setLeaveIdToDelete] = useState(null);

  // Filter/Search states
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { showToast } = useToast();

  const fetchMyProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = decodeToken(token);
      if (!decoded) return;

      const userId =
        decoded.id ||
        decoded.Id ||
        decoded.userId ||
        decoded.sub ||
        decoded.nameid ||
        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

      if (!userId) return;

      const response = await axios.get(`/api/auth/get-employee-byId/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMyProfileData(response.data);
    } catch (err) {
      console.error("Error fetching profile inside Leave.jsx:", err);
    }
  }, []);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await axios.get("/api/auth/get-all-leave-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLeaves(response.data || []);
    } catch (err) {
      console.error("Error fetching leave requests:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem("token");
        navigate("/");
      } else {
        setError(err.response?.data?.message || "Failed to load leave requests. Please verify backend connection.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchMyProfile();
    fetchLeaves();
  }, [fetchMyProfile, fetchLeaves]);

  // Handle Delete leave request
  const handleDeleteClick = (id) => {
    setLeaveIdToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDeleteLeave = async () => {
    if (!leaveIdToDelete) return;
    const id = leaveIdToDelete;
    setDeleteModalOpen(false);
    setLeaveIdToDelete(null);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      await axios.delete(`/api/auth/delete-leave-request/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showToast("Leave request deleted successfully.");
      fetchLeaves();
    } catch (err) {
      console.error("Error deleting leave request:", err);
      showToast(err.response?.data?.message || "Failed to delete leave request.", "error");
    }
  };

  // Mock Approve/Reject status triggers (since backend doesn't show specific update endpoints in swagger screenshot)
  const handleMockStatus = (id, requestNumber, newStatus) => {
    // Optimistically update status locally
    setLeaves((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus, statusCode: newStatus } : item))
    );
    showToast(`Leave request ${requestNumber} status updated to ${newStatus} (Local Demo).`);
  };

  // Profile triggers redirect mock helper (or standard opening)
  const handleProfileOpenHelper = () => {
    // Simply redirect to dashboard with query to open profile slide-over
    navigate("/dashboard?profile=open");
  };

  const getInitials = (emp) => {
    if (!emp) return "?";
    const first = emp.firstName ? emp.firstName.charAt(0) : "";
    const last = emp.lastName ? emp.lastName.charAt(0) : "";
    if (first || last) return (first + last).toUpperCase();
    return emp.userName ? emp.userName.substring(0, 2).toUpperCase() : "?";
  };

  // Metrics calculations
  const totalRequests = leaves.length;
  const pendingRequests = leaves.filter((l) => l.status === "PENDING" || l.statusCode === "PENDING").length;
  const approvedRequests = leaves.filter((l) => l.status === "APPROVED" || l.statusCode === "APPROVED").length;
  const rejectedRequests = leaves.filter((l) => l.status === "REJECTED" || l.statusCode === "REJECTED").length;

  // Filter logic
  const getStatusBadgeStyles = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "APPROVED") return "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40 transition-colors";
    if (s === "REJECTED") return "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800/40 transition-colors";
    return "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/40 transition-colors";
  };

  // Filter leaves for DataTable by status & type only
  const leavesFilteredByStatusAndType = useMemo(() => {
    return leaves.filter((l) => {
      const matchesStatus = statusFilter === "" || l.status === statusFilter || l.statusCode === statusFilter;
      const matchesType = typeFilter === "" || l.leaveType === typeFilter;
      return matchesStatus && matchesType;
    });
  }, [leaves, statusFilter, typeFilter]);

  // Columns config for DataTable
  const tableColumns = useMemo(() => [
    {
      header: "Request Details",
      accessor: "requestNumber",
      sortable: true,
      render: (l) => (
        <div>
          <div className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold transition-colors">{l.requestNumber}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
            Applied: {l.appliedOnUtc ? l.appliedOnUtc.substring(0, 10) : "N/A"}
          </div>
        </div>
      )
    },
    {
      header: "Employee",
      accessor: "employeeName",
      sortable: true,
      render: (l) => (
        <div className="font-semibold text-slate-900 dark:text-slate-200 transition-colors">
          {l.employeeName || "Unknown Employee"}
        </div>
      )
    },
    {
      header: "Leave Type",
      accessor: "leaveType",
      sortable: true,
      render: (l) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 uppercase transition-colors">
          {l.leaveType}
        </span>
      )
    },
    {
      header: "Duration",
      accessor: "startDate",
      sortable: true,
      render: (l) => (
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 transition-colors">
            <FaCalendarAlt className="text-slate-500 text-[10px]" />
            <span>{l.startDate} to {l.endDate}</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium transition-colors">
            Total Days: {l.totalDays} {l.isHalfDay && "(Half Day)"}
          </div>
        </div>
      )
    },
    {
      header: "Reason",
      accessor: "reason",
      sortable: false,
      render: (l) => (
        <div className="text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate transition-colors" title={l.reason}>
          {l.reason || <span className="italic text-slate-400 dark:text-slate-600">No reason specified</span>}
        </div>
      )
    },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (l) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border ${getStatusBadgeStyles(l.status)}`}>
          {l.status}
        </span>
      )
    }
  ], []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased pb-12 transition-colors">
      {/* Header component integration */}
      <Header
        myProfileData={myProfileData}
        setIsMyProfileOpen={handleProfileOpenHelper}
        setIsMyProfileEditing={setIsMyProfileEditing}
        handleLogout={() => {
          localStorage.removeItem("token");
          navigate("/");
        }}
        getInitials={getInitials}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <Breadcrumb />

        {/* Leave metrics section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-900/50 transition duration-300">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider transition-colors">Total Requests</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 transition-colors">{loading ? "..." : totalRequests}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors">
              <FaRegFileAlt className="text-base" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-900/50 transition duration-300">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider transition-colors">Pending Approval</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 transition-colors">{loading ? "..." : pendingRequests}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 transition-colors">
              <FaClock className="text-base" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-900/50 transition duration-300">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider transition-colors">Approved Leaves</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 transition-colors">{loading ? "..." : approvedRequests}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition-colors">
              <FaCheckCircle className="text-base" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-900/50 transition duration-300">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider transition-colors">Rejected Requests</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 transition-colors">{loading ? "..." : rejectedRequests}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 transition-colors">
              <FaTimesCircle className="text-base" />
            </div>
          </div>
        </section>

        {/* Filters and List block */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 transition-colors">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                <FaPlaneDeparture className="text-blue-600 dark:text-blue-500 transition-colors" />
                <span>Leave Applications</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">Review, approve, or reject employee leave requests.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Type filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer transition-colors"
              >
                <option value="">All Leave Types</option>
                <option value="CASUAL">Casual</option>
                <option value="SICK">Sick</option>
                <option value="MATERNITY">Maternity</option>
                <option value="PATERNITY">Paternity</option>
              </select>
            </div>
          </div>

          {/* Table content wrapper */}
          <div className="w-full bg-white dark:bg-slate-900 transition-colors">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 items-center animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-12 text-center text-rose-600 dark:text-rose-500">
                <p className="text-sm font-semibold">⚠ Failed to load leaves</p>
                <p className="text-xs text-slate-500 mt-1">{error}</p>
                <button
                  onClick={fetchLeaves}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Retry Load
                </button>
              </div>
            ) : (
              <DataTable
                columns={tableColumns}
                data={leavesFilteredByStatusAndType}
                searchPlaceholder="Search name, reason, request..."
                searchKeys={["employeeName", "reason", "requestNumber"]}
                itemsPerPage={10}
                noDataMessage="No leave requests match the criteria."
                actionsRenderer={(l) => (
                  <>
                    {(l.status === "PENDING" || l.statusCode === "PENDING") && (
                      <>
                        <button
                          onClick={() => handleMockStatus(l.id, l.requestNumber, "APPROVED")}
                          title="Approve Leave"
                          className="p-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white rounded border border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-500 transition-colors"
                        >
                          <FaCheck className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleMockStatus(l.id, l.requestNumber, "REJECTED")}
                          title="Reject Leave"
                          className="p-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white rounded border border-rose-200 dark:border-rose-900/50 hover:border-rose-500 transition-colors"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteClick(l.id)}
                      title="Delete Request"
                      className="p-1.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white rounded border border-slate-300 dark:border-slate-700/60 hover:border-red-500 transition-colors"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </>
                )}
              />
            )}
          </div>
        </section>
      </main>


      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        title="Delete Leave Request"
        message="Are you sure you want to delete this leave request? This action cannot be undone."
        type="danger"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteLeave}
        onCancel={() => {
          setDeleteModalOpen(false);
          setLeaveIdToDelete(null);
        }}
      />
    </div>
  );
}

export default Leave;

