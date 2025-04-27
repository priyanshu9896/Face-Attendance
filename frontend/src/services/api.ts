// API service for communicating with the backend

const API_URL = 'http://localhost:5000/api';

export type Student = {
  id: string;
  name: string;
  roll_number?: string;
  created_at: string;
};

export type Face = {
  location: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  is_live: boolean;
};

export type RecognizedFace = {
  id: number;
  recognized: boolean;
  student_id: string | null;
  student_name: string | null;
  confidence: number;
  is_live: boolean;
  message?: string;
};

export type AttendanceRecord = {
  id: string;
  student_id: string;
  student_name: string;
  time: string;
  confidence: number;
};

export type AttendanceData = {
  date: string;
  records: AttendanceRecord[];
};

// Function to register a new student
export async function registerStudent(name: string, images: string[], rollNumber?: string): Promise<Student> {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        roll_number: rollNumber,
        images
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register student');
    }
    
    const data = await response.json();
    return data.student;
  } catch (error) {
    console.error('Error registering student:', error);
    throw error;
  }
}

// Function to recognize faces in an image
export async function recognizeFaces(imageData: string) {
  try {
    const response = await fetch(`${API_URL}/recognize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: imageData
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to recognize faces');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error recognizing faces:', error);
    throw error;
  }
}

// Function to get all students
export async function getStudents(): Promise<Student[]> {
  try {
    const response = await fetch(`${API_URL}/students`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }
    
    const data = await response.json();
    return data.students;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
}

// Function to get attendance for a specific date
export async function getAttendance(date?: string): Promise<AttendanceData> {
  try {
    const url = date 
      ? `${API_URL}/attendance?date=${date}`
      : `${API_URL}/attendance`;
      
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch attendance data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
}

// Function to get available attendance dates
export async function getAttendanceDates(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/attendance/dates`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch attendance dates');
    }
    
    const data = await response.json();
    return data.dates;
  } catch (error) {
    console.error('Error fetching attendance dates:', error);
    throw error;
  }
}