import { Quote } from 'lucide-react'
import StarRating from './StarRating'
import type { Review } from '@/store'

interface ReviewCardProps {
  review: Review
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-charcoal">{review.customerName}</p>
          <p className="text-xs text-charcoal/40 mt-0.5">{review.createdAt}</p>
        </div>
        <StarRating rating={review.rating} />
      </div>

      <div className="relative mb-4">
        <Quote className="w-5 h-5 text-gold/30 absolute -top-1 -left-1" />
        <p className="text-sm text-charcoal/70 italic leading-relaxed pl-5">
          {review.content}
        </p>
      </div>

      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-gold border border-gold/30 px-2.5 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
