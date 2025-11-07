# GentleCare Backend API Documentation

## Overview
Complete backend API with real-time synchronization between Elder and Caretaker profiles.

## Features
- ✅ User Authentication (JWT)
- ✅ Real-time WebSocket sync
- ✅ Medication tracking with notifications
- ✅ Health records monitoring
- ✅ Meal tracking
- ✅ Appointment management
- ✅ Emergency contacts
- ✅ Location tracking
- ✅ Push notifications
- ✅ AI Chatbot (Voice + Text)

## Setup

### 1. Install Dependencies
```bash
cd Server
pip install -r requirements.txt
```

### 2. Run Server
```bash
python app_new.py
```

Server runs on: `http://0.0.0.0:5001`

## API Endpoints

### Authentication

#### POST /auth/signup
Register new user (elder or caretaker)
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "user_type": "elder"  // or "caretaker"
}
```

#### POST /auth/login
User login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /auth/link-caretaker
Link elder to caretaker (requires JWT)
```json
{
  "caretaker_email": "caretaker@example.com"
}
```

### Medications

#### GET /medications
Get all medications (requires JWT)

#### POST /medications
Add medication (requires JWT)
```json
{
  "name": "Aspirin",
  "dosage": "100mg",
  "frequency": "Daily",
  "time": "Morning",
  "instructions": "Take with food",
  "start_date": "2025-11-05",
  "end_date": "2025-12-05"
}
```

#### POST /medications/{id}/log
Log medication taken (requires JWT)
```json
{
  "status": "taken",  // or "missed", "skipped"
  "notes": "Took at 8:30 AM"
}
```

### Health Records

#### GET /health-records
Get health records (requires JWT)
Query params: `elder_id`, `type`, `days` (default 30)

#### POST /health-records
Add health record (requires JWT)
```json
{
  "type": "blood_pressure",
  "value": "120/80",
  "unit": "mmHg",
  "notes": "Morning reading"
}
```

### Meals

#### GET /meals
Get meals (requires JWT)
Query params: `date`, `elder_id`

#### POST /meals/{id}/consume
Mark meal as consumed (requires JWT)

### Appointments

#### GET /appointments
Get appointments (requires JWT)

#### POST /appointments
Add appointment (requires JWT)
```json
{
  "title": "Cardiology Checkup",
  "doctor_name": "Dr. Smith",
  "location": "City Hospital",
  "appointment_date": "2025-11-10T10:00:00",
  "duration_minutes": 30,
  "notes": "Bring previous reports"
}
```

### Notifications

#### GET /notifications
Get notifications (requires JWT)

#### POST /notifications/{id}/read
Mark notification as read (requires JWT)

### Location Tracking

#### POST /location
Update elder location (requires JWT)
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "accuracy": 10.5
}
```

#### GET /location/{elder_id}
Get elder's latest location (requires JWT)

### Emergency Contacts

#### GET /emergency-contacts
Get emergency contacts (requires JWT)

#### POST /emergency-contacts
Add emergency contact (requires JWT)
```json
{
  "name": "Jane Doe",
  "relationship": "Daughter",
  "phone": "+1234567890",
  "email": "jane@example.com",
  "is_primary": true
}
```

### AI Chatbot (Existing)

#### POST /transcribe
Speech to text (multipart/form-data with audio file)

#### POST /chat
Chat with AI
```json
{
  "message": "How are you today?"
}
```

#### POST /speak
Text to speech
```json
{
  "text": "Hello, how can I help you?"
}
```

## WebSocket Events

### Client → Server

#### join
Join user-specific room for real-time updates
```json
{
  "user_id": 123
}
```

#### leave
Leave user-specific room
```json
{
  "user_id": 123
}
```

### Server → Client

#### medication_logged
Sent to caretaker when elder logs medication
```json
{
  "medication_id": 1,
  "elder_id": 5,
  "elder_name": "John Doe",
  "medication_name": "Aspirin",
  "status": "taken",
  "time": "2025-11-05T08:30:00"
}
```

#### meal_consumed
Sent to caretaker when elder eats a meal
```json
{
  "meal_id": 10,
  "elder_id": 5,
  "elder_name": "John Doe",
  "meal_type": "breakfast",
  "meal_name": "Oatmeal"
}
```

#### health_record_added
Sent to caretaker when elder adds health record

#### location_updated
Sent to caretaker when elder's location updates

#### appointment_added
Sent to caretaker when appointment is scheduled

## Real-time Synchronization

All actions by elders are automatically synced to their caretaker in real-time:
- ✅ Medication taken → Caretaker notified
- ✅ Meal consumed → Caretaker notified
- ✅ Health vitals recorded → Caretaker notified
- ✅ Location updated → Caretaker sees real-time position
- ✅ Appointments scheduled → Both parties notified

## Authorization

All endpoints (except auth) require JWT token in header:
```
Authorization: Bearer <access_token>
```

## Database

SQLite database created automatically on first run: `gentlecare.db`

Tables:
- users
- elder_profiles
- caretaker_profiles
- medications
- medication_logs
- health_records
- meals
- appointments
- emergency_contacts
- notifications
- location_logs
