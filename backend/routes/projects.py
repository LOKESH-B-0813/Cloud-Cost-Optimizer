from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.models import Project, Budget
from backend.database import db

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/api/projects', methods=['GET'])
@jwt_required()
def get_projects():
    user_id = get_jwt_identity()
    projects = Project.query.filter_by(user_id=user_id).all()
    return jsonify([p.to_dict() for p in projects]), 200


@projects_bp.route('/api/projects', methods=['POST'])
@jwt_required()
def create_project():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    cloud_provider = data.get('cloud_provider', 'AWS').strip()
    budget_amt = float(data.get('budget', 0.0))
    environment = data.get('environment', 'Production').strip()
    owner = data.get('owner', 'Lokesh B').strip()
    health_score = int(data.get('health_score', 95))
    optimization_score = int(data.get('optimization_score', 88))
    active_resources = int(data.get('active_resources', 14))
    
    if not name:
        return jsonify({'error': 'Project name is required'}), 400
        
    try:
        project = Project(
            user_id=user_id,
            name=name,
            description=description,
            cloud_provider=cloud_provider,
            budget=budget_amt,
            environment=environment,
            owner=owner,
            health_score=health_score,
            optimization_score=optimization_score,
            active_resources=active_resources
        )
        db.session.add(project)
        db.session.flush() # Fetch project ID
        
        # Provision default project budget tracker
        budget = Budget(
            user_id=user_id,
            project_id=project.id,
            amount=budget_amt,
            spent=0.0,
            alert_threshold=80.0,
            status='Active'
        )
        db.session.add(budget)
        
        db.session.commit()
        return jsonify({
            'message': 'Project created successfully',
            'project': project.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create project: {str(e)}'}), 500


@projects_bp.route('/api/projects/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    user_id = get_jwt_identity()
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    return jsonify(project.to_dict()), 200


@projects_bp.route('/api/projects/<int:project_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_project(project_id):
    user_id = get_jwt_identity()
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()
    if not project:
        return jsonify({'error': 'Project not found'}), 404
        
    data = request.get_json() or {}
    
    if 'name' in data:
        project.name = data['name'].strip()
    if 'description' in data:
        project.description = data['description'].strip()
    if 'cloud_provider' in data:
        project.cloud_provider = data['cloud_provider'].strip()
    if 'environment' in data:
        project.environment = data['environment'].strip()
    if 'owner' in data:
        project.owner = data['owner'].strip()
    if 'health_score' in data:
        project.health_score = int(data['health_score'])
    if 'optimization_score' in data:
        project.optimization_score = int(data['optimization_score'])
    if 'active_resources' in data:
        project.active_resources = int(data['active_resources'])
    if 'budget' in data:
        budget_val = float(data['budget'])
        project.budget = budget_val
        # Sync the associated Budget model
        b_model = Budget.query.filter_by(project_id=project.id).first()
        if b_model:
            b_model.amount = budget_val
            
    try:
        db.session.commit()
        return jsonify({
            'message': 'Project updated successfully',
            'project': project.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update project: {str(e)}'}), 500


@projects_bp.route('/api/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    user_id = get_jwt_identity()
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()
    if not project:
        return jsonify({'error': 'Project not found'}), 404
        
    try:
        import os
        from flask import current_app
        from backend.models.models import Calculation, Report, Budget, ComparisonResult, Recommendation, History
        
        # 1. Delete associated reports (files and records)
        reports = Report.query.filter_by(project_id=project_id, user_id=user_id).all()
        for report in reports:
            try:
                filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], report.file_path)
                if os.path.exists(filepath):
                    os.remove(filepath)
            except Exception:
                pass
            db.session.delete(report)
            
        # 2. Delete calculations and related data to avoid foreign key or orphaned entries
        calculations = Calculation.query.filter_by(project_id=project_id, user_id=user_id).all()
        for calc in calculations:
            ComparisonResult.query.filter_by(calculation_id=calc.id).delete()
            Recommendation.query.filter_by(calculation_id=calc.id).delete()
            History.query.filter_by(calculation_id=calc.id).delete()
            # Also clean up report files generated from this calculation
            calc_reports = Report.query.filter_by(calculation_id=calc.id).all()
            for cr in calc_reports:
                try:
                    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], cr.file_path)
                    if os.path.exists(filepath):
                        os.remove(filepath)
                except Exception:
                    pass
                db.session.delete(cr)
            db.session.delete(calc)
            
        # 3. Delete budgets
        Budget.query.filter_by(project_id=project_id, user_id=user_id).delete()
        
        # 4. Finally delete project
        db.session.delete(project)
        db.session.commit()
        return jsonify({'message': 'Project and all associated workloads and files deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete project: {str(e)}'}), 500
