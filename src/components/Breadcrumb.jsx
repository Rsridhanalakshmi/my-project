import { Link, useLocation } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // If we are on the root/login page, do not display breadcrumb
  if (location.pathname === "/") {
    return null;
  }

  // Map segments to reader-friendly display labels
  const getFriendlyName = (segment, index, fullPathnames) => {
    switch (segment) {
      case "dashboard":
        return "Dashboard";
      case "change-password":
        return "Change Password";
      case "employee":
        return "Employees";
      case "leave":
        return "Leave Management";
      case "new":
        return "Add Employee";
      default:
        // If it is a route parameter (ID) following "employee", display it as "Edit Employee"
        if (index > 0 && fullPathnames[index - 1] === "employee") {
          return "Edit Employee";
        }
        // Capitalize and format general segments
        return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    }
  };

  return (
    <nav 
      className="flex items-center text-[11px] font-medium text-slate-500 dark:text-slate-400 py-2 px-3 mb-6 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-sm max-w-fit transition-all duration-300" 
      aria-label="Breadcrumb"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
          >
            <span>Home</span>
          </Link>
        </li>
        
        {pathnames.map((segment, index) => {
          // Skip the "employee" segment if it is followed by a child action/ID,
          // avoiding redundant breadcrumb segments or broken links since '/employee' is not a route.
          const isEmployeeParent = segment === "employee" && index < pathnames.length - 1;
          if (isEmployeeParent) {
            return null;
          }

          // If the user is on the dashboard page, we do not need to repeat "Home > Dashboard"
          // as "Home" already redirects to the Dashboard. So we skip dashboard segment.
          if (segment === "dashboard" && pathnames.length === 1) {
            return null;
          }

          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          const friendlyName = getFriendlyName(segment, index, pathnames);

          return (
            <li key={routeTo} className="inline-flex items-center">
              <FaChevronRight className="text-slate-400 dark:text-slate-600 text-[9px] mx-1 md:mx-2" />
              {isLast ? (
                <span className="text-blue-600 dark:text-blue-400 font-semibold select-none">
                  {friendlyName}
                </span>
              ) : (
                <Link
                  to={routeTo}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
                >
                  {friendlyName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
