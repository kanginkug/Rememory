import Image from "next/image";
import { MapPin, Users, Star } from "lucide-react";

/** MemoryCard 컴포넌트 props */
interface MemoryCardProps {
  image: string;
  title: string;
  placeCount: number;
  memberCount: number;
  rating: number;
  date: string;
}

/** 추억 정보를 요약해서 보여주는 카드 (표지 이미지, 장소 수, 멤버 수, 평균 별점, 날짜) */
export default function MemoryCard({
  image,
  title,
  placeCount,
  memberCount,
  rating,
  date,
}: MemoryCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <div className="relative aspect-[4/3]">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>
      <div className="p-3">
        <h3 className="mb-2 line-clamp-1 text-base font-bold">{title}</h3>
        <div className="mb-2 flex items-center gap-3 text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin size={14} />
            <span className="text-xs">{placeCount}곳</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span className="text-xs">{memberCount}명</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs">{rating}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
    </div>
  );
}
