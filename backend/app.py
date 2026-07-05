import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from backend.config import Config
from backend.database import db, migrate

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Setup JWT
    jwt = JWTManager(app)
    
    # Setup CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    
    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    from backend.routes.auth import auth_bp
    from backend.routes.settings import settings_bp
    from backend.routes.projects import projects_bp
    from backend.routes.calculations import calculations_bp
    from backend.routes.dashboard import dashboard_bp
    from backend.routes.reports import reports_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(calculations_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(reports_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'timestamp': os.environ.get('CURRENT_TIME', '2026-07-04T09:47:00-07:00'),
            'database': 'connected' if db.engine else 'error'
        }), 200

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Token has expired',
            'code': 'TOKEN_EXPIRED'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'error': 'Signature verification failed',
            'code': 'TOKEN_INVALID'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'error': 'Authorization header is missing',
            'code': 'TOKEN_MISSING'
        }), 401

    # Global database setup & seeding
    with app.app_context():
        try:
            db.create_all()
            logger.info("Successfully checked/created database tables.")
            
            # Seed default providers if empty
            from backend.models.models import CloudProvider, Region, PricingCatalog
            if CloudProvider.query.count() == 0:
                logger.info("Database is empty. Seeding cloud provider details and catalog metadata...")
                from backend.services.pricing_service import PROVIDER_DATA
                
                for code, details in PROVIDER_DATA.items():
                    provider = CloudProvider(
                        name=details['name'],
                        code=code,
                        description=f"Enterprise-grade service from {details['name']}.",
                        logo_url=details['logo_url'],
                        rating_performance=details['ratings']['perf'],
                        rating_security=details['ratings']['sec'],
                        scalability_rating=details['ratings']['scale'],
                        suitability_enterprise=details['ratings']['ent'],
                        suitability_startup=details['ratings']['startup'],
                        free_tier_info="Free tier options available for new subscriptions."
                    )
                    db.session.add(provider)
                    db.session.flush() # Get provider ID
                    
                    # Seed global regions
                    for r_name, r_code in [("US East (N. Virginia)", "us-east-1"), ("Europe (Frankfurt)", "eu-central-1"), ("Asia Pacific (Singapore)", "ap-southeast-1")]:
                        region = Region(
                            provider_id=provider.id,
                            name=r_name,
                            code=r_code
                        )
                        db.session.add(region)
                        db.session.flush() # Get region ID
                        
                        # Seed Pricing Catalogs
                        for service_type in ['compute', 'storage', 'object_storage', 'database', 'load_balancer', 'bandwidth', 'cdn', 'dns', 'snapshot']:
                            catalog = PricingCatalog(
                                provider_id=provider.id,
                                region_id=region.id,
                                service_type=service_type,
                                service_name=details['compute_name'] if service_type == 'compute' else (details['object_name'] if service_type == 'object_storage' else service_type.capitalize()),
                                resource_name="Standard Performance Tier",
                                price_per_hour=details['factors'].get(f'compute_vcpu', 0.0) if service_type == 'compute' else 0.0,
                                price_per_gb_month=details['factors'].get('block_storage', 0.0) if service_type == 'storage' else (details['factors'].get('object_storage', 0.0) if service_type == 'object_storage' else 0.0),
                                unit='USD'
                            )
                            db.session.add(catalog)
                
                db.session.commit()
                logger.info("Successfully seeded all providers and catalogs.")
        except Exception as e:
            logger.error(f"Error initializing or seeding database: {str(e)}")
            
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
