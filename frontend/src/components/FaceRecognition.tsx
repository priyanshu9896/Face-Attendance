import React, { useState, useEffect } from 'react';
import Webcam from './Webcam';
import { recognizeFaces } from '../services/api';
import { Check, AlertCircle } from 'lucide-react';

interface StudentRecord {
  id: string;
  name: string;
  rollNo: string;
  timestamp: string;
  image?: string;
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recognitionResults, setRecognitionResults] = useState<any>(null);
  const [facesDetected, setFacesDetected] = useState<number>(0);

  // Reset state when the component becomes inactive
  useEffect(() => {
    if (!isActive) {
      setRecognitionResults(null);
      setFacesDetected(0);
      setError(null);
    }
  }, [isActive]);

  const handleCapture = async (imageData: string) => {
    setCapturedImage(imageData);
    onFaceDetected({ image: imageData });
    
    if (!isActive) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Call the API to recognize faces
      const results = await recognizeFaces(imageData);
      
      if (results) {
        setRecognitionResults(results);
        setFacesDetected(results.faces ? results.faces.length : 0);
        
        // Mark attendance for recognized students
        if (results.marked_attendance && results.marked_attendance.length > 0) {
          results.marked_attendance.forEach((student: any) => {
            const record: StudentRecord = {
              id: student.id,
              name: student.student_name,
              rollNo: student.student_id,
              timestamp: new Date().toISOString()
            };
            onAttendanceMarked(record);
          });
        }
      }
    } catch (err) {
      console.error("Face recognition error:", err);
      setError("Failed to recognize faces. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="face-recognition">
      <div className="webcam-section">
        <h2>Face Recognition</h2>
        <p className="text-gray-600 mb-4">
          Position your face in front of the camera to be recognized and mark attendance.
        </p>
        
        <Webcam isActive={isActive} onCapture={handleCapture} />
        
        {loading && (
          <div className="processing">
            <p>Processing faces... Please wait.</p>
          </div>
        )}
        
        {error && (
          <div className="error-message bg-red-100 text-red-700 p-3 rounded-md mt-4 flex items-center">
            <AlertCircle size={18} className="mr-2" />
            {error}
          </div>
        )}
        
        {recognitionResults && recognitionResults.recognized && (
          <div className="recognition-results">
            <h3>Recognition Results ({facesDetected} {facesDetected === 1 ? 'face' : 'faces'} detected)</h3>
            
            {recognitionResults.recognized.length > 0 ? (
              <ul>
                {recognitionResults.recognized.map((face: any, index: number) => (
                  <li key={index} className={`p-3 ${face.recognized ? 'bg-green-50' : 'bg-gray-50'} rounded-md mb-2`}>
                    {face.recognized ? (
                      <div>
                        <div className="font-medium">{face.student_name} (ID: {face.student_id})</div>
                        <div className="text-sm text-gray-500">
                          Confidence: {(face.confidence * 100).toFixed(1)}%
                          {face.is_live ? 
                            <span className="text-green-600 ml-2">✓ Live face</span> : 
                            <span className="text-red-600 ml-2">× Potential spoofing detected</span>
                          }
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-orange-600">Unrecognized Face</div>
                        <div className="text-sm">{face.message || "This face is not registered in the system."}</div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No faces recognized in the image.</p>
            )}
            
            {recognitionResults.marked_attendance && recognitionResults.marked_attendance.length > 0 && (
              <div className="mt-4 bg-green-100 p-3 rounded-md">
                <div className="font-medium text-green-800 flex items-center">
                  <Check size={18} className="mr-2" /> Attendance Marked Successfully
                </div>
                <ul className="mt-2">
                  {recognitionResults.marked_attendance.map((record: any) => (
                    <li key={record.id} className="text-sm text-green-700">
                      {record.student_name} at {record.time}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      {capturedImage && (
        <div className="captured-image">
          <h3>Last Captured Frame</h3>
          <img src={capturedImage} alt="Captured frame" className="mt-2 rounded-md border border-gray-200" />
        </div>
      )}
    </div>
  );
};

export default FaceRecognition;