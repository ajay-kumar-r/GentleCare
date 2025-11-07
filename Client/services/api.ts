/**
 * GentleCare API Service
 * Handles all backend communication with authentication and real-time sync
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

// Base API URL - update this to your Mac's IP
const API_BASE_URL = 'http://192.168.1.65:5001';
const SOCKET_URL = 'http://192.168.1.65:5001';

// Socket instance
let socket: any = null;

// ===========================
// Storage Helpers
// ===========================

export const storage = {
  async setToken(token: string) {
    await AsyncStorage.setItem('auth_token', token);
  },
  
  async getToken() {
    return await AsyncStorage.getItem('auth_token');
  },
  
  async setUser(user: any) {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  },
  
  async getUser() {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  async clear() {
    await AsyncStorage.multiRemove(['auth_token', 'user']);
  }
};

// ===========================
// API Request Helper
// ===========================

async function apiRequest(endpoint: string, options: any = {}) {
  const token = await storage.getToken();
  
  console.log('API Request:', endpoint);
  console.log('Token:', token ? `${token.substring(0, 20)}...` : 'No token');
  
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      let errorMsg = `Request failed with status ${response.status}`;
      try {
        const error = await response.json();
        errorMsg = error.error || errorMsg;
      } catch (e) {
        // If JSON parsing fails, use status text
        errorMsg = response.statusText || errorMsg;
      }
      throw new Error(errorMsg);
    }
    
    return response.json();
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error('Network request failed. Please check your connection.');
  }
}

// ===========================
// WebSocket Connection
// ===========================

export const socketService = {
  connect(userId: number) {
    if (socket) return socket;
    
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
    });
    
    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('join', { user_id: userId });
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    return socket;
  },
  
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
  
  on(event: string, callback: Function) {
    if (socket) {
      socket.on(event, callback);
    }
  },
  
  off(event: string) {
    if (socket) {
      socket.off(event);
    }
  }
};

// ===========================
// Authentication API
// ===========================

export const authAPI = {
  async signup(data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    user_type: 'elder' | 'caretaker';
  }) {
    const response = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    await storage.setToken(response.access_token);
    await storage.setUser(response.user);
    socketService.connect(response.user.id);
    
    return response;
  },
  
  async login(email: string, password: string) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    console.log('Login response:', response);
    console.log('Access token:', response.access_token ? 'exists' : 'missing');
    
    await storage.setToken(response.access_token);
    await storage.setUser(response.user);
    
    // Verify token was stored
    const storedToken = await storage.getToken();
    console.log('Stored token:', storedToken ? 'success' : 'failed');
    
    socketService.connect(response.user.id);
    
    return response;
  },
  
  async linkCaretaker(caretakerEmail: string) {
    return await apiRequest('/auth/link-caretaker', {
      method: 'POST',
      body: JSON.stringify({ caretaker_email: caretakerEmail }),
    });
  },
  
  async logout() {
    socketService.disconnect();
    await storage.clear();
  }
};

// ===========================
// Medication API
// ===========================

export const medicationAPI = {
  async getAll() {
    return await apiRequest('/medications');
  },
  
  async add(data: {
    name: string;
    dosage: string;
    frequency: string;
    time: string;
    instructions?: string;
    start_date?: string;
    end_date?: string;
    elder_id?: number;
  }) {
    return await apiRequest('/medications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async logTaken(medicationId: number, status: 'taken' | 'missed' | 'skipped', notes?: string) {
    return await apiRequest(`/medications/${medicationId}/log`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    });
  },

  async update(medicationId: number, data: {
    name?: string;
    dosage?: string;
    frequency?: string;
    time?: string;
    instructions?: string;
  }) {
    return await apiRequest(`/medications/${medicationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(medicationId: number) {
    return await apiRequest(`/medications/${medicationId}`, {
      method: 'DELETE',
    });
  }
};

// ===========================
// Health Records API
// ===========================

export const healthAPI = {
  async getRecords(params?: { elder_id?: number; type?: string; days?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return await apiRequest(`/health-records${query ? `?${query}` : ''}`);
  },
  
  async addRecord(data: {
    type: string;
    value: string;
    unit: string;
    notes?: string;
    elder_id?: number;
  }) {
    return await apiRequest('/health-records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

// ===========================
// Meal API
// ===========================

export const mealAPI = {
  async getMeals(date?: string, elderId?: number) {
    const params: any = {};
    if (date) params.date = date;
    if (elderId) params.elder_id = elderId;
    const query = new URLSearchParams(params).toString();
    return await apiRequest(`/meals${query ? `?${query}` : ''}`);
  },
  
  async consumeMeal(mealId: number) {
    return await apiRequest(`/meals/${mealId}/consume`, {
      method: 'POST',
    });
  },
  
  async addMeal(data: {
    meal_type: string;
    meal_name: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    scheduled_time?: string;
    notes?: string;
    elder_id?: number;
  }) {
    return await apiRequest('/meals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

// ===========================
// Appointment API
// ===========================

export const appointmentAPI = {
  async getAll() {
    return await apiRequest('/appointments');
  },
  
  async add(data: {
    title: string;
    doctor_name?: string;
    location?: string;
    appointment_date: string;
    duration_minutes?: number;
    notes?: string;
    elder_id?: number;
  }) {
    return await apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async updateStatus(appointmentId: number, status: 'scheduled' | 'completed' | 'cancelled') {
    return await apiRequest(`/appointments/${appointmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
};

// ===========================
// Notification API
// ===========================

export const notificationAPI = {
  async getAll() {
    return await apiRequest('/notifications');
  },
  
  async markRead(notificationId: number) {
    return await apiRequest(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }
};

// ===========================
// Location API
// ===========================

export const locationAPI = {
  async update(latitude: number, longitude: number, accuracy?: number) {
    return await apiRequest('/location', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, accuracy }),
    });
  },
  
  async getLocation(elderId: number) {
    return await apiRequest(`/location/${elderId}`);
  }
};

// ===========================
// Emergency Contacts API
// ===========================

export const emergencyContactAPI = {
  async getAll(elderId?: number) {
    const query = elderId ? `?elder_id=${elderId}` : '';
    return await apiRequest(`/emergency-contacts${query}`);
  },
  
  async add(data: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    is_primary?: boolean;
    elder_id?: number;
  }) {
    return await apiRequest('/emergency-contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async delete(contactId: number) {
    return await apiRequest(`/emergency-contacts/${contactId}`, {
      method: 'DELETE',
    });
  }
};

// ===========================
// Chatbot API (existing)
// ===========================

export const chatbotAPI = {
  async transcribe(audioBlob: Blob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.m4a');
    
    const token = await storage.getToken();
    const response = await fetch(`${API_BASE_URL}/transcribe`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Transcription failed');
    }
    
    return response.json();
  },
  
  async chat(message: string) {
    return await apiRequest('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
  
  async speak(text: string) {
    const token = await storage.getToken();
    const response = await fetch(`${API_BASE_URL}/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      throw new Error('Speech synthesis failed');
    }
    
    return response.blob();
  }
};
