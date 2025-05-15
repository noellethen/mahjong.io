"""
Player Class: 

Updates individual tiles (e.g. drawing, discarding)
"""

class Player:
    def __init__(self):
        self.hand = []
        self.exposed_hand = [] # Set of completed sets (for Chi, Gang, Pong)
        self.bonus_tiles = []
        self.tai = 0
        self.zimo = False

    def draw_tile(self, tile):
        self.hand.append(tile)
    
    def discard_tile(self):
        # If player is human, discarded tile can be chosen. Else, apply bot discard logic
        return

    def __str__(self):
        return