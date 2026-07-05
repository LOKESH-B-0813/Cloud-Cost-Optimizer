from datetime import datetime
import bcrypt
from backend.database import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(191), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile = db.relationship('Profile', backref='user', uselist=False, cascade="all, delete-orphan")
    settings = db.relationship('Settings', backref='user', uselist=False, cascade="all, delete-orphan")
    projects = db.relationship('Project', backref='user', cascade="all, delete-orphan")
    calculations = db.relationship('Calculation', backref='user', cascade="all, delete-orphan")
    reports = db.relationship('Report', backref='user', cascade="all, delete-orphan")
    histories = db.relationship('History', backref='user', cascade="all, delete-orphan")
    notifications = db.relationship('Notification', backref='user', cascade="all, delete-orphan")
    activity_logs = db.relationship('ActivityLog', backref='user', cascade="all, delete-orphan")
    sessions = db.relationship('Session', backref='user', cascade="all, delete-orphan")
    budgets = db.relationship('Budget', backref='user', cascade="all, delete-orphan")

    def set_password(self, password):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Profile(db.Model):
    __tablename__ = 'profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(191), nullable=False)
    phone = db.Column(db.String(50), nullable=True)
    company = db.Column(db.String(100), nullable=True)
    gst_number = db.Column(db.String(50), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    industry = db.Column(db.String(100), nullable=True)
    profile_image = db.Column(db.Text, nullable=True)  # Base64 or URL
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'company': self.company,
            'gst_number': self.gst_number,
            'country': self.country,
            'industry': self.industry,
            'profile_image': self.profile_image,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Settings(db.Model):
    __tablename__ = 'settings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    theme = db.Column(db.String(50), default='light')
    language = db.Column(db.String(50), default='en')
    currency = db.Column(db.String(10), default='USD')
    timezone = db.Column(db.String(100), default='UTC')
    budget_alerts = db.Column(db.Boolean, default=True)
    notification_preferences = db.Column(db.String(255), default='email,push')  # Comma separated
    default_provider = db.Column(db.String(100), default='AWS')
    default_region = db.Column(db.String(100), default='us-east-1')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'theme': self.theme,
            'language': self.language,
            'currency': self.currency,
            'timezone': self.timezone,
            'budget_alerts': self.budget_alerts,
            'notification_preferences': self.notification_preferences,
            'default_provider': self.default_provider,
            'default_region': self.default_region
        }


class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    cloud_provider = db.Column(db.String(100), nullable=True)
    budget = db.Column(db.Float, default=0.0)
    environment = db.Column(db.String(50), default='Production')
    owner = db.Column(db.String(100), default='Lokesh B')
    health_score = db.Column(db.Integer, default=95)
    optimization_score = db.Column(db.Integer, default=88)
    active_resources = db.Column(db.Integer, default=14)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    calculations = db.relationship('Calculation', backref='project', cascade="all, delete-orphan")
    reports = db.relationship('Report', backref='project', cascade="all, delete-orphan")
    budgets = db.relationship('Budget', backref='project', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'cloud_provider': self.cloud_provider,
            'budget': self.budget,
            'environment': self.environment or 'Production',
            'owner': self.owner or 'Lokesh B',
            'health_score': self.health_score or 95,
            'optimization_score': self.optimization_score or 88,
            'active_resources': self.active_resources or 14,
            'calculations_count': len(self.calculations) if self.calculations else 0,
            'reports_count': len(self.reports) if self.reports else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class CloudProvider(db.Model):
    __tablename__ = 'cloud_providers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    code = db.Column(db.String(50), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)
    logo_url = db.Column(db.Text, nullable=True)
    rating_performance = db.Column(db.Float, default=4.0)
    rating_security = db.Column(db.Float, default=4.0)
    scalability_rating = db.Column(db.Float, default=4.0)
    suitability_enterprise = db.Column(db.Float, default=4.0)
    suitability_startup = db.Column(db.Float, default=4.0)
    free_tier_info = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    regions = db.relationship('Region', backref='provider', cascade="all, delete-orphan")
    instance_types = db.relationship('InstanceType', backref='provider', cascade="all, delete-orphan")
    pricing_catalog = db.relationship('PricingCatalog', backref='provider', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description,
            'logo_url': self.logo_url,
            'rating_performance': self.rating_performance,
            'rating_security': self.rating_security,
            'scalability_rating': self.scalability_rating,
            'suitability_enterprise': self.suitability_enterprise,
            'suitability_startup': self.suitability_startup,
            'free_tier_info': self.free_tier_info
        }


class Region(db.Model):
    __tablename__ = 'regions'
    
    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('cloud_providers.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(50), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    instance_types = db.relationship('InstanceType', backref='region', cascade="all, delete-orphan")
    pricing_catalog = db.relationship('PricingCatalog', backref='region', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'provider_id': self.provider_id,
            'name': self.name,
            'code': self.code
        }


class InstanceType(db.Model):
    __tablename__ = 'instance_types'
    
    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('cloud_providers.id', ondelete='CASCADE'), nullable=False)
    region_id = db.Column(db.Integer, db.ForeignKey('regions.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False, index=True)
    vcpu = db.Column(db.Integer, nullable=False)
    ram_gb = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'provider_id': self.provider_id,
            'region_id': self.region_id,
            'name': self.name,
            'vcpu': self.vcpu,
            'ram_gb': self.ram_gb
        }


class PricingCatalog(db.Model):
    __tablename__ = 'pricing_catalog'
    
    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('cloud_providers.id', ondelete='CASCADE'), nullable=False)
    region_id = db.Column(db.Integer, db.ForeignKey('regions.id', ondelete='CASCADE'), nullable=False)
    service_type = db.Column(db.String(50), nullable=False, index=True)  # compute, storage, object_storage, database, etc.
    service_name = db.Column(db.String(100), nullable=False)  # EC2, S3, RDS, EBS, etc.
    resource_name = db.Column(db.String(100), nullable=False)  # t3.medium, standard-storage, etc.
    price_per_hour = db.Column(db.Float, default=0.0)
    price_per_gb_month = db.Column(db.Float, default=0.0)
    unit = db.Column(db.String(50), default='USD')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'provider_id': self.provider_id,
            'region_id': self.region_id,
            'service_type': self.service_type,
            'service_name': self.service_name,
            'resource_name': self.resource_name,
            'price_per_hour': self.price_per_hour,
            'price_per_gb_month': self.price_per_gb_month,
            'unit': self.unit
        }


