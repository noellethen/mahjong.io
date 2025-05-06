from collections import Counter

def smart_discard(hand):
    tile_counts = Counter(hand)
    
    # Keep pairs/triplets
    keep = {tile for tile, count in tile_counts.items() if count >= 2}

    # keep potential sequences
    for tile in hand:
        if len(tile) == 2 and tile[1] in ['B', 'C', 'D']:
            try:
                num = int(tile[0])
                for i in [-2, -1, 1, 2]:
                    j = f"{num+i}{tile[1]}"
                    if j in hand:
                        keep.add(tile)
            except:
                continue

    for tile in hand:
        if tile not in keep:
            hand.remove(tile)
            return tile
    
    return hand.pop()