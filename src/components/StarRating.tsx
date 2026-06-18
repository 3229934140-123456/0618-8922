import { Star } from 'lucide-react'

interface StarRatingProps {
  rating?: number
  value?: number
  interactive?: boolean
  onChange?: (rating: number) => void
  size?: number
}

export default function StarRating({
  rating,
  value,
  interactive = false,
  onChange,
  size = 20,
}: StarRatingProps) {
  const currentRating = value ?? rating ?? 0

  const handleClick = (starValue: number) => {
    if (interactive && onChange) {
      onChange(starValue)
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((starValue) => (
        <button
          key={starValue}
          type="button"
          disabled={!interactive}
          onClick={() => handleClick(starValue)}
          className={`p-0.5 ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <Star
            style={{ width: size, height: size }}
            className={`transition-colors ${
              starValue <= currentRating
                ? 'fill-gold text-gold'
                : 'fill-none text-charcoal/20'
            }`}
          />
        </button>
      ))}
    </div>
  )
}
