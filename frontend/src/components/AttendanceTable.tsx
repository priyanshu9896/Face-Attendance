import React, { useState, useEffect } from 'react';
import { Check, X, Download, Search, FilterX } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  name: string;
  rollNo: string;
  timestamp: string;
  image?: string;
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onExport: (format: string) => void;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ records, onExport }) => {
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  useEffect(() => {
    let filtered = [...records];
    
    if (searchText) {
      filtered = filtered.filter(record => 
        record.name.toLowerCase().includes(searchText.toLowerCase()) ||
        record.rollNo.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    if (filterDate) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
        return recordDate === filterDate;
      });
    }
    
    setFilteredRecords(filtered);
  }, [records, searchText, filterDate]);

  const handleDateFilter = (date: string) => {
    setFilterDate(date === filterDate ? '' : date);
  };

  // Get unique dates from records
  const uniqueDates = [...new Set(records.map(record => 
    new Date(record.timestamp).toISOString().split('T')[0]
  ))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="attendance-table">
      <div className="table-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or roll number"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button className="clear-search" onClick={() => setSearchText('')}>
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="date-filters">
          <span className="filter-label">Filter by date:</span>
          {uniqueDates.length > 0 ? (
            <div className="date-buttons">
              {uniqueDates.map(date => (
                <button
                  key={date}
                  className={`date-filter ${filterDate === date ? 'active' : ''}`}
                  onClick={() => handleDateFilter(date)}
                >
                  {new Date(date).toLocaleDateString()}
                </button>
              ))}
              {filterDate && (
                <button className="clear-filter" onClick={() => setFilterDate('')}>
                  <FilterX size={16} /> Clear
                </button>
              )}
            </div>
          ) : (
            <span className="no-dates">No attendance records</span>
          )}
        </div>
        
        <div className="export-options">
          <button className="download-csv" onClick={() => onExport('csv')}>
            <Download size={16} /> Export CSV
          </button>
          <button className="download-pdf" onClick={() => onExport('pdf')}>
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>
      
      <div className="records-table">
        {filteredRecords.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => {
                const recordDate = new Date(record.timestamp);
                return (
                  <tr key={record.id}>
                    <td>{record.rollNo}</td>
                    <td>{record.name}</td>
                    <td>{recordDate.toLocaleDateString()}</td>
                    <td>{recordDate.toLocaleTimeString()}</td>
                    <td>
                      <span className="status present">
                        <Check size={16} /> Present
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="no-records">
            <p>No attendance records found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTable;