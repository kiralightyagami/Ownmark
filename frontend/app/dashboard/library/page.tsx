import { ProductCard } from "@/components/dashboard/product-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function LibraryPage() {
  const ownedProducts = [
    {
      id: 101,
      title: "Cyberpunk City Assets",
      creator: "FutureWorld",
      price: 2.5,
      imageUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2940&auto=format&fit=crop",
    },
    {
      id: 102,
      title: "Indie Game Sound Effects",
      creator: "SoundStudio",
      price: 1.0,
      imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2940&auto=format&fit=crop",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">My Library</h1>
          <p className="text-zinc-400">Access and download your purchased content.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Search library..." 
            className="bg-zinc-900 border-zinc-800 text-white pl-10 focus-visible:ring-zinc-700"
          />
        </div>
      </div>

      {/* Grid */}
      {ownedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ownedProducts.map((product) => (
            <ProductCard
              key={product.id}
              title={product.title}
              creator={product.creator}
              price={product.price}
              imageUrl={product.imageUrl}
              isOwned={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-500">
          <p>You haven&apos;t purchased anything yet.</p>
        </div>
      )}
    </div>
  );
}
