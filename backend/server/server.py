from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
from game import Game
from rules import can_chi, can_pong , check_win, check_win_discard, calculate_tai      

app = Flask(__name__)
cors = CORS(app, origins='*')
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')
desired_humans = None
socket_to_player = {}
next_human_slot = 0

game = None 

@socketio.on('connect')
def handle_connect():
    print("Client connected:", request.sid)   

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected:", request.sid)
    if request.sid in socket_to_player:
        print(f"Player {socket_to_player[request.sid] + 1} disconnected")
        del socket_to_player[request.sid]

@socketio.on('join-game')
def handle_join_game(data):
    print(f"joined game with data: {data}")                                      
    global desired_humans, next_human_slot, game                                 

    if request.sid in socket_to_player:
        print(f"Player {socket_to_player[request.sid] + 1} is rejoining - resetting game")
        game = None
        desired_humans = None
        next_human_slot = 0
        socket_to_player.clear()
        print("Game reset due to player rejoin!")

    if desired_humans is not None and desired_humans != data.get('numHumans', 1):
        print(f"Player count changed from {desired_humans} to {data.get('numHumans', 1)} - resetting game")
        game = None
        desired_humans = None
        next_human_slot = 0
        socket_to_player.clear()
        print("Game reset due to player count change!")

    if desired_humans is None:                                                   
        desired_humans = data.get('numHumans', 1)                                
        print(f"→ Desired human players: {desired_humans}")                       

    slot = next_human_slot                                                        
    socket_to_player[request.sid] = slot                                           
    print(f"→ Assigned slot {slot} to SID {request.sid}")                          
    next_human_slot += 1                                                           

    if next_human_slot < desired_humans:                                           
        print(f"Waiting for humans: {next_human_slot}/{desired_humans}")           
        socketio.emit('player-assigned', {'player_id': slot + 1}, to=request.sid)
        return                                                                     

    human_players = list(range(1, desired_humans + 1))
    game = Game(human_players=human_players)                                                                  
    game.start_game()     
    game.last_discarder = -1
    game.winner = None
    game.is_draw = False                                                         
    print(f"All humans joined—started game with {desired_humans} human(s) and {4-desired_humans} bot(s)")  
    for sid, player_slot in socket_to_player.items():
        socketio.emit('player-assigned', {'player_id': player_slot + 1}, to=sid)
    response = game_state()                                                        
    payload = response.get_json()                                                  
    socketio.emit('game-update', payload)

