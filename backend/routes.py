from flask import Blueprint, request, jsonify
from models import Organization, Activity, Calculation, Scenario
from datetime import datetime

api = Blueprint('api', __name__)

# ==================== ORGANIZATION ROUTES ====================

@api.route('/organizations', methods=['POST'])
def create_organization():
    """Create a new organization"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'sector', 'org_size', 'country']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        org_id = Organization.create(
            name=data['name'],
            sector=data['sector'],
            org_size=data['org_size'],
            country=data['country']
        )
        
        return jsonify({
            "success": True,
            "message": "Organization created successfully",
            "org_id": org_id
        }), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/organizations/<org_id>', methods=['GET'])
def get_organization(org_id):
    """Get organization by ID"""
    try:
        org = Organization.get_by_id(org_id)
        if org:
            return jsonify({"success": True, "data": org}), 200
        else:
            return jsonify({"error": "Organization not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/organizations', methods=['GET'])
def get_all_organizations():
    """Get all organizations"""
    try:
        orgs = Organization.get_all()
        return jsonify({"success": True, "data": orgs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== ACTIVITY ROUTES ====================

@api.route('/activities', methods=['POST'])
def create_activities():
    """Create activities and calculate emissions"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'org_id' not in data:
            return jsonify({"error": "Missing org_id"}), 400
        if 'activities' not in data or not isinstance(data['activities'], list):
            return jsonify({"error": "Missing or invalid activities array"}), 400
        
        org_id = data['org_id']
        activities_data = data['activities']
        
        created_activities = []
        calculations = []
        
        for activity_data in activities_data:
            # Create activity
            activity_id = Activity.create(
                org_id=org_id,
                activity_date=activity_data['activity_date'],
                category=activity_data['category'],
                subcategory=activity_data['subcategory'],
                unit=activity_data['unit'],
                quantity=activity_data['quantity'],
                scope=activity_data['scope'],
                meta_json=activity_data.get('meta_json')
            )
            
            created_activities.append(activity_id)
            
            # Calculate emission
            emission = Calculation.calculate_emission(activity_data)
            
            # Save calculation
            calc_id = Calculation.create(
                activity_id=activity_id,
                org_id=org_id,
                scope=activity_data['scope'],
                co2e_kg=emission['co2e_kg'],
                factor_used=emission['factor_used'],
                method=emission['method']
            )
            
            calculations.append({
                "activity_id": activity_id,
                "calc_id": calc_id,
                "emission": emission
            })
        
        # Get summary
        summary = Calculation.get_summary(org_id)
        
        return jsonify({
            "success": True,
            "message": f"{len(created_activities)} activities created and emissions calculated",
            "activity_ids": created_activities,
            "calculations": calculations,
            "summary": summary
        }), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/activities/<org_id>', methods=['GET'])
def get_activities(org_id):
    """Get activities by organization"""
    try:
        # Get optional date filters from query params
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        activities = Activity.get_by_org(org_id, start_date, end_date)
        
        return jsonify({
            "success": True,
            "count": len(activities),
            "data": activities
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/activities/<activity_id>', methods=['DELETE'])
def delete_activity(activity_id):
    """Delete an activity"""
    try:
        success = Activity.delete_by_id(activity_id)
        if success:
            return jsonify({"success": True, "message": "Activity deleted"}), 200
        else:
            return jsonify({"error": "Activity not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== CALCULATION ROUTES ====================

@api.route('/calculations/<org_id>', methods=['GET'])
def get_calculations(org_id):
    """Get all calculations for an organization"""
    try:
        calculations = Calculation.get_by_org(org_id)
        return jsonify({
            "success": True,
            "count": len(calculations),
            "data": calculations
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/calculations/<org_id>/summary', methods=['GET'])
def get_emission_summary(org_id):
    """Get emission summary by scope"""
    try:
        summary = Calculation.get_summary(org_id)
        return jsonify({
            "success": True,
            "data": summary
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== SCENARIO ROUTES ====================

@api.route('/scenarios', methods=['POST'])
def create_scenario():
    """Create a new scenario"""
    try:
        data = request.get_json()
        
        scenario_id = Scenario.create(
            org_id=data['org_id'],
            name=data['name'],
            description=data.get('description', ''),
            reduction_percentage=data['reduction_percentage'],
            strategy_type=data.get('strategy_type', 'custom')
        )
        
        return jsonify({
            "success": True,
            "message": "Scenario created successfully",
            "scenario_id": scenario_id
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/scenarios/<org_id>', methods=['GET'])
def get_scenarios(org_id):
    """Get all scenarios for an organization"""
    try:
        scenarios = Scenario.get_by_org(org_id)
        return jsonify({
            "success": True,
            "count": len(scenarios),
            "data": scenarios
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== HEALTH CHECK ====================

@api.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }), 200


# Add this import at the top
from ai_service import AIService

# Add these routes before the health check route

# ==================== AI ROUTES ====================

@api.route('/ai/insights/<org_id>', methods=['GET'])
def get_ai_insights(org_id):
    """Generate AI-powered insights for an organization"""
    try:
        print(f"\n=== GENERATING AI INSIGHTS for org_id: {org_id} ===")
        
        # Get organization data
        org = Organization.get_by_id(org_id)
        if not org:
            return jsonify({"error": "Organization not found"}), 404
        
        # Get emission summary
        summary = Calculation.get_summary(org_id)
        
        # Get activities
        activities = Activity.get_by_org(org_id)
        
        # Get calculations
        calculations = Calculation.get_by_org(org_id)
        
        # Generate AI insights
        insights = AIService.generate_insights(org, summary, activities, calculations)
        
        print(f"✅ AI insights generated successfully")
        
        return jsonify({
            "success": True,
            "data": insights
        }), 200
        
    except Exception as e:
        print(f"❌ Error generating AI insights: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@api.route('/ai/scenario', methods=['POST'])
def analyze_scenario():
    """Analyze what-if scenario using AI"""
    try:
        data = request.get_json()
        
        print(f"\n=== ANALYZING SCENARIO ===")
        print(f"Query: {data.get('query')}")
        
        if 'org_id' not in data or 'query' not in data:
            return jsonify({"error": "Missing org_id or query"}), 400
        
        org_id = data['org_id']
        query = data['query']
        
        # Get organization data
        org = Organization.get_by_id(org_id)
        if not org:
            return jsonify({"error": "Organization not found"}), 404
        
        # Get emission summary
        summary = Calculation.get_summary(org_id)
        
        # Analyze scenario with AI
        analysis = AIService.analyze_scenario(org, summary, query)
        
        print(f"✅ Scenario analyzed successfully")
        
        return jsonify({
            "success": True,
            "data": {
                "query": query,
                "analysis": analysis,
                "timestamp": datetime.utcnow().isoformat()
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error analyzing scenario: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
