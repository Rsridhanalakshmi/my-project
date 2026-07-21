import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUserAlt, FaSignOutAlt, FaBell, FaBars, FaTimes, FaSun, FaMoon } from "react-icons/fa";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";

function Header({
  myProfileData,
  setIsMyProfileOpen,
  setIsMyProfileEditing,
  handleLogout,
  getInitials,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { theme, toggleTheme } = useTheme();
  
  // Track read leave notification IDs locally
  const [readIds, setReadIds] = useState(() => {
    const saved = localStorage.getItem("gconnect_read_leave_ids");
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch pending leave applications to build dynamic notification alerts
  const fetchLeaveNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get("/api/auth/get-all-leave-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Filter for leave requests that are pending approval
      const pendingRequests = (response.data || []).filter(
        (item) => item.status === "PENDING" || item.statusCode === "PENDING"
      );

      // Map pending leave requests to dashboard notification alerts
      const mappedNotifications = pendingRequests.map((item) => {
        const dateStr = item.appliedOnUtc 
          ? new Date(item.appliedOnUtc).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })
          : "Recently";

        return {
          id: item.id,
          title: `New Leave Request - ${item.employeeName}`,
          message: `${item.employeeName} requests ${item.totalDays} day(s) of ${item.leaveType} leave starting ${item.startDate}.`,
          time: dateStr,
          isRead: readIds.includes(item.id),
        };
      });

      setNotifications(mappedNotifications);
    } catch (err) {
      console.error("Error loading leave alerts inside Header:", err);
    }
  };

  useEffect(() => {
    fetchLeaveNotifications();

    // Poll the backend every 30 seconds for live notifications updates
    const timer = setInterval(fetchLeaveNotifications, 30000);
    return () => clearInterval(timer);
  }, [readIds]);

  // Mark all notifications as read
  const markAllAsRead = () => {
    const unread = notifications.filter((n) => !n.isRead).map((n) => n.id);
    const updated = [...readIds, ...unread];
    setReadIds(updated);
    localStorage.setItem("gconnect_read_leave_ids", JSON.stringify(updated));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Mark single notification as read
  const markAsRead = (id) => {
    if (readIds.includes(id)) return;
    const updated = [...readIds, id];
    setReadIds(updated);
    localStorage.setItem("gconnect_read_leave_ids", JSON.stringify(updated));
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // Click outside and Escape close-away handler
  useEffect(() => {
    if (!isNotificationsOpen) return;

    const handleClickOutside = (e) => {
      const dropdown = document.getElementById("notification-dropdown") || document.getElementById("notification-dropdown-mobile");
      const bellBtn = document.getElementById("notification-bell-btn") || document.getElementById("notification-bell-btn-mobile");
      if (
        dropdown && 
        !dropdown.contains(e.target) && 
        bellBtn && 
        !bellBtn.contains(e.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotificationsOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex flex-col md:flex-row gap-4 md:gap-0 items-center justify-between transition-colors duration-300">
      {/* Branding and Mobile Toggle Toggle block */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            G
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 via-slate-600 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
              GConnect Admin
            </h1>
            <p className="text-xs text-blue-400">Employee Management Portal</p>
          </div>
        </div>

        {/* Mobile Hamburger menu toggle button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          className="md:hidden p-2.5 rounded-lg bg-slate-800 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 transition duration-200 flex items-center justify-center ml-auto"
          title="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <FaTimes className="text-sm" /> : <FaBars className="text-sm" />}
        </button>
      </div>

      {/* DESKTOP VIEW ACTIONS (Hidden on mobile) */}
      <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-3 sm:gap-4">
        {/* Navigation Link: Dashboard */}
        <Link
          to="/dashboard"
          className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center"
        >
          Dashboard
        </Link>

        {/* Navigation Link: Leave Page */}
        <Link
          to="/leave"
          className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center"
        >
          Leave List
        </Link>

        {/* Action Toggle: Theme */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center"
          title="Toggle Theme"
        >
          {theme === "dark" ? <FaSun className="text-sm text-yellow-400" /> : <FaMoon className="text-sm text-slate-500" />}
        </button>

        {/* Action Toggle: Notification Panel Bell */}
        <div className="relative">
          <button
            id="notification-bell-btn"
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={isNotificationsOpen}
            aria-controls="notification-dropdown"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center"
            title="Notifications"
          >
            <FaBell className="text-sm" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div
              id="notification-dropdown"
              role="menu"
              className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-2xl z-50 overflow-hidden transition-colors"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/30 transition-colors">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                  <FaBell className="text-blue-600 dark:text-blue-400 text-xs transition-colors" />
                  <span>Pending Leave Requests</span>
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/60 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 transition-colors">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs transition-colors" role="menuitem">
                    No pending leave requests.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      role="menuitem"
                      tabIndex={0}
                      onClick={() => markAsRead(n.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          markAsRead(n.id);
                        }
                      }}
                      className={`p-4 flex gap-3 text-left cursor-pointer transition duration-150 relative focus:outline-none focus:bg-slate-200 dark:focus:bg-slate-700 ${
                        !n.isRead
                          ? "bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-800/60"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/20"
                      }`}
                    >
                      {!n.isRead && (
                        <span className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-500 shadow-[0_0_6px_rgba(37,99,235,0.8)] dark:shadow-[0_0_6px_rgba(59,130,246,0.8)]"></span>
                      )}
                      <div className="flex-1 space-y-1">
                        <div className={`text-xs transition-colors ${!n.isRead ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                          {n.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
                          {n.message}
                        </div>
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 transition-colors">
                          Applied: {n.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Toggle: Profile slide drawer trigger */}
        <button
          onClick={() => {
            setIsMyProfileOpen(true);
            setIsMyProfileEditing(false);
          }}
          className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
        >
          {myProfileData?.pictureUrl ? (
            <img
              src={myProfileData.pictureUrl}
              alt="Avatar"
              className="w-5 h-5 rounded-full object-cover border border-blue-500"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[9px] font-bold text-white">
              {myProfileData ? getInitials(myProfileData) : <FaUserAlt className="text-[8px]" />}
            </div>
          )}
          <span>My Profile</span>
        </button>

        {/* Action button: Sign out */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-semibold border border-red-200 dark:border-red-900/50 transition-colors"
        >
          <FaSignOutAlt className="text-xs" />
          <span>Sign Out</span>
        </button>
      </nav>

      {/* MOBILE VIEW ACTIONS (Hidden on desktop, shown when toggled) */}
      {isMobileMenuOpen && (
        <nav aria-label="Mobile Navigation" className="md:hidden flex flex-col gap-3 w-full border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 animate-fadeIn transition-colors">
          {/* Navigation Link: Dashboard */}
          <Link
            to="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full justify-center px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center"
          >
            Dashboard
          </Link>

          {/* Navigation Link: Leave Page */}
          <Link
            to="/leave"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full justify-center px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center"
          >
            Leave List
          </Link>

          {/* Mobile Theme Toggle */}
          <button
            onClick={() => {
              toggleTheme();
              setIsMobileMenuOpen(false);
            }}
            className="w-full justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors flex items-center"
          >
            {theme === "dark" ? <FaSun className="text-sm text-yellow-400" /> : <FaMoon className="text-sm text-slate-500" />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>

          {/* Mobile Notifications bell toggle link */}
          <div className="relative w-full">
            <button
              id="notification-bell-btn-mobile"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="w-full justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors flex items-center"
            >
              <FaBell className="text-sm" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div
                id="notification-dropdown-mobile"
                role="menu"
                className="absolute left-0 right-0 mt-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden transition-colors"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/30 transition-colors">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                    <FaBell className="text-blue-600 dark:text-blue-400 text-xs transition-colors" />
                    <span>Pending Leave Requests</span>
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/60 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 transition-colors">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs transition-colors" role="menuitem">
                      No pending leave requests.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        role="menuitem"
                        tabIndex={0}
                        onClick={() => {
                          markAsRead(n.id);
                          setIsMobileMenuOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            markAsRead(n.id);
                            setIsMobileMenuOpen(false);
                          }
                        }}
                        className={`p-4 flex gap-3 text-left cursor-pointer transition duration-150 relative focus:outline-none focus:bg-slate-200 dark:focus:bg-slate-700 ${
                          !n.isRead
                            ? "bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-800/60"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/20"
                        }`}
                      >
                        {!n.isRead && (
                          <span className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-500 shadow-[0_0_6px_rgba(37,99,235,0.8)] dark:shadow-[0_0_6px_rgba(59,130,246,0.8)]"></span>
                        )}
                        <div className="flex-1 space-y-1">
                          <div className={`text-xs transition-colors ${!n.isRead ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                            {n.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
                            {n.message}
                          </div>
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 transition-colors">
                            Applied: {n.time}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Profile Trigger link */}
          <button
            onClick={() => {
              setIsMyProfileOpen(true);
              setIsMyProfileEditing(false);
              setIsMobileMenuOpen(false);
            }}
            className="w-full justify-center px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2"
          >
            {myProfileData?.pictureUrl ? (
              <img
                src={myProfileData.pictureUrl}
                alt="Avatar"
                className="w-5 h-5 rounded-full object-cover border border-blue-500"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[9px] font-bold text-white">
                {myProfileData ? getInitials(myProfileData) : <FaUserAlt className="text-[8px]" />}
              </div>
            )}
            <span>My Profile</span>
          </button>

          {/* Mobile Sign out link */}
          <button
            onClick={() => {
              handleLogout();
              setIsMobileMenuOpen(false);
            }}
            className="w-full justify-center px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-semibold border border-red-200 dark:border-red-900/50 transition-colors flex items-center gap-2"
          >
            <FaSignOutAlt className="text-xs" />
            <span>Sign Out</span>
          </button>
        </nav>
      )}
    </header>
  );
}

export default Header;
