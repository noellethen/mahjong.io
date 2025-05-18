"""
Player Class: 

Updates individual tiles (e.g. drawing, discarding)
"""
from bot import smart_discard
from rules import check_win

class Player:
    def __init__(self, player_id):
        self.id = player_id
        self.hand = []
        self.exposed_hand = [] # Set of completed sets (for Chi, Gang, Pong)
        self.bonus_tiles = []
        self.tai = 0
        self.zimo = False

    def draw_tile(self, tile):
        self.hand.append(tile)
    
    def discard_tile(self, interactive):
        # If player is human, discarded tile can be chosen. Else, apply bot discard logic
        if not self.hand:
            return None
        
        if interactive:
            print(f"\nYour hand: {self.hand}")
            while True:
                try:
                    index = int(input("Enter the tile index to discard from 0 to 13: "))
                    if 0 <= index < len(self.hand):
                        return self.hand.pop(index)
                    else:
                        print("Invalid index.")
                except ValueError:
                    print("Invalid index.")
        else:
            return smart_discard(self.hand) # Bot discard logic
        
    def has_won(self):
        full_hand = self.hand.copy()
        for group in self.exposed_hand:
            full_hand.extend(group)
        return check_win(self.hand, self.exposed_hand) and self.tai != 0

    def __str__(self):
        return (f"Player {self.id}:\n"
                f"Hand: {self.hand}\n"
                f"Exposed: {self.exposed_hand}\n"
                f"Bonus: {self.bonus_tiles}\n"
                f"Tai: {self.tai}")