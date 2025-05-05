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

def check_win(hand):
    if len(hand) != 14:
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

def all_chi(hand):
    

def calculate_tai(player):
    tai = 0
    if full_suit(player.hand):
        tai += 3
    if all_chi(player.hand):
        tai += 1
    if all_pong(player.hand):
        tai += 2
    if half_suit(player.hand):
        tai += 2
    tai += dragon_or_wind(player.hand)
    return tai