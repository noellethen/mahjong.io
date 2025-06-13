"""
Game Class:

Simulates actual turn-based game, with dealing and player interaction (Chi, Gang, Pong) etc.
"""

import random
from player import Player
from tiles import generate_full_wall
from rules import (
    handle_bonus_tile, calculate_tai, check_win,
    can_chi, can_pong, can_gang, can_concealed_gang, can_addon_gang,
    resolve_chi, resolve_pong, resolve_gang, resolve_concealed_gang, resolve_addon_gang
)
from bot import smart_discard

class Game:
    def __init__(self):
        self.players = [Player(i) for i in range(1, 5)]
        self.interactive_player_id = 1 # Player 1 can choose tiles to discard, the rest are bots
        self.wall = generate_full_wall()
        random.shuffle(self.wall)
        self.turn = 0
        self.winner = None
        self.has_drawn = False

    def deal_tiles(self):
        for i in range(13):
            for player in self.players:
                drawn_tile = self.wall.pop()

                while drawn_tile.startswith("Flower") or drawn_tile.startswith("Season") or drawn_tile in ['Cat', 'Mouse', 'Chicken', 'Centipede']:
                    handle_bonus_tile(player, drawn_tile)
                    drawn_tile = self.wall.pop()

                player.draw_tile(drawn_tile)
                player.hand = self.sort_tiles(player.hand)

    def get_player_info(self, player_num):
        player_affected = self.players[player_num - 1]
        bonus_tiles = player_affected.bonus_tiles
        exposed_hand = player_affected.exposed_hand
        hand = player_affected.hand
        return {"bonus_tiles": bonus_tiles, "exposed_hand": exposed_hand, "hand": hand}
    
    def discard_tile(self, player_id, discarded_tile):
        player = self.players[player_id - 1]
        if discarded_tile in player.hand:
            player.hand.remove(discarded_tile)  # Safely remove the tile
            print(f"Discarded tile {discarded_tile} from Player {player_id}")
        else:
            print(f"Error: Tile {discarded_tile} not found in Player {player_id}'s hand!")

    def bot_discard(self):
        current_player = self.players[self.turn]
        if current_player.id != self.interactive_player_id: 
            discarded_tile = smart_discard(current_player.hand) 
            if discarded_tile in current_player.hand:
                self.discard_tile(current_player.id, discarded_tile)
                current_player.hand = self.sort_tiles(current_player.hand)
                return discarded_tile
            else:
                print(f"Error: Bot attempted to discard a tile that doesn't exist in the hand")
                return None
        return None
    
    def draw_tile(self):
        current_player = self.players[self.turn]
        drawn_tile = self.wall.pop()

        while drawn_tile.startswith("Flower") or drawn_tile.startswith("Season") or drawn_tile in ['Cat', 'Mouse', 'Chicken', 'Centipede']:
            handle_bonus_tile(current_player, drawn_tile)
            print(f"Player {current_player.id} draws bonus tile {drawn_tile}, replacing...")
            if self.wall:
                drawn_tile = self.wall.pop()
            else: 
                break
            
        current_player.hand.append(drawn_tile)
        return drawn_tile

    def get_tile_number(self, tile):
        try:
            return int(tile[0])
        except ValueError:
            return 0

    def sort_numeric_tiles(self, tiles):
        tiles.sort(key = self.get_tile_number)

    def sort_tiles(self, hand):
        # Sort in order of: B, C, D, Honors
        bamboos = []
        characters = []
        dots = []
        honors = []

        for tile in hand:
            if len(tile) == 2 and tile[1] == 'B':
                bamboos.append(tile)
            elif len(tile) == 2 and tile[1] == 'C':
                characters.append(tile)
            elif len(tile) == 2 and tile[1] == 'D':
                dots.append(tile)
            else:
                honors.append(tile) 

        # Sort each category
        self.sort_numeric_tiles(bamboos)
        self.sort_numeric_tiles(characters)
        self.sort_numeric_tiles(dots)
        honors.sort() # Alphabetical order

        return bamboos + characters + dots + honors

    def interaction(self, discarded_tile, discarder_id):
        discarder_idx = discarder_id - 1
        players = self.players
        responders = players[discarder_idx + 1:] + players[:discarder_idx]

        for responder in responders:
            temp_hand = responder.hand.copy()
            temp_hand.append(discarded_tile)
            if check_win(temp_hand, responder.exposed_hand):
                self.winner = responder
                calculate_tai(responder)
                print(f"Player {responder.id} wins by claiming {discarded_tile} from Player {discarder_id} with {responder.tai} Tai!")
                break

        for responder in responders:
            interactive = (responder.id == self.interactive_player_id)

            # Anyone can Pong/Gang

            if can_gang(responder.hand, discarded_tile):
                if interactive:
                    print(f"\nPlayer {responder.id}, discarded tile is {discarded_tile}")
                    print(f"Your hand: {responder.hand}")
                    choice = input("Gang (g) or Pass (enter): ").strip().lower()

                    if choice != 'g':
                        continue
                    
                print(f"Player {responder.id} calls GANG!")
                resolve_gang(self,responder, discarded_tile)
                self.turn = responder.id
                return True

            if can_pong(responder.hand, discarded_tile):
                if interactive:
                    print(f"\nPlayer {responder.id}, discarded tile is {discarded_tile}")
                    print(f"Your hand: {responder.hand}")
                    choice = input("Pong (p) or Pass (enter): ").strip().lower()

                    if choice != 'p':
                        continue
                
                print(f"Player {responder.id} calls PONG!")
                resolve_pong(responder, discarded_tile)
                self.turn = responder.id
                return True
            
            # Only next player can Chi

            next_player = responders[0]
            next_player_id = next_player.id
            interactive_chi = (next_player_id == self.interactive_player_id)
            if can_chi(next_player.hand, discarded_tile):
                if interactive_chi:
                    print(f"\nPlayer {next_player_id}, discarded tile is {discarded_tile}")
                    print(f"Your hand: {next_player.hand}")
                    choice = input("Chi (c) or Pass (enter): ").strip().lower()

                    if choice != 'c':
                        return False
                    
                print(f"Player {next_player_id} calls CHI!")
                resolve_chi(next_player, discarded_tile)
                self.turn = next_player_id
                return True

        return False
    
    def start_game(self):
        self.deal_tiles()

        # # For Simulation 

        # print("\nStarting game turns...\n")

        # winner = None
        # claimed_tile = False

        # while self.wall:
        #     current_player = self.players[self.turn % 4]
            
        #     # Draw tile
        #     if not claimed_tile:
        #         drawn_tile = self.wall.pop()

        #         while drawn_tile.startswith("Flower") or drawn_tile.startswith("Season") or drawn_tile in ['Cat', 'Mouse', 'Chicken', 'Centipede']:
        #             handle_bonus_tile(current_player, drawn_tile)
        #             print(f"Player {current_player.id} draws bonus tile {drawn_tile}, replacing...")
        #             if self.wall:
        #                 drawn_tile = self.wall.pop()
        #             else: 
        #                 break

        #         current_player.draw_tile(drawn_tile)

        #         # Check for win (after drawing tile)
        #         if current_player.has_won():
        #             winner = current_player
        #             calculate_tai(current_player)
        #             print(f"Player {current_player.id} wins after drawing {drawn_tile} with Tai: {current_player.tai}!")
        #             break
        #     else:
        #         drawn_tile = None  

        #     interactive = (current_player.id == self.interactive_player_id)

        #     concealed_tiles = can_concealed_gang(current_player.hand)
        #     if concealed_tiles:
        #         print(f"\nPlayer {current_player.id}, you can declare a concealed Gang with: {concealed_tiles}")
        #         print(f"Your hand: {current_player.hand}")
        #         if current_player.id == self.interactive_player_id:
        #             choice = input("Declare concealed Gang? Enter tile or press Enter to skip: ")
        #             if choice in concealed_tiles:
        #                 resolve_concealed_gang(self, current_player, choice)
        #         else:
        #             resolve_concealed_gang(self, current_player, concealed_tiles[0])

        #     addon_tiles = can_addon_gang(current_player)
        #     if addon_tiles:
        #         print(f"\nPlayer {current_player.id}, you can declare upgrade to Gang with: {addon_tiles}")
        #         print(f"Your hand: {current_player.hand}")
        #         if current_player.id == self.interactive_player_id:
        #             choice = input("Upgrade to Gang? Enter tile or press Enter to skip: ")
        #             if choice in addon_tiles:
        #                 resolve_addon_gang(self, current_player, choice)
        #         else:
        #             resolve_addon_gang(self, current_player, addon_tiles[0])

        #     discarded_tile = current_player.discard_tile(interactive)

        #     current_player.hand = sort_tiles(current_player.hand)  
        #     if drawn_tile:
        #         print(f"Turn {self.turn + 1}: Player {current_player.id} draws {drawn_tile}, discards {discarded_tile}")
        #         print(current_player)
        #     else:
        #         print(f"Turn {self.turn + 1}: Player {current_player.id} (claimed tile) discards {discarded_tile}")
        #         print(current_player)

        #     while self.interaction(discarded_tile, current_player.id):
        #         # Logic for discarding tiles after claiming

        #         claimed_tile = True
        #         current_player = self.players[self.turn - 1]
        #         interactive = (current_player.id == self.interactive_player_id)

        #         discarded_tile = current_player.discard_tile(interactive)
        #         current_player.hand = sort_tiles(current_player.hand)

        #         print(f"Turn {self.turn + 1}: Player {current_player.id} (claimed tile) discards {discarded_tile}")

        #         # if self.interaction(discarded_tile, current_player.id):
        #         #     claimed_tile = True
        #         #     continue
        #         # else:
        #         #     claimed_tile = False
        #         # continue
        #     # else:
        #     claimed_tile = False

        #     self.turn += 1

        # if not winner:
        #     print("\nNo winner — wall exhausted.")

        # print("\nFinal hands:")
        # for player in self.players:
        #     print(player)