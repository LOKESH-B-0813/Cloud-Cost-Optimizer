from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.models import Calculation, Project, Report, History, Budget
from backend.database import db

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    user_id = get_jwt_identity()
    
    # 1. Fetch live metrics
    projects = Project.query.filter_by(user_id=user_id).all()
    project_count = len(projects)
    
    calculations = Calculation.query.filter_by(user_id=user_id).all()
    calc_count = len(calculations)
    
    reports = Report.query.filter_by(user_id=user_id).all()
    reports_count = len(reports)
    
    history_count = History.query.filter_by(user_id=user_id).count()
    
    # Summing monthly costs & annual costs from active calculations
    total_monthly = sum((c.monthly_cost or 0.0) for c in calculations)
    total_annual = sum((c.annual_cost or 0.0) for c in calculations)
    total_savings = sum((c.estimated_savings or 0.0) for c in calculations)
    
    # Budgets
    budgets = Budget.query.filter_by(user_id=user_id).all()
    total_budget_amount = sum((b.amount or 0.0) for b in budgets)
    total_budget_spent = sum((b.spent or 0.0) for b in budgets)
    
    # Provider Distribution
    provider_counts = {}
    for c in calculations:
        prov = (c.provider_code or 'UNKNOWN').upper()
        provider_counts[prov] = provider_counts.get(prov, 0) + 1

    # Resource Cost Breakdown Aggregation
    resource_breakdown = {
        'compute': 0.0,
        'storage': 0.0,
        'database': 0.0,
        'networking': 0.0,
        'other': 0.0
    }
    
    import json
    for c in calculations:
        try:
            config = json.loads(c.configuration)
            # Fetch estimation on the fly to get real cost categories
            from backend.services.pricing_service import calculate_costs_for_all
            res = calculate_costs_for_all(config)
            bd = res['selected_provider_cost']['breakdown']
            resource_breakdown['compute'] += bd.get('compute', 0.0)
            resource_breakdown['storage'] += bd.get('block_storage', 0.0) + bd.get('object_storage', 0.0) + bd.get('snapshot_backup', 0.0)
            resource_breakdown['database'] += bd.get('database', 0.0)
            resource_breakdown['networking'] += bd.get('bandwidth', 0.0) + bd.get('cdn', 0.0) + bd.get('dns', 0.0)
            resource_breakdown['other'] += bd.get('load_balancer', 0.0) + bd.get('tax', 0.0)
        except Exception:
            pass
        
    # Cost Trend last 6 months (Dynamic aggregation from DB)
    months_list = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    from datetime import datetime
    curr_month = datetime.utcnow().month
    trend_months = []
    for i in range(5, -1, -1):
        m_idx = (curr_month - 1 - i) % 12
        trend_months.append(months_list[m_idx])
        
    trend_dict = {m: {"spend": 0.0, "savings": 0.0} for m in trend_months}
    for c in calculations:
        if c.created_at:
            m_name = months_list[c.created_at.month - 1]
            if m_name in trend_dict:
                trend_dict[m_name]["spend"] += (c.monthly_cost or 0.0)
                trend_dict[m_name]["savings"] += (c.estimated_savings or 0.0)
                
    cost_trend = [{"month": m, "spend": round(trend_dict[m]["spend"], 2), "savings": round(trend_dict[m]["savings"], 2)} for m in trend_months]
    
    # Provider Distribution structure
    prov_dist = []
    for prov, count in provider_counts.items():
        prov_dist.append({'name': prov, 'value': count})
        
    # Savings analysis list
    savings_trend = [
        {"name": "Compute Rightsizing", "value": round(resource_breakdown['compute'] * 0.25, 2)},
        {"name": "Spot Instance Migration", "value": round(resource_breakdown['compute'] * 0.15, 2)},
        {"name": "Storage Archiving", "value": round(resource_breakdown['storage'] * 0.30, 2)},
        {"name": "Alternative Cloud Mapping", "value": round(total_savings, 2)}
    ]
    
    # List top spending projects
    project_spend = []
    for p in projects:
        p_budget = Budget.query.filter_by(project_id=p.id).first()
        project_spend.append({
            'id': p.id,
            'name': p.name,
            'provider': p.cloud_provider or 'Multi-Cloud',
            'budget': p.budget or 0.0,
            'spent': p_budget.spent if (p_budget and p_budget.spent) else 0.0
        })

    return jsonify({
        'monthly_cost': round(total_monthly, 2),
        'annual_cost': round(total_annual, 2),
        'estimated_savings': round(total_savings, 2),
        'project_count': project_count,
        'report_count': reports_count,
        'calc_count': calc_count,
        'history_count': history_count,
        'budget_limit': round(total_budget_amount, 2),
        'budget_spent': round(total_budget_spent, 2),
        'resource_distribution': resource_breakdown,
        'provider_distribution': prov_dist,
        'cost_trend': cost_trend,
        'savings_trend': savings_trend,
        'project_spend_matrix': project_spend
    }), 200
