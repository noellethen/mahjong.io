from rules import check_win

class Player:
    def __init__(self, player_id):
        self.id = player_id
        self.hand = []
        self.bonus_tiles = []
        self.tai = 0
        self.zimo = False

    def draw_tile(self, tile):
        self.hand.append(tile)

    def discard_tile(self):
        # if tile in self.hand:
        #     self.hand.remove(tile)
        #     return tile

        # For simulation

        if self.hand:
            return self.hand.pop(0) # Discards first tile
        return None

    def has_won(self):
        return check_win(self.hand) and self.tai != 0
    
    def __str__(self):
        return f"Player {self.id}: {self.hand}"