import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { User, Phone, Mail, Plus, X, Camera, StickyNote } from 'lucide-react';
import { useCustomerStore } from '@/store';

const STYLE_OPTIONS = ['自然风', '复古风', '简约风', '时尚风', '文艺风', '清新风', '暗调风', '胶片风'];

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { profile, fetchProfile, updatePreferences } = useCustomerStore();
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    if (id) fetchProfile(Number(id));
  }, [id, fetchProfile]);

  const addTag = async (tag: string) => {
    if (!profile || !id) return;
    if (profile.stylePreferences.includes(tag)) return;
    const updated = [...profile.stylePreferences, tag];
    await updatePreferences(Number(id), updated);
  };

  const removeTag = async (tag: string) => {
    if (!profile || !id) return;
    const updated = profile.stylePreferences.filter((t) => t !== tag);
    await updatePreferences(Number(id), updated);
  };

  const handleAddCustomTag = async () => {
    if (newTag.trim()) {
      await addTag(newTag.trim());
      setNewTag('');
      setShowTagInput(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-ivory font-body pt-20 flex items-center justify-center">
        <p className="text-charcoal/40">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory font-body pt-20">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gold/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h2 className="font-display text-xl text-charcoal">{profile.name}</h2>
                  <p className="text-sm font-body text-charcoal/40">客户 ID: {profile.id}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-body text-charcoal/60">
                  <Phone className="w-4 h-4 text-gold" />
                  {profile.phone || '未填写'}
                </div>
                <div className="flex items-center gap-2 text-sm font-body text-charcoal/60">
                  <Mail className="w-4 h-4 text-gold" />
                  {profile.email || '未填写'}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gold/10">
              <h3 className="font-display text-lg text-charcoal mb-4">风格偏好</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.stylePreferences.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-body bg-gold/10 text-gold"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {STYLE_OPTIONS.filter((s) => !profile.stylePreferences.includes(s)).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="px-3 py-1 rounded-full text-xs font-body border border-gold/20 text-charcoal/50 hover:border-gold hover:text-gold transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              {showTagInput ? (
                <div className="flex gap-2">
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gold/20 text-sm font-body focus:outline-none focus:border-gold"
                    placeholder="自定义标签"
                    autoFocus
                  />
                  <button
                    onClick={handleAddCustomTag}
                    className="px-3 py-1.5 rounded-lg bg-gold text-charcoal text-sm font-body"
                  >
                    添加
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="flex items-center gap-1 text-xs font-body text-charcoal/40 hover:text-gold transition-colors"
                >
                  <Plus className="w-3 h-3" /> 自定义标签
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gold/10">
              <h3 className="font-display text-lg text-charcoal mb-6">拍摄历史</h3>
              {profile.shootingHistory.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-gold/20 space-y-6">
                  {profile.shootingHistory.map((record, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[1.6rem] w-3 h-3 rounded-full bg-gold border-2 border-ivory" />
                      <div className="bg-ivory p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Camera className="w-4 h-4 text-gold" />
                            <span className="font-body text-charcoal font-medium">{record.serviceType}</span>
                          </div>
                          <span className="text-sm font-body text-charcoal/40">{record.date}</span>
                        </div>
                        <div className="flex gap-4 text-sm font-body text-charcoal/50">
                          <span>拍摄 {record.photoCount} 张</span>
                          <span>已选 {record.selectedCount} 张</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-charcoal/40 font-body py-8">暂无拍摄记录</p>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gold/10">
              <h3 className="font-display text-lg text-charcoal mb-4 flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-gold" />
                摄影师备注
              </h3>
              {profile.photographerNotes.length > 0 ? (
                <div className="space-y-3">
                  {profile.photographerNotes.map((note) => (
                    <div key={note.id} className="bg-ivory p-4 rounded-lg">
                      <p className="text-sm font-body text-charcoal/70 mb-1">{note.content}</p>
                      <p className="text-xs font-body text-charcoal/30">{note.createdAt}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-charcoal/40 font-body py-4">暂无备注</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
