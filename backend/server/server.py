from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app, origins='*')

#Gamemode Page
@app.route("/api/game_state")
def game_state():
    exposed = ["1B", "2B", "3B"]
    hand    = ["RED", "RED", "GREEN"]
    return jsonify({"exposed": exposed, "hand": hand})

@app.route("/api/select_tile", methods=["POST"])
def select_tile():
    data = request.get_json()
    selected_tile = data.get("tile")

    print(f"Player selected tile: {selected_tile}")

    return jsonify({"message": "Tile received", "tile": selected_tile})

if __name__ == "__main__":
    app.run(debug=True, port=5000)