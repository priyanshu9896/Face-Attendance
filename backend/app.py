from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import cv2
import numpy as np
import base64
import os
import json
from datetime import datetime
import time
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Create data directories if they don't exist
os.makedirs('data/students', exist_ok=True)
os.makedirs('data/attendance', exist_ok=True)

# Load student data
def load_students():
    try:
        with open('data/students/students.json', 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"students": []}

# Save student data
def save_students(data):
    with open('data/students/students.json', 'w') as f:
        json.dump(data, f, indent=4)

# Load face encodings
def load_encodings():
    try:
        with open('data/students/encodings.json', 'r') as f:
            encodings_data = json.load(f)
            # Convert string encodings back to numpy arrays
            for student_id, encodings in encodings_data.items():
                encodings_data[student_id] = [np.array(enc) for enc in encodings]
            return encodings_data
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

# Save face encodings
def save_encodings(encodings):
    # Convert numpy arrays to lists for JSON serialization
    serializable_encodings = {}
    for student_id, enc_list in encodings.items():
        serializable_encodings[student_id] = [enc.tolist() for enc in enc_list]
    
    with open('data/students/encodings.json', 'w') as f:
        json.dump(serializable_encodings, f)

# Load attendance data for a specific date
def load_attendance(date):
    filename = f'data/attendance/{date}.json'
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"date": date, "records": []}

# Save attendance data for a specific date
def save_attendance(date, data):
    filename = f'data/attendance/{date}.json'
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)

# Function to detect faces in an image
def detect_faces(image_data):
    # Convert base64 to numpy array
    encoded_data = image_data.split(',')[1]
    nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Convert image from BGR to RGB (face_recognition uses RGB)
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Detect faces
    face_locations = face_recognition.face_locations(rgb_image)
    face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
    
    # Check for liveness (implement a basic check for now)
    liveness_scores = detect_liveness(rgb_image, face_locations)
    
    # Create results
    results = []
    for i, (face_loc, face_enc, liveness) in enumerate(zip(face_locations, face_encodings, liveness_scores)):
        top, right, bottom, left = face_loc
        results.append({
            "id": i,
            "location": {"top": top, "right": right, "bottom": bottom, "left": left},
            "encoding": face_enc.tolist(),
            "is_live": liveness > 0.8  # Threshold for liveness
        })
    
    return results

# Basic liveness detection (can be improved)
def detect_liveness(image, face_locations):
    # This is a simplified liveness detection
    # In a real-world scenario, you would implement more sophisticated checks
    scores = []
    
    # For each face
    for face_loc in face_locations:
        top, right, bottom, left = face_loc
        face_image = image[top:bottom, left:right]
        
        # Simple way to detect liveness: check for variation in pixel values
        # Real liveness detection would use eye blinking, head movement, texture analysis, etc.
        if face_image.size > 0:
            # Calculate the standard deviation of the face pixels
            std_dev = np.std(face_image)
            
            # Convert to a score between 0 and 1
            # Higher variation (not a flat printed photo) = higher score
            score = min(1.0, std_dev / 30.0)
            scores.append(score)
        else:
            scores.append(0.0)
    
    return scores

# Recognize faces by comparing with stored encodings
def recognize_faces(face_encodings, is_live_list):
    known_encodings = load_encodings()
    students_data = load_students()
    student_map = {s["id"]: s for s in students_data["students"]}
    
    results = []
    for i, (face_encoding, is_live) in enumerate(zip(face_encodings, is_live_list)):
        # Skip recognition if the face is not considered "live"
        if not is_live:
            results.append({
                "id": i,
                "recognized": False,
                "student_id": None,
                "student_name": None,
                "confidence": 0,
                "is_live": False,
                "message": "Potential spoofing attempt detected!"
            })
            continue
        
        best_match = None
        best_confidence = 0
        
        for student_id, encodings in known_encodings.items():
            for encoding in encodings:
                # Calculate face distance (lower is better)
                face_distance = face_recognition.face_distance([encoding], face_encoding)[0]
                
                # Convert to confidence (higher is better)
                confidence = 1.0 - min(face_distance, 1.0)
                
                if confidence > 0.6 and confidence > best_confidence:  # Threshold for recognition
                    best_match = student_id
                    best_confidence = confidence
        
        if best_match:
            student = student_map.get(best_match, {"name": "Unknown"})
            results.append({
                "id": i,
                "recognized": True,
                "student_id": best_match,
                "student_name": student.get("name", "Unknown"),
                "confidence": best_confidence,
                "is_live": True
            })
        else:
            results.append({
                "id": i,
                "recognized": False,
                "student_id": None,
                "student_name": None,
                "confidence": 0,
                "is_live": True,
                "message": "Face not recognized"
            })
    
    return results

