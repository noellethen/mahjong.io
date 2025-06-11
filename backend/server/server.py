from flask import Flask, jsonify, request
from flask_cors import CORS
from game import Game
import threading
import time

app = Flask(__name__)
cors = CORS(app, origins='*')
game = Game()
game.start_game()

#Gamemode Page
@app.route("/api/game_state")
def game_state():
    player_1_info = game.get_player_info(1)
    current_player = game.players[game.turn]
    print(f"Current Turn: {game.turn}")
    print(f"Player 1's hand: {game.players[0].hand}")
    print(f"Player 2's hand: {game.players[1].hand}")
    print(f"Player 3's hand: {game.players[2].hand}")
    print(f"Player 4's hand: {game.players[3].hand}")

    discarded_tile = None

    if game.turn != 0:
        discarded_tile = game.bot_discard()
        print(f"Bot discarded tile: {discarded_tile}")
        game.turn = (game.turn + 1) % 4
    
    return jsonify({
        "bonus": player_1_info.get("bonus_tiles", []),
        "exposed": player_1_info.get("exposed_hand", []),
        "hand": player_1_info.get("hand", []),
        "current_turn": (current_player.id - 1),
        "discarded_tile": discarded_tile if discarded_tile else None
    })

@app.route("/api/discard_tile", methods=["POST"])
def discard_tile():
    data = request.get_json()
    discarded_tile = data.get("tile")
    idx = data.get("idx")

    if (game.turn == 0):
        print(f"Player selected tile: {discarded_tile}")
        print(f"Player 1's hand before discard: {game.players[0].hand}")
        game.discard_tile(1, discarded_tile)
        print(f"Player 1's hand after discard: {game.players[0].hand}")

    game.turn = (game.turn + 1) % 4

    return jsonify({
        "message": "Tile discarded", 
        "discarded_tile": discarded_tile, 
        "current_turn": (game.players[game.turn].id - 1)
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)