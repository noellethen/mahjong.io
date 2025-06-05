from flask import Flask, jsonify, request
from flask_cors import CORS
from game import Game

app = Flask(__name__)
cors = CORS(app, origins='*')

#Gamemode Page
@app.route("/api/game_state")
def game_state():
    game = Game()
    game.deal_tiles()
    player_1_info = game.get_player_info(1)
    
    return jsonify({
        "bonus": player_1_info.get("bonus_tiles", []),
        "exposed": player_1_info.get("exposed_hand", []),
        "hand": player_1_info.get("hand", [])
    })

@app.route("/api/select_tile", methods=["POST"])
def select_tile():
    data = request.get_json()
    selected_tile = data.get("tile")

    print(f"Player selected tile: {selected_tile}")

    return jsonify({"message": "Tile received", "tile": selected_tile})

if __name__ == "__main__":
    app.run(debug=True, port=5000)