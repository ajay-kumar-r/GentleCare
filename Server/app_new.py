"""
GentleCare Backend API - Complete Implementation
Handles authentication, real-time sync, and all app features
"""
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO, emit, join_room, leave_room
from models import db, User, ElderProfile, CaretakerProfile, Medication, MedicationLog, HealthRecord, Meal, Appointment, EmergencyContact, Notification, LocationLog
from datetime import datetime, timedelta
import os
import io
import wave

# Google Cloud imports
from google.cloud import speech, texttospeech
import google.generativeai as genai

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_SECRET_KEY'] = 'jwt-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)
app.config['JWT_IDENTITY_CLAIM'] = 'sub'  # Allow integer user IDs
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///gentlecare.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)
socketio = SocketIO(app, cors_allowed_origins="*")
db.init_app(app)

# Google Cloud credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "gentecare-c5d5a11b6915.json"

# Gemini AI setup
API_KEY = "AIzaSyB2PhOsz-fWJIN2VvzTGwQsaG-XsyueRUw"
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-1.5-pro-latest")
conversation_history = []

# JWT error handlers
@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"Invalid token error: {error}")
    return jsonify({"error": "Invalid token", "message": str(error)}), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"Missing token error: {error}")
    return jsonify({"error": "Authorization token is missing", "message": str(error)}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    print(f"Expired token: {jwt_header}, {jwt_data}")
    return jsonify({"error": "Token has expired"}), 401

# ===========================
# AUTHENTICATION ROUTES
# ===========================

@app.route('/auth/signup', methods=['POST'])
def signup():
    """Register new user (elder or caretaker)"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        phone = data.get('phone')
        user_type = data.get('user_type')  # 'elder' or 'caretaker'
        
        if not all([email, password, full_name, user_type]):
            return jsonify({"error": "Missing required fields"}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already registered"}), 400
        
        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            phone=phone,
            user_type=user_type
        )
        db.session.add(user)
        db.session.flush()
        
        # Create profile based on user type
        if user_type == 'elder':
            profile = ElderProfile(user_id=user.id)
            db.session.add(profile)
        else:
            profile = CaretakerProfile(user_id=user.id)
            db.session.add(profile)
        
        db.session.commit()
        
        access_token = create_access_token(identity=user.id)
        return jsonify({
            "message": "User registered successfully",
            "access_token": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "user_type": user.user_type
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        user = User.query.filter_by(email=email).first()
        if not user or not bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid credentials"}), 401
        
        access_token = create_access_token(identity=str(user.id))
        
        # Get profile data
        profile_data = {}
        if user.user_type == 'elder':
            profile = ElderProfile.query.filter_by(user_id=user.id).first()
            if profile:
                profile_data = {
                    "caretaker_id": profile.caretaker_id,
                    "emergency_contact": profile.emergency_contact
                }
        else:
            profile = CaretakerProfile.query.filter_by(user_id=user.id).first()
            if profile:
                elders = ElderProfile.query.filter_by(caretaker_id=user.id).all()
                profile_data = {
                    "elder_count": len(elders),
                    "elders": [{"id": e.id, "name": e.user.full_name} for e in elders]
                }
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "phone": user.phone,
                "user_type": user.user_type,
                "profile": profile_data
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/auth/link-caretaker', methods=['POST'])
@jwt_required()
def link_caretaker():
    """Link an elder to a caretaker"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        caretaker_email = data.get('caretaker_email')
        
        user = User.query.get(user_id)
        if user.user_type != 'elder':
            return jsonify({"error": "Only elders can link to caretakers"}), 400
        
        caretaker = User.query.filter_by(email=caretaker_email, user_type='caretaker').first()
        if not caretaker:
            return jsonify({"error": "Caretaker not found"}), 404
        
        elder_profile = ElderProfile.query.filter_by(user_id=user_id).first()
        elder_profile.caretaker_id = caretaker.id
        db.session.commit()
        
        # Notify caretaker via socket
        socketio.emit('elder_linked', {
            'elder_id': elder_profile.id,
            'elder_name': user.full_name
        }, room=f'user_{caretaker.id}')
        
        return jsonify({
            "message": "Caretaker linked successfully",
            "caretaker": {
                "id": caretaker.id,
                "name": caretaker.full_name,
                "email": caretaker.email
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ===========================
# MEDICATION ROUTES
# ===========================

@app.route('/medications', methods=['GET'])
@jwt_required()
def get_medications():
    """Get all medications for user"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if user.user_type == 'elder':
            elder_profile = ElderProfile.query.filter_by(user_id=user_id).first()
            if not elder_profile:
                return jsonify({"error": "Elder profile not found"}), 404
            medications = Medication.query.filter_by(elder_id=elder_profile.id, is_active=True).all()
        else:
            # Caretaker: get all medications for their elders
            elder_ids = [e.id for e in ElderProfile.query.filter_by(caretaker_id=user_id).all()]
            print(f"Caretaker {user_id} - Elder IDs: {elder_ids}")
            if elder_ids:
                medications = Medication.query.filter(Medication.elder_id.in_(elder_ids), Medication.is_active == True).all()
                print(f"Found {len(medications)} medications")
            else:
                medications = []
        
        print(f"Returning {len(medications)} medications")
        return jsonify({
            "medications": [{
                "id": m.id,
                "elder_id": m.elder_id,
                "elder_name": m.elder.user.full_name,
                "name": m.name,
                "dosage": m.dosage,
                "frequency": m.frequency,
                "time": m.time,
                "instructions": m.instructions,
                "is_active": m.is_active,
                "status": m.logs[-1].status if m.logs else "pending",
                "start_date": m.start_date.isoformat() if m.start_date else None,
                "end_date": m.end_date.isoformat() if m.end_date else None,
                "last_taken": m.logs[-1].taken_at.isoformat() if m.logs else None
            } for m in medications]
        }), 200
        
    except Exception as e:
        print(f"Error in get_medications: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/medications', methods=['POST'])
@jwt_required()
def add_medication():
    """Add new medication"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        user = User.query.get(user_id)
        
        if user.user_type == 'elder':
            elder_profile = ElderProfile.query.filter_by(user_id=user_id).first()
            elder_id = elder_profile.id
        else:
            elder_id = data.get('elder_id')
        
        medication = Medication(
            elder_id=elder_id,
            name=data.get('name'),
            dosage=data.get('dosage'),
            frequency=data.get('frequency'),
            time=data.get('time'),
            instructions=data.get('instructions'),
            start_date=datetime.fromisoformat(data.get('start_date')) if data.get('start_date') else None,
            end_date=datetime.fromisoformat(data.get('end_date')) if data.get('end_date') else None
        )
        db.session.add(medication)
        db.session.commit()
        
        # Notify both elder and caretaker
        elder_profile = ElderProfile.query.get(elder_id)
        if elder_profile.caretaker_id:
            socketio.emit('medication_added', {
                'medication_id': medication.id,
                'elder_id': elder_id,
                'name': medication.name
            }, room=f'user_{elder_profile.caretaker_id}')
        
        return jsonify({
            "message": "Medication added successfully",
            "medication_id": medication.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/medications/<int:med_id>/log', methods=['POST'])
@jwt_required()
def log_medication(med_id):
    """Log medication taken"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        medication = Medication.query.get_or_404(med_id)
        
        log = MedicationLog(
            medication_id=med_id,
            status=data.get('status', 'taken'),
            notes=data.get('notes')
        )
        db.session.add(log)
        db.session.commit()
        
        # Notify caretaker
        elder_profile = ElderProfile.query.get(medication.elder_id)
        if elder_profile.caretaker_id:
            notification = Notification(
                elder_id=medication.elder_id,
                recipient_user_id=elder_profile.caretaker_id,
                title="Medication Taken",
                message=f"{elder_profile.user.full_name} took {medication.name}",
                notification_type="medication"
            )
            db.session.add(notification)
            db.session.commit()
            
            socketio.emit('medication_logged', {
                'medication_id': med_id,
                'elder_id': medication.elder_id,
                'elder_name': elder_profile.user.full_name,
                'medication_name': medication.name,
                'status': log.status,
                'time': log.taken_at.isoformat()
            }, room=f'user_{elder_profile.caretaker_id}')
        
        return jsonify({
            "message": "Medication logged successfully",
            "log_id": log.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/medications/<int:med_id>', methods=['PUT'])
@jwt_required()
def update_medication(med_id):
    """Update medication details"""
    try:
        user_id = int(get_jwt_identity())
        data = request.json
        
        medication = Medication.query.get_or_404(med_id)
        
        # Update fields if provided
        if 'name' in data:
            medication.name = data['name']
        if 'dosage' in data:
            medication.dosage = data['dosage']
        if 'frequency' in data:
            medication.frequency = data['frequency']
        if 'time' in data:
            medication.time = data['time']
        if 'instructions' in data:
            medication.instructions = data['instructions']
        if 'is_active' in data:
            medication.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            "message": "Medication updated successfully",
            "medication": {
                "id": medication.id,
                "name": medication.name,
                "dosage": medication.dosage,
                "frequency": medication.frequency,
                "time": medication.time,
                "instructions": medication.instructions,
                "is_active": medication.is_active
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/medications/<int:med_id>', methods=['DELETE'])
@jwt_required()
def delete_medication(med_id):
    """Delete (deactivate) medication"""
    try:
        user_id = int(get_jwt_identity())
        
        medication = Medication.query.get_or_404(med_id)
        medication.is_active = False
        
        db.session.commit()
        
        return jsonify({
            "message": "Medication deleted successfully"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ===========================
# HEALTH RECORDS ROUTES
# ===========================

@app.route('/health-records', methods=['GET'])
@jwt_required()
def get_health_records():
    """Get health records"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        elder_id = request.args.get('elder_id')
        record_type = request.args.get('type')
        days = int(request.args.get('days', 30))
        
        if user.user_type == 'elder':
            elder_profile = ElderProfile.query.filter_by(user_id=user_id).first()
            elder_id = elder_profile.id
        
        query = HealthRecord.query.filter_by(elder_id=elder_id)
        if record_type:
            query = query.filter_by(record_type=record_type)
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        records = query.filter(HealthRecord.recorded_at >= cutoff_date).order_by(HealthRecord.recorded_at.desc()).all()
        
        return jsonify({
            "records": [{
                "id": r.id,
                "type": r.record_type,
                "value": r.value,
                "unit": r.unit,
                "notes": r.notes,
                "recorded_at": r.recorded_at.isoformat()
            } for r in records]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health-records', methods=['POST'])
@jwt_required()
def add_health_record():
    """Add health record"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        user = User.query.get(user_id)
        
        if user.user_type == 'elder':
            elder_profile = ElderProfile.query.filter_by(user_id=user_id).first()
            elder_id = elder_profile.id
        else:
            elder_id = data.get('elder_id')
        
        record = HealthRecord(
            elder_id=elder_id,
            record_type=data.get('type'),
            value=data.get('value'),
            unit=data.get('unit'),
            notes=data.get('notes')
        )
        db.session.add(record)
        db.session.commit()
        
        # Notify caretaker
        elder_profile = ElderProfile.query.get(elder_id)
        if elder_profile.caretaker_id:
            socketio.emit('health_record_added', {
                'elder_id': elder_id,
                'elder_name': elder_profile.user.full_name,
                'type': record.record_type,
                'value': record.value,
                'unit': record.unit
            }, room=f'user_{elder_profile.caretaker_id}')
        
        return jsonify({
            "message": "Health record added successfully",
            "record_id": record.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ===========================
# MEAL TRACKING ROUTES
# ===========================

@app.route('/meals', methods=['GET'])
@jwt_required()
def get_meals():
    """Get meals"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        date_str = request.args.get('date')
        
        if user.user_type == 'elder':
            elder_profile = ElderProfile.query.filter_by(user_id=user_id).first()
            elder_id = elder_profile.id
        else:
            elder_id = request.args.get('elder_id')
        
        query = Meal.query.filter_by(elder_id=elder_id)
        if date_str:
            date = datetime.fromisoformat(date_str).date()
            query = query.filter(db.func.date(Meal.created_at) == date)
        
        meals = query.order_by(Meal.scheduled_time.desc()).all()
        
        return jsonify({
            "meals": [{
                "id": m.id,
                "meal_type": m.meal_type,
                "meal_name": m.meal_name,
                "calories": m.calories,
                "protein": m.protein,
                "carbs": m.carbs,
                "fats": m.fats,
                "consumed": m.consumed,
                "consumed_at": m.consumed_at.isoformat() if m.consumed_at else None,
                "scheduled_time": m.scheduled_time.isoformat() if m.scheduled_time else None,
                "notes": m.notes
            } for m in meals]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/meals/<int:meal_id>/consume', methods=['POST'])
@jwt_required()
def consume_meal(meal_id):
    """Mark meal as consumed"""
    try:
        meal = Meal.query.get_or_404(meal_id)
        meal.consumed = True
        meal.consumed_at = datetime.utcnow()
        db.session.commit()
        
        # Notify caretaker
        elder_profile = ElderProfile.query.get(meal.elder_id)
        if elder_profile.caretaker_id:
            socketio.emit('meal_consumed', {
                'meal_id': meal_id,
                'elder_id': meal.elder_id,
                'elder_name': elder_profile.user.full_name,
                'meal_type': meal.meal_type,
                'meal_name': meal.meal_name
            }, room=f'user_{elder_profile.caretaker_id}')
        
        return jsonify({"message": "Meal marked as consumed"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ===========================
# APPOINTMENT ROUTES
# ===========================

@app.route('/appointments', methods=['GET'])
@jwt_required()
def get_appointments():
    """Get appointments"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.user_type == 'elder':
            elder_profile = ElderProfile.query.filter_by(user_id=user_id).first()
            appointments = Appointment.query.filter_by(elder_id=elder_profile.id).order_by(Appointment.appointment_date).all()
        else:
            elder_ids = [e.id for e in ElderProfile.query.filter_by(caretaker_id=user_id).all()]
            appointments = Appointment.query.filter(Appointment.elder_id.in_(elder_ids)).order_by(Appointment.appointment_date).all()
        
        return jsonify({
            "appointments": [{
                "id": a.id,
                "elder_id": a.elder_id,
                "elder_name": a.elder.user.full_name,
                "title": a.title,
                "doctor_name": a.doctor_name,
                "location": a.location,
                "appointment_date": a.appointment_date.isoformat(),
                "duration_minutes": a.duration_minutes,
                "status": a.status,
                "notes": a.notes
            } for a in appointments]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/appointments', methods=['POST'])
@jwt_required()
def add_appointment():
    """Add appointment"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        user = User.query.get(user_id)
        
        if user.user_type == 'elder':
            elder_profile = ElderProfile.query.filter_by(user_id=user_id).first()
            elder_id = elder_profile.id
        else:
            elder_id = data.get('elder_id')
        
        appointment = Appointment(
            elder_id=elder_id,
            title=data.get('title'),
            doctor_name=data.get('doctor_name'),
            location=data.get('location'),
            appointment_date=datetime.fromisoformat(data.get('appointment_date')),
            duration_minutes=data.get('duration_minutes', 30),
            notes=data.get('notes')
        )
        db.session.add(appointment)
        db.session.commit()
        
        # Notify both elder and caretaker
        elder_profile = ElderProfile.query.get(elder_id)
        if elder_profile.caretaker_id:
            socketio.emit('appointment_added', {
                'appointment_id': appointment.id,
                'elder_id': elder_id,
                'title': appointment.title,
                'date': appointment.appointment_date.isoformat()
            }, room=f'user_{elder_profile.caretaker_id}')
        
        return jsonify({
            "message": "Appointment added successfully",
            "appointment_id": appointment.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ===========================
# NOTIFICATION ROUTES
# ===========================

@app.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get user notifications"""
    try:
        user_id = get_jwt_identity()
        notifications = Notification.query.filter_by(recipient_user_id=user_id).order_by(Notification.created_at.desc()).limit(50).all()
        
        return jsonify({
            "notifications": [{
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.notification_type,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat()
            } for n in notifications]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/notifications/<int:notif_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notif_id):
    """Mark notification as read"""
    try:
        notification = Notification.query.get_or_404(notif_id)
        notification.is_read = True
        db.session.commit()
        
        return jsonify({"message": "Notification marked as read"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ===========================
# LOCATION TRACKING ROUTES
# ===========================

@app.route('/location', methods=['POST'])
@jwt_required()
def update_location():
    """Update elder location"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        user = User.query.get(user_id)
        
        if user.user_type != 'elder':
            return jsonify({"error": "Only elders can update location"}), 400
        
        elder_profile = ElderProfile.query.filter_by(user_id=user_id).first()
        
        location = LocationLog(
            elder_id=elder_profile.id,
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            accuracy=data.get('accuracy')
        )
        db.session.add(location)
        db.session.commit()
        
        # Notify caretaker in real-time
        if elder_profile.caretaker_id:
            socketio.emit('location_updated', {
                'elder_id': elder_profile.id,
                'elder_name': user.full_name,
                'latitude': location.latitude,
                'longitude': location.longitude,
                'accuracy': location.accuracy,
                'timestamp': location.recorded_at.isoformat()
            }, room=f'user_{elder_profile.caretaker_id}')
        
        return jsonify({"message": "Location updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/location/<int:elder_id>', methods=['GET'])
@jwt_required()
def get_location(elder_id):
    """Get elder's latest location"""
    try:
        location = LocationLog.query.filter_by(elder_id=elder_id).order_by(LocationLog.recorded_at.desc()).first()
        
        if not location:
            return jsonify({"error": "No location data found"}), 404
        
        return jsonify({
            "latitude": location.latitude,
            "longitude": location.longitude,
            "accuracy": location.accuracy,
            "recorded_at": location.recorded_at.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================
# EMERGENCY CONTACTS ROUTES
# ===========================

@app.route('/emergency-contacts', methods=['GET'])
@jwt_required()
def get_emergency_contacts():
    """Get emergency contacts"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.user_type == 'elder':
            elder_profile = ElderProfile.query.filter_by(user_id=user_id).first()
            elder_id = elder_profile.id
        else:
            elder_id = request.args.get('elder_id')
        
        contacts = EmergencyContact.query.filter_by(elder_id=elder_id).all()
        
        return jsonify({
            "contacts": [{
                "id": c.id,
                "name": c.name,
                "relationship": c.relationship,
                "phone": c.phone,
                "email": c.email,
                "is_primary": c.is_primary
            } for c in contacts]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/emergency-contacts', methods=['POST'])
@jwt_required()
def add_emergency_contact():
    """Add emergency contact"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        user = User.query.get(user_id)
        
        if user.user_type == 'elder':
            elder_profile = ElderProfile.query.filter_by(user_id=user_id).first()
            elder_id = elder_profile.id
        else:
            elder_id = data.get('elder_id')
        
        contact = EmergencyContact(
            elder_id=elder_id,
            name=data.get('name'),
            relationship=data.get('relationship'),
            phone=data.get('phone'),
            email=data.get('email'),
            is_primary=data.get('is_primary', False)
        )
        db.session.add(contact)
        db.session.commit()
        
        return jsonify({
            "message": "Emergency contact added successfully",
            "contact_id": contact.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ===========================
# CHATBOT ROUTES (EXISTING)
# ===========================

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Speech to text"""
    try:
        audio_file = request.files['file']
        audio_bytes = audio_file.read()
        
        client = speech.SpeechClient()
        audio = speech.RecognitionAudio(content=audio_bytes)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="en-US",
        )
        
        response = client.recognize(config=config, audio=audio)
        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript
        
        return jsonify({"transcript": transcript})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Chat with Gemini AI"""
    try:
        data = request.json
        user_message = data.get("message", "")
        
        conversation_history.append(f"User: {user_message}")
        prompt = "\n".join(conversation_history[-10:]) + "\nAssistant:"
        
        response = model.generate_content(prompt)
        bot_response = response.text
        
        conversation_history.append(f"Assistant: {bot_response}")
        
        return jsonify({"response": bot_response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/speak', methods=['POST'])
def speak():
    """Text to speech"""
    try:
        data = request.json
        text = data.get("text", "")
        
        client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.LINEAR16
        )
        
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        return send_file(
            io.BytesIO(response.audio_content),
            mimetype="audio/wav",
            download_name="response.wav"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===========================
# WEBSOCKET EVENTS
# ===========================

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')

@socketio.on('join')
def handle_join(data):
    """Join user-specific room for real-time updates"""
    user_id = data.get('user_id')
    join_room(f'user_{user_id}')
    print(f'User {user_id} joined their room')

@socketio.on('leave')
def handle_leave(data):
    """Leave user-specific room"""
    user_id = data.get('user_id')
    leave_room(f'user_{user_id}')
    print(f'User {user_id} left their room')

# ===========================
# MAIN
# ===========================

if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # Create database tables
        print("Database tables created successfully!")
    
    # Run with SocketIO
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)
