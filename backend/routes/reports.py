import os
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.models import Report, Calculation
from backend.database import db
from backend.services.report_service import ReportService
from backend.services.pricing_service import calculate_costs_for_all

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/api/reports', methods=['GET'])
@jwt_required()
def get_reports():
    user_id = get_jwt_identity()
    reports = Report.query.filter_by(user_id=user_id).order_by(Report.created_at.desc()).all()
    return jsonify([r.to_dict() for r in reports]), 200


@reports_bp.route('/api/reports/generate', methods=['POST'])
@jwt_required()
def generate_report():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    calc_id = data.get('calculation_id')
    file_type = data.get('file_type', 'PDF').upper() # PDF, CSV, EXCEL
    project_id = data.get('project_id')
    
    if not calc_id:
        return jsonify({'error': 'Calculation ID is required to compile a report.'}), 400
        
    calculation = Calculation.query.filter_by(id=calc_id, user_id=user_id).first()
    if not calculation:
        return jsonify({'error': 'Source calculation record not found.'}), 404
        
    try:
        import json
        config_data = json.loads(calculation.configuration)
        
        # Calculate full cost comparison data structure
        calc_data = calculate_costs_for_all(config_data)
        
        # Setup file paths
        timestamp = os.environ.get('CURRENT_TIME', '2026-07-04_09-47-00')
        filename = f"cloud_optimizer_report_{calc_id}_{timestamp}." + ("csv" if file_type == 'CSV' else ("xlsx" if file_type == 'EXCEL' else "pdf"))
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        
        # Execute report compiling
        if file_type == 'CSV':
            ReportService.generate_csv(calc_data, filepath)
        elif file_type == 'EXCEL':
            ReportService.generate_excel(calc_data, filepath)
        else: # Default is PDF
            ReportService.generate_pdf(calc_data, filepath)
            
        # Register generated report in database
        report_record = Report(
            user_id=user_id,
            project_id=project_id if project_id else calculation.project_id,
            calculation_id=calc_id,
            name=f"Cost Benchmarking Report ({file_type})",
            file_path=filename,
            file_type=file_type
        )
        db.session.add(report_record)
        db.session.commit()
        
        return jsonify({
            'message': f'{file_type} report compiled successfully',
            'report': report_record.to_dict(),
            'download_url': f"/api/reports/download/{report_record.id}"
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to generate report: {str(e)}'}), 500


@reports_bp.route('/api/reports/download/<int:report_id>', methods=['GET'])
def download_report(report_id):
    from flask_jwt_extended import decode_token, get_jwt_identity
    token = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    else:
        token = request.args.get('token') or request.args.get('jwt')
        
    if not token:
        return jsonify({'error': 'Missing authorization token'}), 401
        
    try:
        decoded = decode_token(token)
        user_id = decoded['sub']
    except Exception as e:
        return jsonify({'error': f'Invalid token: {str(e)}'}), 401
        
    report = Report.query.filter_by(id=report_id, user_id=user_id).first()
    if not report:
        return jsonify({'error': 'Report not found or permission denied'}), 404
        
    upload_dir = current_app.config['UPLOAD_FOLDER']
    filename = report.file_path
    
    if not os.path.exists(os.path.join(upload_dir, filename)):
        return jsonify({'error': 'File does not exist on disk'}), 410
        
    return send_from_directory(
        directory=upload_dir,
        path=filename,
        as_attachment=True
    )


@reports_bp.route('/api/reports/<int:report_id>', methods=['DELETE'])
@jwt_required()
def delete_report(report_id):
    user_id = get_jwt_identity()
    report = Report.query.filter_by(id=report_id, user_id=user_id).first()
    if not report:
        return jsonify({'error': 'Report not found'}), 404
        
    try:
        # Delete file from disk if present
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], report.file_path)
        if os.path.exists(filepath):
            os.remove(filepath)
            
        db.session.delete(report)
        db.session.commit()
        return jsonify({'message': 'Report record deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete report: {str(e)}'}), 500
