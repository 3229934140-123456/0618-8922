import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Users, Camera, Sparkles } from 'lucide-react';
import ServiceCard from '@/components/ServiceCard';
import ReviewCard from '@/components/ReviewCard';
import { useServiceStore, useReviewStore } from '@/store';

const HERO_IMAGE = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20photography%20studio%20interior%20with%20soft%20lighting%20and%20elegant%20equipment&image_size=landscape_16_9';

const TEAM_HIGHLIGHTS = [
  { icon: Award, label: '10年+行业经验' },
  { icon: Users, label: '5000+满意客户' },
  { icon: Camera, label: '专业级影棚设备' },
  { icon: Sparkles, label: '一对一专属服务' },
];

export default function Home() {
  const { services, fetchServices } = useServiceStore();
  const { featuredReviews, fetchFeatured } = useReviewStore();

  useEffect(() => {
    fetchServices();
    fetchFeatured();
  }, [fetchServices, fetchFeatured]);

  return (
    <div className="min-h-screen bg-ivory font-body">
      <section className="relative h-screen flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-charcoal/70" />
        <div className="relative z-10 text-center px-6">
          <h1 className="font-display text-5xl md:text-7xl text-ivory mb-4 tracking-wider">
            光影工作室
          </h1>
          <p className="font-body text-lg md:text-xl text-ivory/70 mb-8">
            捕捉每一个值得铭记的瞬间
          </p>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-gold text-charcoal font-body font-medium hover:bg-gold/90 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            立即预约
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="container mx-auto">
          <h2 className="font-display text-3xl text-charcoal text-center mb-3">我们的服务</h2>
          <div className="w-16 h-0.5 bg-gold mx-auto mb-12" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.slice(0, 4).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-charcoal">
        <div className="container mx-auto">
          <h2 className="font-display text-3xl text-ivory text-center mb-3">客户好评</h2>
          <div className="w-16 h-0.5 bg-gold mx-auto mb-12" />
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {featuredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
            {featuredReviews.length === 0 && (
              <p className="text-ivory/40 font-body text-center w-full">暂无评价</p>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-display text-3xl text-charcoal text-center mb-3">关于我们</h2>
          <div className="w-16 h-0.5 bg-gold mx-auto mb-12" />
          <p className="font-body text-charcoal/60 text-center leading-relaxed mb-12 max-w-2xl mx-auto">
            光影工作室成立于2014年，专注于人像写真、商业摄影与婚纱预拍。我们拥有超过10年的行业经验，
            配备专业级影棚与灯光设备，致力于为每一位客户打造独一无二的视觉体验。
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TEAM_HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <div key={label} className="text-center p-6 rounded-xl bg-white border border-gold/10">
                <Icon className="w-8 h-8 text-gold mx-auto mb-3" />
                <p className="text-sm font-body text-charcoal/70">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
