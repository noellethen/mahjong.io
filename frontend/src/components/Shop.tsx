import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; 

/* Data Type for ShopItem and array of our ShopItems */
interface ShopItemType {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

const shopItems: ShopItemType[] = [
  { id: 1, name: 'Skin 1', price: 1000, imageUrl: 'link1' },
  { id: 2, name: 'Skin 2', price: 2000, imageUrl: 'link2' },
  { id: 3, name: 'Skin 3', price: 5000, imageUrl: 'link3' },
  { id: 4, name: 'Table 1', price: 10000, imageUrl: 'link4' },
];

/* Single Shop Item Card */
interface ShopItemProps {
  item: ShopItemType;
  onBuySuccess: () => void;
}

const ShopItem: React.FC<ShopItemProps> = ({ item, onBuySuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      alert('You must be signed in to make a purchase.');
      return;
    }
    const userId = user.id;

    try {
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        throw new Error('Failed to fetch your profile.');
      }

      const currentCoins: number = profileData.coins;

      if (currentCoins < item.price) {
        alert(`Not enough coins. You have ${currentCoins} coins.`);
        setLoading(false);
        return;
      }

      const newBalance = currentCoins - item.price;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: newBalance })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      onBuySuccess();

      alert(`Purchase successful! You now have ${newBalance} coins left.`);
    } catch (err: any) {
      console.error('Error buying item:', err);
      alert(err.message || 'Purchase failed. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col w-64 h-80">
      <img
        src={item.imageUrl}
        alt={item.name}
        className="h-40 w-full object-cover"
      />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-2 text-white h-10 overflow-hidden whitespace-nowrap overflow-ellipsis">
          {item.name}
        </h3>
        <p className="text-gray-300 mb-4">{item.price} coins</p>
        <button
          className={`mt-auto ${
            loading
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium py-2 px-4 rounded`}
          onClick={handleBuy}
          disabled={loading}
        >
          {loading ? 'Processing…' : 'Buy'}
        </button>
      </div>
    </div>
  );
};

/* Shop Page: header, balance display, and grid of items */
const ShopPage: React.FC = () => {
  const [coins, setCoins] = useState<number | null>(null);
  const [loadingCoins, setLoadingCoins] = useState(true);

  const fetchBalance = async () => {
    setLoadingCoins(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setCoins(null);
      setLoadingCoins(false);
      return;
    }
    const userId = user.id;

    try {
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        console.error('Failed to fetch balance:', profileError);
        setCoins(null);
      } else {
        setCoins(profileData.coins);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setCoins(null);
    } finally {
      setLoadingCoins(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return (
    <div className="min-h-screen bg-black-900 py-8 px-4">
      <h1 className="text-3xl font-bold text-center text-white mb-4">
        Shop
      </h1>
      <div className="max-w-md mx-auto mb-8">
        {loadingCoins ? (
          <p className="text-center text-gray-300">Loading balance…</p>
        ) : coins === null ? (
          <p className="text-center text-red-400">Not signed in.</p>
        ) : (
          <p className="text-center text-xl text-yellow-300">
            Your coins: {coins}
          </p>
        )}
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shopItems.map((item) => (
          <ShopItem
            key={item.id}
            item={item}
            onBuySuccess={fetchBalance}
          />
        ))}
      </div>
    </div>
  );
};

export default ShopPage;
