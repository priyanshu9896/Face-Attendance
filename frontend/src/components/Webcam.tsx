import React, { useRef, useState, useEffect } from 'react';
import { Camera, AlertTriangle } from 'lucide-react';

interface WebcamProps {
  isActive: boolean;
  onCapture: (imageData: string) => void;
  captureInterval?: number; // milliseconds between captures
}

const Webcam: React.FC<WebcamProps> = ({ 
  isActive, 
  onCapture,
  captureInterval = 2000 // Default to 2 seconds
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Function to stop all media tracks
  const stopMediaTracks = (mediaStream: MediaStream | null) => {
    if (!mediaStream) return;
    mediaStream.getTracks().forEach((track: MediaStreamTrack) => {
      track.stop();
    });
  };

  // Start or stop the camera based on isActive prop
  useEffect(() => {
    if (isActive && !cameraActive) {
      startCamera();
    } else if (!isActive && cameraActive) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      setError(null);
      const constraints = { 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user" 
        } 
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraActive(true);

        // Start the capture loop after camera is initialized
        videoRef.current.onloadedmetadata = () => {
          startCaptureLoop();
        };
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError(`Could not access camera: ${err.message || 'Unknown error'}`);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    if (stream) {
      stopMediaTracks(stream);
      setStream(null);
    }
    
    setCameraActive(false);
  };

  const startCaptureLoop = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    // Set up the capture loop
    const id = window.setInterval(() => {
      if (isActive && cameraActive) {
        captureImage();
      }
    }, captureInterval);
    
    setIntervalId(id);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Make sure video is playing and has dimensions
    if (video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    onCapture(imageData);
  };

  // Manual capture button handler
  const handleManualCapture = () => {
    if (cameraActive) {
      captureImage();
    } else {
      startCamera();
    }
  };

  return (
    <div className="webcam-container">
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cameraActive ? "active" : ""}
        />
        
        {error && (
          <div className="error-message">
            <AlertTriangle size={24} className="mb-2 text-yellow-500" />
            <p>{error}</p>
            <button 
              onClick={() => startCamera()} 
              className="mt-3 px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
            >
              Try Again
            </button>
          </div>
        )}
        
        {!cameraActive && !error && (
          <div className="camera-inactive">
            <Camera size={48} />
            <p className="mt-2 mb-4">Camera is inactive</p>
            <button 
              onClick={handleManualCapture}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Start Camera
            </button>
          </div>
        )}
        
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      
      {cameraActive && (
        <div className="webcam-controls mt-3 flex justify-center">
          <button
            onClick={handleManualCapture}
            className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center"
          >
            <Camera size={18} className="mr-2" /> Capture Photo
          </button>
        </div>
      )}
    </div>
  );
};

export default Webcam;