# Gamemode Page
@app.route("/api/game_state")
def game_state():
    if game is None:
        return jsonify({"waiting": True, "needed": desired_humans - next_human_slot}), 200
    game.turn = game.turn % len(game.players)

    if game.winner:
        return jsonify({"winner": game.winner.id, "tai": game.winner.tai})
    
    if game.is_draw:
        return jsonify({"draw": True})

    if not game.wall and game.last_discard is None:
        print("Wall exhausted — draw game.")
        game.is_draw = True
        return jsonify({"draw": True})
    
    current_player = game.players[game.turn]
    current_player_id = current_player.id
    
    if current_player_id in game.human_players and game.has_drawn and game.last_discard is None:
        if check_win(current_player.hand, current_player.exposed_hand):
            calculate_tai(current_player)
            game.winner = current_player
            print(f"Player {current_player.id} wins by self-draw with {current_player.tai} Tai!")
            return jsonify({"winner": current_player.id, "tai": current_player.tai})

    # For debugging
    print(f"Current Turn: {game.turn}")
    for i, player in enumerate(game.players):
        print(f"Player {i+1}'s hand: {player.hand}")
        print(f"Player {i+1}'s bonus tiles: {player.bonus_tiles}")

    discarded_tile = None
    drawn_tile = None

    # Handle drawing and discarding
    if current_player_id in game.human_players:
        if game.wall and not game.has_drawn and game.last_discard is None and not getattr(game, 'just_ponged_chi', False):
            drawn_tile = game.draw_tile()
            game.has_drawn = True
            print(f"Game State: Human player {current_player_id} drew {drawn_tile}")
        else:
            print(f"Game State: Human player {current_player_id} did not draw - has_drawn={game.has_drawn}, last_discard={game.last_discard}, just_ponged_chi={getattr(game, 'just_ponged_chi', False)}")
    else:
        # Bot player's turn
        if game.last_discard is not None:
            print(f"Game State: Bot {current_player_id} turn skipped - waiting for human Pong/Chi")
            discarded_tile = None
            drawn_tile = None
        elif game.wall and not game.has_drawn:
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

            can_any_human_pong = False
            can_any_human_chi = False
            
            for human_id in game.human_players:
                if human_id != bot_idx + 1:  
                    human_idx = human_id - 1
                    if can_pong(game.players[human_idx].hand, discarded_tile):
                        can_any_human_pong = True
                        break
                        
            next_player_idx = (bot_idx + 1) % len(game.players)
            next_player_id = next_player_idx + 1
            
            print(f"Game State: Player {bot_idx+1} discarded {discarded_tile}")
            print(f"Game State: Discarder idx: {bot_idx}, Next player idx: {next_player_idx}, Next player id: {next_player_id}")
            print(f"Game State: Human players: {game.human_players}")
            print(f"Game State: Next player is human: {next_player_id in game.human_players}")
            
            if next_player_id in game.human_players:
                next_player_hand = game.players[next_player_idx].hand
                print(f"Game State: Next player {next_player_id} hand: {next_player_hand}")
                chi_possible = can_chi(next_player_hand, discarded_tile)
                print(f"Game State: Can chi: {chi_possible}")
                if chi_possible:
                    can_any_human_chi = True
                    print(f"Game State: Chi is possible for player {next_player_id}")
                else:
                    print(f"Game State: Chi not possible for player {next_player_id}")
            else:
                print(f"Game State: Next player {next_player_id} is not human, skipping Chi check")

            print(f"Game State: Can any human pong: {can_any_human_pong}")
            print(f"Game State: Can any human chi: {can_any_human_chi}")

            if can_any_human_pong or can_any_human_chi:
                game.last_discard = discarded_tile
                game.last_discarder = bot_idx
            else:
                game.last_discard = None
                game.last_discarder = -1
                game.turn = (game.turn + 1) % 4
        else:
            discarded_tile = None
            drawn_tile = None

    response = {
        "current_turn": current_player_id - 1,
        "discarded_tile": discarded_tile,
        "drawn_tile": drawn_tile,
        "discard_pile": game.discard_pile,  
        "players": []
    }

    for human_id in game.human_players:
        human_idx = human_id - 1
        player_info = game.get_player_info(human_id)
        
        player_response = {
            "player_id": human_id,
            "bonus": player_info["bonus_tiles"],
            "exposed": player_info["exposed_hand"],
            "hand": player_info["hand"],
            "hand_count": len(player_info["hand"]),
            "possiblePong": [],
            "possibleChi": []
        }
        
        if game.last_discard:
            if can_pong(game.players[human_idx].hand, game.last_discard):
                player_response["possiblePong"] = [game.get_pong_option(human_id)]
            
            discarder_idx = game.last_discarder
            next_player_idx = (discarder_idx + 1) % len(game.players)
            next_player_id = next_player_idx + 1
            
            print(f"Game State: Player {human_id}, discarder_idx: {discarder_idx}, next_player_idx: {next_player_idx}, next_player_id: {next_player_id}")
            print(f"Game State: Is this player next? {human_id == next_player_id}")
            print(f"Game State: Last discard: {game.last_discard}")
            
            if human_id == next_player_id:
                print(f"Game State: Checking Chi for player {human_id}")
                print(f"Game State: Player {human_id} hand: {game.players[human_idx].hand}")
                chi_possible = can_chi(game.players[human_idx].hand, game.last_discard)
                print(f"Game State: Can chi: {chi_possible}")
                if chi_possible:
                    chi_options = game.get_chi_options(human_id)
                    print(f"Game State: Chi options: {chi_options}")
                    player_response["possibleChi"] = chi_options
                    print(f"Game State: Set possibleChi for player {human_id}: {chi_options}")
                else:
                    print(f"Game State: Chi not possible for player {human_id}")
            else:
                print(f"Game State: Player {human_id} is not next player, skipping Chi check")
        
        response["players"].append(player_response)

    # Add info for all players (for display)
    all_players_info = []
    for p in game.players:
        info = game.get_player_info(p.id)
        all_players_info.append({
            "id": p.id,
            "bonus": info["bonus_tiles"],
            "exposed": info["exposed_hand"],
            "hand_count": len(info["hand"])
        })
    response["all_players"] = all_players_info

    return jsonify(response)

