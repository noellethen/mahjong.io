from collections import Counter

def handle_bonus_tile(player, tile):
    player.bonus_tiles.append(tile)
    if tile in ['Cat', 'Mouse', 'Chicken', 'Centipede']:
        player.tai += 1
    elif tile.startswith("Flower") or tile.startswith("Season"):
        try:
            tile_num = int(tile[-1])
            seat_wind = player.id + 1
            if tile_num == seat_wind:
                player.tai += 1
        except ValueError:
            pass

# Check win

def is_valid_group(tiles):
    if not tiles:
        return True
    
    tile_counts = Counter(tiles)
    first = tiles[0]

    # Check for Pong
    if tile_counts[first] >= 3:
        reduced = tiles.copy()
        for i in range(3):
            reduced.remove(first)
        if is_valid_group(reduced):
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
                if is_valid_group(reduced):
                    return True
        except:
            pass

    return False

def check_win(hand, exposed_hand=[]):
    total_exposed_tiles = sum(len(group) for group in exposed_hand)  
    total_tiles = len(hand) + total_exposed_tiles

    if total_tiles != 14:
        return False  

    tile_counts = Counter(hand)
    pairs = [tile for tile, count in tile_counts.items() if count >= 2]

    for pair in pairs:
        temp_hand = hand.copy()
        temp_hand.remove(pair)
        temp_hand.remove(pair)
        if is_valid_group(sorted(temp_hand)):
            return True

    return False

# Tai Calculation

def all_pong(hand):
    tile_counts = Counter(hand)
    triplet_count = 0
    pair_count = 0

    for tile, count in tile_counts.items():
        if count == 2:
            pair_count += 1
        elif count == 3:
            triplet_count += 1
        elif count == 4:
            triplet_count += 1
            pair_count += 1
        else:
            return False
        
    return triplet_count == 4 and pair_count == 1

def half_suit(hand):
    suits = set()
    for tile in hand:
        if len(tile) == 2 and tile[1] in ['B', 'C', 'D']:
            suits.add(tile[1])
        elif tile in ['East', 'South', 'West', 'North', 'Red', 'Green', 'White']:
            continue
        else:
            return False
    return len(suits) == 1

def full_suit(hand):
    suits = set()
    for tile in hand:
        if len(tile) == 2 and tile[1] in ['B', 'C', 'D']:
            suits.add(tile[1])
        else:
            return False
        
    return len(suits) == 1

def ping_hu(player, hand):
    if player.tai != 0:
        return False
    
    if len(hand) != 14:
        return False
    
    for tile in hand:
        if len(tile) != 2 or tile[1] not in ['B', 'C', 'D']:
            return False
        
    tile_counts = Counter(hand)
    pairs = [tile for tile, count in tile_counts.items() if count >= 2]

    for pair in pairs:
        temp_hand = hand.copy()
        temp_hand.remove(pair)
        temp_hand.remove(pair)

        if all(tile_is_suited(t) for t in temp_hand and all_chi_only(sorted(temp_hand))):
            return True
        
    return False

def tile_is_suited(tile):
    return len(tile) == 2 and tile[1] in ['B', 'C', 'D']

# def all_chi_only(tiles):
#     if not tiles:
#         return True
    
#     tiles = sorted(tiles)
#     first = tiles[0]

#     try:
#         num = int(first[0])
#         suit = first[1]
#         second = f"{num+1}{suit}"
#         third = f"{num+2}{suit}"

#         if second in tiles and third in tiles:
#             reduced = tiles.copy()
#             reduced.remove(first)
#             reduced.remove(second)
#             reduced.remove(third)
#             return all_chi_only(reduced)
#     except:
#         return False
    
#     return False
    
def calculate_tai(player):
    tai = 0
    if full_suit(player.hand): # 一色
        tai += 3
    if all_pong(player.hand): # 碰碰胡
        tai += 2
    if half_suit(player.hand): # 半色
        tai += 2
    if ping_hu(player, player.hand):
        tai += 4
    return tai

# Chi/Pong/Gang logic

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
        return [chi for chi in options if all(t in hand for t in chi)]
    except:
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

def can_gang(hand, tile):
    return hand.count(tile) == 3

def can_concealed_gang(hand):
    return [tile for tile, count in Counter(hand).items() if count == 4]

def can_supplemental_gang(player):
    upgradeable = []
    for group in player.exposed_hand:
        if len(group) == 3 and all(tile == group[0] for tile in group):
            if group[0] in player.hand:
                upgradeable.append(group[0])
    return upgradeable

def resolve_gang(game, player, tile):
    for i in range(3):
        player.hand.remove(tile)
    player.exposed_hand.append([tile] * 4)
    print(f"{tile} formed as (exposed) Gang!")
    draw_replacement_tile(game, player)

def resolve_concealed_gang(game, player, tile):
    for i in range(4):
        player.hand.remove(tile)
    player.exposed_hand.append([tile] * 4)
    print(f"{tile} formed as (concealed) Gang!")
    draw_replacement_tile(game, player)

def resolve_supplemental_gang(game, player, tile):
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