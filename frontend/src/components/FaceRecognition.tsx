import React, { useState, useEffect } from 'react';
import { Camera, UserCheck } from 'lucide-react';
import Webcam from './Webcam';

interface StudentRecord {
  id: string;
  name: string;
  rollNo: string;
  timestamp: string;
  image?: string;
}

interface DetectedFace {
  name: string;
  rollNo: string;
  confidence: number;
}

interface FaceRecognitionProps {
  isActive: boolean;
  onFaceDetected: (faceData: { image: string }) => void;
  onAttendanceMarked: (record: StudentRecord) => void;
}

const FaceRecognition: React.FC<FaceRecognitionProps> = ({
  isActive,
  onFaceDetected,
  onAttendanceMarked
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recognized, setRecognized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [markedStudents, setMarkedStudents] = useState<StudentRecord[]>([]);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
    onFaceDetected({ image: imageData });
    
    // Simulate face detection process
    setTimeout(() => {
      detectFaces(imageData);
    }, 1000);
  };

  const detectFaces = (imageData: string) => {
    setLoading(true);
    
    // Simulate API call to face recognition service
    setTimeout(() => {
      // Mock detected faces (in a real app, this would come from your backend)
      const mockDetectedFaces: DetectedFace[] = [
        { name: "John Doe", rollNo: "CS001", confidence: 0.92 },
        { name: "Alice Smith", rollNo: "CS002", confidence: 0.88 }
      ];
      
      setDetectedFaces(mockDetectedFaces);
      setLoading(false);
      
      // Mark attendance for detected faces
      mockDetectedFaces.forEach(face => {
        const timestamp = new Date().toISOString();
        const record: StudentRecord = {
          id: `${face.rollNo}-${timestamp}`,
          name: face.name,
          rollNo: face.rollNo,
          timestamp,
          image: imageData
        };
        
        // Check if student already marked
        const alreadyMarked = markedStudents.some(
          student => student.rollNo === face.rollNo
        );
        
        if (!alreadyMarked) {
          setMarkedStudents(prevMarked => [...prevMarked, record]);
          onAttendanceMarked(record);
        }
      });
      
      setRecognized(true);
    }, 2000);
  };

  return (
    <div className="face-recognition">
      <div className="webcam-section">
        <h2>Face Recognition</h2>
        <Webcam isActive={isActive} onCapture={handleCapture} />
        
        {loading && (
          <div className="processing">
            <p>Processing faces...</p>
          </div>
        )}
        
        {recognized && (
          <div className="recognition-results">
            <h3>Recognized Students</h3>
            <ul>
              {detectedFaces.map(face => (
                <li key={face.rollNo}>
                  {face.name} ({face.rollNo}) - Confidence: {(face.confidence * 100).toFixed(2)}%
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {capturedImage && (
        <div className="captured-image">
          <h3>Last Captured Frame</h3>
          <img src={capturedImage} alt="Captured frame" />
        </div>
      )}
    </div>
  );
};

export default FaceRecognition;