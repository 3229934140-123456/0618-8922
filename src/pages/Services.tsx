import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import ServiceCard from '@/components/ServiceCard';
import { useServiceStore } from '@/store';
import type { Service } from '@/store';

const CATEGORIES = [
  { value: 'id_photo', label: '证件照' },
  { value: 'portrait', label: '写真' },
  { value: 'commercial', label: '商业产品' },
  { value: 'wedding', label: '婚纱预拍' },
] as const;

const EMPTY_FORM: Partial<Service> = {
  name: '',
  category: 'portrait',
  duration: 60,
  basePrice: 0,
  depositRate: 0.3,
  includedItems: [],
  description: '',
  imageUrl: '',
  isActive: true,
};

export default function Services() {
  const { services, fetchServices, createService, updateService, deleteService } = useServiceStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Service>>(EMPTY_FORM);
  const [itemsInput, setItemsInput] = useState('');

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openNewForm = () => {
    setForm(EMPTY_FORM);
    setItemsInput('');
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (service: Service) => {
    setForm(service);
    setItemsInput(service.includedItems.join(', '));
    setEditingId(service.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const data = {
      ...form,
      includedItems: itemsInput.split(',').map((s) => s.trim()).filter(Boolean),
    };
    if (editingId) {
      await updateService(editingId, data);
    } else {
      await createService(data);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    await deleteService(id);
  };

  return (
    <div className="min-h-screen bg-ivory font-body pt-20">
      <div className="container mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl text-charcoal">服务管理</h1>
          <button
            onClick={openNewForm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-charcoal font-body font-medium hover:bg-gold/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增服务
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              editable
              onEdit={openEditForm}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center py-20 text-charcoal/40 font-body">
            暂无服务，点击上方按钮新增
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm">
          <div className="bg-ivory rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10">
              <h3 className="font-display text-xl text-charcoal">
                {editingId ? '编辑服务' : '新增服务'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-charcoal/40 hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-body text-charcoal/60 mb-1">服务名称</label>
                <input
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold/20 bg-white font-body text-charcoal focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-body text-charcoal/60 mb-1">分类</label>
                <select
                  value={form.category || 'portrait'}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Service['category'] })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold/20 bg-white font-body text-charcoal focus:outline-none focus:border-gold"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-body text-charcoal/60 mb-1">时长（分钟）</label>
                  <input
                    type="number"
                    value={form.duration || 0}
                    onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gold/20 bg-white font-body text-charcoal focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-body text-charcoal/60 mb-1">基础价格</label>
                  <input
                    type="number"
                    value={form.basePrice || 0}
                    onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gold/20 bg-white font-body text-charcoal focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-body text-charcoal/60 mb-1">定金比例</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={form.depositRate || 0.3}
                  onChange={(e) => setForm({ ...form, depositRate: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold/20 bg-white font-body text-charcoal focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-body text-charcoal/60 mb-1">包含项目（逗号分隔）</label>
                <input
                  value={itemsInput}
                  onChange={(e) => setItemsInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold/20 bg-white font-body text-charcoal focus:outline-none focus:border-gold"
                  placeholder="精修10张, 服装2套"
                />
              </div>

              <div>
                <label className="block text-sm font-body text-charcoal/60 mb-1">描述</label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gold/20 bg-white font-body text-charcoal focus:outline-none focus:border-gold resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gold/10 flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gold/20 font-body text-charcoal/70 hover:bg-gold/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gold text-charcoal font-body font-medium hover:bg-gold/90 transition-colors"
              >
                {editingId ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
