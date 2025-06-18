"""
tiles.py:

Handles tile logic (initial dealing of tiles, sorting tiles and replacing tiles)
"""

# Tiles to generate: suited tiles, honor tiles and bonus tiles
def generate_suited_tiles():
    suits = ['B', 'C', 'D'] # Bamboo, Characters, Dots
    tiles = []
    for suit in suits:
        for number in range(1, 10):
            tiles.extend([f"{number}{suit}"] * 4) # Generates 4 sets of suited tiles from 1 to 9
    return tiles

def generate_honor_tiles():
    honors = ['East', 'South', 'West', 'North', 'Red', 'Green', 'White']
    tiles = []
    for honor in honors:
        tiles.extend([honor] * 4) # Generates 4 of each honor tile
    return tiles

def generate_bonus_tiles():
    flowers = [f"Flower{i}" for i in range(1, 5)] # Generates Flower tiles from 1 to 4
    seasons = [f"Season{i}" for i in range(1, 5)] # Generates Season tiles from 1 to 4
    animals = ["Cat", "Mouse", "Chicken", "Centipede"]
    return flowers + seasons + animals

def generate_full_wall():
    wall = generate_suited_tiles() + generate_honor_tiles() + generate_bonus_tiles()
    return wall # Add and return everything (unsorted)

# def get_tile_number(tile):
#     try:
#         return int(tile[0])
#     except ValueError:
#         return 0

# def sort_numeric_tiles(tiles):
#     tiles.sort(key = get_tile_number)

# def sort_tiles(hand):
#     # Sort in order of: B, C, D, Honors
#     bamboos = []
#     characters = []
#     dots = []
#     honors = []

#     for tile in hand:
#         if len(tile) == 2 and tile[1] == 'B':
#             bamboos.append(tile)
#         elif len(tile) == 2 and tile[1] == 'C':
#             characters.append(tile)
#         elif len(tile) == 2 and tile[1] == 'D':
#             dots.append(tile)
#         else:
#             honors.append(tile) 

#     # Sort each category
#     sort_numeric_tiles(bamboos)
#     sort_numeric_tiles(characters)
#     sort_numeric_tiles(dots)
#     honors.sort() # Alphabetical order

#     return bamboos + characters + dots + honors