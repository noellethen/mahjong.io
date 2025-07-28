import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

/* Data Type for ShopItem and array of our ShopItems */
interface ShopItemType {
  id: number;
  key: string;       
  name: string;
  price: number;
  imageUrl: string;
}

const shopItems: ShopItemType[] = [
  { id: 0, key: 'green',  name: 'Green (Default)',  price: 1000,   imageUrl: '/tiles/back_green.png' },
  { id: 1, key: 'red',  name: 'Red',  price: 1000,   imageUrl: '/designs/back_red.png' },
  { id: 2, key: 'orange',  name: 'Orange',  price: 1000,   imageUrl: '/designs/back_orange.png' },
  { id: 3, key: 'yellow',  name: 'Yellow',  price: 1000,   imageUrl: '/designs/back_yellow.png' },
  { id: 4, key: 'blue',  name: 'Blue',  price: 1000,   imageUrl: '/designs/back_blue.png' },
  { id: 5, key: 'pink',  name: 'Pink',  price: 1000,   imageUrl: '/designs/back_pink.png' },
  { id: 6, key: 'table_1', name: 'Table 1', price: 10000,  imageUrl: 'link4' },
];

type ProfileData = {
  coins: number;
  [flag: string]: any;
};

/* Single Shop Item Card */
interface ShopItemProps {
  item: ShopItemType;
  onBuySuccess: () => void;
  owned: boolean;
}

const ShopItem: React.FC<ShopItemProps> = ({ item, onBuySuccess, owned }) => {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (owned) {
      alert('You already own this item.');
      return;
    }
    setLoading(true);

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      setLoading(false);
      alert('You must be signed in to make a purchase.');
      return;
    }
    const userId = authData.user.id;

    const buyRes = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', userId)
      .single();

    if (buyRes.error || !buyRes.data) {
      console.error(buyRes.error);
      setLoading(false);
      alert('Failed to load your balance.');
      return;
    }

    const currentCoins = (buyRes.data as unknown as ProfileData).coins;

    if (currentCoins < item.price) {
      alert(`Not enough coins. You have ${currentCoins} coins.`);
      setLoading(false);
      return;
    }

    const newBalance = currentCoins - item.price;
    const updates: Record<string, any> = {
      coins: newBalance,
      [item.key]: true,
    };

    const updateRes = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (updateRes.error) {
      console.error(updateRes.error);
      alert('Purchase failed.');
    } else {
      onBuySuccess();
      alert(`Purchase successful! You now have ${newBalance} coins left.`);
    }

    setLoading(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col w-64 h-80">
      <img
        src={item.imageUrl}
        alt={item.name}
        className="h-40 w-full object-contain"
      />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-2 text-white h-10 overflow-hidden whitespace-nowrap overflow-ellipsis">
          {item.name}
        </h3>
        <p className="text-gray-300 mb-4">{item.price} coins</p>
        <button
          className={`mt-auto ${
            owned
              ? 'bg-gray-600 cursor-not-allowed'
              : loading
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium py-2 px-4 rounded`}
          onClick={handleBuy}
          disabled={loading || owned}
        >
          {owned ? 'Owned' : loading ? 'Processing…' : 'Buy'}
        </button>
      </div>
    </div>
  );
};

/* Shop Page: header, balance display, and grid of items */
const Shop: React.FC = () => {
  const [coins, setCoins] = useState<number>(0);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'tiles' | 'boards'>('tiles');

  const fetchProfile = async () => {
    setLoading(true);
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      setLoading(false);
      return;
    }
    const userId = authData.user.id;

    const cols = ['coins', ...shopItems.map(i => i.key)].join(',');
    const profRes = await supabase
      .from('profiles')
      .select(cols)
      .eq('id', userId)
      .single();

    if (!profRes.error && profRes.data) {
      const profile = profRes.data as unknown as ProfileData;
      setCoins(profile.coins);

      const newFlags: Record<string, boolean> = {};
      shopItems.forEach(i => {
        newFlags[i.key] = Boolean(profile[i.key]);
      });
      setFlags(newFlags);
    } else {
      console.error(profRes.error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const filteredItems = shopItems.filter(item =>
    tab === 'tiles'
      ? !item.key.startsWith('table')
      : item.key.startsWith('table')
  );

  return (
    <div className="full-screen-component bg-[url('/Homepage.png')] bg-contain bg-center bg-no-repeat">
      <h1 className="text-3xl font-bold text-center text-white mb-4">
        Shop
      </h1>
      <div className="max-w-md mx-auto mb-8">
        {loading ? (
          <p className="text-center text-gray-300">Loading profile…</p>
        ) : (
          <p className="text-center text-xl text-yellow-300">
            Coins: {coins}
          </p>
        )}
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={() => setTab('tiles')}
          className="px-6 py-2 rounded-l-full border border-gray-600 text-black"
          style={{
            backgroundColor: tab === 'tiles' ? 'goldenrod' : '#b8860b',
            color: tab === 'tiles' ? 'white'    : 'black',
          }}
        >
          Tiles
        </button>
        <button
          onClick={() => setTab('boards')}
          className="px-6 py-2 rounded-r-full border border-gray-600 text-black"
          style={{
            backgroundColor: tab === 'boards' ? 'goldenrod' : '#b8860b',
            color: tab === 'boards' ? 'white' : 'black',
          }}
        >
          Boards
        </button>
      </div>

      <div className="min-h-screen max-w-3xl w-full mx-auto 
        grid 
        grid-cols-1       
        sm:grid-cols-2     
        md:grid-cols-3     
        gap-1">
        {filteredItems.map(item => (
          <ShopItem
            key={item.id}
            item={item}
            onBuySuccess={fetchProfile}
            owned={flags[item.key] || false}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto mt-6 flex justify-end">
        <Link
          to="/homepage"
          className="!text-white visited:!text-white hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

export default Shop;
