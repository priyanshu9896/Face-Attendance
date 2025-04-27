import React, { useState, useEffect } from 'react';
import Webcam from './Webcam';

interface StudentRecord {
  id: string;
  name: string;
  rollNo: string;
  timestamp: string;
  image?: string;
}

interface RegisterStudentProps {
  isActive: boolean;
  onFaceDetected: (faceData: { image: string, name: string, rollNo: string }) => void;
  onAttendanceMarked: (record: StudentRecord) => void;
}

const RegisterStudent: React.FC<RegisterStudentProps> = ({ 
  isActive, 
  onFaceDetected
}) => {
  const [name, setName] = useState<string>('');
  const [rollNo, setRollNo] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [registered, setRegistered] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [registeredStudents, setRegisteredStudents] = useState<StudentRecord[]>([]);

  useEffect(() => {
    // Load registered students from localStorage on component mount
    const savedStudents = localStorage.getItem('registeredStudents');
    if (savedStudents) {
      setRegisteredStudents(JSON.parse(savedStudents));
    }
  }, []);

  useEffect(() => {
    // Save registered students to localStorage whenever they change
    if (registeredStudents.length > 0) {
      localStorage.setItem('registeredStudents', JSON.stringify(registeredStudents));
    }
  }, [registeredStudents]);

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
  };

  const handleRegister = () => {
    if (!name || !rollNo || !capturedImage) {
      alert('Please fill all fields and capture an image');
      return;
    }

    setLoading(true);

    // Simulate API call to register face
    setTimeout(() => {
      const timestamp = new Date().toISOString();
      const newStudent: StudentRecord = {
        id: `${rollNo}-${timestamp}`,
        name,
        rollNo,
        timestamp,
        image: capturedImage
      };

      // Check if student already registered
      const alreadyRegistered = registeredStudents.some(
        student => student.rollNo === rollNo
      );

      if (alreadyRegistered) {
        alert(`Student with Roll No ${rollNo} is already registered`);
      } else {
        setRegisteredStudents(prev => [...prev, newStudent]);
        onFaceDetected({ image: capturedImage, name, rollNo });
        setRegistered(true);
        // Reset form
        setName('');
        setRollNo('');
        setCapturedImage(null);
      }

      setLoading(false);
    }, 1500);
  };

  return (
    <div className="register-student">
      <div className="form-section">
        <h2>Register New Student</h2>
        <div className="input-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
          />
        </div>
        <div className="input-group">
          <label htmlFor="rollNo">Roll Number</label>
          <input
            type="text"
            id="rollNo"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            placeholder="Enter roll number"
          />
        </div>
        <div className="webcam-section">
          <h3>Capture Face</h3>
          <Webcam isActive={isActive} onCapture={handleCapture} />
        </div>
        {capturedImage && (
          <div className="captured-image">
            <h3>Captured Image</h3>
            <img src={capturedImage} alt="Captured face" />
          </div>
        )}
        <button
          className="register-button"
          onClick={handleRegister}
          disabled={loading || !name || !rollNo || !capturedImage}
        >
          {loading ? 'Registering...' : 'Register Student'}
        </button>
        {registered && (
          <div className="success-message">
            <p>Student registered successfully!</p>
          </div>
        )}
      </div>
      <div className="registered-list">
        <h3>Registered Students</h3>
        <ul>
          {registeredStudents.map(student => (
            <li key={student.id}>
              {student.name} ({student.rollNo})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RegisterStudent;