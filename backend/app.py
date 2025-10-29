from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import Database
from routes import api
from ai_service import AIService  # Add this import
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Application factory"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": Config.CORS_ORIGINS,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize database
    if not Database.initialize():
        logger.error("Failed to initialize database. Exiting...")
        exit(1)
    
    # Initialize AI Service
    AIService.initialize()  # Add this line
    
    # Register blueprints
    app.register_blueprint(api, url_prefix='/api')
    
    # Root route
    @app.route('/')
    def index():
        return jsonify({
            "message": "Carbon Tracker API with AI",
            "version": "2.0.0",
            "status": "running",
            "ai_enabled": Config.GEMINI_API_KEY != ""
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found"}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    logger.info("🚀 Starting Carbon Tracker API server with AI...")
    logger.info(f"📍 Server running at http://localhost:5000")
    logger.info(f"📊 API endpoints available at http://localhost:5000/api")
    logger.info(f"🤖 AI Features: {'Enabled' if Config.GEMINI_API_KEY else 'Disabled'}")
    app.run(debug=Config.DEBUG, host='0.0.0.0', port=5000)
