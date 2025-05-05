import random
from collections import Counter

class Player:
    def __init__(self, player_id):
        self.id = player_id
        self.hand = []

    def draw_tile(self, tile):
        self.hand.append(tile)

    def discard_tile(self, tile):
        if tile in self.hand:
            self.hand.remove(tile)
            return tile

        # For simulation
        
        # if self.hand:
        #     return self.hand.pop(0) # Discards first tile
        return None
    
    def is_valid_group(self, tiles):
        if not tiles:
            return True
        
        tile_counts = Counter(tiles)
        first = tiles[0]

        # Check for Pong
        if tile_counts[first] >= 3:
            reduced = tiles.copy()
            for i in range(3):
                reduced.remove(first)
            if self.is_valid_group(reduced):
                return True
            
        # Check for Chi
        if len(first) == 2 and first[1] in ['B', 'C', 'D']:
            try:
                num = int(first[0])
                suit = first[1]
                second = f"{num+1}{suit}"
                third = f"{num+2}{suit}"
                if second in tiles and third in tiles:
                    reduced = tiles.copy()
                    reduced.remove(first)
                    reduced.remove(second)
                    reduced.remove(third)
                    if self.is_valid_group(reduced):
                        return True
            except:
                pass

        return False
    
    def check_win(self, hand):
        if len(hand) != 14:
            return False
        
        tile_counts = Counter(hand)
        pairs = [tile for tile, count in tile_counts.items() if count >= 2]

        for pair in pairs:
            temp_hand = hand.copy()
            temp_hand.remove(pair)
            temp_hand.remove(pair)
            if self.is_valid_group(sorted(temp_hand)):
                return True
            
        return False
    
    def has_won(self):
        return self.check_win(self.hand)
    
    def __str__(self):
        return f"Player {self.id}: {self.hand}"
    
class Game:
    def __init__(self, player_count = 4):
        self.players = [Player(i) for i in range(player_count)]
        self.wall = self._create_shuffled_wall()
        self.turn = 0

    def _create_shuffled_wall(self):
        suits = ['B', 'C', 'D'] # Bamboo, Characters, Dots
        tiles = [f"{num}{suit}" for suit in suits for num in range(1, 10) for i in range(4)]
        honors = ['East', 'South', 'West', 'North', 'Red', 'Green', 'White']
        tiles += [honor for honor in honors for j in range(4)]
        random.shuffle(tiles)
        return tiles

    def deal_tiles(self):
        for i in range(13):
            for player in self.players:
                player.draw_tile(self.wall.pop())

    def start_game(self):
        print("Dealing tiles...")
        self.deal_tiles()
        for player in self.players:
            print(player)

        # For Simulation (player discards first tile)

        # print("\nStarting game turns...\n")

        # winner = None

        # while self.wall:
        #     current_player = self.players[self.turn % len(self.players)]
            
        #     # Draw tile
        #     drawn_tile = self.wall.pop()
        #     current_player.draw_tile(drawn_tile)

        #     # Check for win
        #     if current_player.has_won():
        #         winner = current_player
        #         print(f"Player {current_player.id} wins after drawing {drawn_tile}!")
        #         break

        #     # Discard tile
        #     discarded_tile = current_player.discard_tile()
        #     print(f"Turn {self.turn + 1}: Player {current_player.id} draws {drawn_tile}, discards {discarded_tile}")
            
        #     self.turn += 1

        # if not winner:
        #     print("\nNo winner — wall exhausted.")

        # print("\nFinal hands:")
        # for player in self.players:
        #     print(player)


if __name__ == "__main__":
    game = Game()
    game.start_game()