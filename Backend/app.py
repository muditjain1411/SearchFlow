import os
from flask import Flask, request, jsonify
from routes.algorithm_routes import algorithm_bp

app = Flask(__name__)

# 1. Health check route to keep Render happy
@app.route('/')
def health_check():
    return jsonify({"status": "SearchFlow backend is running!"}), 200

# 2. Manual CORS override for all responses
@app.after_request
def add_cors_headers(response):
    # Explicitly allow your Vercel frontend
    response.headers['Access-Control-Allow-Origin'] = 'https://search-flow-visual.vercel.app'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    
    # Immediately return 200 OK for all preflight OPTIONS requests
    if request.method == 'OPTIONS':
        response.status_code = 200
        
    return response

# 3. Register your algorithms blueprint
app.register_blueprint(algorithm_bp)

if __name__ == "__main__":
    app.run(debug=True, port=5000)