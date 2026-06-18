import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import StarRating from '@/components/StarRating';
import { useBookingStore, useReviewStore } from '@/store';

const QUICK_TAGS = ['氛围好', '专业', '出片快', '服务热情', '环境舒适'];

export default function Review() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { bookings, fetchBookings } = useBookingStore();
  const { submitReview } = useReviewStore();

  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const booking = bookings.find((b) => b.id === Number(bookingId));

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!bookingId || rating === 0) return;
    await submitReview({
      bookingId: Number(bookingId),
      customerId: booking?.customerId || 1,
      rating,
      content,
      tags: selectedTags,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-ivory font-body pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <Send className="w-7 h-7 text-gold" />
          </div>
          <h2 className="font-display text-2xl text-charcoal mb-2">感谢您的评价</h2>
          <p className="font-body text-charcoal/50 mb-6">您的反馈对我们非常重要</p>
          <button
            onClick={() => navigate('/my-bookings')}
            className="px-6 py-2.5 rounded-lg bg-gold text-charcoal font-body font-medium hover:bg-gold/90 transition-colors"
          >
            返回我的预约
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory font-body pt-20">
      <div className="container mx-auto px-6 py-10 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm font-body text-charcoal/50 hover:text-gold mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        <h1 className="font-display text-3xl text-charcoal mb-8">评价服务</h1>

        {booking && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gold/10 mb-8">
            <p className="font-body text-charcoal font-medium mb-1">
              {booking.serviceName || `服务 #${booking.serviceId}`}
            </p>
            <p className="text-sm font-body text-charcoal/40">
              {booking.date} {booking.timeSlot}
            </p>
          </div>
        )}

        <div className="space-y-8">
          <div>
            <label className="block font-body text-charcoal/70 mb-3">评分</label>
            <StarRating value={rating} onChange={setRating} interactive size={32} />
          </div>

          <div>
            <label className="block font-body text-charcoal/70 mb-3">快捷标签</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-body transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-gold text-charcoal'
                      : 'bg-white border border-gold/20 text-charcoal/60 hover:border-gold'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-body text-charcoal/70 mb-2">评价内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gold/20 bg-white font-body text-charcoal focus:outline-none focus:border-gold resize-none"
              placeholder="分享您的拍摄体验..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="w-full px-6 py-3 rounded-lg bg-gold text-charcoal font-body font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            提交评价
          </button>
        </div>
      </div>
    </div>
  );
}
