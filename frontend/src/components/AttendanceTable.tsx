import React, { useState, useEffect } from 'react';
import { Check, Download, Search, FilterX, Calendar, Loader } from 'lucide-react';
import { getAttendanceDates, AttendanceRecord } from '../services/api';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onExport: (format: string, date?: string) => void;
  onDateChange: (date?: string) => void;
  isLoading: boolean;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ 
  records, 
  onExport, 
  onDateChange,
  isLoading 
}) => {
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState<boolean>(false);

  // Initialize filtered records
  useEffect(() => {
    applyFilters();
  }, [records, searchText, filterDate]);

  // Fetch available attendance dates
  useEffect(() => {
    fetchAvailableDates();
  }, []);

  const fetchAvailableDates = async () => {
    try {
      setLoadingDates(true);
      const dates = await getAttendanceDates();
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error fetching attendance dates:', error);
    } finally {
      setLoadingDates(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];
    
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(record => 
        record.student_name.toLowerCase().includes(searchLower) ||
        record.student_id.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredRecords(filtered);
  };

  const handleDateFilter = (date: string) => {
    const newDate = date === filterDate ? '' : date;
    setFilterDate(newDate);
    onDateChange(newDate);
  };

  const formatTime = (timeString: string) => {
    try {
      // If the time is already in HH:MM:SS format, return it as is
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
      }
      
      // Otherwise, assume it's an ISO string and format it
      const date = new Date(timeString);
      return date.toLocaleTimeString();
    } catch (e) {
      return timeString;
    }
  };

  return (
    <div className="attendance-table">
      <div className="table-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or ID"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button className="clear-search" onClick={() => setSearchText('')}>
              <FilterX size={16} />
            </button>
          )}
        </div>
        
        <div className="date-filters">
          <span className="filter-label">Filter by date:</span>
          {loadingDates ? (
            <div className="flex items-center text-gray-500">
              <Loader size={16} className="mr-2 animate-spin" /> Loading dates...
            </div>
          ) : availableDates.length > 0 ? (
            <div className="date-buttons">
              {availableDates.map(date => (
                <button
                  key={date}
                  className={`date-filter ${filterDate === date ? 'active' : ''}`}
                  onClick={() => handleDateFilter(date)}
                >
                  <Calendar size={14} className="mr-1" />
                  {new Date(date).toLocaleDateString()}
                </button>
              ))}
              {filterDate && (
                <button className="clear-filter" onClick={() => handleDateFilter('')}>
                  <FilterX size={16} /> Clear Date Filter
                </button>
              )}
            </div>
          ) : (
            <span className="no-dates">No attendance records available</span>
          )}
        </div>
        
        <div className="export-options">
          <button 
            className="download-csv" 
            onClick={() => onExport('csv', filterDate)}
            disabled={isLoading || records.length === 0}
          >
            <Download size={16} /> Export CSV
          </button>
          <button 
            className="download-pdf" 
            onClick={() => onExport('pdf', filterDate)}
            disabled={isLoading || records.length === 0}
          >
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>
      
      <div className="records-table">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader size={24} className="animate-spin mr-2" />
            <span>Loading attendance records...</span>
          </div>
        ) : filteredRecords.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Time</th>
                <th>Confidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => (
                <tr key={record.id}>
                  <td>{record.student_id}</td>
                  <td>{record.student_name}</td>
                  <td>{formatTime(record.time)}</td>
                  <td>{(record.confidence * 100).toFixed(1)}%</td>
                  <td>
                    <span className="status present">
                      <Check size={16} /> Present
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-records">
            {records.length === 0 ? (
              <p>No attendance records found. Mark attendance in the Recognition tab.</p>
            ) : (
              <p>No records match your search criteria.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTable;