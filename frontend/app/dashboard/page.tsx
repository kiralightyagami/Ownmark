import { ProductCard } from "@/components/dashboard/product-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function DiscoverPage() {
  const products = [
    {
      id: 1,
      title: "Neon Cyberpunk 3D Pack",
      creator: "DigitalDreams",
      price: 1.5,
      imageUrl: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2940&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "Lo-Fi Beats Collection Vol. 1",
      creator: "AudioAlchemy",
      price: 0.8,
      imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2940&auto=format&fit=crop",
    },
    {
      id: 3,
      title: "Minimalist UI Kit for React",
      creator: "InterfaceLab",
      price: 2.0,
      imageUrl: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=2940&auto=format&fit=crop",
    },
    {
      id: 4,
      title: "Abstract Gradient Wallpapers",
      creator: "ColorFlow",
      price: 0.5,
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2940&auto=format&fit=crop",
    },
    {
      id: 5,
      title: "Pro Photography Presets",
      creator: "LensMaster",
      price: 1.2,
      imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2800&auto=format&fit=crop",
    },
    {
      id: 6,
      title: "3D Blender Texture Pack",
      creator: "PolyGon",
      price: 3.5,
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2864&auto=format&fit=crop",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Discover</h1>
          <p className="text-zinc-400">Explore the best digital assets from top creators.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Search products..." 
            className="bg-zinc-900 border-zinc-800 text-white pl-10 focus-visible:ring-zinc-700"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            title={product.title}
            creator={product.creator}
            price={product.price}
            imageUrl={product.imageUrl}
          />
        ))}
      </div>
    </div>
  );
}
