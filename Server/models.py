"""
Database models for GentleCare application
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    """User model for authentication"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    user_type = db.Column(db.String(20), nullable=False)  # 'elder' or 'caretaker'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    elder_profile = db.relationship('ElderProfile', backref='user', uselist=False, cascade='all, delete-orphan', foreign_keys='ElderProfile.user_id')
    caretaker_profile = db.relationship('CaretakerProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    # Elder profiles where this user is the caretaker
    elder_clients = db.relationship('ElderProfile', backref='caretaker', foreign_keys='ElderProfile.caretaker_id')

class ElderProfile(db.Model):
    """Elder-specific profile information"""
    __tablename__ = 'elder_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date_of_birth = db.Column(db.Date)
    address = db.Column(db.String(255))
    emergency_contact = db.Column(db.String(20))
    medical_conditions = db.Column(db.Text)
    caretaker_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    medications = db.relationship('Medication', backref='elder', cascade='all, delete-orphan')
    health_records = db.relationship('HealthRecord', backref='elder', cascade='all, delete-orphan')
    meals = db.relationship('Meal', backref='elder', cascade='all, delete-orphan')
    appointments = db.relationship('Appointment', backref='elder', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='elder', cascade='all, delete-orphan')

class CaretakerProfile(db.Model):
    """Caretaker-specific profile information"""
    __tablename__ = 'caretaker_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    specialization = db.Column(db.String(100))
    experience_years = db.Column(db.Integer)
    certification = db.Column(db.String(100))

class Medication(db.Model):
    """Medication tracking"""
    __tablename__ = 'medications'
    
    id = db.Column(db.Integer, primary_key=True)
    elder_id = db.Column(db.Integer, db.ForeignKey('elder_profiles.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    dosage = db.Column(db.String(50))
    frequency = db.Column(db.String(50))  # e.g., "Daily", "Twice a day"
    time = db.Column(db.String(50))  # e.g., "Morning", "8:00 AM"
    instructions = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Medication logs
    logs = db.relationship('MedicationLog', backref='medication', cascade='all, delete-orphan')

class MedicationLog(db.Model):
    """Log when medications are taken"""
    __tablename__ = 'medication_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    medication_id = db.Column(db.Integer, db.ForeignKey('medications.id'), nullable=False)
    taken_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20))  # 'taken', 'missed', 'skipped'
    notes = db.Column(db.Text)

class HealthRecord(db.Model):
    """Health vitals and records"""
    __tablename__ = 'health_records'
    
    id = db.Column(db.Integer, primary_key=True)
    elder_id = db.Column(db.Integer, db.ForeignKey('elder_profiles.id'), nullable=False)
    record_type = db.Column(db.String(50))  # 'blood_pressure', 'heart_rate', 'temperature', 'weight', etc.
    value = db.Column(db.String(50))
    unit = db.Column(db.String(20))
    notes = db.Column(db.Text)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)

class Meal(db.Model):
    """Meal tracking"""
    __tablename__ = 'meals'
    
    id = db.Column(db.Integer, primary_key=True)
    elder_id = db.Column(db.Integer, db.ForeignKey('elder_profiles.id'), nullable=False)
    meal_type = db.Column(db.String(20))  # 'breakfast', 'lunch', 'dinner', 'snack'
    meal_name = db.Column(db.String(100))
    calories = db.Column(db.Integer)
    protein = db.Column(db.Float)
    carbs = db.Column(db.Float)
    fats = db.Column(db.Float)
    consumed = db.Column(db.Boolean, default=False)
    consumed_at = db.Column(db.DateTime)
    scheduled_time = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Appointment(db.Model):
    """Medical appointments"""
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    elder_id = db.Column(db.Integer, db.ForeignKey('elder_profiles.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    doctor_name = db.Column(db.String(100))
    location = db.Column(db.String(255))
    appointment_date = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=30)
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='scheduled')  # 'scheduled', 'completed', 'cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class EmergencyContact(db.Model):
    """Emergency contacts for elders"""
    __tablename__ = 'emergency_contacts'
    
    id = db.Column(db.Integer, primary_key=True)
    elder_id = db.Column(db.Integer, db.ForeignKey('elder_profiles.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    relationship = db.Column(db.String(50))
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120))
    is_primary = db.Column(db.Boolean, default=False)

class Notification(db.Model):
    """Notifications for both elders and caretakers"""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    elder_id = db.Column(db.Integer, db.ForeignKey('elder_profiles.id'))
    recipient_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50))  # 'medication', 'appointment', 'health', 'emergency'
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class LocationLog(db.Model):
    """Track elder location for safety"""
    __tablename__ = 'location_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    elder_id = db.Column(db.Integer, db.ForeignKey('elder_profiles.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    accuracy = db.Column(db.Float)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)
