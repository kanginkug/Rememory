import { Search, Plus, Home, BookImage, Map, User } from "lucide-react";
import MemoryCard from "@/components/MemoryCard";
import SortChip from "@/components/SortChip";

const memories = [
  {
    image: "https://picsum.photos/seed/jeju/400/300",
    title: "제주도 푸른 밤",
    placeCount: 8,
    memberCount: 3,
    rating: 4.8,
    date: "3.1 (토) - 3.5 (수)",
  },
  {
    image: "https://picsum.photos/seed/seoul/400/300",
    title: "서울 골목 산책",
    placeCount: 3,
    memberCount: 3,
    rating: 4.5,
    date: "2.15 (토) - 2.17 (월)",
  },
  {
    image: "https://picsum.photos/seed/camping/400/300",
    title: "가평 캠핑 여행",
    placeCount: 8,
    memberCount: 3,
    rating: 4.7,
    date: "1.20 (월) - 1.22 (수)",
  },
  {
    image: "https://picsum.photos/seed/cafe99/400/300",
    title: "남해 보리암 데이트",
    placeCount: 5,
    memberCount: 2,
    rating: 4.3,
    date: "12.10 (화) - 12.11 (수)",
  },
];

export default function MemoriesPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#BFDBF3" }}>
      <div className="mx-auto max-w-md px-5 pb-28 pt-6">
        {/* Search */}
        <div className="mb-5">
          <div className="flex h-14 items-center gap-3 rounded-full bg-white px-5 shadow-sm">
            <Search className="text-gray-400" size={20} />
            <input
              placeholder="추억 이름으로 검색"
              className="flex-1 bg-transparent outline-none placeholder:text-gray-400 text-sm"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
          <SortChip label="최신순" active />
          <SortChip label="오래된순" />
          <SortChip label="별점높은순" />
          <SortChip label="별점낮은순" />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-4">
          {memories.map((memory) => (
            <MemoryCard key={memory.title} {...memory} />
          ))}
        </div>
      </div>

      {/* Floating Button */}
      <button className="fixed bottom-24 right-5 flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-4 font-bold shadow-xl text-sm">
        <Plus size={18} />
        추억 생성하기
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white">
        <div className="mx-auto flex max-w-md justify-around py-3">
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Home size={22} />
            <span className="text-xs">홈</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-orange-500">
            <BookImage size={22} />
            <span className="text-xs">추억</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Map size={22} />
            <span className="text-xs">지도탐색</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <User size={22} />
            <span className="text-xs">마이페이지</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
