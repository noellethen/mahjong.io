"""
Game Class:

Simulates actual turn-based game, with dealing and player interaction (Chi, Gang, Pong) etc.
"""

import random
from player import Player
from tiles import generate_full_wall, sort_tiles
from rules import (
    handle_bonus_tile,
    can_chi, can_pong,
    resolve_chi, resolve_pong
)

class Game:
    def __init__(self):
        self.players = [Player(i) for i in range(1, 5)]
        self.interactive_player_id = 1 # Player 1 can choose tiles to discard, the rest are bots
        self.wall = generate_full_wall()
        random.shuffle(self.wall)
        self.turn = 0
        self.winner = None

    def deal_tiles(self):
        for i in range(13):
            for player in self.players:
                drawn_tile = self.wall.pop()

                while drawn_tile.startswith("Flower") or drawn_tile.startswith("Season") or drawn_tile in ['Cat', 'Mouse', 'Chicken', 'Centipede']:
                    handle_bonus_tile(player, drawn_tile)
                    print(f"Player {player.id} draws bonus tile {drawn_tile}, replacing...")
                    drawn_tile = self.wall.pop()

                player.draw_tile(drawn_tile)
                player.hand = sort_tiles(player.hand)

    def interaction(self, discarded_tile, discarder_id):
        for i in range(1, 4):
            responder_id = (discarder_id + i) % 5
            responder = self.players[responder_id - 1]
            interactive = (responder_id == self.interactive_player_id)

            # Anyone can Pong

            if can_pong(responder.hand, discarded_tile):
                if interactive:
                    print(f"\nPlayer {responder_id}, discarded tile is {discarded_tile}")
                    print(f"Your hand: {responder.hand}")
                    choice = input("Pong (p) or Pass (enter): ").strip().lower()

                    if choice != 'p':
                        return
                
                print(f"Player {responder_id} calls PONG!")
                resolve_pong(responder, discarded_tile)
                self.turn = responder_id
                return True
            
            # Only next player can Chi

            next_player_id = (discarder_id + 1) % 4
            next_player = self.players[next_player_id - 1]
            interactive_chi = (next_player_id == self.interactive_player_id)

            if can_chi(next_player.hand, discarded_tile):
                if interactive_chi:
                    print(f"\nPlayer {next_player_id}, discarded tile is {discarded_tile}")
                    print(f"Your hand: {next_player.hand}")
                    choice = input("Chi (c) or Pass (enter): ").strip().lower()

                    if choice != 'c':
                        return
                    
                print(f"Player {next_player_id} calls CHI!")
                resolve_chi(next_player, discarded_tile)
                self.turn = next_player_id
                return True

        return False
    
    def start_game(self):
        print("Dealing tiles...")
        self.deal_tiles()
        for player in self.players:
            print(player)

        # For Simulation 

        print("\nStarting game turns...\n")

        winner = None
        claimed_tile = False

        while self.wall:
            current_player = self.players[self.turn % len(self.players) - 1]
            
            # Draw tile
            if not claimed_tile:
                drawn_tile = self.wall.pop()

                while drawn_tile.startswith("Flower") or drawn_tile.startswith("Season") or drawn_tile in ['Cat', 'Mouse', 'Chicken', 'Centipede']:
                    handle_bonus_tile(current_player, drawn_tile)
                    print(f"Player {current_player.id} draws bonus tile {drawn_tile}, replacing...")
                    drawn_tile = self.wall.pop()

                current_player.draw_tile(drawn_tile)

                # Check for win 
                if current_player.has_won():
                    winner = current_player
                    print(f"Player {current_player.id} wins after drawing {drawn_tile}!")
                    break
            else:
                drawn_tile = None  

            interactive = (current_player.id == self.interactive_player_id)

            discarded_tile = current_player.discard_tile(interactive)
            current_player.hand = sort_tiles(current_player.hand)  
            if drawn_tile:
                print(f"Turn {self.turn + 1}: Player {current_player.id} draws {drawn_tile}, discards {discarded_tile}")
            else:
                print(f"Turn {self.turn + 1}: Player {current_player.id} (claimed tile) discards {discarded_tile}")

            if self.interaction(discarded_tile, current_player.id):
                claimed_tile = True
                continue
            else:
                claimed_tile = False

            self.turn += 1

        if not winner:
            print("\nNo winner — wall exhausted.")

        print("\nFinal hands:")
        for player in self.players:
            print(player)