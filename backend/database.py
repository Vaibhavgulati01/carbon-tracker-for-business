from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from config import Config
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Database:
    client = None
    db = None
    
    @classmethod
    def initialize(cls):
        """Initialize MongoDB connection"""
        try:
            cls.client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=5000)
            # Test connection
            cls.client.admin.command('ping')
            cls.db = cls.client[Config.DATABASE_NAME]
            logger.info(f"✅ Connected to MongoDB database: {Config.DATABASE_NAME}")
            
            # Create indexes for better performance
            cls.create_indexes()
            
            return True
        except ConnectionFailure as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            return False
    
    @classmethod
    def create_indexes(cls):
        """Create indexes on collections"""
        try:
            # Organizations indexes
            cls.db.organizations.create_index("name")
            cls.db.organizations.create_index("sector")
            
            # Users indexes
            cls.db.users.create_index("email", unique=True)
            cls.db.users.create_index("org_id")
            
            # Activities indexes
            cls.db.activities.create_index("org_id")
            cls.db.activities.create_index("activity_date")
            cls.db.activities.create_index([("org_id", 1), ("activity_date", -1)])
            
            # Calculations indexes
            cls.db.calculations.create_index("org_id")
            cls.db.calculations.create_index("scope")
            
            # Scenarios indexes
            cls.db.scenarios.create_index("org_id")
            
            logger.info("✅ Database indexes created successfully")
        except Exception as e:
            logger.error(f"❌ Error creating indexes: {e}")
    
    @classmethod
    def get_collection(cls, collection_name):
        """Get a specific collection"""
        if cls.db is None:
            cls.initialize()
        return cls.db[collection_name]
    
    @classmethod
    def close(cls):
        """Close database connection"""
        if cls.client:
            cls.client.close()
            logger.info("✅ MongoDB connection closed")
