import random
from player import Player
from tiles import generate_full_wall
from rules import check_win, calculate_tai, handle_bonus_tile

class Game:
    def __init__(self, player_count = 4, include_bonus = True):
        self.players = [Player(i) for i in range(player_count)]
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

    def start_game(self):
        print("Dealing tiles...")
        self.deal_tiles()
        for player in self.players:
            print(player)

        # For Simulation (player discards first tile)

        print("\nStarting game turns...\n")

        winner = None

        while self.wall:
            current_player = self.players[self.turn % len(self.players)]
            
            # Draw tile
            drawn_tile = self.wall.pop()

            while drawn_tile.startswith("Flower") or drawn_tile.startswith("Season") or drawn_tile in ['Cat', 'Mouse', 'Chicken', 'Centipede']:
                handle_bonus_tile(player, drawn_tile)
                print(f"Player {player.id} draws bonus tile {drawn_tile}, replacing...")
                drawn_tile = self.wall.pop()

            current_player.draw_tile(drawn_tile)

            # Check for win
            if current_player.has_won():
                winner = current_player
                print(f"Player {current_player.id} wins after drawing {drawn_tile}!")
                break

            # Discard tile
            discarded_tile = current_player.discard_tile()
            print(f"Turn {self.turn + 1}: Player {current_player.id} draws {drawn_tile}, discards {discarded_tile}")
            
            self.turn += 1

        if not winner:
            print("\nNo winner — wall exhausted.")

        print("\nFinal hands:")
        for player in self.players:
            print(player)