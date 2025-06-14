from flask import Flask, jsonify, request
from flask_cors import CORS
from game import Game
from rules import can_chi           

app = Flask(__name__)
cors = CORS(app, origins='*')
game = Game()
game.start_game()

# Gamemode Page
@app.route("/api/game_state")
def game_state():
    game.turn = game.turn % len(game.players)

    player_1_info = game.get_player_info(1)
    current_player = game.players[game.turn]

    # For debugging
    print(f"Current Turn: {game.turn}")
    print(f"Player 1's hand: {game.players[0].hand}")
    print(f"Player 2's hand: {game.players[1].hand}")
    print(f"Player 3's hand: {game.players[2].hand}")
    print(f"Player 4's hand: {game.players[3].hand}")

    discarded_tile = None
    drawn_tile = None

    if game.turn == 0:
        if game.wall and not game.has_drawn and game.last_discard is None:
            drawn_tile = game.draw_tile()
            game.has_drawn = True
    else:
        if game.wall and not game.has_drawn:
            drawn_tile = game.draw_tile()
            game.has_drawn = True
        
        print(f"Bot drew tile: {drawn_tile}")
        discarded_tile = game.bot_discard()
        print(f"Bot discarded tile: {discarded_tile}")
        game.has_drawn = False

        if discarded_tile and can_chi(game.players[0].hand, discarded_tile):
            game.last_discard = discarded_tile
        else:
            game.last_discard = None

        game.turn = (game.turn + 1) % 4

    possibleChi = []
    if game.turn == 0 and game.last_discard:
        possibleChi = game.get_chi_options(1)

    return jsonify({
        "bonus":          player_1_info.get("bonus_tiles", []),
        "exposed":        player_1_info.get("exposed_hand", []),
        "hand":           player_1_info.get("hand", []),
        "current_turn":   current_player.id - 1,
        "discarded_tile": discarded_tile,
        "drawn_tile":     drawn_tile,
        "possibleChi":    possibleChi
    })

@app.route("/api/discard_tile", methods=["POST"])
def discard_tile():
    data = request.get_json()
    discarded_tile = data.get("tile")
    idx = data.get("idx")

    if game.turn == 0:
        print(f"Player selected tile: {discarded_tile}")
        print(f"Player 1's hand before discard: {game.players[0].hand}")
        game.discard_tile(1, discarded_tile)
        print(f"Player 1's hand after discard: {game.players[0].hand}")
        game.players[0].hand = game.sort_tiles(game.players[0].hand)
        game.has_drawn = False
        game.turn = (game.turn + 1) % 4

    return jsonify({
        "message":        "Tile discarded",
        "discarded_tile": discarded_tile,
        "current_turn":   game.players[game.turn].id - 1
    })

@app.route("/api/chi", methods=["POST"])
def chi():
    data = request.get_json()
    tiles = data.get("tiles")  # e.g. ["2B","3B","4B"]
    print(f"Player chose Chi for tiles: {tiles}")

    from rules import resolve_chi
    resolve_chi(game.players[0], game.last_discard)
    print(f"Resolved Chi with discard: {game.last_discard}")
    game.last_discard = None
    game.turn = 0
    game.has_drawn = True    

    info = game.get_player_info(1)
    return jsonify({
        "hand":         info.get("hand", []),
        "exposed":      info.get("exposed_hand", []),
        "current_turn": game.turn
    })

@app.route("/api/pass_chi", methods=["POST"])
def pass_chi():
    game.pass_chi()
    game.turn = 0
    game.has_drawn = False   

    return jsonify({"message": "Chi passed"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
