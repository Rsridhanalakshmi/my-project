import { useState, useMemo, useEffect } from "react";
import { FaSort, FaSortUp, FaSortDown, FaSearch, FaAngleLeft, FaAngleRight, FaDownload } from "react-icons/fa";

export default function DataTable({
  columns = [],
  data = [],
  searchPlaceholder = "Search...",
  searchKeys = [],
  itemsPerPage = 10,
  actionsRenderer,
  noDataMessage = "No entries found.",
  onRowSave, // callback for inline editing
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [columnFilters, setColumnFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingRowData, setEditingRowData] = useState({});

  // Reset page when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortConfig, columnFilters]);

  const handleSort = (key, sortable) => {
    if (!sortable) return;
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "";
      key = "";
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    let result = data;

    // Global Search
    if (searchQuery.trim() && searchKeys.length > 0) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((row) => {
        return searchKeys.some((key) => {
          const val = row[key];
          if (val === undefined || val === null) return false;
          return val.toString().toLowerCase().includes(query);
        });
      });
    }

    // Column Filters
    Object.entries(columnFilters).forEach(([accessor, filterValue]) => {
      if (filterValue && filterValue.trim()) {
        const query = filterValue.toLowerCase().trim();
        result = result.filter(row => {
           const val = row[accessor];
           if (val === undefined || val === null) return false;
           return val.toString().toLowerCase().includes(query);
        });
      }
    });

    return result;
  }, [data, searchQuery, searchKeys, columnFilters]);

  const sortedData = useMemo(() => {
    const { key, direction } = sortConfig;
    if (!key || !direction) return filteredData;

    return [...filteredData].sort((a, b) => {
      let valA = typeof a[key] === "string" ? a[key].toLowerCase() : a[key];
      let valB = typeof b[key] === "string" ? b[key].toLowerCase() : b[key];

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (activePage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, activePage, itemsPerPage]);

  const startItem = sortedData.length === 0 ? 0 : (activePage - 1) * itemsPerPage + 1;
  const endItem = Math.min(activePage * itemsPerPage, sortedData.length);

  const hasFilterableColumns = columns.some(c => c.filterable);

  const handleExportCSV = () => {
    if (!sortedData || sortedData.length === 0) return;
    const headers = columns.map(c => c.header).join(',');
    const csvRows = sortedData.map(row => {
      return columns.map(col => {
        let val = "";
        if (typeof col.accessor === "function") {
           val = col.accessor(row);
        } else if (col.accessor) {
           val = row[col.accessor];
        }
        val = String(val !== undefined && val !== null ? val : "").replace(/"/g, '""');
        return `"${val}"`;
      }).join(',');
    });
    
    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startEdit = (row) => {
    setEditingRowId(row.id);
    setEditingRowData({ ...row });
  };

  const handleSaveEdit = async () => {
    if (onRowSave) {
      try {
        await onRowSave(editingRowData);
      } catch (e) {
        console.error("Failed to save row", e);
        return;
      }
    }
    setEditingRowId(null);
    setEditingRowData({});
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditingRowData({});
  };

  const handleTableKeyDown = (e) => {
    const validKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (!validKeys.includes(e.key)) return;

    const cell = e.target.closest("td, th");
    if (!cell) return;

    const row = cell.parentElement;
    const table = row.closest("table");
    const rows = Array.from(table.querySelectorAll("tr"));
    
    const rowIndex = rows.indexOf(row);
    const cells = Array.from(row.querySelectorAll("td, th"));
    const colIndex = cells.indexOf(cell);

    let nextRowIndex = rowIndex;
    let nextColIndex = colIndex;

    if (e.key === "ArrowUp") nextRowIndex = Math.max(0, rowIndex - 1);
    if (e.key === "ArrowDown") nextRowIndex = Math.min(rows.length - 1, rowIndex + 1);
    if (e.key === "ArrowLeft") nextColIndex = Math.max(0, colIndex - 1);
    if (e.key === "ArrowRight") nextColIndex = Math.min(cells.length - 1, colIndex + 1);

    if (nextRowIndex !== rowIndex || nextColIndex !== colIndex) {
      e.preventDefault();
      const nextRow = rows[nextRowIndex];
      const nextCells = Array.from(nextRow.querySelectorAll("td, th"));
      const nextCell = nextCells[nextColIndex] || nextCells[nextCells.length - 1];
      if (nextCell) {
        nextCell.focus();
      }
    }
  };

  return (
    <div className="flex flex-col w-full text-slate-900 dark:text-slate-200 bg-white dark:bg-transparent rounded-2xl overflow-hidden transition-colors duration-300">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-4 transition-colors">
        {searchKeys.length > 0 ? (
          <div className="relative w-full max-w-xs">
            <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 text-xs" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-blue-500 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
            />
          </div>
        ) : <div />}
        
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
        >
          <FaDownload /> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {paginatedData.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-slate-50/20 dark:bg-slate-900/20 transition-colors">
            {noDataMessage}
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]" onKeyDown={handleTableKeyDown}>
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider transition-colors">
                {columns.map((col, index) => (
                  <th
                    key={index}
                    tabIndex={0}
                    aria-sort={col.sortable ? (sortConfig.key === col.accessor ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none") : undefined}
                    onClick={() => handleSort(col.accessor, col.sortable)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && col.sortable) {
                        e.preventDefault();
                        handleSort(col.accessor, col.sortable);
                      }
                    }}
                    className={`px-6 py-4 select-none focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800 ${col.sortable ? "cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors duration-150" : ""}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-500 text-[10px]">
                          {sortConfig.key === col.accessor ? (
                            sortConfig.direction === "asc" ? <FaSortUp className="text-blue-500" /> : <FaSortDown className="text-blue-500" />
                          ) : (
                            <FaSort />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {actionsRenderer && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>

              {hasFilterableColumns && (
                <tr className="bg-slate-50/40 dark:bg-slate-950/30 border-b border-slate-200 dark:border-slate-800">
                  {columns.map((col, idx) => (
                    <th key={`filter-${idx}`} className="px-4 py-2 font-normal">
                      {col.filterable && col.accessor && typeof col.accessor === "string" && (
                        <input
                          type="text"
                          placeholder={`Filter ${col.header}...`}
                          aria-label={`Filter ${col.header}`}
                          value={columnFilters[col.accessor] || ""}
                          onChange={(e) => setColumnFilters(prev => ({ ...prev, [col.accessor]: e.target.value }))}
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      )}
                    </th>
                  ))}
                  {actionsRenderer && <th className="px-6 py-2"></th>}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/10 text-xs transition-colors">
              {paginatedData.map((row, rIndex) => {
                const isEditing = editingRowId === row.id;

                return (
                  <tr key={row.id || rIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors duration-150">
                    {columns.map((col, cIndex) => {
                      if (isEditing && col.editable && typeof col.accessor === "string") {
                        return (
                          <td key={cIndex} tabIndex={0} className="px-6 py-4 focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800">
                            <input
                              type="text"
                              value={editingRowData[col.accessor] || ""}
                              onChange={(e) => setEditingRowData({ ...editingRowData, [col.accessor]: e.target.value })}
                              className="w-full px-2 py-1.5 text-xs border border-blue-300 dark:border-blue-700 rounded bg-blue-50 dark:bg-blue-900/20 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                          </td>
                        );
                      }

                      let cellVal = "";
                      if (typeof col.accessor === "function") {
                        cellVal = col.accessor(row);
                      } else if (col.accessor) {
                        cellVal = row[col.accessor];
                      }

                      return (
                        <td key={cIndex} tabIndex={0} className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800">
                          {col.render ? col.render(row) : (cellVal !== undefined && cellVal !== null ? String(cellVal) : "")}
                        </td>
                      );
                    })}
                    
                    {actionsRenderer && (
                      <td tabIndex={0} className="px-6 py-4 text-right focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button onClick={handleSaveEdit} className="text-green-600 dark:text-green-400 font-semibold hover:underline">Save</button>
                              <button onClick={handleCancelEdit} className="text-slate-500 hover:underline">Cancel</button>
                            </>
                          ) : (
                            actionsRenderer(row, { startEdit: () => startEdit(row) })
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {sortedData.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            Showing <span className="text-slate-900 dark:text-slate-200 font-bold">{startItem}</span> to <span className="text-slate-900 dark:text-slate-200 font-bold">{endItem}</span> of <span className="text-slate-900 dark:text-slate-200 font-bold">{sortedData.length}</span> entries
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={activePage === 1}
                aria-label="Previous page"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FaAngleLeft className="text-xs" />
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isSelected = pageNum === activePage;
                return (
                  <button
                    key={pageNum}
                    aria-label={`Page ${pageNum}`}
                    aria-current={isSelected ? "page" : undefined}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors duration-150
                      ${isSelected
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                        : "border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={activePage === totalPages}
                aria-label="Next page"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FaAngleRight className="text-xs" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
