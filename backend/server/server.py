from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app, origins='*')

#Login Page
@app.route("/")
def serve_login():
    return send_from_directory(app.template_folder, 'index.html')

#Gamemode Page
@app.route("/api/game_state")
def game_state():
    exposed = ["1B", "2B", "3B"]
    hand    = ["RED", "RED", "GREEN"]
    return jsonify({"exposed": exposed, "hand": hand})

@app.route('/gamemode')
def serve_gamemode():
    return send_from_directory(app.template_folder, 'gamemode.html')

#Quizmode Page
@app.route('/quizmode')
def serve_quizmode():
    return send_from_directory(app.template_folder, 'quizmode.html')

if __name__ == "__main__":
    app.run(debug=True, port=5000)