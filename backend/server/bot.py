"""
bot.py:

Handles bot logic (e.g. discarding)
"""

from collections import Counter

def smart_discard(hand):
    # Counts occurrences of each tile
    tile_counts = Counter(hand)
    keep_tiles = set() # Tiles with potential will be kept here

    # Keep pairs and above (for Pong / Gang)
    for tile, count in tile_counts.items():
        if count >= 2:
            keep_tiles.add(tile)

    # Check for potential sequences (for Chi)
    for tile in hand:
        if len(tile) == 2 and tile[1] in ['B', 'C', 'D']:
            try:
                num = int(tile[0])
                for i in [-2, -1, 1, 2]:
                    j = f"{num+i}{tile[1]}"
                    if j in hand:
                        keep_tiles.add(tile)
            except ValueError:
                continue

    # Discard tiles not added to keep_tiles
    for tile in list(hand):
        if tile not in keep_tiles:
            print(f"Bot discarding tile: {tile}")
            return tile
        
    return hand.pop() # If all tiles are in keep_tiles, discard the last tile