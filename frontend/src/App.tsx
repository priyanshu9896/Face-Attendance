import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserCheck, Check, AlertCircle } from 'lucide-react';
import FaceRecognition from './components/FaceRecognition';
import RegisterStudent from './components/RegisterStudent';
import AttendanceTable from './components/AttendanceTable';
import { getAttendance, AttendanceRecord } from './services/api';
import './App.css';

interface StudentRecord {
  id: string;
  name: string;
  rollNo: string;
  timestamp: string;
  image?: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('recognize');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [notificationStatus, setNotificationStatus] = useState<'success' | 'error' | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Load records from API on component mount
  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceRecords();
    }
  }, [activeTab]);

  const fetchAttendanceRecords = async (date?: string) => {
    try {
      setIsLoading(true);
      const data = await getAttendance(date);
      if (data && data.records) {
        setAttendanceRecords(data.records);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      showNotification('error', 'Failed to load attendance records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceDetection = (faceData: any) => {
    // This is just for debugging
    console.log("Face detected:", faceData);
  };

  const handleAttendanceMarked = (record: StudentRecord) => {
    // Show success notification
    showNotification('success', `Attendance marked for ${record.name}`);
    
    // Refresh attendance records if we're on the attendance tab
    if (activeTab === 'attendance') {
      fetchAttendanceRecords();
    }
  };

  const showNotification = (status: 'success' | 'error', message: string) => {
    setNotificationStatus(status);
    setNotificationMessage(message);
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotificationStatus(null);
      setNotificationMessage('');
    }, 3000);
  };

  const handleExport = async (format: string, date?: string) => {
    try {
      // Get the latest attendance data
      const data = await getAttendance(date);
      
      if (!data.records || data.records.length === 0) {
        showNotification('error', 'No attendance records to export');
        return;
      }
      
      if (format === 'csv') {
        // Export to CSV
        const headers = ['Student ID', 'Name', 'Time', 'Confidence'];
        const csvContent = [
          headers.join(','),
          ...data.records.map(record => {
            return [
              record.student_id,
              record.student_name,
              record.time,
              record.confidence
            ].join(',');
          })
        ].join('\n');
        
        // Create a download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_${data.date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('success', 'Attendance exported successfully');
      } else if (format === 'pdf') {
        // In a real app, you would generate a PDF here
        showNotification('error', 'PDF export functionality will be implemented soon');
      }
    } catch (error) {
      console.error('Error exporting attendance:', error);
      showNotification('error', 'Failed to export attendance');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Face Recognition Attendance System</h1>
        <nav className="app-nav">
          <button
            className={`nav-button ${activeTab === 'recognize' ? 'active' : ''}`}
            onClick={() => setActiveTab('recognize')}
          >
            <UserCheck size={18} /> Recognize & Mark
          </button>
          <button
            className={`nav-button ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            <UserPlus size={18} /> Register Student
          </button>
          <button
            className={`nav-button ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <Users size={18} /> Attendance Records
          </button>
        </nav>
      </header>
      
      <main className="app-main">
        {activeTab === 'recognize' && (
          <FaceRecognition
            isActive={activeTab === 'recognize'}
            onFaceDetected={handleFaceDetection}
            onAttendanceMarked={handleAttendanceMarked}
          />
        )}
        
        {activeTab === 'register' && (
          <RegisterStudent
            isActive={activeTab === 'register'}
            onFaceDetected={handleFaceDetection}
            onAttendanceMarked={handleAttendanceMarked}
          />
        )}
        
        {activeTab === 'attendance' && (
          <AttendanceTable
            records={attendanceRecords}
            onExport={handleExport}
            onDateChange={fetchAttendanceRecords}
            isLoading={isLoading}
          />
        )}
      </main>
      
      {notificationStatus && (
        <div 
          className={`fixed bottom-6 right-6 p-4 rounded-md shadow-lg flex items-center ${
            notificationStatus === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {notificationStatus === 'success' ? (
            <Check size={20} className="mr-2" />
          ) : (
            <AlertCircle size={20} className="mr-2" />
          )}
          {notificationMessage}
        </div>
      )}
      
      <footer className="app-footer">
        <p>Real-Time Multi-Face Recognition Attendance System © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;