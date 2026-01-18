import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Copy, ThumbsUp, Plus, X, Send, User, Clock, AlertCircle, TrendingUp, Calendar, Wifi, WifiOff } from 'lucide-react';
import { db } from '../firebase';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    increment,
    query,
    orderBy
} from 'firebase/firestore';

const AiPromptLibrary = () => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'popular'
    const [searchTerm, setSearchTerm] = useState('');
    const [prompts, setPrompts] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPrompt, setNewPrompt] = useState({ title: '', content: '', category: 'code', author: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [votingInProgress, setVotingInProgress] = useState(new Set());

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dbStatus, setDbStatus] = useState('connecting'); // connecting, online, error

    // Use state for UI and Ref for synchronous logic to prevent race conditions
    const [likedPrompts, setLikedPrompts] = useState(() => {
        const saved = localStorage.getItem('parguszu_liked_prompts');
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed.map(id => String(id)) : [];
    });
    const likedPromptsRef = useRef(likedPrompts);

    // Sync Ref and LocalStorage with State
    useEffect(() => {
        likedPromptsRef.current = likedPrompts;
        localStorage.setItem('parguszu_liked_prompts', JSON.stringify(likedPrompts));
    }, [likedPrompts]);

    // Fetch Prompts from Firestore
    useEffect(() => {
        console.log("Initializing Firestore sync... v3.2 Diagnostic Build");
        const q = query(collection(db, 'prompts'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const promptData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPrompts(promptData);
            setLoading(false);
            setError(null);
            setDbStatus('online');
            console.log(`[Firestore] Sync OK - ${promptData.length} items loaded. Metadata:`, snapshot.metadata);
        }, (err) => {
            console.error("[Firestore] Sync Failed:", err);
            setError(`Veritabanı Hatası: ${err.message}`);
            setDbStatus('error');
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddPrompt = async (e) => {
        e.preventDefault();

        if (!newPrompt.title || !newPrompt.content || !newPrompt.author) {
            alert("Lütfen tüm alanları doldurunuz.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        console.log("[Diagnostic] Attempting to save prompt:", newPrompt.title);

        const promptData = {
            ...newPrompt,
            votes: 0,
            createdAt: new Date().toISOString()
        };

        // v3.2 Strict Timed Write
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Zaman Aşımı: Sunucu 10 saniye boyunca yanıt vermedi. Lütfen internetinizi veya Firebase kurallarını kontrol edin.")), 10000)
        );

        try {
            console.log("[Diagnostic] Sending to Firestore...");
            await Promise.race([
                addDoc(collection(db, 'prompts'), promptData),
                timeoutPromise
            ]);

            console.log("[Diagnostic] Save Success confirmed by server!");
            setNewPrompt({ title: '', content: '', category: 'code', author: '' });
            setShowAddForm(false);
            alert("Prompt başarıyla kaydedildi ve tüm kullanıcılara yayınlandı!");
        } catch (err) {
            console.error("[Diagnostic] Save Failed:", err);
            setError(`Yayınlama Hatası: ${err.message}`);
            alert(`Hata: ${err.message}\n\nEğer bu sorun devam ederse, Firebase Rules ayarlarınızı kontrol edin.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (id) => {
        if (votingInProgress.has(id)) return;
        const promptId = String(id);
        const isCurrentlyLiked = likedPrompts.includes(promptId);
        setVotingInProgress(prev => new Set(prev).add(promptId));

        try {
            const promptRef = doc(db, 'prompts', promptId);
            if (isCurrentlyLiked) {
                setLikedPrompts(likedPrompts.filter(pId => pId !== promptId));
                await updateDoc(promptRef, { votes: increment(-1) });
            } else {
                setLikedPrompts([...likedPrompts, promptId]);
                await updateDoc(promptRef, { votes: increment(1) });
            }
        } catch (error) {
            console.error("Like error:", error);
            if (isCurrentlyLiked) setLikedPrompts(prev => [...prev, promptId]);
            else setLikedPrompts(prev => prev.filter(pId => pId !== promptId));
        } finally {
            setTimeout(() => {
                setVotingInProgress(prev => {
                    const next = new Set(prev);
                    next.delete(promptId);
                    return next;
                });
            }, 500);
        }
    };

    const getTimestamp = (dateInput) => {
        if (!dateInput) return 0;
        if (dateInput.toDate && typeof dateInput.toDate === 'function') return dateInput.toDate().getTime();
        return new Date(dateInput).getTime();
    };

    const categories = [
        { id: 'all', label: 'Tümü' },
        { id: 'code', label: 'Kodlama' },
        { id: 'debug', label: 'Hata Ayıklama' },
        { id: 'sql', label: 'Veritabanı' },
        { id: 'test', label: 'Test Yazımı' },
    ];

    const filteredPrompts = prompts.filter(p => {
        const pTitle = p.title || '';
        const pContent = p.content || '';
        const pAuthor = p.author || '';
        const searchLower = searchTerm.toLowerCase();
        return (activeCategory === 'all' || p.category === activeCategory) &&
            (pTitle.toLowerCase().includes(searchLower) ||
                pContent.toLowerCase().includes(searchLower) ||
                (pAuthor && pAuthor.toLowerCase().includes(searchLower)))
    }).sort((a, b) => {
        if (sortBy === 'popular') return (b.votes || 0) - (a.votes || 0);
        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.75rem',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    background: dbStatus === 'online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: dbStatus === 'online' ? '#10b981' : '#ef4444',
                    fontWeight: 700
                }}>
                    {dbStatus === 'online' ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {dbStatus === 'connecting' ? 'BAĞLANILIYOR...' : dbStatus === 'online' ? 'VERİTABANI CANLI' : 'BAĞLANTI HATASI'}
                </div>
                {dbStatus === 'online' && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Toplulukta {prompts.length} prompt mevcut
                    </div>
                )}
            </div>

            {error && (
                <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--danger)', borderRadius: '12px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertCircle size={24} />
                    <span>{error}</span>
                </div>
            )}

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {categories.map(cat => (
                        <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className="glass" style={{ padding: '8px 20px', borderRadius: '30px', color: activeCategory === cat.id ? 'var(--primary)' : 'var(--text-dim)', backgroundColor: activeCategory === cat.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)', border: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.3s ease' }}>
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px' }}>
                    <button onClick={() => setSortBy('newest')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: 'none', background: sortBy === 'newest' ? 'var(--bg-card)' : 'transparent', color: sortBy === 'newest' ? 'white' : 'var(--text-dim)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Calendar size={14} /> Yeni
                    </button>
                    <button onClick={() => setSortBy('popular')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: 'none', background: sortBy === 'popular' ? 'var(--bg-card)' : 'transparent', color: sortBy === 'popular' ? 'white' : 'var(--text-dim)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                        <TrendingUp size={14} /> Popüler
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                    <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} color="var(--text-dim)" />
                        <input type="text" placeholder="Ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }} />
                    </div>
                    <button className="btn-primary" onClick={() => setShowAddForm(true)} style={{ padding: '12px 24px', borderRadius: '14px' }}>
                        <Plus size={20} /> <span className="mobile-hide">Yeni Ekle</span>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showAddForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass" style={{ width: '100%', maxWidth: '550px', padding: '40px', position: 'relative', border: '1px solid var(--primary-glow)' }}>
                            <button onClick={() => setShowAddForm(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={24} /></button>
                            <h3 style={{ fontSize: '1.8rem', marginBottom: '8px', fontWeight: 800 }}>Prompt Paylaş</h3>
                            <p style={{ color: 'var(--text-dim)', marginBottom: '32px' }}>Toplulukla en iyi AI komutlarını paylaşın.</p>
                            <form onSubmit={handleAddPrompt} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <input type="text" required placeholder="İsminiz..." className="glass" style={{ width: '100%', padding: '14px', color: 'white', borderRadius: '12px' }} value={newPrompt.author} onChange={(e) => setNewPrompt({ ...newPrompt, author: e.target.value })} />
                                    <select className="glass" style={{ width: '100%', padding: '14px', color: 'white', borderRadius: '12px', backgroundColor: 'var(--bg-deep)' }} value={newPrompt.category} onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}>
                                        {categories.filter(c => c.id !== 'all').map(c => (<option key={c.id} value={c.id}>{c.label}</option>))}
                                    </select>
                                </div>
                                <input type="text" required placeholder="Başlık..." className="glass" style={{ width: '100%', padding: '14px', color: 'white', borderRadius: '12px' }} value={newPrompt.title} onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })} />
                                <textarea required placeholder="Komut..." className="glass" style={{ width: '100%', height: '140px', padding: '14px', color: 'white', borderRadius: '12px', resize: 'none' }} value={newPrompt.content} onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })} />
                                <button className="btn-primary" disabled={isSubmitting} style={{ justifyContent: 'center', padding: '16px', fontSize: '1rem' }}>
                                    {isSubmitting ? 'SUNUCUYA KAYDEDİLİYOR...' : 'Yayınla'} <Send size={18} />
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                {filteredPrompts.map(prompt => {
                    const isLiked = likedPrompts.includes(prompt.id);
                    return (
                        <motion.div layout key={prompt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass card-hover" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', border: isLiked ? '1px solid var(--primary)' : '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', fontWeight: 800 }}>{categories.find(c => c.id === prompt.category)?.label}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                                            <Clock size={10} /> {new Date(getTimestamp(prompt.createdAt)).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>{prompt.title}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                        <User size={12} color="var(--primary)" /> <span style={{ fontWeight: 600 }}>{prompt.author || 'Anonim'}</span>
                                    </div>
                                </div>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', lineHeight: '1.7', height: '80px', overflow: 'hidden' }}>{prompt.content}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <button onClick={() => handleLike(prompt.id)} style={{ background: isLiked ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', color: isLiked ? 'white' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', fontWeight: 700 }}>
                                    <ThumbsUp size={18} fill={isLiked ? "white" : "none"} /> <span>{prompt.votes || 0}</span>
                                </button>
                                <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem', borderRadius: '12px' }} onClick={() => { navigator.clipboard.writeText(prompt.content); alert('Kopyalandı!'); }}><Copy size={18} /> Kopyala</button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default AiPromptLibrary;