# Mark attendance for recognized students
def mark_attendance(recognized_students):
    today = datetime.now().strftime('%Y-%m-%d')
    attendance = load_attendance(today)
    current_time = datetime.now().strftime('%H:%M:%S')
    
    marked_students = []
    
    for student in recognized_students:
        if student["recognized"] and student["is_live"]:
            student_id = student["student_id"]
            
            # Check if this student is already marked for today
            already_marked = any(record["student_id"] == student_id for record in attendance["records"])
            
            if not already_marked:
                # Add new attendance record
                record = {
                    "id": str(uuid.uuid4()),
                    "student_id": student_id,
                    "student_name": student["student_name"],
                    "time": current_time,
                    "confidence": student["confidence"]
                }
                attendance["records"].append(record)
                marked_students.append(record)
    
    # Save updated attendance data
    if marked_students:
        save_attendance(today, attendance)
    
    return marked_students

# API Routes

@app.route('/api/register', methods=['POST'])
def register_student():
    data = request.json
    
    # Validate input
    if not data or 'name' not in data or 'images' not in data:
        return jsonify({"error": "Missing required data"}), 400
    
    # Load existing students
    students_data = load_students()
    encodings_data = load_encodings()
    
    # Generate new student ID
    student_id = str(uuid.uuid4())
    
    # Process each face image
    face_encodings = []
    for image_data in data['images']:
        faces = detect_faces(image_data)
        if len(faces) != 1:
            return jsonify({"error": f"Expected one face in the image, found {len(faces)}"}), 400
        
        face = faces[0]
        if not face.get("is_live", False):
            return jsonify({"error": "Live face required for registration"}), 400
        
        face_encodings.append(np.array(face["encoding"]))
    
    # Create new student record
    new_student = {
        "id": student_id,
        "name": data['name'],
        "created_at": datetime.now().isoformat()
    }
    
    # Add additional fields if provided
    if 'roll_number' in data:
        new_student['roll_number'] = data['roll_number']
    
    # Add to students data
    students_data["students"].append(new_student)
    
    # Add to encodings data
    encodings_data[student_id] = face_encodings
    
    # Save updated data
    save_students(students_data)
    save_encodings(encodings_data)
    
    return jsonify({"success": True, "student": new_student})

@app.route('/api/recognize', methods=['POST'])
def recognize():
    data = request.json
    
    # Validate input
    if not data or 'image' not in data:
        return jsonify({"error": "Missing image data"}), 400
    
    # Process image to detect faces
    faces = detect_faces(data['image'])
    
    # If no faces detected
    if not faces:
        return jsonify({"recognized": [], "message": "No faces detected"})
    
    # Extract face encodings and liveness flags
    face_encodings = [np.array(face["encoding"]) for face in faces]
    is_live_list = [face["is_live"] for face in faces]
    
    # Recognize faces
    recognized = recognize_faces(face_encodings, is_live_list)
    
    # Mark attendance for recognized faces
    marked = mark_attendance(recognized)
    
    # Return face locations and recognition results
    results = {
        "faces": [{"location": face["location"], "is_live": face["is_live"]} for face in faces],
        "recognized": recognized,
        "marked_attendance": marked
    }
    
    return jsonify(results)

@app.route('/api/students', methods=['GET'])
def get_students():
    students_data = load_students()
    return jsonify(students_data)

@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    date = request.args.get('date')
    if not date:
        date = datetime.now().strftime('%Y-%m-%d')
    
    attendance = load_attendance(date)
    return jsonify(attendance)

@app.route('/api/attendance/dates', methods=['GET'])
def get_attendance_dates():
    files = os.listdir('data/attendance')
    dates = [file.split('.')[0] for file in files if file.endswith('.json')]
    return jsonify({"dates": sorted(dates, reverse=True)})

# Start the Flask app
if __name__ == '__main__':
    app.run(debug=True, port=5000)