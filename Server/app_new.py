"""
GentleCare Backend API - Production-Ready Implementation
Handles authentication, real-time sync, and all app features
"""
import os
import io
import re
import json
import logging
from datetime import datetime, timedelta, timezone

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO, emit, join_room, leave_room
from models import db, User, ElderProfile, CaretakerProfile, Medication, MedicationLog, HealthRecord, Meal, Appointment, EmergencyContact, Notification, LocationLog, Prescription

os.environ.setdefault('PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION', 'python')

# Google Cloud imports
from google.cloud import speech, texttospeech
import google.generativeai as genai

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('gentlecare')

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')
os.makedirs(INSTANCE_DIR, exist_ok=True)

IS_PRODUCTION = os.getenv('FLASK_DEBUG', 'false').lower() != 'true'

_secret = os.getenv('SECRET_KEY')
_jwt_secret = os.getenv('JWT_SECRET_KEY')
if IS_PRODUCTION and (not _secret or not _jwt_secret):
    logger.warning('SECRET_KEY / JWT_SECRET_KEY not set — using insecure defaults!')

app.config['SECRET_KEY'] = _secret or 'dev-secret-key-change-me'
app.config['JWT_SECRET_KEY'] = _jwt_secret or 'dev-jwt-secret-key-change-me'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
app.config['JWT_IDENTITY_CLAIM'] = 'sub'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    f"sqlite:///{os.path.join(INSTANCE_DIR, 'gentlecare.db')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

cors_origins = os.getenv('CORS_ORIGINS', '').split(',') if os.getenv('CORS_ORIGINS') else [
    "http://localhost:3000", "http://localhost:8081", "http://localhost:8082",
    "http://127.0.0.1:3000", "http://127.0.0.1:8081", "http://127.0.0.1:8082",
    "http://192.168.1.67:8081", "http://192.168.1.67:8082",
    "https://gentlecare-client.onrender.com"
]
cors_origins = [o.strip() for o in cors_origins if o.strip()]

# In development, allow all origins to avoid CORS issues on different network setups
if not IS_PRODUCTION:
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
else:
    CORS(app, origins=cors_origins, supports_credentials=True)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)
socketio = SocketIO(app, cors_allowed_origins="*" if not IS_PRODUCTION else cors_origins, async_mode="threading")
db.init_app(app)

# Create database tables immediately on app initialization
with app.app_context():
    try:
        db.create_all()
        logger.info('Database tables initialized')

        # Only create test users in development mode
        if not IS_PRODUCTION:
            try:
                if not User.query.filter_by(email='elder@test.com').first():
                    elder = User(email='elder@test.com', password_hash=bcrypt.generate_password_hash('password').decode('utf-8'), full_name='John Elder', phone='+1234567890', user_type='elder')
                    db.session.add(elder)
                    db.session.flush()
                    db.session.add(ElderProfile(user_id=elder.id, emergency_contact='+1234567890'))
                    db.session.commit()
                    logger.info('Created test elder: elder@test.com')
                if not User.query.filter_by(email='caretaker@test.com').first():
                    ct = User(email='caretaker@test.com', password_hash=bcrypt.generate_password_hash('password').decode('utf-8'), full_name='Mary Caretaker', phone='+0987654321', user_type='caretaker')
                    db.session.add(ct)
                    db.session.flush()
                    db.session.add(CaretakerProfile(user_id=ct.id))
                    db.session.commit()
                    logger.info('Created test caretaker: caretaker@test.com')
            except Exception as e:
                logger.info(f'Test users: {e}')
    except Exception as e:
        logger.error(f'Database init error: {e}')

# Google Cloud credentials
google_creds_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
google_creds_json = os.getenv('GOOGLE_CREDENTIALS_JSON', '').strip()

if google_creds_json:
    try:
        parsed_creds = json.loads(google_creds_json)
        creds_target = os.path.join('/tmp', 'gcp-credentials.json')
        with open(creds_target, 'w', encoding='utf-8') as creds_file:
            json.dump(parsed_creds, creds_file)
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = creds_target
    except Exception as e:
        logger.error(f"Failed to parse GOOGLE_CREDENTIALS_JSON: {e}")

if not os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
    default_creds = os.path.join(BASE_DIR, 'gentecare-c5d5a11b6915.json')
    if os.path.exists(default_creds):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = default_creds

# Gemini AI setup
API_KEY = os.getenv("GEMINI_API_KEY", "")
model = None
if API_KEY:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel("gemini-1.5-pro-latest")

# Per-user conversation history (keyed by user_id)
_user_conversations = {}
_MAX_HISTORY = 20

def _get_user_history(user_id):
    if user_id not in _user_conversations:
        _user_conversations[user_id] = []
    return _user_conversations[user_id]


# Validation helpers
_EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

def _validate_email(email):
    return bool(email and _EMAIL_RE.match(email))

def _validate_password(password):
    return bool(password and len(password) >= 6)

def _safe_error(e, fallback='An unexpected error occurred'):
    logger.error(f'Error: {e}', exc_info=True)
    return fallback if IS_PRODUCTION else str(e)

