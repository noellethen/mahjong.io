def generate_suited_tiles():
    suits = ['B', 'C', 'D']  # Bamboo, Characters, Dots
    tiles = [f"{num}{suit}" for suit in suits for num in range(1, 10) for _ in range(4)]
    return tiles

def generate_honor_tiles():
    honors = ['East', 'South', 'West', 'North', 'Red', 'Green', 'White']
    return [honor for honor in honors for i in range(4)]

def generate_bonus_tiles():
    flowers = [f"Flower{i}" for i in range(1, 5)]
    seasons = [f"Season{i}" for i in range(1, 5)]
    animals = ["Cat", "Mouse", "Chicken", "Centipede"]  
    return flowers + seasons + animals

def generate_full_wall(include_bonus = True):
    wall = generate_suited_tiles() + generate_honor_tiles()
    if include_bonus:
        wall += generate_bonus_tiles()
    return wall

def sort_tile(hand):
    # Sort in order of: Bamboo, Characters, Dots, Honors
    bamboos = []
    characters = []
    dots = []
    honors = []

    for tile in hand:
        if len(tile) == 2 and tile[1] == 'B':
            bamboos.append(tile)
        elif len(tile) == 2 and tile[1] == 'C':
            characters.append(tile)
        elif len(tile) == 2 and tile[1] == 'D':
            dots.append(tile)
        else:
            honors.append(tile)

    bamboos.sort(key=lambda x: int(x[0]))
    characters.sort(key=lambda x: int(x[0]))
    dots.sort(key=lambda x: int(x[0]))
    honors.sort()

    return bamboos + characters + dots + honors