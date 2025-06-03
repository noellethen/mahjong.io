/* Data Type for ShopItem and array of our ShopItems */
interface ShopItemType {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

const shopItems: ShopItemType[] = [
  {
    id: 1,
    name: 'Skin 1',
    price: 1000,
    imageUrl: 'link1',
  },
  {
    id: 2,
    name: 'Skin 2',
    price: 2000,
    imageUrl: 'link2',
  },
  {
    id: 3,
    name: 'Skin 3',
    price: 5000,
    imageUrl: 'link3',
  },
  {
    id: 4,
    name: 'Table 1',
    price: 10000,
    imageUrl: 'link4',
  },
];

/* Component for Single ShopItem Card */
const ShopItem: React.FC<{ item: ShopItemType }> = ({ item }) => {
  return (
    <div className="bg-grey rounded-lg shadow-md overflow-hidden flex flex-col w-64 h-80">
      <img
        src={item.imageUrl}
        alt={item.name}
        className="h-40 w-full object-cover"
      />

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-2 text-white h-10 overflow-hidden whitespace-nowrap overflow-ellipsis">
          {item.name}
        </h3>
        <p className="text-white-300 mb-4">{item.price}</p>
        <button
          className="mt-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          onClick={() => console.log(`Buy clicked for item id ${item.id}`)}
        >
          Buy
        </button>
      </div>
    </div>
  );
};


/* Page Component that maps over shop items and displays each Shop Item */
const ShopPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-grey-100 py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Shop</h1>
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shopItems.map((item) => (
          <ShopItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default ShopPage;