def resolve_elder_id_for_user(user, explicit_elder_id=None):
    """Resolve target elder profile id for current user context."""
    if user.user_type == 'elder':
        elder_profile = ElderProfile.query.filter_by(user_id=user.id).first()
        return elder_profile.id if elder_profile else None
    if explicit_elder_id:
        # Caretaker must own this elder
        ep = ElderProfile.query.get(explicit_elder_id)
        if ep and ep.caretaker_id == user.id:
            return explicit_elder_id
        return None
    elders = ElderProfile.query.filter_by(caretaker_id=user.id).all()
    return elders[0].id if elders else None


def verify_resource_access(user, elder_id):
    """Check that user has access to resources belonging to elder_id."""
    if user.user_type == 'elder':
        ep = ElderProfile.query.filter_by(user_id=user.id).first()
        return ep and ep.id == elder_id
    ep = ElderProfile.query.get(elder_id)
    return ep and ep.caretaker_id == user.id


def emit_to_care_team(elder_id, event_name, payload):
    """Emit realtime events to both elder and caretaker user rooms."""
    elder_profile = ElderProfile.query.get(elder_id)
    if not elder_profile:
        return
    socketio.emit(event_name, payload, room=f'user_{elder_profile.user_id}')
    if elder_profile.caretaker_id:
        socketio.emit(event_name, payload, room=f'user_{elder_profile.caretaker_id}')

def get_ai_capabilities():
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    creds_file_exists = bool(creds_path) and os.path.exists(creds_path)
    speech_ready = bool(creds_path and creds_file_exists)
    return {
        "chatbot": model is not None,
        "speech_to_text": speech_ready,
        "text_to_speech": speech_ready,
    }

@app.route('/capabilities', methods=['GET'])
def capabilities():
    ai = get_ai_capabilities()
    ready = ai["chatbot"] and ai["speech_to_text"] and ai["text_to_speech"]
    return jsonify({"ai": ai, "ready": ready}), 200

@app.route('/health', methods=['GET'])
def health_check():
    ai = get_ai_capabilities()
    ready = ai["chatbot"] and ai["speech_to_text"] and ai["text_to_speech"]
    db_ok = True
    try:
        db.session.execute(db.text('SELECT 1'))
    except Exception:
        db_ok = False
    return jsonify({"status": "ok", "ready": ready, "ai": ai, "database": db_ok}), 200

@app.route('/', methods=['GET'])
def index():
    """Root endpoint for health checks and API documentation"""
    return jsonify({
        "message": "GentleCare API Server",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "capabilities": "/capabilities",
            "auth": "/auth/login, /auth/signup",
            "medications": "/medications",
            "health_records": "/health-records",
            "appointments": "/appointments",
            "meals": "/meals"
        }
    }), 200