class Calculation(db.Model):
    __tablename__ = 'calculations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='SET NULL'), nullable=True)
    provider_code = db.Column(db.String(50), nullable=False)
    region_code = db.Column(db.String(50), nullable=False)
    configuration = db.Column(db.Text, nullable=False)  # JSON String of input specs
    monthly_cost = db.Column(db.Float, nullable=False)
    annual_cost = db.Column(db.Float, nullable=False)
    estimated_savings = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    histories = db.relationship('History', backref='calculation', cascade="all, delete-orphan")
    recommendations = db.relationship('Recommendation', backref='calculation', cascade="all, delete-orphan")
    comparison_results = db.relationship('ComparisonResult', backref='calculation', cascade="all, delete-orphan")

    def to_dict(self):
        import json
        config_data = {}
        try:
            config_data = json.loads(self.configuration)
        except Exception:
            pass
        return {
            'id': self.id,
            'user_id': self.user_id,
            'project_id': self.project_id,
            'provider_code': self.provider_code,
            'region_code': self.region_code,
            'configuration': config_data,
            'monthly_cost': self.monthly_cost,
            'annual_cost': self.annual_cost,
            'estimated_savings': self.estimated_savings,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Report(db.Model):
    __tablename__ = 'reports'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='SET NULL'), nullable=True)
    calculation_id = db.Column(db.Integer, db.ForeignKey('calculations.id', ondelete='CASCADE'), nullable=True)
    name = db.Column(db.String(150), nullable=False)
    file_path = db.Column(db.Text, nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # PDF, CSV, Excel
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import os
        from flask import current_app
        file_size_str = 'Unknown'
        try:
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], self.file_path)
            if os.path.exists(filepath):
                size_bytes = os.path.getsize(filepath)
                if size_bytes < 1024:
                    file_size_str = f"{size_bytes} B"
                elif size_bytes < 1024 * 1024:
                    file_size_str = f"{size_bytes / 1024:.1f} KB"
                else:
                    file_size_str = f"{size_bytes / (1024 * 1024):.1f} MB"
        except Exception:
            pass
            
        return {
            'id': self.id,
            'user_id': self.user_id,
            'project_id': self.project_id,
            'calculation_id': self.calculation_id,
            'name': self.name,
            'file_path': self.file_path,
            'file_type': self.file_type,
            'file_size': file_size_str,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class History(db.Model):
    __tablename__ = 'history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    calculation_id = db.Column(db.Integer, db.ForeignKey('calculations.id', ondelete='CASCADE'), nullable=False)
    action = db.Column(db.String(100), default='Created calculation')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'calculation_id': self.calculation_id,
            'action': self.action,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'calculation': self.calculation.to_dict() if self.calculation else None
        }


class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    read_status = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'read_status': self.read_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = db.Column(db.String(150), nullable=False)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'details': self.details,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Session(db.Model):
    __tablename__ = 'sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    session_token = db.Column(db.String(255), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_token': self.session_token,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Budget(db.Model):
    __tablename__ = 'budgets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    spent = db.Column(db.Float, default=0.0)
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)
    alert_threshold = db.Column(db.Float, default=80.0)  # Percentage, e.g. 80%
    status = db.Column(db.String(50), default='Active')  # Active, Exceeded, Warning
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'project_id': self.project_id,
            'amount': self.amount,
            'spent': self.spent,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'alert_threshold': self.alert_threshold,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Recommendation(db.Model):
    __tablename__ = 'recommendations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    calculation_id = db.Column(db.Integer, db.ForeignKey('calculations.id', ondelete='CASCADE'), nullable=False)
    type = db.Column(db.String(100), nullable=False)  # Rightsizing, Unused, Reserved, etc.
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    potential_savings = db.Column(db.Float, nullable=False)
    complexity = db.Column(db.String(50), nullable=False)  # Low, Medium, High
    impact = db.Column(db.String(50), nullable=False)       # Low, Medium, High
    reasoning = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'calculation_id': self.calculation_id,
            'type': self.type,
            'title': self.title,
            'description': self.description,
            'potential_savings': self.potential_savings,
            'complexity': self.complexity,
            'impact': self.impact,
            'reasoning': self.reasoning,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ComparisonResult(db.Model):
    __tablename__ = 'comparison_results'
    
    id = db.Column(db.Integer, primary_key=True)
    calculation_id = db.Column(db.Integer, db.ForeignKey('calculations.id', ondelete='CASCADE'), nullable=False)
    provider_code = db.Column(db.String(50), nullable=False)
    monthly_cost = db.Column(db.Float, nullable=False)
    annual_cost = db.Column(db.Float, nullable=False)
    estimated_savings = db.Column(db.Float, default=0.0)
    difference_from_selected = db.Column(db.Float, default=0.0)
    diff_percent = db.Column(db.Float, default=0.0)
    ranking = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'calculation_id': self.calculation_id,
            'provider_code': self.provider_code,
            'monthly_cost': self.monthly_cost,
            'annual_cost': self.annual_cost,
            'estimated_savings': self.estimated_savings,
            'difference_from_selected': self.difference_from_selected,
            'diff_percent': self.diff_percent,
            'ranking': self.ranking,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
