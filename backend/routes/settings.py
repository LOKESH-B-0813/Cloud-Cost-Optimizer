from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.models import User, Settings
from backend.database import db

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/api/settings', methods=['GET'])
@jwt_required()
def get_settings():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    settings = user.settings
    if not settings:
        # Create default if somehow missing
        settings = Settings(user_id=user.id)
        db.session.add(settings)
        db.session.commit()
        
    return jsonify(settings.to_dict()), 200


@settings_bp.route('/api/settings', methods=['PUT', 'PATCH'])
@jwt_required()
def update_settings():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    settings = user.settings
    if not settings:
        settings = Settings(user_id=user.id)
        db.session.add(settings)
        
    data = request.get_json() or {}
    
    if 'theme' in data:
        settings.theme = data['theme']
    if 'language' in data:
        settings.language = data['language']
    if 'currency' in data:
        settings.currency = data['currency']
    if 'timezone' in data:
        settings.timezone = data['timezone']
    if 'budget_alerts' in data:
        settings.budget_alerts = bool(data['budget_alerts'])
    if 'notification_preferences' in data:
        settings.notification_preferences = data['notification_preferences']
    if 'default_provider' in data:
        settings.default_provider = data['default_provider']
    if 'default_region' in data:
        settings.default_region = data['default_region']
        
    try:
        db.session.commit()
        return jsonify({
            'message': 'Preferences saved successfully',
            'settings': settings.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update settings: {str(e)}'}), 500