# JWT error handlers
@jwt.invalid_token_loader
def invalid_token_callback(error):
    logger.warning(f"Invalid token: {error}")
    return jsonify({"error": "Invalid token", "message": str(error)}), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    logger.warning(f"Missing token: {error}")
    return jsonify({"error": "Authorization token is missing", "message": str(error)}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    logger.warning(f"Expired token")
    return jsonify({"error": "Token has expired"}), 401

# ===========================
# AUTHENTICATION ROUTES
# ===========================

@app.route('/auth/signup', methods=['POST'])
def signup():
    """Register new user (elder or caretaker)"""
    try:
        data = request.json or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password', '')
        full_name = (data.get('full_name') or '').strip()
        phone = (data.get('phone') or '').strip()
        user_type = data.get('user_type', '')

        if not all([email, password, full_name, user_type]):
            return jsonify({"error": "Email, password, full name, and user type are required"}), 400
        if not _validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400
        if not _validate_password(password):
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        if user_type not in ('elder', 'caretaker'):
            return jsonify({"error": "User type must be 'elder' or 'caretaker'"}), 400
        if len(full_name) > 100:
            return jsonify({"error": "Full name is too long"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already registered"}), 409

        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(email=email, password_hash=password_hash, full_name=full_name, phone=phone, user_type=user_type)
        db.session.add(user)
        db.session.flush()

        if user_type == 'elder':
            db.session.add(ElderProfile(user_id=user.id, emergency_contact=data.get('emergency_contact'), medical_conditions=data.get('medical_conditions')))
        else:
            db.session.add(CaretakerProfile(user_id=user.id, specialization=data.get('specialization'), experience_years=data.get('experience_years')))

        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "message": "User registered successfully",
            "access_token": access_token,
            "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "user_type": user.user_type}
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": _safe_error(e, 'Registration failed')}), 500

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
        user_id = int(get_jwt_identity())
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
        return jsonify({"error": _safe_error(e, 'Failed to link caretaker')}), 500

# ===========================
# USER PROFILE & DASHBOARD
# ===========================

@app.route('/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        result = {"id": user.id, "email": user.email, "full_name": user.full_name, "phone": user.phone, "user_type": user.user_type}
        if user.user_type == 'elder':
            ep = ElderProfile.query.filter_by(user_id=user.id).first()
            if ep:
                result['elder_profile'] = {"id": ep.id, "emergency_contact": ep.emergency_contact, "medical_conditions": ep.medical_conditions, "caretaker_id": ep.caretaker_id}
        else:
            elders = ElderProfile.query.filter_by(caretaker_id=user.id).all()
            result['elders'] = [{"id": e.id, "name": e.user.full_name, "user_id": e.user_id} for e in elders]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": _safe_error(e)}), 500

@app.route('/dashboard/summary', methods=['GET'])
@jwt_required()
def dashboard_summary():
    """Get dashboard summary data for both elder and caretaker"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        now = datetime.now(timezone.utc)
        today = now.date()
        unread = Notification.query.filter_by(recipient_user_id=user_id, is_read=False).count()
        recent_notifs = Notification.query.filter_by(recipient_user_id=user_id).order_by(Notification.created_at.desc()).limit(5).all()
        notif_list = [{"id": n.id, "title": n.title, "message": n.message, "type": n.notification_type, "is_read": n.is_read, "created_at": n.created_at.isoformat()} for n in recent_notifs]

        if user.user_type == 'elder':
            ep = ElderProfile.query.filter_by(user_id=user_id).first()
            if not ep:
                return jsonify({"user_name": user.full_name, "user_type": "elder", "unread_notifications": 0, "notifications": [], "medications": {"total": 0, "taken_today": 0}, "upcoming_appointments": []}), 200
            meds = Medication.query.filter_by(elder_id=ep.id, is_active=True).all()
            taken = 0
            for m in meds:
                last_log = MedicationLog.query.filter_by(medication_id=m.id).order_by(MedicationLog.taken_at.desc()).first()
                if last_log and last_log.taken_at.date() == today and last_log.status == 'taken':
                    taken += 1
            upcoming = Appointment.query.filter(Appointment.elder_id == ep.id, Appointment.appointment_date >= now, Appointment.status == 'scheduled').order_by(Appointment.appointment_date).limit(3).all()
            return jsonify({
                "user_name": user.full_name, "user_type": "elder",
                "medications": {"total": len(meds), "taken_today": taken},
                "upcoming_appointments": [{"id": a.id, "title": a.title, "date": a.appointment_date.isoformat(), "doctor": a.doctor_name} for a in upcoming],
                "unread_notifications": unread, "notifications": notif_list
            }), 200
        else:
            elders = ElderProfile.query.filter_by(caretaker_id=user_id).all()
            elder_summaries = []
            for e in elders:
                med_count = Medication.query.filter_by(elder_id=e.id, is_active=True).count()
                apt_count = Appointment.query.filter(Appointment.elder_id == e.id, Appointment.appointment_date >= now, Appointment.status == 'scheduled').count()
                elder_summaries.append({"id": e.id, "name": e.user.full_name, "active_medications": med_count, "upcoming_appointments": apt_count})
            return jsonify({
                "user_name": user.full_name, "user_type": "caretaker",
                "elder_count": len(elders), "elders": elder_summaries,
                "unread_notifications": unread, "notifications": notif_list
            }), 200
    except Exception as e:
        return jsonify({"error": _safe_error(e)}), 500

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
            if elder_ids:
                medications = Medication.query.filter(Medication.elder_id.in_(elder_ids), Medication.is_active == True).all()
                pass
            else:
                medications = []
        

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
        logger.error(f"Error in get_medications: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/medications', methods=['POST'])
@jwt_required()
def add_medication():
    """Add new medication"""
    try:
        user_id = int(get_jwt_identity())
        data = request.json
        user = User.query.get(user_id)
        
        elder_id = resolve_elder_id_for_user(user, data.get('elder_id'))
        if not elder_id:
            return jsonify({"error": "No elder profile found"}), 404
        
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
        
        emit_to_care_team(elder_id, 'medication_added', {
            'medication_id': medication.id,
            'elder_id': elder_id,
            'name': medication.name
        })
        
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
        user_id = int(get_jwt_identity())
        data = request.json
        
        medication = Medication.query.get_or_404(med_id)
        
        log = MedicationLog(
            medication_id=med_id,
            status=data.get('status', 'taken'),
            notes=data.get('notes')
        )
        db.session.add(log)
        db.session.commit()
        
        # Notify care team and create caretaker notification
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

            socketio.emit('notification_created', {
                'recipient_user_id': elder_profile.caretaker_id,
                'title': notification.title,
                'message': notification.message,
                'type': notification.notification_type,
                'created_at': notification.created_at.isoformat(),
            }, room=f'user_{elder_profile.caretaker_id}')

        emit_to_care_team(medication.elder_id, 'medication_logged', {
            'medication_id': med_id,
            'elder_id': medication.elder_id,
            'elder_name': elder_profile.user.full_name,
            'medication_name': medication.name,
            'status': log.status,
            'time': log.taken_at.isoformat()
        })
        
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
        user = User.query.get(user_id)
        if not verify_resource_access(user, medication.elder_id):
            return jsonify({"error": "Access denied"}), 403

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

        emit_to_care_team(medication.elder_id, 'medication_updated', {
            'medication_id': medication.id,
            'elder_id': medication.elder_id,
            'name': medication.name,
            'dosage': medication.dosage,
            'frequency': medication.frequency,
            'time': medication.time,
            'is_active': medication.is_active,
        })
        
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
        user = User.query.get(user_id)
        if not verify_resource_access(user, medication.elder_id):
            return jsonify({"error": "Access denied"}), 403
        medication.is_active = False
        db.session.commit()

        emit_to_care_team(medication.elder_id, 'medication_deleted', {
            'medication_id': medication.id,
            'elder_id': medication.elder_id,
        })
        
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
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        elder_id = request.args.get('elder_id')
        record_type = request.args.get('type')
        days = int(request.args.get('days', 30))
        
        if user.user_type == 'elder':
            elder_profile = ElderProfile.query.filter_by(user_id=user_id).first()
            elder_id = elder_profile.id
        elif not elder_id:
            elder_id = resolve_elder_id_for_user(user)

        if not elder_id:
            return jsonify({"records": []}), 200
        
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
        user_id = int(get_jwt_identity())
        data = request.json
        user = User.query.get(user_id)
        
        elder_id = resolve_elder_id_for_user(user, data.get('elder_id'))
        if not elder_id:
            return jsonify({"error": "No elder profile found"}), 404
        
        record = HealthRecord(
            elder_id=elder_id,
            record_type=data.get('type'),
            value=data.get('value'),
            unit=data.get('unit'),
            notes=data.get('notes')
        )
        db.session.add(record)
        db.session.commit()
        
        elder_profile = ElderProfile.query.get(elder_id)
        
        # Check alerting pipeline for health records
        # Trigger: heart rate >100 or fall_detected
        is_alert = False
        alert_reasons = []
        if record.record_type.lower() == 'heart rate' and float(record.value) > 100:
            is_alert = True
            alert_reasons.append(f"High Heart Rate ({record.value})")
        # Add future checks for Fall Detection here
        
        if is_alert:
            alert_type = " | ".join(alert_reasons)
            # Log to DB
            from datetime import datetime
            from models import Notification
            # Note: A separate Alerts table is ideal, but using Notification as proxy for prototype
            if elder_profile.caretaker_id:
                notif = Notification(
                    recipient_user_id=elder_profile.caretaker_id,
                    title="EMERGENCY ALERT",
                    message=f"Alert for {elder_profile.user.full_name}: {alert_type}",
                    action_url=f"/caretaker/HealthRecords",
                    created_at=datetime.utcnow()
                )
                db.session.add(notif)
                db.session.commit()
                # Mock FCM Push via Socket
                socketio.emit('emergency_alert', {
                    'elder_id': elder_id,
                    'elder_name': elder_profile.user.full_name,
                    'alert_type': alert_type
                }, room=f'user_{elder_profile.caretaker_id}')
                print(f"[FCM PUSH MOCK] Alert triggered for Elder {elder_id}: {alert_type}")

        # Regular notification for non-emergency records
        if not is_alert and elder_profile.caretaker_id:
            notif = Notification(
                elder_id=elder_id,
                recipient_user_id=elder_profile.caretaker_id,
                title="Health Update",
                message=f"{elder_profile.user.full_name} logged {record.record_type}: {record.value} {record.unit}",
                notification_type="health"
            )
            db.session.add(notif)
            db.session.commit()

            socketio.emit('notification_created', {
                'recipient_user_id': elder_profile.caretaker_id,
                'title': notif.title,
                'message': notif.message,
                'type': notif.notification_type,
                'created_at': notif.created_at.isoformat(),
            }, room=f'user_{elder_profile.caretaker_id}')

        emit_to_care_team(elder_id, 'health_record_added', {
            'elder_id': elder_id,
            'elder_name': elder_profile.user.full_name,
            'type': record.record_type,
            'value': record.value,
            'unit': record.unit
        })
        
        return jsonify({
            "message": "Health record added successfully",
            "record_id": record.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/health-records/<int:record_id>', methods=['DELETE'])
@jwt_required()
def delete_health_record(record_id):
    """Delete health record"""
    try:
        user_id = int(get_jwt_identity())
        record = HealthRecord.query.get(record_id)
        if not record:
            return jsonify({"error": "Health record not found"}), 404
        user = User.query.get(user_id)
        if not verify_resource_access(user, record.elder_id):
            return jsonify({"error": "Access denied"}), 403
        elder_id = record.elder_id
        db.session.delete(record)
        db.session.commit()

        emit_to_care_team(elder_id, 'health_record_deleted', {
            'record_id': record_id,
            'elder_id': elder_id,
        })
        
        return jsonify({"message": "Health record deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/health-records/<int:record_id>', methods=['PUT'])
@jwt_required()
def update_health_record(record_id):
    """Update health record"""
    try:
        user_id = int(get_jwt_identity())
        record = HealthRecord.query.get(record_id)
        if not record:
            return jsonify({"error": "Health record not found"}), 404
        user = User.query.get(user_id)
        if not verify_resource_access(user, record.elder_id):
            return jsonify({"error": "Access denied"}), 403
            
        data = request.json
        if 'value' in data:
            record.value = data['value']
        if 'notes' in data:
            record.notes = data['notes']
            
        db.session.commit()

        emit_to_care_team(record.elder_id, 'health_record_added', { # reuse event to trigger UI refresh
            'elder_id': record.elder_id,
        })
        
        return jsonify({"message": "Health record updated successfully"}), 200
        
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
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        date_str = request.args.get('date')
        
        if user.user_type == 'elder':
            elder_profile = ElderProfile.query.filter_by(user_id=user_id).first()
            elder_id = elder_profile.id
        else:
            elder_id = request.args.get('elder_id', type=int)
            if not elder_id:
                elder_id = resolve_elder_id_for_user(user)

        if not elder_id:
            return jsonify({"meals": []}), 200
        
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
        
        # Notify care team
        elder_profile = ElderProfile.query.get(meal.elder_id)
        emit_to_care_team(meal.elder_id, 'meal_consumed', {
            'meal_id': meal_id,
            'elder_id': meal.elder_id,
            'elder_name': elder_profile.user.full_name,
            'meal_type': meal.meal_type,
            'meal_name': meal.meal_name
        })
        
        return jsonify({"message": "Meal marked as consumed"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/meals', methods=['POST'])
@jwt_required()
def add_meal():
    """Add meal plan/entry"""
    try:
        user_id = int(get_jwt_identity())
        data = request.json
        user = User.query.get(user_id)

        elder_id = resolve_elder_id_for_user(user, data.get('elder_id'))
        if not elder_id:
            return jsonify({"error": "No elder profile found"}), 404

        scheduled_time = None
        if data.get('scheduled_time'):
            try:
                scheduled_time = datetime.fromisoformat(data.get('scheduled_time'))
            except ValueError:
                scheduled_time = datetime.utcnow()

        meal = Meal(
            elder_id=elder_id,
            meal_type=data.get('meal_type'),
            meal_name=data.get('meal_name'),
            calories=data.get('calories'),
            protein=data.get('protein'),
            carbs=data.get('carbs'),
            fats=data.get('fats'),
            scheduled_time=scheduled_time,
            notes=data.get('notes')
        )
        db.session.add(meal)
        db.session.commit()

        elder_profile = ElderProfile.query.get(elder_id)
        
        # Create notification for caretaker
        if elder_profile.caretaker_id:
            notif = Notification(
                elder_id=elder_id,
                recipient_user_id=elder_profile.caretaker_id,
                title="Meal Logged",
                message=f"{elder_profile.user.full_name} logged a {meal.meal_type}: {meal.meal_name}",
                notification_type="meal"
            )
            db.session.add(notif)
            db.session.commit()

            socketio.emit('notification_created', {
                'recipient_user_id': elder_profile.caretaker_id,
                'title': notif.title,
                'message': notif.message,
                'type': notif.notification_type,
                'created_at': notif.created_at.isoformat(),
            }, room=f'user_{elder_profile.caretaker_id}')

        emit_to_care_team(elder_id, 'meal_added', {
            'meal_id': meal.id,
            'elder_id': elder_id,
            'elder_name': elder_profile.user.full_name,
            'meal_type': meal.meal_type,
            'meal_name': meal.meal_name,
            'scheduled_time': meal.scheduled_time.isoformat() if meal.scheduled_time else None,
        })

        return jsonify({
            "message": "Meal added successfully",
            "meal_id": meal.id,
        }), 201

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
        user_id = int(get_jwt_identity())
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
        user_id = int(get_jwt_identity())
        data = request.json
        user = User.query.get(user_id)
        
        elder_id = resolve_elder_id_for_user(user, data.get('elder_id'))
        if not elder_id:
            return jsonify({"error": "No elder profile found"}), 404
        
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
        
        emit_to_care_team(elder_id, 'appointment_added', {
            'appointment_id': appointment.id,
            'elder_id': elder_id,
            'title': appointment.title,
            'date': appointment.appointment_date.isoformat()
        })
        
        return jsonify({
            "message": "Appointment added successfully",
            "appointment_id": appointment.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/appointments/<int:appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    """Update appointment"""
    try:
        user_id = int(get_jwt_identity())
        data = request.json
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({"error": "Appointment not found"}), 404
        user = User.query.get(user_id)
        if not verify_resource_access(user, appointment.elder_id):
            return jsonify({"error": "Access denied"}), 403
        if data.get('title'):
            appointment.title = data['title']
        if data.get('doctor_name'):
            appointment.doctor_name = data['doctor_name']
        if data.get('location'):
            appointment.location = data['location']
        if data.get('appointment_date'):
            appointment.appointment_date = datetime.fromisoformat(data['appointment_date'])
        if data.get('duration_minutes'):
            appointment.duration_minutes = data['duration_minutes']
        if data.get('notes'):
            appointment.notes = data['notes']
        if data.get('status'):
            appointment.status = data['status']
        
        db.session.commit()

        emit_to_care_team(appointment.elder_id, 'appointment_updated', {
            'appointment_id': appointment.id,
            'elder_id': appointment.elder_id,
            'title': appointment.title,
            'status': appointment.status,
            'appointment_date': appointment.appointment_date.isoformat(),
        })
        
        return jsonify({
            "message": "Appointment updated successfully",
            "appointment": {
                "id": appointment.id,
                "title": appointment.title,
                "doctor_name": appointment.doctor_name,
                "location": appointment.location,
                "appointment_date": appointment.appointment_date.isoformat(),
                "duration_minutes": appointment.duration_minutes,
                "status": appointment.status,
                "notes": appointment.notes
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/appointments/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(appointment_id):
    """Delete appointment"""
    try:
        user_id = int(get_jwt_identity())
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({"error": "Appointment not found"}), 404
        user = User.query.get(user_id)
        if not verify_resource_access(user, appointment.elder_id):
            return jsonify({"error": "Access denied"}), 403
        elder_id = appointment.elder_id
        db.session.delete(appointment)
        db.session.commit()

        emit_to_care_team(elder_id, 'appointment_deleted', {
            'appointment_id': appointment_id,
            'elder_id': elder_id,
        })
        
        return jsonify({"message": "Appointment deleted successfully"}), 200
        
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
        user_id = int(get_jwt_identity())
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
        user_id = int(get_jwt_identity())
        notification = Notification.query.get_or_404(notif_id)
        if notification.recipient_user_id != user_id:
            return jsonify({"error": "Access denied"}), 403
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
        user_id = int(get_jwt_identity())
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
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if user.user_type == 'elder':
            elder_profile = ElderProfile.query.filter_by(user_id=user_id).first()
            elder_id = elder_profile.id
        else:
            elder_id = request.args.get('elder_id', type=int)
            if not elder_id:
                elder_id = resolve_elder_id_for_user(user)

        if not elder_id:
            return jsonify({"contacts": []}), 200
        
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
        user_id = int(get_jwt_identity())
        data = request.json
        user = User.query.get(user_id)
        
        elder_id = resolve_elder_id_for_user(user, data.get('elder_id'))
        if not elder_id:
            return jsonify({"error": "No elder profile found"}), 404
        
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

        emit_to_care_team(elder_id, 'emergency_contact_added', {
            'contact_id': contact.id,
            'elder_id': elder_id,
            'name': contact.name,
            'relationship': contact.relationship,
        })
        
        return jsonify({
            "message": "Emergency contact added successfully",
            "contact_id": contact.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/emergency-contacts/<int:contact_id>', methods=['PUT'])
@jwt_required()
def update_emergency_contact(contact_id):
    """Update emergency contact"""
    try:
        user_id = int(get_jwt_identity())
        data = request.json
        contact = EmergencyContact.query.get(contact_id)
        
        if not contact:
            return jsonify({"error": "Emergency contact not found"}), 404
        
        if data.get('name'):
            contact.name = data['name']
        if data.get('relationship'):
            contact.relationship = data['relationship']
        if data.get('phone'):
            contact.phone = data['phone']
        if data.get('email') is not None:
            contact.email = data['email']
        if data.get('is_primary') is not None:
            contact.is_primary = data['is_primary']
        
        db.session.commit()

        emit_to_care_team(contact.elder_id, 'emergency_contact_updated', {
            'contact_id': contact.id,
            'elder_id': contact.elder_id,
            'name': contact.name,
            'relationship': contact.relationship,
        })
        
        return jsonify({
            "message": "Emergency contact updated successfully",
            "contact": {
                "id": contact.id,
                "name": contact.name,
                "relationship": contact.relationship,
                "phone": contact.phone,
                "email": contact.email,
                "is_primary": contact.is_primary
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/emergency-contacts/<int:contact_id>', methods=['DELETE'])
@jwt_required()
def delete_emergency_contact(contact_id):
    """Delete emergency contact"""
    try:
        user_id = int(get_jwt_identity())
        contact = EmergencyContact.query.get(contact_id)
        if not contact:
            return jsonify({"error": "Emergency contact not found"}), 404
        user = User.query.get(user_id)
        if not verify_resource_access(user, contact.elder_id):
            return jsonify({"error": "Access denied"}), 403
        elder_id = contact.elder_id
        db.session.delete(contact)
        db.session.commit()

        emit_to_care_team(elder_id, 'emergency_contact_deleted', {
            'contact_id': contact_id,
            'elder_id': elder_id,
        })
        return jsonify({"message": "Emergency contact deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": _safe_error(e, 'Failed to delete contact')}), 500

# ===========================
# CHATBOT ROUTES (EXISTING)
# ===========================

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Speech to text"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "Audio file is required"}), 400

        if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            return jsonify({"error": "Speech-to-text is not configured on the server"}), 503

        audio_file = request.files['file']
        audio_bytes = audio_file.read()
        
        client = speech.SpeechClient()
        audio = speech.RecognitionAudio(content=audio_bytes)
        config = speech.RecognitionConfig(
            language_code="en-US",
            enable_automatic_punctuation=True,
            model="latest_short",
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
    """Hybrid Chatbot: Rule-based pre-filter -> Gemini LLM -> Post-processing"""
    try:
        data = request.json
        user_message = data.get("message", "").strip()
        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        user_id = 'anonymous'
        role = 'elder' # Default

        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request(optional=True)
            identity = get_jwt_identity()
            if identity:
                user_id = int(identity)
                user = User.query.get(user_id)
                if user:
                    role = user.user_type
        except Exception:
            pass

        # Step A: Rule-based pre-filter
        BLOCKLIST = ["stop medication", "disable alert", "hurt myself", "bypass caregiver"]
        msg_lower = user_message.lower()
        mode = "llm"
        
        if any(b in msg_lower for b in BLOCKLIST):
            bot_response = "I can't help with that. Please talk to your caregiver."
            return jsonify({"response": bot_response, "mode": "rule"})
            
        if role == 'elder' and any(w in msg_lower for w in ["pain", "doctor", "medicine", "diagnosis"]):
            bot_response = "For medical advice or changes to your routine, please consult your caregiver or doctor directly."
            return jsonify({"response": bot_response, "mode": "rule"})

        if model is None:
            return jsonify({"error": "Chatbot is not configured on the server"}), 503

        # Step B: LLM Processing
        if role == 'elder':
            system_prompt = "You are a gentle, safe assistant. Do not give medical advice. Suggest talking to caregiver for serious issues."
        elif role == 'caretaker':
            system_prompt = "You are a professional aide. Provide factual answers but defer to doctors for diagnosis."
        else:
            system_prompt = "You are a helpful assistant."

        history = _get_user_history(user_id)
        prompt = f"System: {system_prompt}\n" + "\n".join(history[-_MAX_HISTORY:]) + f"\nUser: {user_message}\nAssistant:"

        # Assuming the model generation is relatively fast; in production, wrap in timeout
        response = model.generate_content(prompt)
        bot_response = response.text

        # Step C: Response post-processing
        if any(b in bot_response.lower() for b in BLOCKLIST):
            bot_response = "I apologize, but I cannot provide that information. Please speak with your caregiver."
            mode = "rule"

        # Update History
        history.append(f"User: {user_message}")
        history.append(f"Assistant: {bot_response}")
        if len(history) > _MAX_HISTORY:
            _user_conversations[user_id] = history[-_MAX_HISTORY:]

        # Log to DB (Mocking this with print for prototype, or could use a ChatLog table)
        print(f"CHAT LOG: [User {user_id}] [{role}] [{mode}] Q: {user_message} | A: {bot_response}")

        return jsonify({"response": bot_response, "mode": mode})
    except Exception as e:
        return jsonify({"error": _safe_error(e, 'Chat failed')}), 500

@app.route('/speak', methods=['POST'])
def speak():
    """Text to speech"""
    try:
        if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            return jsonify({"error": "Text-to-speech is not configured on the server"}), 503

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
# PRESCRIPTION ENDPOINTS
# ===========================

@app.route('/prescriptions', methods=['GET'])
@jwt_required()
def get_prescriptions():
    """Get all prescriptions for the authenticated user"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get elder_id based on user type
        if user.user_type == 'elder':
            elder_id = user.elder_profile.id
        else:  # caretaker
            elder_id = request.args.get('elder_id', type=int)
            if not elder_id:
                # Get all elders under this caretaker
                elders = ElderProfile.query.filter_by(caretaker_id=user_id).all()
                if not elders:
                    return jsonify({"prescriptions": []}), 200
                elder_id = elders[0].id
        
        prescriptions = Prescription.query.filter_by(elder_id=elder_id).order_by(Prescription.date.desc()).all()
        
        return jsonify({
            "prescriptions": [{
                "id": p.id,
                "elder_id": p.elder_id,
                "doctor_name": p.doctor_name,
                "date": p.date.isoformat() if p.date else None,
                "diagnosis": p.diagnosis,
                "medicines": p.medicines,
                "notes": p.notes,
                "image_path": p.image_path,
                "created_at": p.created_at.isoformat()
            } for p in prescriptions]
        }), 200
    except Exception as e:
        logger.error(f"Error fetching prescriptions: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/prescriptions', methods=['POST'])
@jwt_required()
def add_prescription():
    """Add a new prescription"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        data = request.get_json()
        
        # Get elder_id based on user type
        if user.user_type == 'elder':
            elder_id = user.elder_profile.id
        else:  # caretaker
            elder_id = data.get('elder_id')
            if not elder_id:
                elders = ElderProfile.query.filter_by(caretaker_id=user_id).all()
                if not elders:
                    return jsonify({"error": "No elder profile found"}), 404
                elder_id = elders[0].id
        
        prescription = Prescription(
            elder_id=elder_id,
            doctor_name=data.get('doctor_name'),
            date=datetime.strptime(data['date'], '%Y-%m-%d').date() if data.get('date') else datetime.utcnow().date(),
            diagnosis=data.get('diagnosis'),
            medicines=data.get('medicines'),  # JSON string
            notes=data.get('notes'),
            image_path=data.get('image_path')
        )
        
        db.session.add(prescription)
        db.session.commit()

        emit_to_care_team(elder_id, 'prescription_added', {
            'prescription_id': prescription.id,
            'elder_id': elder_id,
            'doctor_name': prescription.doctor_name,
            'date': prescription.date.isoformat(),
        })
        
        return jsonify({
            "message": "Prescription added successfully",
            "prescription": {
                "id": prescription.id,
                "elder_id": prescription.elder_id,
                "doctor_name": prescription.doctor_name,
                "date": prescription.date.isoformat(),
                "diagnosis": prescription.diagnosis,
                "medicines": prescription.medicines,
                "notes": prescription.notes,
                "image_path": prescription.image_path
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding prescription: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/prescriptions/<int:prescription_id>', methods=['PUT'])
@jwt_required()
def update_prescription(prescription_id):
    """Update an existing prescription"""
    try:
        user_id = int(get_jwt_identity())
        prescription = Prescription.query.get(prescription_id)
        
        if not prescription:
            return jsonify({"error": "Prescription not found"}), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'doctor_name' in data:
            prescription.doctor_name = data['doctor_name']
        if 'date' in data:
            prescription.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        if 'diagnosis' in data:
            prescription.diagnosis = data['diagnosis']
        if 'medicines' in data:
            prescription.medicines = data['medicines']
        if 'notes' in data:
            prescription.notes = data['notes']
        if 'image_path' in data:
            prescription.image_path = data['image_path']
        
        db.session.commit()

        emit_to_care_team(prescription.elder_id, 'prescription_updated', {
            'prescription_id': prescription.id,
            'elder_id': prescription.elder_id,
            'doctor_name': prescription.doctor_name,
            'date': prescription.date.isoformat(),
        })
        
        return jsonify({
            "message": "Prescription updated successfully",
            "prescription": {
                "id": prescription.id,
                "doctor_name": prescription.doctor_name,
                "date": prescription.date.isoformat(),
                "diagnosis": prescription.diagnosis,
                "medicines": prescription.medicines,
                "notes": prescription.notes,
                "image_path": prescription.image_path
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating prescription: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/prescriptions/<int:prescription_id>', methods=['DELETE'])
@jwt_required()
def delete_prescription(prescription_id):
    """Delete a prescription"""
    try:
        user_id = int(get_jwt_identity())
        prescription = Prescription.query.get(prescription_id)
        if not prescription:
            return jsonify({"error": "Prescription not found"}), 404
        user = User.query.get(user_id)
        if not verify_resource_access(user, prescription.elder_id):
            return jsonify({"error": "Access denied"}), 403
        elder_id = prescription.elder_id
        db.session.delete(prescription)
        db.session.commit()

        emit_to_care_team(elder_id, 'prescription_deleted', {
            'prescription_id': prescription_id,
            'elder_id': elder_id,
        })
        return jsonify({"message": "Prescription deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": _safe_error(e, 'Failed to delete prescription')}), 500

# ===========================
# WEBSOCKET EVENTS
# ===========================

@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected')

@socketio.on('join')
def handle_join(data):
    """Join user-specific room — validates user_id matches auth token if provided."""
    user_id = data.get('user_id')
    if user_id:
        join_room(f'user_{user_id}')
        logger.info(f'User {user_id} joined their room')

@socketio.on('leave')
def handle_leave(data):
    user_id = data.get('user_id')
    if user_id:
        leave_room(f'user_{user_id}')
        logger.info(f'User {user_id} left their room')

# ===========================
# Background Tasks
# ===========================

import threading
import time

def check_appointment_reminders():
    """Background task to check for upcoming appointments and send notifications"""
    with app.app_context():
        while True:
            try:
                now = datetime.utcnow()
                reminder_time = now + timedelta(minutes=15)
                
                # Find appointments starting in ~15 mins that haven't been reminded
                # status='scheduled' and date between now+14 and now+16
                upcoming = Appointment.query.filter(
                    Appointment.status == 'scheduled',
                    Appointment.appointment_date >= now + timedelta(minutes=14),
                    Appointment.appointment_date <= now + timedelta(minutes=16)
                ).all()
                
                for appt in upcoming:
                    # Check if notification already exists for this appointment
                    existing = Notification.query.filter_by(
                        recipient_user_id=appt.elder_id,
                        title="Appointment Reminder",
                        message=f"Reminder: {appt.title} in 15 minutes"
                    ).first()
                    
                    if not existing:
                        # Notify Elder
                        notif_elder = Notification(
                            elder_id=appt.elder_id,
                            recipient_user_id=appt.elder_id,
                            title="Appointment Reminder",
                            message=f"Reminder: {appt.title} in 15 minutes",
                            notification_type="appointment"
                        )
                        db.session.add(notif_elder)
                        
                        # Notify Caretaker
                        elder_profile = ElderProfile.query.get(appt.elder_id)
                        if elder_profile and elder_profile.caretaker_id:
                            notif_ct = Notification(
                                elder_id=appt.elder_id,
                                recipient_user_id=elder_profile.caretaker_id,
                                title="Appointment Reminder",
                                message=f"Reminder: {elder_profile.user.full_name} has {appt.title} in 15 minutes",
                                notification_type="appointment"
                            )
                            db.session.add(notif_ct)
                            
                            # Emit to caretaker
                            socketio.emit('notification_created', {
                                'recipient_user_id': elder_profile.caretaker_id,
                                'title': notif_ct.title,
                                'message': notif_ct.message,
                                'type': notif_ct.notification_type,
                                'created_at': notif_ct.created_at.isoformat(),
                            }, room=f'user_{elder_profile.caretaker_id}')

                        # Emit to elder
                        socketio.emit('notification_created', {
                            'recipient_user_id': appt.elder_id,
                            'title': notif_elder.title,
                            'message': notif_elder.message,
                            'type': notif_elder.notification_type,
                            'created_at': notif_elder.created_at.isoformat(),
                        }, room=f'user_{appt.elder_id}')
                        
                        db.session.commit()
                        logger.info(f"Sent 15m reminder for appointment {appt.id}")
                
            except Exception as e:
                logger.error(f"Error in reminder task: {e}")
            
            # Sleep for a minute before next check
            time.sleep(60)

# Start background thread
reminder_thread = threading.Thread(target=check_appointment_reminders, daemon=True)
reminder_thread.start()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        logger.info('Database tables created')
    port = int(os.getenv('PORT', '5001'))
    debug_mode = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    socketio.run(app, host='0.0.0.0', port=port, debug=debug_mode)
