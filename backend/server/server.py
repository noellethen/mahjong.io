from flask import Flask, jsonify, request
from flask_cors import CORS
from game import Game
from rules import can_chi, can_pong , check_win, check_win_discard, calculate_tai      

app = Flask(__name__)
cors = CORS(app, origins='*')
game = Game()
game.start_game()
game.last_discarder = None
game.winner = None
game.is_draw = False

# Gamemode Page
@app.route("/api/game_state")
def game_state():
    game.turn = game.turn % len(game.players)

    if game.winner:
        return jsonify({"winner": game.winner.id, "tai": game.winner.tai})
    
    if game.is_draw:
        return jsonify({"draw": True})

    if not game.wall and game.last_discard is None:
        print("Wall exhausted — draw game.")
        game.is_draw = True
        return jsonify({"draw": True})
    
    player = game.players[0]
    if game.turn == 0 and game.has_drawn and game.last_discard is None:
        if check_win(player.hand, player.exposed_hand):
            calculate_tai(player)
            game.winner = player
            print(f"Player {player.id} wins by self-draw with {player.tai} Tai!")
            return jsonify({"winner": player.id, "tai": player.tai})

    player_1_info = game.get_player_info(1)
    current_player = game.players[game.turn]

    # For debugging
    print(f"Current Turn: {game.turn}")
    print(f"Player 1's hand: {game.players[0].hand}")
    print(f"Player 1's bonus tiles: {player_1_info['bonus_tiles']}")
    print(f"Player 2's hand: {game.players[1].hand}")
    print(f"Player 2's bonus tiles: {game.players[1].bonus_tiles}")
    print(f"Player 3's hand: {game.players[2].hand}")
    print(f"Player 3's bonus tiles: {game.players[2].bonus_tiles}")
    print(f"Player 4's hand: {game.players[3].hand}")
    print(f"Player 4's bonus tiles: {game.players[3].bonus_tiles}")

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
        bot_idx = game.turn
        discarded_tile = game.bot_discard()
        print(f"Bot discarded tile: {discarded_tile}")
        game.has_drawn = False

        if discarded_tile is not None:
            winner = check_win_discard(game, game.players[bot_idx], discarded_tile)
            if winner:
                calculate_tai(winner)
                game.winner = winner
                print(f"Player {winner.id} wins by discard with {winner.tai} Tai!")
                return jsonify({"winner": winner.id, "tai": winner.tai})

        keep_pong = discarded_tile and can_pong(game.players[0].hand, discarded_tile)

        interactive_idx = game.interactive_player_id - 1
        predecessor_idx = (interactive_idx - 1) % len(game.players)
        keep_chi = (
            discarded_tile
            and can_chi(game.players[0].hand, discarded_tile)
            and (game.turn == predecessor_idx)
        )

        if keep_pong or keep_chi:
            game.last_discard = discarded_tile
            game.last_discarder = bot_idx
            game.turn = 0
        else:
            game.last_discard = None
            game.turn = (game.turn + 1) % 4

    response = {
        "bonus":          player_1_info["bonus_tiles"],
        "exposed":        player_1_info["exposed_hand"],
        "hand":           player_1_info["hand"],
        "current_turn":   current_player.id - 1,
        "discarded_tile": discarded_tile,
        "drawn_tile":     drawn_tile,
        "possiblePong":   ([game.get_pong_option(1)] if game.turn == 0 and game.get_pong_option(1) else []),
        "possibleChi":    (game.get_chi_options(1) if game.turn == 0 else []),
    }

    players_info = []
    for p in game.players:
        info = game.get_player_info(p.id)
        players_info.append({
            "id":      p.id,
            "bonus":   info["bonus_tiles"],
            "exposed": info["exposed_hand"],
        })
    response["players"] = players_info

    return jsonify(response)

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

        if discarded_tile is not None:
            winner = check_win_discard(game, game.players[0], discarded_tile)
            if winner:
                calculate_tai(winner)
                game.winner = winner           
                print(f"Player {winner.id} wins by discard with {winner.tai} Tai!")
                return jsonify({"winner": winner.id, "tai": winner.tai})
    
    game.turn = (game.turn + 1) % 4

    return jsonify({
        "message":        "Tile discarded",
        "discarded_tile": discarded_tile,
        "current_turn":   game.players[game.turn].id - 1
    })

@app.route("/api/pong", methods=["POST"])
def pong():
    data = request.get_json()
    tile = data["tile"]
    print(f"Player chose Pong for tile: {tile}")

    from rules import resolve_pong
    resolve_pong(game.players[0], tile)
    print(f"Resolved Pong for: {tile}")

    game.last_discard = None
    game.has_drawn = True
    game.turn = 0

    info = game.get_player_info(1)
    return jsonify({
        "hand":         info["hand"],
        "exposed":      info["exposed_hand"],
        "current_turn": game.turn
    })

@app.route("/api/pass_pong", methods=["POST"])
def pass_pong():
    game.pass_pong()
    game.last_discard = None
    if game.last_discarder is not None:
        game.turn = (game.last_discarder + 1) % len(game.players)
    else:
        game.turn = (game.turn + 1) % len(game.players)

    game.has_drawn = False

    return jsonify({"message": "Pong passed"})

@app.route("/api/chi", methods=["POST"])
def chi():
    data = request.get_json()
    tiles = data.get("tiles") 
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

@app.route("/api/reset", methods=["POST"])
def reset():
    global game
    game = Game()
    game.start_game()
    game.last_discarder = None
    game.winner = None
    game.has_drawn = False
    game.is_draw = False
    print("Game reset!")
    return jsonify({"message": "Game reset"}), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)
