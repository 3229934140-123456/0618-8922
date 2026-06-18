import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck, DollarSign, Image, ThumbsUp,
  Settings, CalendarDays, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { useStatsStore, useBookingStore } from '@/store';
import type { Booking } from '@/store';

const STATUS_ACTIONS: Record<string, { label: string; icon: typeof CheckCircle; color: string }[]> = {
  pending: [
    { label: '确认', icon: CheckCircle, color: 'text-blue-600' },
    { label: '取消', icon: XCircle, color: 'text-red-400' },
  ],
  confirmed: [
    { label: '完成', icon: CheckCircle, color: 'text-green-600' },
    { label: '取消', icon: XCircle, color: 'text-red-400' },
  ],
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function Admin() {
  const { stats, fetchStats } = useStatsStore();
  const { bookings, fetchBookings, updateBookingStatus } = useBookingStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<'date' | 'status'>('date');

  useEffect(() => {
    fetchStats();
    fetchBookings();
  }, [fetchStats, fetchBookings]);

  const filtered = bookings
    .filter((b) => statusFilter === 'all' || b.status === statusFilter)
    .sort((a, b) => {
      if (sortKey === 'date') return b.date.localeCompare(a.date);
      return a.status.localeCompare(b.status);
    });

  const handleAction = async (id: number, action: string) => {
    const statusMap: Record<string, Booking['status']> = {
      确认: 'confirmed',
      完成: 'completed',
      取消: 'cancelled',
    };
    const newStatus = statusMap[action];
    if (newStatus) await updateBookingStatus(id, newStatus);
  };

  const statCards = [
    { icon: CalendarCheck, label: '今日预约', value: stats?.todayBookings ?? 0, color: 'text-blue-600' },
    { icon: DollarSign, label: '本月收入', value: `¥${(stats?.monthlyRevenue ?? 0).toLocaleString()}`, color: 'text-gold' },
    { icon: Image, label: '待选片', value: stats?.pendingSelections ?? 0, color: 'text-purple-600' },
    { icon: ThumbsUp, label: '好评率', value: `${(stats?.reviewRate ?? 0)}%`, color: 'text-green-600' },
  ];

  return (
    <div className="min-h-screen bg-ivory font-body pt-20">
      <div className="container mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl text-charcoal">管理后台</h1>
          <div className="flex gap-2">
            <Link
              to="/admin/schedule"
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gold/20 text-sm font-body text-charcoal/70 hover:border-gold hover:text-gold transition-colors"
            >
              <CalendarDays className="w-4 h-4" />档期管理
            </Link>
            <Link
              to="/admin/pricing"
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gold/20 text-sm font-body text-charcoal/70 hover:border-gold hover:text-gold transition-colors"
            >
              <Settings className="w-4 h-4" />价格配置
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gold/10">
              <div className="flex items-center gap-3 mb-3">
                <Icon className={`w-6 h-6 ${color}`} />
                <span className="text-sm font-body text-charcoal/50">{label}</span>
              </div>
              <p className="font-display text-2xl text-charcoal">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gold/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-gold/10 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-lg text-charcoal">预约管理</h2>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gold/20 text-sm font-body text-charcoal/70 focus:outline-none focus:border-gold"
              >
                <option value="all">全部状态</option>
                <option value="pending">待确认</option>
                <option value="confirmed">已确认</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
              <button
                onClick={() => setSortKey(sortKey === 'date' ? 'status' : 'date')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gold/20 text-sm font-body text-charcoal/70 hover:border-gold transition-colors"
              >
                <Clock className="w-4 h-4" />
                {sortKey === 'date' ? '按日期' : '按状态'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-ivory text-xs font-body text-charcoal/50">
                  <th className="text-left px-6 py-3">编号</th>
                  <th className="text-left px-6 py-3">客户</th>
                  <th className="text-left px-6 py-3">服务</th>
                  <th className="text-left px-6 py-3">日期</th>
                  <th className="text-left px-6 py-3">时段</th>
                  <th className="text-left px-6 py-3">状态</th>
                  <th className="text-left px-6 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => (
                  <tr key={booking.id} className="border-t border-gold/5 hover:bg-ivory/50">
                    <td className="px-6 py-3 text-sm font-body text-charcoal">#{booking.id}</td>
                    <td className="px-6 py-3 text-sm font-body text-charcoal/70">
                      {booking.customerName || `客户#${booking.customerId}`}
                    </td>
                    <td className="px-6 py-3 text-sm font-body text-charcoal/70">
                      {booking.serviceName || `服务#${booking.serviceId}`}
                    </td>
                    <td className="px-6 py-3 text-sm font-body text-charcoal/70">{booking.date}</td>
                    <td className="px-6 py-3 text-sm font-body text-charcoal/70">{booking.timeSlot}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-body ${STATUS_COLORS[booking.status]}`}>
                        {STATUS_LABELS[booking.status]}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        {(STATUS_ACTIONS[booking.status] || []).map(({ label, icon: Icon, color }) => (
                          <button
                            key={label}
                            onClick={() => handleAction(booking.id, label)}
                            className={`flex items-center gap-1 text-xs font-body ${color} hover:opacity-70 transition-opacity`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-charcoal/40 font-body">暂无预约记录</div>
          )}
        </div>
      </div>
    </div>
  );
}
