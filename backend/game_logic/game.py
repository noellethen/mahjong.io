"""
Game Class:

Simulates actual turn-based game, with dealing and player interaction (Chi, Gang, Pong) etc.
"""

import random
from player import Player

class Game:
    def __init__(self):
        self.players = [Player(i) for i in range(4)]
        self.interactive_player_id = 0 # Player 0 can choose tiles to discard, the rest are bots
        self.turn = 0
        self.winner = None

    def deal_tiles(self):
        pass