from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app, origins='*')

@app.route("/")
def serve_login():
    return send_from_directory(app.template_folder, 'index.html')

@app.route('/gamemode')
def serve_gamemode():
    return send_from_directory(app.template_folder, 'gamemode.html')

@app.route('/quizmode')
def serve_quizmode():
    return send_from_directory(app.template_folder, 'quizmode.html')

if __name__ == "__main__":
    app.run(debug=True, port=5000)