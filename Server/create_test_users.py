"""
Quick script to create test users for GentleCare
Run this to create sample elder and caretaker accounts
"""
from app_new import app, db, User, ElderProfile, CaretakerProfile
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

def create_test_users():
    with app.app_context():
        # Create test elder
        elder = User.query.filter_by(email='elder@test.com').first()
        if not elder:
            elder = User(
                email='elder@test.com',
                password_hash=bcrypt.generate_password_hash('password123').decode('utf-8'),
                full_name='John Elder',
                phone='+1234567890',
                user_type='elder'
            )
            db.session.add(elder)
            db.session.flush()
            
            elder_profile = ElderProfile(
                user_id=elder.id,
                emergency_contact='+1234567890',
                medical_conditions='Diabetes, Hypertension'
            )
            db.session.add(elder_profile)
            print("✅ Created test elder account:")
            print("   Email: elder@test.com")
            print("   Password: password123")
        else:
            print("ℹ️  Test elder account already exists")
        
        # Create test caretaker
        caretaker = User.query.filter_by(email='caretaker@test.com').first()
        if not caretaker:
            caretaker = User(
                email='caretaker@test.com',
                password_hash=bcrypt.generate_password_hash('password123').decode('utf-8'),
                full_name='Mary Caretaker',
                phone='+0987654321',
                user_type='caretaker'
            )
            db.session.add(caretaker)
            db.session.flush()
            
            caretaker_profile = CaretakerProfile(
                user_id=caretaker.id,
                specialization='Geriatric Care',
                experience_years=5
            )
            db.session.add(caretaker_profile)
            print("✅ Created test caretaker account:")
            print("   Email: caretaker@test.com")
            print("   Password: password123")
        else:
            print("ℹ️  Test caretaker account already exists")
        
        db.session.commit()
        print("\n🎉 Test accounts ready! You can now login with these credentials.")

if __name__ == '__main__':
    create_test_users()
