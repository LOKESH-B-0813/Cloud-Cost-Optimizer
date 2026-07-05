from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.models.models import User, Profile, Settings
from backend.database import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    company = data.get('company', '').strip()
    gst = data.get('gst_number', '').strip()
    country = data.get('country', '').strip()
    industry = data.get('industry', '').strip()
    
    if not email or not password or not name:
        return jsonify({'error': 'Name, email, and password are required.'}), 400
        
    # Check duplicate email
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists.'}), 400
        
    # Check duplicate phone
    if phone and Profile.query.filter_by(phone=phone).first():
        return jsonify({'error': 'This phone number is already registered.'}), 400
        
    try:
        # Create User
        user = User(email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.flush() # Fetch user id
        
        # Create Profile
        profile = Profile(
            user_id=user.id,
            name=name,
            email=email,
            phone=phone if phone else None,
            company=company if company else None,
            gst_number=gst if gst else None,
            country=country if country else None,
            industry=industry if industry else None
        )
        db.session.add(profile)
        
        # Create Settings
        settings = Settings(
            user_id=user.id,
            theme='light',
            language='en',
            currency='USD'
        )
        db.session.add(settings)
        
        db.session.commit()
        
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'message': 'Registration successful',
            'token': access_token,
            'user': user.to_dict(),
            'profile': profile.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create account: {str(e)}'}), 500


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password.'}), 401
        
    # Get profile
    profile = user.profile
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Login successful',
        'token': access_token,
        'user': user.to_dict(),
        'profile': profile.to_dict() if profile else None,
        'settings': user.settings.to_dict() if user.settings else None
    }), 200


@auth_bp.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    profile = user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
        
    return jsonify(profile.to_dict()), 200


@auth_bp.route('/api/auth/profile', methods=['PUT', 'PATCH'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    profile = user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
        
    data = request.get_json() or {}
    
    # Phone number duplicate check
    phone = data.get('phone', '').strip()
    if phone and phone != profile.phone:
        existing = Profile.query.filter_by(phone=phone).first()
        if existing and existing.user_id != int(user_id):
            return jsonify({'error': 'This phone number is already registered to another account.'}), 400
            
    # Update fields
    if 'name' in data:
        profile.name = data['name'].strip()
    if 'phone' in data:
        profile.phone = phone if phone else None
    if 'company' in data:
        profile.company = data['company'].strip()
    if 'gst_number' in data:
        profile.gst_number = data['gst_number'].strip()
    if 'country' in data:
        profile.country = data['country'].strip()
    if 'industry' in data:
        profile.industry = data['industry'].strip()
    if 'profile_image' in data:
        profile.profile_image = data['profile_image']
        
    try:
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'profile': profile.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500


@auth_bp.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    if not email:
        return jsonify({'error': 'Email is required'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        # For security, return success even if user isn't found to prevent account enumeration
        return jsonify({'message': 'If the email exists, a password reset link has been dispatched.'}), 200
        
    # Return mock token in response since mail config is sandbox
    reset_token = f"reset_{user.id}_token_hash_abc"
    return jsonify({
        'message': 'Password reset request generated successfully.',
        'reset_token': reset_token
    }), 200


@auth_bp.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    token = data.get('token', '')
    new_password = data.get('new_password', '')
    
    if not email or not token or not new_password:
        return jsonify({'error': 'Email, token, and new password are required.'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or token != f"reset_{user.id}_token_hash_abc":
        return jsonify({'error': 'Invalid or expired password reset request.'}), 400
        
    try:
        user.set_password(new_password)
        db.session.commit()
        return jsonify({'message': 'Password has been successfully updated.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Reset failed: {str(e)}'}), 500
