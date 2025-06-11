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
  { key: 'skin_0',  name: 'Skin 0',   imageUrl: '/skins/0.png', type: 'skin' },
  { key: 'skin_1',  name: 'Skin 1',      imageUrl: '/skins/1.png', type: 'skin' },
  { key: 'skin_2',  name: 'Skin 2',       imageUrl: '/skins/2.png', type: 'skin' },
  { key: 'skin_3',  name: 'Skin 3',       imageUrl: '/skins/2.png', type: 'skin' },
  { key: 'table_0', name: 'Table 0',  imageUrl: '/tables/0.png', type: 'table' },
  { key: 'table_1', name: 'Table 1',     imageUrl: '/tables/1.png', type: 'table' },
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
}

const OwnedItem: React.FC<OwnedItemProps> = ({ item, onEquip }) => (
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
      <button
        onClick={() => onEquip(item)}
        className="mt-auto bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
      >
        Equip
      </button>
    </div>
  </div>
);

/* Customise Page */
const Customise: React.FC = () => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [equippedSkin, setEquippedSkin] = useState('skin_0');
  const [equippedTable, setEquippedTable] = useState('table_0');
  const [loading, setLoading] = useState(true);

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
    <div className="p-8">
      <h1 className="text-2xl text-white mb-6">Customize Your Avatar</h1>
      <h2 className="text-white mb-2">Skins (equipped: {equippedSkin})</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {allItems
          .filter(i => i.type === 'skin' && flags[i.key])
          .map(i => (
            <OwnedItem key={i.key} item={i} onEquip={handleEquip} />
          ))}
      </div>

      <h2 className="text-white mb-2">Tables (equipped: {equippedTable})</h2>
      <div className="grid grid-cols-3 gap-4">
        {allItems
          .filter(i => i.type === 'table' && flags[i.key])
          .map(i => (
            <OwnedItem key={i.key} item={i} onEquip={handleEquip} />
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

export default Customise;