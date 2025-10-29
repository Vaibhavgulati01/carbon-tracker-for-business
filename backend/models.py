from datetime import datetime
from bson.objectid import ObjectId
from database import Database
import bcrypt

class Organization:
    collection = None
    
    @classmethod
    def initialize(cls):
        cls.collection = Database.get_collection('organizations')
    
    @classmethod
    def create(cls, name, sector, org_size, country):
        """Create a new organization"""
        if cls.collection is None:
            cls.initialize()
        
        org_data = {
            "name": name,
            "sector": sector,
            "org_size": org_size,
            "country": country,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = cls.collection.insert_one(org_data)
        return str(result.inserted_id)
    
    @classmethod
    def get_by_id(cls, org_id):
        """Get organization by ID"""
        if cls.collection is None:
            cls.initialize()
        
        try:
            org = cls.collection.find_one({"_id": ObjectId(org_id)})
            if org:
                org['_id'] = str(org['_id'])
            return org
        except:
            return None
    
    @classmethod
    def get_all(cls):
        """Get all organizations"""
        if cls.collection is None:
            cls.initialize()
        
        orgs = list(cls.collection.find())
        for org in orgs:
            org['_id'] = str(org['_id'])
        return orgs


class Activity:
    collection = None
    
    @classmethod
    def initialize(cls):
        cls.collection = Database.get_collection('activities')
    
    @classmethod
    def create(cls, org_id, activity_date, category, subcategory, unit, quantity, scope, meta_json=None):
        """Create a new activity"""
        if cls.collection is None:
            cls.initialize()
        
        activity_data = {
            "org_id": org_id,
            "activity_date": activity_date,
            "category": category,
            "subcategory": subcategory,
            "unit": unit,
            "quantity": float(quantity),
            "scope": int(scope),
            "meta_json": meta_json,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = cls.collection.insert_one(activity_data)
        return str(result.inserted_id)
    
    @classmethod
    def create_many(cls, activities):
        """Create multiple activities"""
        if cls.collection is None:
            cls.initialize()
        
        for activity in activities:
            activity['created_at'] = datetime.utcnow()
            activity['updated_at'] = datetime.utcnow()
        
        result = cls.collection.insert_many(activities)
        return [str(id) for id in result.inserted_ids]
    
    @classmethod
    def get_by_org(cls, org_id, start_date=None, end_date=None):
        """Get activities by organization"""
        if cls.collection is None:
            cls.initialize()
        
        query = {"org_id": org_id}
        
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            query["activity_date"] = date_filter
        
        activities = list(cls.collection.find(query).sort("activity_date", -1))
        for activity in activities:
            activity['_id'] = str(activity['_id'])
        return activities
    
    @classmethod
    def get_by_id(cls, activity_id):
        """Get activity by ID"""
        if cls.collection is None:
            cls.initialize()
        
        try:
            activity = cls.collection.find_one({"_id": ObjectId(activity_id)})
            if activity:
                activity['_id'] = str(activity['_id'])
            return activity
        except:
            return None
    
    @classmethod
    def delete_by_id(cls, activity_id):
        """Delete activity by ID"""
        if cls.collection is None:
            cls.initialize()
        
        try:
            result = cls.collection.delete_one({"_id": ObjectId(activity_id)})
            return result.deleted_count > 0
        except:
            return False


class Calculation:
    collection = None
    
    # Emission factors (simplified - you can expand this)
    EMISSION_FACTORS = {
        'Diesel': 2.65,  # kg CO2e per liter
        'Petrol/Gasoline': 2.31,
        'Natural Gas': 0.185,  # kg CO2e per kWh
        'Grid Electricity': 0.5,  # kg CO2e per kWh (varies by region)
        'LPG': 1.51,
        'Coal': 2.86,
    }
    
    @classmethod
    def initialize(cls):
        cls.collection = Database.get_collection('calculations')
    
    @classmethod
    def calculate_emission(cls, activity):
        """Calculate CO2e emission for an activity"""
        subcategory = activity.get('subcategory')
        quantity = float(activity.get('quantity', 0))
        
        # Get emission factor
        factor = cls.EMISSION_FACTORS.get(subcategory, 0.5)  # Default factor
        
        # Calculate CO2e in kg
        co2e_kg = quantity * factor
        
        return {
            "co2e_kg": round(co2e_kg, 2),
            "co2e_tons": round(co2e_kg / 1000, 4),
            "factor_used": factor,
            "method": "Default Emission Factor"
        }
    
    @classmethod
    def create(cls, activity_id, org_id, scope, co2e_kg, factor_used, method):
        """Save calculation result"""
        if cls.collection is None:
            cls.initialize()
        
        calc_data = {
            "activity_id": activity_id,
            "org_id": org_id,
            "scope": int(scope),
            "co2e_kg": float(co2e_kg),
            "co2e_tons": float(co2e_kg) / 1000,
            "factor_used": float(factor_used),
            "method": method,
            "created_at": datetime.utcnow()
        }
        
        result = cls.collection.insert_one(calc_data)
        return str(result.inserted_id)
    
    @classmethod
    def get_by_org(cls, org_id):
        """Get all calculations for an organization"""
        if cls.collection is None:
            cls.initialize()
        
        calculations = list(cls.collection.find({"org_id": org_id}))
        for calc in calculations:
            calc['_id'] = str(calc['_id'])
        return calculations
    
    @classmethod
    def get_summary(cls, org_id):
        """Get emission summary by scope"""
        if cls.collection is None:
            cls.initialize()
        
        pipeline = [
            {"$match": {"org_id": org_id}},
            {"$group": {
                "_id": "$scope",
                "total_co2e_kg": {"$sum": "$co2e_kg"},
                "total_co2e_tons": {"$sum": "$co2e_tons"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        
        results = list(cls.collection.aggregate(pipeline))
        
        summary = {
            "scope1": 0,
            "scope2": 0,
            "scope3": 0,
            "total": 0
        }
        
        for result in results:
            scope = result['_id']
            tons = result['total_co2e_tons']
            summary[f'scope{scope}'] = round(tons, 2)
            summary['total'] += tons
        
        summary['total'] = round(summary['total'], 2)
        return summary


class Scenario:
    collection = None
    
    @classmethod
    def initialize(cls):
        cls.collection = Database.get_collection('scenarios')
    
    @classmethod
    def create(cls, org_id, name, description, reduction_percentage, strategy_type):
        """Create a new scenario"""
        if cls.collection is None:
            cls.initialize()
        
        scenario_data = {
            "org_id": org_id,
            "name": name,
            "description": description,
            "reduction_percentage": float(reduction_percentage),
            "strategy_type": strategy_type,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = cls.collection.insert_one(scenario_data)
        return str(result.inserted_id)
    
    @classmethod
    def get_by_org(cls, org_id):
        """Get all scenarios for an organization"""
        if cls.collection is None:
            cls.initialize()
        
        scenarios = list(cls.collection.find({"org_id": org_id}))
        for scenario in scenarios:
            scenario['_id'] = str(scenario['_id'])
        return scenarios
