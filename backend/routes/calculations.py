import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.models import Calculation, ComparisonResult, Recommendation, History, Project, Budget, Report
from backend.database import db
from backend.services.pricing_service import calculate_costs_for_all

calculations_bp = Blueprint('calculations', __name__)

@calculations_bp.route('/api/calculations/estimate', methods=['POST'])
def estimate_cost():
    """
    Dry-run cost estimation. Takes spec configuration and calculates multi-cloud comparison
    and recommendations on-the-fly without database insertion.
    """
    data = request.get_json() or {}
    try:
        results = calculate_costs_for_all(data)
        return jsonify(results), 200
    except Exception as e:
        return jsonify({'error': f'Cost estimation calculation failed: {str(e)}'}), 500


@calculations_bp.route('/api/calculations', methods=['POST'])
@jwt_required()
def save_calculation():
    """
    Calculates costs and persists the calculation, equivalents matrix, recommendations, and activity history.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    selected_provider = data.get('selected_provider', 'aws')
    region = data.get('region', 'us-east-1')
    project_id = data.get('project_id')
    
    try:
        # 1. Run Cost Calculation Engine
        calc_result = calculate_costs_for_all(data)
        selected_details = calc_result['selected_provider_cost']
        comparison_list = calc_result['comparison']
        recs_list = calc_result['recommendations']
        
        # 2. Persist main Calculation record
        calculation = Calculation(
            user_id=user_id,
            project_id=project_id if project_id else None,
            provider_code=selected_provider,
            region_code=region,
            configuration=json.dumps(data),
            monthly_cost=selected_details['monthly_cost'],
            annual_cost=selected_details['annual_cost'],
            estimated_savings=selected_details['monthly_cost'] - comparison_list[0]['monthly_cost'] # Savings against absolute cheapest option
        )
        db.session.add(calculation)
        db.session.flush() # Fetch calculation ID
        
        # 3. Save Multi-Cloud Comparison Matrix Results
        for item in comparison_list:
            comp_res = ComparisonResult(
                calculation_id=calculation.id,
                provider_code=item['provider_code'],
                monthly_cost=item['monthly_cost'],
                annual_cost=item['annual_cost'],
                estimated_savings=item['estimated_savings'],
                difference_from_selected=item['difference_from_selected'],
                diff_percent=item['diff_percent'],
                ranking=item['ranking']
            )
            db.session.add(comp_res)
            
        # 4. Save Actionable FinOps Recommendations
        for rec in recs_list:
            recommendation = Recommendation(
                user_id=user_id,
                calculation_id=calculation.id,
                type=rec['type'],
                title=rec['title'],
                description=rec['description'],
                potential_savings=rec['potential_savings'],
                complexity=rec['complexity'],
                impact=rec['impact'],
                reasoning=rec['reasoning']
            )
            db.session.add(recommendation)
            
        # 5. Insert History log
        history_log = History(
            user_id=user_id,
            calculation_id=calculation.id,
            action=f"Calculated {selected_details['provider_name']} architecture cost"
        )
        db.session.add(history_log)
        
        # 6. Update Project Budget tracking spend if project is specified
        if project_id:
            project = Project.query.get(project_id)
            if project:
                budget = Budget.query.filter_by(project_id=project.id).first()
                if budget:
                    budget.spent += selected_details['monthly_cost']
                    if budget.spent > budget.amount:
                        budget.status = 'Exceeded'
                    elif budget.spent > (budget.amount * (budget.alert_threshold / 100.0)):
                        budget.status = 'Warning'
                    else:
                        budget.status = 'Active'
                        
        db.session.commit()
        return jsonify({
            'message': 'Calculation saved successfully',
            'calculation': calculation.to_dict(),
            'comparison': comparison_list,
            'recommendations': [r for r in recs_list]
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to process and save calculation: {str(e)}'}), 500


@calculations_bp.route('/api/calculations', methods=['GET'])
@jwt_required()
def get_calculations():
    """
    Lists the calculation history with full search, sorting, and project-based filtering.
    """
    user_id = get_jwt_identity()
    
    # Query params
    provider = request.args.get('provider')
    project_id = request.args.get('project_id')
    sort_by = request.args.get('sort_by', 'created_at') # cost, savings, created_at
    order = request.args.get('order', 'desc') # asc, desc
    search_q = request.args.get('q', '')
    
    query = Calculation.query.filter_by(user_id=user_id)
    
    # Filters
    if provider:
        query = query.filter(Calculation.provider_code == provider.lower())
    if project_id:
        query = query.filter(Calculation.project_id == project_id)
        
    # Execution
    calculations = query.all()
    
    # Process memory filter for search / JSON fields if needed, or simple query matches
    records = []
    for c in calculations:
        c_dict = c.to_dict()
        
        # Fetch comparison matrix & recommendations
        comps = ComparisonResult.query.filter_by(calculation_id=c.id).order_by(ComparisonResult.ranking).all()
        recs = Recommendation.query.filter_by(calculation_id=c.id).all()
        
        c_dict['comparison'] = [item.to_dict() for item in comps]
        c_dict['recommendations'] = [rec.to_dict() for rec in recs]
        
        # Search match checks
        match = True
        if search_q:
            q = search_q.lower()
            prov_match = c.provider_code.lower()
            region_match = c.region_code.lower()
            match = (q in prov_match) or (q in region_match)
            
        if match:
            records.append(c_dict)
            
    # Sorting
    reverse_sort = (order == 'desc')
    if sort_by == 'cost':
        records.sort(key=lambda x: x['monthly_cost'], reverse=reverse_sort)
    elif sort_by == 'savings':
        records.sort(key=lambda x: x['estimated_savings'], reverse=reverse_sort)
    else: # Default is created_at
        records.sort(key=lambda x: x['created_at'] or '', reverse=reverse_sort)
        
    return jsonify(records), 200


@calculations_bp.route('/api/calculations/<int:calc_id>', methods=['GET'])
@jwt_required()
def get_calculation(calc_id):
    user_id = get_jwt_identity()
    calculation = Calculation.query.filter_by(id=calc_id, user_id=user_id).first()
    if not calculation:
        return jsonify({'error': 'Calculation not found'}), 404
        
    c_dict = calculation.to_dict()
    comps = ComparisonResult.query.filter_by(calculation_id=calculation.id).order_by(ComparisonResult.ranking).all()
    recs = Recommendation.query.filter_by(calculation_id=calculation.id).all()
    
    c_dict['comparison'] = [item.to_dict() for item in comps]
    c_dict['recommendations'] = [rec.to_dict() for rec in recs]
    
    return jsonify(c_dict), 200


@calculations_bp.route('/api/calculations/<int:calc_id>', methods=['DELETE'])
@jwt_required()
def delete_calculation(calc_id):
    user_id = get_jwt_identity()
    calculation = Calculation.query.filter_by(id=calc_id, user_id=user_id).first()
    if not calculation:
        return jsonify({'error': 'Calculation not found'}), 404
        
    try:
        import os
        from flask import current_app
        # Delete associated reports' physical files and database rows
        reports = Report.query.filter_by(calculation_id=calculation.id).all()
        for report in reports:
            try:
                filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], report.file_path)
                if os.path.exists(filepath):
                    os.remove(filepath)
            except Exception:
                pass
            db.session.delete(report)

        # Also clean up associated budget spend if applicable
        if calculation.project_id:
            budget = Budget.query.filter_by(project_id=calculation.project_id).first()
            if budget:
                budget.spent = max(0.0, budget.spent - calculation.monthly_cost)
                if budget.spent > budget.amount:
                    budget.status = 'Exceeded'
                elif budget.spent > (budget.amount * (budget.alert_threshold / 100.0)):
                    budget.status = 'Warning'
                else:
                    budget.status = 'Active'
                    
        db.session.delete(calculation)
        db.session.commit()
        return jsonify({'message': 'Calculation history item deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete calculation: {str(e)}'}), 500
