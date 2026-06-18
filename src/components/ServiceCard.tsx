import { Clock, Edit2, Trash2 } from 'lucide-react'
import type { Service } from '@/store'

interface ServiceCardProps {
  service: Service
  onSelect?: (service: Service) => void
  editable?: boolean
  onEdit?: (service: Service) => void
  onDelete?: (id: number) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  id_photo: '证件照',
  portrait: '写真',
  commercial: '商业产品',
  wedding: '婚纱预拍',
}

export default function ServiceCard({
  service,
  onSelect,
  editable = false,
  onEdit,
  onDelete,
}: ServiceCardProps) {
  return (
    <div
      onClick={() => onSelect?.(service)}
      className={`group relative overflow-hidden rounded-2xl card-hover border-2 border-transparent hover:border-gold ${
        onSelect ? 'cursor-pointer' : ''
      }`}
    >
      <div className="relative h-56 bg-charcoal">
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={service.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-charcoal to-charcoal/80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent" />

        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-gold/90 text-white text-xs font-medium rounded-full">
            {CATEGORY_LABELS[service.category] || service.category}
          </span>
        </div>

        {editable && (
          <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(service)
              }}
              className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <Edit2 className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(service.id)
              }}
              className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-red-500/50 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="font-display text-xl font-semibold text-white mb-1">
            {service.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-gold font-display text-lg font-semibold">
              ¥{service.basePrice}
            </span>
            <span className="flex items-center gap-1 text-white/70 text-sm">
              <Clock className="w-3.5 h-3.5" />
              {service.duration}分钟
            </span>
          </div>
        </div>
      </div>

      {service.includedItems && service.includedItems.length > 0 && (
        <div className="bg-white p-4">
          <div className="flex flex-wrap gap-1.5">
            {service.includedItems.map((item, index) => (
              <span
                key={index}
                className="text-xs text-charcoal/60 bg-warm-gray px-2 py-1 rounded-md"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