@app.route("/api/discard_tile", methods=["POST"])
def discard_tile():
    data = request.get_json()
    discarded_tile = data.get("tile")
    player_id = data.get("player_id", 1)  

    if game is None:
        return jsonify({"error": "No game in progress"}), 400

    current_player = game.players[game.turn]
    current_player_id = current_player.id
    
    if current_player_id == player_id and player_id in game.human_players:
        print(f"Player {player_id} selected tile: {discarded_tile}")
        print(f"Player {player_id}'s hand before discard: {game.players[player_id-1].hand}")
        game.discard_tile(player_id, discarded_tile)
        print(f"Player {player_id}'s hand after discard: {game.players[player_id-1].hand}")
        game.players[player_id-1].hand = game.sort_tiles(game.players[player_id-1].hand)
        game.has_drawn = False
        game.just_ponged_chi = False  

        if discarded_tile is not None:
            winner = check_win_discard(game, game.players[player_id-1], discarded_tile)
            if winner:
                calculate_tai(winner)
                game.winner = winner           
                print(f"Player {winner.id} wins by discard with {winner.tai} Tai!")
                return jsonify({"winner": winner.id, "tai": winner.tai})
            
        can_any_human_pong = False
        can_any_human_chi = False
        
        for human_id in game.human_players:
            if human_id != player_id:  
                human_idx = human_id - 1
                if can_pong(game.players[human_idx].hand, discarded_tile):
                    can_any_human_pong = True
                    break
                    
        discarder_idx = player_id - 1
        next_player_idx = (discarder_idx + 1) % len(game.players)
        next_player_id = next_player_idx + 1
        
        print(f"Discard Tile: Player {player_id} discarded {discarded_tile}")
        print(f"Discard Tile: Discarder idx: {discarder_idx}, Next player idx: {next_player_idx}, Next player id: {next_player_id}")
        print(f"Discard Tile: Human players: {game.human_players}")
        print(f"Discard Tile: Next player is human: {next_player_id in game.human_players}")
        
        if next_player_id in game.human_players:
            next_player_hand = game.players[next_player_idx].hand
            print(f"Discard Tile: Next player {next_player_id} hand: {next_player_hand}")
            chi_possible = can_chi(next_player_hand, discarded_tile)
            print(f"Discard Tile: Can chi: {chi_possible}")
            if chi_possible:
                can_any_human_chi = True
                print(f"Discard Tile: Chi is possible for player {next_player_id}")
            else:
                print(f"Discard Tile: Chi not possible for player {next_player_id}")
        else:
            print(f"Discard Tile: Next player {next_player_id} is not human, skipping Chi check")

        print(f"Discard Tile: Can any human pong: {can_any_human_pong}")
        print(f"Discard Tile: Can any human chi: {can_any_human_chi}")

        if can_any_human_pong or can_any_human_chi:
            game.last_discard = discarded_tile
            game.last_discarder = discarder_idx
            print(f"Discard Tile: Setting last_discard={discarded_tile}, last_discarder={discarder_idx}")
            return jsonify({
                "message": "Tile discarded, waiting for Chi/Pong",
                "discarded_tile": discarded_tile,
                "current_turn": game.turn
            })
        
        game.last_discard = None
        game.last_discarder = -1
        game.turn = (game.turn + 1) % 4
        print(f"Discard Tile: No Pong/Chi possible, advancing turn to {game.turn}")
        return jsonify({
            "message": "Tile discarded, no Pong/Chi possible",
            "discarded_tile": discarded_tile,
            "current_turn": game.turn
        })

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
    player_id = data.get("player_id", 1)  
    
    print(f"Player {player_id} chose Pong for tile: {tile}")

    from rules import resolve_pong
    resolve_pong(game.players[player_id-1], tile)
    print(f"Resolved Pong for: {tile}")

    game.remove_from_discard_pile(tile)

    game.last_discard = None
    game.last_discarder = -1
    game.has_drawn = False  
    game.turn = player_id - 1  
    game.just_ponged_chi = True  

    info = game.get_player_info(player_id)
    return jsonify({
        "hand":         info["hand"],
        "exposed":      info["exposed_hand"],
        "current_turn": game.turn
    })

@app.route("/api/pass_pong", methods=["POST"])
def pass_pong():
    data = request.get_json()
    player_id = data.get("player_id", 1)     
    game.pass_pong()
    game.last_discard = None
    game.last_discarder = -1
    game.turn = (game.turn + 1) % 4
    game.has_drawn = False
    return jsonify({"message": "Pong passed"})

@app.route("/api/chi", methods=["POST"])
def chi():
    data = request.get_json()
    tiles = data.get("tiles") 
    player_id = data.get("player_id", 1)  
    print(f"Player {player_id} chose Chi for tiles: {tiles}")
    from rules import resolve_chi
    resolve_chi(game.players[player_id-1], game.last_discard)
    print(f"Resolved Chi with discard: {game.last_discard}")
    game.remove_from_discard_pile(game.last_discard)
    game.last_discard = None
    game.last_discarder = -1
    game.turn = player_id - 1  
    game.has_drawn = False  
    game.just_ponged_chi = True  
    info = game.get_player_info(player_id)
    return jsonify({
        "hand":         info.get("hand", []),
        "exposed":      info.get("exposed_hand", []),
        "current_turn": game.turn
    })

@app.route("/api/pass_chi", methods=["POST"])
def pass_chi():
    data = request.get_json()
    player_id = data.get("player_id", 1)     
    game.pass_chi()
    game.last_discard = None
    game.last_discarder = -1
    game.turn = (game.turn + 1) % 4   
    game.has_drawn = False   
    return jsonify({"message": "Chi passed"})

@app.route("/api/reset", methods=["POST"])
def reset():
    global game, desired_humans, next_human_slot, socket_to_player
    game = None
    desired_humans = None
    next_human_slot = 0
    socket_to_player.clear()
    print("Game reset!")
    return jsonify({"message": "Game reset"}), 200

@app.route("/api/rejoin", methods=["POST"])
def rejoin():
    global game, desired_humans, next_human_slot, socket_to_player
    print("Player rejoin detected - resetting game state")
    game = None
    desired_humans = None
    next_human_slot = 0
    socket_to_player.clear()
    print("Game reset due to player rejoin!")
    return jsonify({"message": "Game reset for rejoin"}), 200

import os

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() in ("1", "true", "yes")

    socketio.run(
        app,
        host="0.0.0.0",
        port=port,
        debug=debug,
    )