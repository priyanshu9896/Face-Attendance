import React, { useRef, useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

interface WebcamProps {
  isActive: boolean;
  onCapture: (imageData: string) => void;
}

const Webcam: React.FC<WebcamProps> = ({ isActive, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  // Function to stop all media tracks
  const stopMediaTracks = (mediaStream: MediaStream | null) => {
    if (!mediaStream) return;
    mediaStream.getTracks().forEach((track: MediaStreamTrack) => {
      track.stop();
    });
  };

  useEffect(() => {
    if (isActive) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((mediaStream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            setStream(mediaStream);
            setError(null);
          }
        })
        .catch((err) => {
          setError("Could not access camera: " + err.message);
        });
    } else {
      if (stream) {
        stopMediaTracks(stream);
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stopMediaTracks(stream);
      }
    };
  }, [isActive]);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg');
    onCapture(imageData);
  };

  useEffect(() => {
    if (isActive && !intervalId && stream) {
      const id = setInterval(captureImage, 1500);
      setIntervalId(id);
    } else if (!isActive && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isActive, stream, intervalId]);

  return (
    <div className="webcam-container">
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={isActive ? "active" : ""}
        />
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        {!isActive && !error && (
          <div className="camera-inactive">
            <Camera size={48} />
            <p>Camera is inactive</p>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default Webcam;