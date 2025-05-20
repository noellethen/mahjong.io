"""
rules.py:

Handles game logic such as win checking and Tai calculations
"""

from collections import Counter

def handle_bonus_tile(player, tile):
    player.bonus_tiles.append(tile)

    # Animal
    if tile in ['Cat', 'Mouse', 'Chicken', 'Centipede']:
        player.tai += 1

    elif tile.startswith("Flower") or tile.startswith("Season"):
        try:
            tile_num = int(tile[-1])
            seat_wind = player.id
            if tile_num == seat_wind:
                player.tai += 1
        except ValueError:
            pass

# Winning Logic

def is_valid_group(tiles):
    # Check if tiles from a valid set (to consider win)
    if not tiles:
        return True

    tiles = sorted(tiles)
    tile_counts = Counter(tiles)
    first = tiles[0]

    # Check for Pong

    if tile_counts[first] >= 3:
        remaining = tiles.copy()
        for i in range(3):
            remaining.remove(first)
        if is_valid_group(remaining):
            return True
        
    # Check for Chi

    if len(first) == 2 and first[1] in ['B', 'C', 'D']:
        try:
            num = int(first[0])
            suit = first[1]
            second, third = f"{num+1}{suit}", f"{num+2}{suit}"
            if second in tiles and third in tiles:
                remaining = tiles.copy()
                for t in [first, second, third]:
                    remaining.remove(t)
                if is_valid_group(remaining):
                    return True
        except ValueError:
            pass

    return False

def check_win(hand, exposed_hand):
    total_exposed = sum(len(group) for group in exposed_hand)
    total_tiles = len(hand) + total_exposed

    if total_tiles != 14:
        return False

    tile_counts = Counter(hand)
    pairs = []
    for tile, count in tile_counts.items():
        if count >= 2:
            pairs.append(tile)

    for pair in pairs:
        temp_hand = hand.copy()
        temp_hand.remove(pair)
        temp_hand.remove(pair)
        if is_valid_group(temp_hand):
            return True

    return False

# Chi/Pong logic

def can_pong(hand, tile):
    return hand.count(tile) >= 2

def resolve_pong(player, tile):
    for i in range(2):
        player.hand.remove(tile)
    player.exposed_hand.append([tile] * 3)
    print(f"{tile} added to exposed hand.")

def find_valid_chis(hand, tile):
    if len(tile) != 2 or tile[1] not in ['B', 'C', 'D']:
        return []

    try:
        num = int(tile[0])
        suit = tile[1]
        options = [
            [f"{num-2}{suit}", f"{num-1}{suit}"],
            [f"{num-1}{suit}", f"{num+1}{suit}"],
            [f"{num+1}{suit}", f"{num+2}{suit}"]
        ]
        # Find all Chi options where every tile in the group is present in the player's hand
        valid_chi_options = []

        for chi in options:
            if all(tile in hand for tile in chi):
                valid_chi_options.append(chi)
    except ValueError:
        return []

def can_chi(hand, tile):
    return bool(find_valid_chis(hand, tile))

def resolve_chi(player, tile):
    chi_options = find_valid_chis(player.hand, tile)
    if not chi_options:
        return

    chi = chi_options[0]  
    for t in chi:
        player.hand.remove(t)
    group = chi + [tile]
    group.sort()
    player.exposed_hand.append(group)
    print(f"{group} formed as Chi!")

# To implement: Gang logic - consists of concealed, add-on or Pong-style gang, then drawing replacement tile

def can_gang(hand, tile):
    return hand.count(tile) == 3

def resolve_gang(game, player, tile):
    for i in range(3):
        player.hand.remove(tile)
    player.exposed_hand.append([tile] * 4)
    print(f"{tile} formed as Gang!")
    draw_replacement_tile(game, player)

def can_concealed_gang(hand):
    # Find all tiles in the hand that appear exactly 4 times
    tiles_with_four_copies = []

    tile_counts = Counter(hand)
    for tile, count in tile_counts.items():
        if count == 4:
            tiles_with_four_copies.append(tile)
    return tiles_with_four_copies  

def resolve_concealed_gang(game, player, tile):
    for i in range(4):
        player.hand.remove(tile)
    player.exposed_hand.append([tile] * 4)
    print(f"{tile} formed as (concealed) Gang!")

def can_addon_gang(player):
    upgradeable = []
    for group in player.exposed_hand:
        if len(group) == 3 and all(tile == group[0] for tile in group): # Check for Pong sets
            if group[0] in player.hand:
                upgradeable.append(group[0])
    return upgradeable

def resolve_addon_gang(game, player, tile):
    player.hand.remove(tile)
    for group in player.exposed_hand:
        if len(group) == 3 and group[0] == tile:
            group.append(tile)
            break
    print(f"{tile} upgraded to Gang!")
    draw_replacement_tile(game, player)

def draw_replacement_tile(game, player):
    if game.wall:
        tile = game.wall.pop()
        print(f"Player {player.id} draws replacement tile {tile} after Gang")
        player.draw_tile(tile)
        return tile
    return None

# To implement: Tai calculation