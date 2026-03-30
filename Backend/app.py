# backend/app.py

from flask import Flask
from flask_cors import CORS
from routes.algorithm_routes import algorithm_bp
import os

app = Flask(__name__)

# Use uppercase for environment variables and add your Vite localhost as the fallback
frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
app.config['frontend_url'] = frontend_url

# Now it will always have a valid origin to allow
CORS(app, origins=[app.config['frontend_url']])  

app.register_blueprint(algorithm_bp)


@app.route('/')
def health_check():
    return {"status": "Backend is running!"}, 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)