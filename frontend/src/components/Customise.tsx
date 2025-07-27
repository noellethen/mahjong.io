import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

/* Data Type for All Items and array of our Items */
interface ItemType {
  key: string;
  name: string;
  imageUrl: string;
  type: 'skin' | 'table';
}

const allItems: ItemType[] = [
  { key: 'green',  name: 'Green (Default)',  imageUrl: '/tiles/back_green.png',  type: 'skin'  },
  { key: 'red',  name: 'Red',  imageUrl: '/designs/back_red.png',  type: 'skin'  },
  { key: 'orange',  name: 'Orange',  imageUrl: '/designs/back_orange.png',  type: 'skin'  },
  { key: 'yellow',  name: 'Yellow',  imageUrl: '/designs/back_yellow.png',  type: 'skin'  },
  { key: 'blue',  name: 'Blue',  imageUrl: '/designs/back_blue.png',  type: 'skin'  },
  { key: 'pink',  name: 'Pink',  imageUrl: '/designs/back_pink.png',  type: 'skin'  },
  { key: 'table_0', name: 'Table 0', imageUrl: '/tables/0.png', type: 'table' },
  { key: 'table_1', name: 'Table 1', imageUrl: '/tables/1.png', type: 'table' },
];

type ProfileData = {
  equipped_skin: string;
  equipped_table: string;
  [flag: string]: any;
};

/* Owned Item Card */
interface OwnedItemProps {
  item: ItemType;
  onEquip: (item: ItemType) => void;
  equipped: boolean;
}

const OwnedItem: React.FC<OwnedItemProps> = ({ item, onEquip, equipped }) => (
  <div
    className={`bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col w-64 h-72
      ${equipped ? 'border-4 border-yellow-500' : ''}`}
  >
    <img
      src={item.imageUrl}
      alt={item.name}
      className="h-40 w-full object-contain"
    />
    <div className="p-4 flex flex-col flex-grow">
      <h3 className="text-lg font-semibold mb-2 text-white h-10 overflow-hidden whitespace-nowrap overflow-ellipsis">
        {item.name}
      </h3>
      <button
        onClick={() => { if (!equipped) onEquip(item) }}
        disabled={equipped}
        className="w-full rounded-md border px-4 py-2 text-white font-medium"
        style={{ backgroundColor: equipped ? 'green' : undefined }}
      >
        {equipped ? 'Equipped' : 'Equip'}
      </button>

    </div>
  </div>
);

/* Customise Page */
const Customise: React.FC = () => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [equippedSkin, setEquippedSkin] = useState('green');
  const [equippedTable, setEquippedTable] = useState('table_0');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'skins' | 'tables'>('skins');

  const fetchProfile = async () => {
    setLoading(true);
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      setLoading(false);
      return;
    }
    const userId = authData.user.id;

    const cols = ['equipped_skin', 'equipped_table', ...allItems.map(i => i.key)].join(',');
    const { data, error } = await supabase
      .from('profiles')
      .select(cols)
      .eq('id', userId)
      .single();

    if (data && !error) {
      const profile = data as unknown as ProfileData;
      setEquippedSkin(profile.equipped_skin);
      setEquippedTable(profile.equipped_table);

      const newFlags: Record<string, boolean> = {};
      allItems.forEach(i => {
        newFlags[i.key] = Boolean(profile[i.key]);
      });
      setFlags(newFlags);
    } else {
      console.error(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEquip = async (item: ItemType) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;

    const column = item.type === 'skin' ? 'equipped_skin' : 'equipped_table';
    const { error } = await supabase
      .from('profiles')
      .update({ [column]: item.key })
      .eq('id', authData.user.id);

    if (!error) {
      alert(`You have equipped ${item.name}!`);
      if (item.type === 'skin') setEquippedSkin(item.key);
      else setEquippedTable(item.key);
    } else {
      console.error(error);
      alert('Failed to equip item.');
    }
  };

  if (loading) {
    return <p className="text-center text-gray-300">Loading…</p>;
  }

  return (
    <div className="full-screen-component min-h-screen py-8 px-125 bg-[url('/Homepage.png')] bg-contain bg-center bg-no-repeat">
      <h1 className="text-3xl font-bold text-center text-white mb-4">
        Customise
      </h1>
      <div className="flex justify-center mb-6 py-10">
        <div className="relative inline-flex rounded-full p-1">
          <div
            className="absolute top-1 bottom-1 w-1/2 bg-goldenrod rounded-full transition-all duration-300"
            style={{ left: tab === 'skins' ? '0%' : '50%' }}
          />
          <button
            onClick={() => setTab('skins')}
            className="px-6 py-2 rounded-l-full border border-gray-600 text-black"
            style={{
              backgroundColor: tab === 'skins' ? 'goldenrod' : '#b8860b',
              color: tab === 'skins' ? 'white'    : 'black',
            }}
          >
            Tiles
          </button>
          <button
            onClick={() => setTab('tables')}
            className="px-6 py-2 rounded-l-full border border-gray-600 text-black"
            style={{
              backgroundColor: tab === 'tables' ? 'goldenrod' : '#b8860b',
              color: tab === 'tables' ? 'white'    : 'black',
            }}
          >
            Boards
          </button>
        </div>
      </div>

      {tab === 'skins' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {allItems
              .filter(i => i.type === 'skin' && flags[i.key])
              .map(i => (
                <OwnedItem
                  key={i.key}
                  item={i}
                  onEquip={handleEquip}
                  equipped={i.key === equippedSkin}
                />
              ))}
          </div>
        </>
      )}

      {tab === 'tables' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {allItems
              .filter(i => i.type === 'table' && flags[i.key])
              .map(i => (
                <OwnedItem
                  key={i.key}
                  item={i}
                  onEquip={handleEquip}
                  equipped={i.key === equippedTable}
                />
              ))}
          </div>
        </>
      )}

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

export default Customise;
