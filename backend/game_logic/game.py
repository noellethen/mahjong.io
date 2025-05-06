import random
from player import Player
from tiles import generate_full_wall
from rules import (
    handle_bonus_tile, 
    can_chi, can_pong, can_gang, can_concealed_gang, can_supplemental_gang,
    resolve_pong, resolve_chi, resolve_gang, resolve_concealed_gang, resolve_supplemental_gang
)

class Game:
    def __init__(self, player_count = 4, include_bonus = True, interactive_player_id = 0):
        self.players = [Player(i) for i in range(player_count)]
        self.interactive_player_id = interactive_player_id
        self.wall = generate_full_wall(include_bonus)
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

    def check_calls(self, discarded_tile, discarder_id):
        num_players = len(self.players)

        for i in range(1, num_players):
            responder_id = (discarder_id + i) % num_players
            responder = self.players[responder_id]

            if can_gang(responder.hand, discarded_tile):
                print(f"\nPlayer {responder_id}, discarded tile is {discarded_tile}")
                print(f"Your hand: {responder.hand}")
                choice = input("Gang (g) or Pass (enter): ").strip().lower()

                if choice == 'g':
                    print(f"Player {responder_id} calls GANG!")
                    resolve_gang(self,responder, discarded_tile)
                    self.turn = responder_id
                    return True

            if can_pong(responder.hand, discarded_tile):
                print(f"\nPlayer {responder_id}, discarded tile is {discarded_tile}")
                print(f"Your hand: {responder.hand}")
                choice = input("Pong (p) or Pass (enter): ").strip().lower()

                if choice == 'p':
                    print(f"Player {responder_id} calls PONG!")
                    resolve_pong(responder, discarded_tile)
                    self.turn = responder_id
                    return True


        next_player_id = (discarder_id + 1) % num_players
        next_player = self.players[next_player_id]

        if can_chi(next_player.hand, discarded_tile):
            print(f"\nPlayer {next_player_id}, discarded tile is {discarded_tile}")
            print(f"Your hand: {next_player.hand}")
            choice = input("Chi (c) or Pass (enter): ").strip().lower()

            if choice == 'c':
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

        # For Simulation (player discards first tile)

        print("\nStarting game turns...\n")

        winner = None
        claimed_tile = False

        while self.wall:
            current_player = self.players[self.turn % len(self.players)]
            
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

            concealed_tiles = can_concealed_gang(current_player.hand)
            if concealed_tiles:
                print(f"\nPlayer {current_player.id}, you can declare a concealed Gang with: {concealed_tiles}")
                print(f"Your hand: {current_player.hand}")
                if current_player.id == self.interactive_player_id:
                    choice = input("Declare concealed Gang? Enter tile or press Enter to skip: ")
                    if choice in concealed_tiles:
                        resolve_concealed_gang(self, current_player, choice)
                else:
                    resolve_concealed_gang(self, current_player, concealed_tiles[0])

            supp_tiles = can_supplemental_gang(current_player)
            if supp_tiles:
                print(f"\nPlayer {current_player.id}, you can declare upgrade to Gang with: {supp_tiles}")
                print(f"Your hand: {current_player.hand}")
                if current_player.id == self.interactive_player_id:
                    choice = input("Upgrade to Gang? Enter tile or press Enter to skip: ")
                    if choice in supp_tiles:
                        resolve_supplemental_gang(self, current_player, choice)
                else:
                    resolve_supplemental_gang(self, current_player, supp_tiles[0])

            discarded_tile = current_player.discard_tile(interactive=interactive)  
            if drawn_tile:
                print(f"Turn {self.turn + 1}: Player {current_player.id} draws {drawn_tile}, discards {discarded_tile}")
            else:
                print(f"Turn {self.turn + 1}: Player {current_player.id} (claimed tile) discards {discarded_tile}")

            if self.check_calls(discarded_tile, current_player.id):
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