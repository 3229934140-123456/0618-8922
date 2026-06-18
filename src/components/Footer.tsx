import { Camera, Phone, Mail, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

const quickLinks = [
  { to: '/services', label: '服务项目' },
  { to: '/booking', label: '在线预约' },
  { to: '/my-bookings', label: '我的预约' },
  { to: '/reviews', label: '客户评价' },
]

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white/70">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-6 h-6 text-gold" />
              <span className="font-display text-xl font-semibold text-white">
                光影工作室
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              用镜头捕捉每一个值得铭记的瞬间，以专业匠心呈现光影之美。
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium text-sm mb-4 tracking-wider">
              快速链接
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium text-sm mb-4 tracking-wider">
              联系方式
            </h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gold" />
                400-888-9999
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gold" />
                hello@guangying.studio
              </li>
              <li className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gold" />
                上海市静安区南京西路888号
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium text-sm mb-4 tracking-wider">
              关注我们
            </h4>
            <div className="flex gap-3">
              {['微博', '微信', '小红书'].map((platform) => (
                <span
                  key={platform}
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-xs hover:border-gold hover:text-gold transition-colors cursor-pointer"
                >
                  {platform.charAt(0)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-white/30">
            © 2024 光影工作室. 保留所有权利.
          </p>
        </div>
      </div>
    </footer>
  )
}
