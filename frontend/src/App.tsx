import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserCheck, Download, Check } from 'lucide-react';
import FaceRecognition from './components/FaceRecognition';
import RegisterStudent from './components/RegisterStudent';
import AttendanceTable from './components/AttendanceTable';
import './App.css';

interface AttendanceRecord {
  id: string;
  name: string;
  rollNo: string;
  timestamp: string;
  image?: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('recognize');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceSaved, setAttendanceSaved] = useState<boolean>(false);
  
  // Load records from localStorage on component mount
  useEffect(() => {
    const savedRecords = localStorage.getItem('attendanceRecords');
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
  }, []);

  // Save records to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('attendanceRecords', JSON.stringify(records));
  }, [records]);

  const handleFaceDetection = (faceData: any) => {
    console.log("Face detected:", faceData);
    // In a real implementation, you could call your face recognition API here
  };

  const handleAttendanceMarked = (record: AttendanceRecord) => {
    // Check if this student was already marked today
    const today = new Date().toISOString().split('T')[0];
    const alreadyMarkedToday = records.some(r => 
      r.rollNo === record.rollNo && 
      new Date(r.timestamp).toISOString().split('T')[0] === today
    );
    
    if (!alreadyMarkedToday) {
      setRecords(prev => [...prev, record]);
      setAttendanceSaved(true);
      setTimeout(() => setAttendanceSaved(false), 3000);
    }
  };

  const handleExport = (format: string) => {
    if (records.length === 0) {
      alert('No attendance records to export');
      return;
    }
    
    if (format === 'csv') {
      // Export to CSV
      const headers = ['Roll No', 'Name', 'Date', 'Time'];
      const csvContent = [
        headers.join(','),
        ...records.map(record => {
          const date = new Date(record.timestamp);
          return [
            record.rollNo,
            record.name,
            date.toLocaleDateString(),
            date.toLocaleTimeString()
          ].join(',');
        })
      ].join('\n');
      
      // Create a download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      // In a real app, you would generate a PDF here
      // For now, we'll just show an alert
      alert('PDF export functionality will be implemented soon');
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
            <UserCheck /> Recognize & Mark
          </button>
          <button
            className={`nav-button ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            <UserPlus /> Register Student
          </button>
          <button
            className={`nav-button ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <Users /> Attendance Records
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
            records={records}
            onExport={handleExport}
          />
        )}
      </main>
      
      {attendanceSaved && (
        <div className="attendance-saved-notification">
          <Check size={18} /> Attendance marked successfully!
        </div>
      )}
      
      <footer className="app-footer">
        <p>Real-Time Multi-Face Recognition Attendance System © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;