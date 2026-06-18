import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ChevronDown, ChevronUp, MapPin, Shirt, Image, MessageSquare } from 'lucide-react';
import { useBookingStore } from '@/store';
import type { Booking } from '@/store';

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待确认' },
  { key: 'confirmed', label: '已确认' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-500' },
};

export default function MyBookings() {
  const { bookings, fetchBookings } = useBookingStore();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filtered = activeTab === 'all' ? bookings : bookings.filter((b) => b.status === activeTab);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-ivory font-body pt-20">
      <div className="container mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-charcoal mb-8">我的预约</h1>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-full text-sm font-body whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-gold text-charcoal'
                  : 'bg-white text-charcoal/60 border border-gold/20 hover:border-gold'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((booking) => (
            <BookingItem
              key={booking.id}
              booking={booking}
              expanded={expandedId === booking.id}
              onToggle={() => toggleExpand(booking.id)}
            />
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-20 text-charcoal/40 font-body">暂无预约记录</div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingItem({
  booking,
  expanded,
  onToggle,
}: {
  booking: Booking;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;

  return (
    <div className="bg-white rounded-xl border border-gold/10 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-ivory/50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body text-charcoal font-medium truncate">
              {booking.serviceName || `服务 #${booking.serviceId}`}
            </p>
            <p className="text-sm font-body text-charcoal/50">
              {booking.date} {booking.timeSlot}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-body ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
          {booking.depositPaid ? (
            <span className="text-xs font-body text-green-600">已付定金</span>
          ) : (
            <span className="text-xs font-body text-charcoal/40">未付定金</span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-charcoal/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-charcoal/40" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-5 border-t border-gold/10 pt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-body">
            <div>
              <p className="text-charcoal/40 mb-1">预约编号</p>
              <p className="text-charcoal">#{booking.id}</p>
            </div>
            <div>
              <p className="text-charcoal/40 mb-1">日期</p>
              <p className="text-charcoal flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />{booking.date}
              </p>
            </div>
            <div>
              <p className="text-charcoal/40 mb-1">时段</p>
              <p className="text-charcoal flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />{booking.timeSlot}
              </p>
            </div>
            <div>
              <p className="text-charcoal/40 mb-1">总价</p>
              <p className="text-gold font-medium">¥{booking.totalPrice}</p>
            </div>
          </div>

          {booking.notes && (
            <div className="text-sm font-body text-charcoal/60 bg-ivory p-3 rounded-lg">
              {booking.notes}
            </div>
          )}

          <div className="bg-ivory p-4 rounded-lg space-y-2">
            <p className="text-sm font-body text-charcoal/70 font-medium">注意事项</p>
            <div className="flex items-start gap-2 text-xs font-body text-charcoal/50">
              <Shirt className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>建议穿着浅色或素色服装，避免大面积花纹。如有特殊服装需求请提前沟通。</span>
            </div>
            <div className="flex items-start gap-2 text-xs font-body text-charcoal/50">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>上海市静安区南京西路1688号，地铁2/12/13号线南京西路站3号口步行5分钟。</span>
            </div>
          </div>

          {booking.status === 'completed' && (
            <div className="flex gap-3">
              <Link
                to={`/album/booking-${booking.id}`}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gold/20 text-sm font-body text-charcoal/70 hover:border-gold transition-colors"
              >
                <Image className="w-4 h-4" />查看相册
              </Link>
              <Link
                to={`/review/${booking.id}`}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gold text-sm font-body text-charcoal hover:bg-gold/90 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />去评价
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
