import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Camera } from 'lucide-react';
import Webcam from './Webcam';
import { registerStudent, getStudents } from '../services/api';
import type { Student } from '../services/api';

interface RegisterStudentProps {
  isActive: boolean;
  onFaceDetected: (faceData: { image: string, name: string, rollNo: string }) => void;
  onAttendanceMarked: (record: any) => void;
}

const RegisterStudent: React.FC<RegisterStudentProps> = ({ 
  isActive
}) => {
  const [name, setName] = useState<string>('');
  const [rollNo, setRollNo] = useState<string>('');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'form' | 'capture'>('form');
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [registeredStudents, setRegisteredStudents] = useState<Student[]>([]);
  const [imagesNeeded] = useState<number>(3);

  // Load registered students from the API
  useEffect(() => {
    if (isActive) {
      fetchStudents();
    }
  }, [isActive]);

  const fetchStudents = async () => {
    try {
      const students = await getStudents();
      setRegisteredStudents(students);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleCapture = (imageData: string) => {
    if (capturedImages.length < imagesNeeded) {
      setCapturedImages(prev => [...prev, imageData]);
      
      // If we have enough images, return to the form
      if (capturedImages.length + 1 >= imagesNeeded) {
        setCurrentView('form');
      }
    }
  };

  const startCapture = () => {
    setCapturedImages([]);
    setCurrentView('capture');
  };

  const handleRegister = async () => {
    if (!name || !rollNo || capturedImages.length < imagesNeeded) {
      setStatusMessage(`Please fill all fields and capture ${imagesNeeded} face images`);
      setRegistrationStatus('error');
      return;
    }

    try {
      setRegistrationStatus('loading');
      setStatusMessage('Registering student...');

      // Call the API to register the student
      const student = await registerStudent(
        name,
        capturedImages,
        rollNo
      );

      if (student) {
        setRegistrationStatus('success');
        setStatusMessage('Student registered successfully!');
        
        // Reset form
        setName('');
        setRollNo('');
        setCapturedImages([]);
        
        // Refresh the student list
        fetchStudents();
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setRegistrationStatus('error');
      setStatusMessage(error.message || 'Failed to register student. Please try again.');
    }
  };

  const renderStatusMessage = () => {
    if (registrationStatus === 'idle') return null;

    const statusStyles = {
      success: "bg-green-100 text-green-800 border-green-200",
      error: "bg-red-100 text-red-800 border-red-200",
      loading: "bg-blue-100 text-blue-800 border-blue-200"
    };

    const StatusIcon = registrationStatus === 'success' ? CheckCircle : 
                        registrationStatus === 'error' ? AlertCircle : null;

    return (
      <div className={`p-4 rounded-md border mt-4 ${statusStyles[registrationStatus]}`}>
        <div className="flex items-center">
          {StatusIcon && <StatusIcon size={18} className="mr-2" />}
          <span>{statusMessage}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="register-student">
      <div className="form-section">
        <h2>Register New Student</h2>
        
        {currentView === 'form' ? (
          <>
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
            
            <div className="mt-6">
              <h3>Face Images ({capturedImages.length}/{imagesNeeded})</h3>
              <p className="text-sm text-gray-600 mb-3">
                We need multiple images of your face from different angles for better recognition.
              </p>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                {Array.from({ length: imagesNeeded }).map((_, index) => (
                  <div 
                    key={index} 
                    className="aspect-square border rounded-md flex items-center justify-center bg-gray-50"
                  >
                    {capturedImages[index] ? (
                      <img 
                        src={capturedImages[index]} 
                        alt={`Face capture ${index + 1}`} 
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center">
                        <Camera size={24} />
                        <span className="text-xs mt-1">Image {index + 1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
                onClick={startCapture}
              >
                <Camera size={18} className="mr-2" /> 
                {capturedImages.length > 0 ? 'Capture More Images' : 'Start Face Capture'}
              </button>
            </div>
            
            <button
              className="register-button"
              onClick={handleRegister}
              disabled={registrationStatus === 'loading' || !name || !rollNo || capturedImages.length < imagesNeeded}
            >
              {registrationStatus === 'loading' ? 'Registering...' : 'Register Student'}
            </button>
            
            {renderStatusMessage()}
          </>
        ) : (
          <div className="capture-view">
            <h3>Face Capture Mode</h3>
            <p className="text-sm text-gray-600 mb-3">
              Please look at the camera and move your head slightly between captures.
            </p>
            
            <div className="webcam-wrapper mb-4">
              <Webcam isActive={isActive} onCapture={handleCapture} />
            </div>
            
            <div className="text-center my-4">
              <p>Captured {capturedImages.length} of {imagesNeeded} images</p>
            </div>
            
            <button
              type="button"
              className="px-4 py-2 bg-gray-600 text-white rounded-md mx-auto block"
              onClick={() => setCurrentView('form')}
            >
              Return to Form
            </button>
          </div>
        )}
      </div>
      
      <div className="registered-list">
        <h3>Registered Students ({registeredStudents.length})</h3>
        {registeredStudents.length > 0 ? (
          <ul>
            {registeredStudents.map(student => (
              <li key={student.id} className="py-2 border-b border-gray-100 last:border-0">
                <div className="font-medium">{student.name}</div>
                <div className="text-sm text-gray-600">
                  {student.roll_number || 'No Roll Number'} • Registered on {new Date(student.created_at).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-8">No students registered yet</p>
        )}
      </div>
    </div>
  );
};

export default RegisterStudent;