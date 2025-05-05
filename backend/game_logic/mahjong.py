import random

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
        return None
    
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
        # while self.wall and self.turn < self.max_turns:
        #     current_player = self.players[self.turn % len(self.players)]
        #     drawn_tile = self.wall.pop()
        #     current_player.draw_tile(drawn_tile)
        #     discarded_tile = current_player.discard_tile()
        #     print(f"Turn {self.turn + 1}: Player {current_player.id} draws {drawn_tile}, discards {discarded_tile}")
        #     self.turn += 1

        # print("\nFinal hands:")
        # for player in self.players:
        #     print(player)

if __name__ == "__main__":
    game = Game()
    game.start_game()