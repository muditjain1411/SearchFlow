# backend/app.py

from flask import Flask
from flask_cors import CORS
from routes.algorithm_routes import algorithm_bp

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # Vite dev server only

# Register blueprints
app.register_blueprint(algorithm_bp)

if __name__ == "__main__":
    app.run(debug=True, port=5000)