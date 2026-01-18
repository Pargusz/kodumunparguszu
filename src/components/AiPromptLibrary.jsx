import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Copy, ThumbsUp, Plus, X, Send, User, Clock, AlertCircle, TrendingUp, Calendar, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
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
    const [sortBy, setSortBy] = useState('newest');
    const [searchTerm, setSearchTerm] = useState('');
    const [prompts, setPrompts] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPrompt, setNewPrompt] = useState({ title: '', content: '', category: 'code', author: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [votingInProgress, setVotingInProgress] = useState(new Set());

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dbStatus, setDbStatus] = useState('connecting');

    const [likedPrompts, setLikedPrompts] = useState(() => {
        const saved = localStorage.getItem('parguszu_liked_prompts');
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed.map(id => String(id)) : [];
    });
    const likedPromptsRef = useRef(likedPrompts);

    useEffect(() => {
        likedPromptsRef.current = likedPrompts;
        localStorage.setItem('parguszu_liked_prompts', JSON.stringify(likedPrompts));
    }, [likedPrompts]);

    // Single source of truth for all prompts - Firestore Realtime Sync
    useEffect(() => {
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
        }, (err) => {
            console.error("Firestore Error:", err);
            setError(`Bağlantı Sorunu: ${err.message}`);
            setDbStatus('error');
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddPrompt = async (e) => {
        e.preventDefault();
        if (!newPrompt.title || !newPrompt.content || !newPrompt.author) return;

        setIsSubmitting(true);
        setError(null);

        const promptData = {
            ...newPrompt,
            votes: 0,
            createdAt: new Date().toISOString()
        };

        try {
            // v4.0: Wait for server confirmation now that rules are fixed
            await addDoc(collection(db, 'prompts'), promptData);

            // On success
            setNewPrompt({ title: '', content: '', category: 'code', author: '' });
            setShowAddForm(false);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (err) {
            console.error("Save error:", err);
            setError(`Kaydetme hatası: ${err.message}`);
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
            }, 400);
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
        const searchLower = searchTerm.toLowerCase();
        return (activeCategory === 'all' || p.category === activeCategory) &&
            (pTitle.toLowerCase().includes(searchLower) || pContent.toLowerCase().includes(searchLower) || (p.author && p.author.toLowerCase().includes(searchLower)))
    }).sort((a, b) => {
        if (sortBy === 'popular') return (b.votes || 0) - (a.votes || 0);
        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Success Toast */}
            <AnimatePresence>
                {showSuccessToast && (
                    <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '40px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)' }}>
                        <CheckCircle2 size={20} />
                        <span style={{ fontWeight: 700 }}>Prompt Yayınlandı!</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', padding: '5px 12px', borderRadius: '20px', background: dbStatus === 'online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: dbStatus === 'online' ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                    {dbStatus === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {dbStatus === 'online' ? 'VERİTABANI CANLI' : 'BAĞLANTI YOK'}
                </div>
            </div>

            {error && (
                <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--danger)', borderRadius: '12px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertCircle size={24} />
                    <span>{error}</span>
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
                        <input type="text" placeholder="Prompt veya yazar ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }} />
                    </div>
                    <button className="btn-primary" onClick={() => setShowAddForm(true)} style={{ padding: '12px 24px', borderRadius: '14px' }}>
                        <Plus size={20} /> <span className="mobile-hide">Yeni Ekle</span>
                    </button>
                </div>
            </div>

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
            )}

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
                                <textarea required placeholder="Komutu buraya yazın..." className="glass" style={{ width: '100%', height: '140px', padding: '14px', color: 'white', borderRadius: '12px', resize: 'none' }} value={newPrompt.content} onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })} />
                                <button className="btn-primary" disabled={isSubmitting} style={{ justifyContent: 'center', padding: '16px', fontSize: '1rem' }}>
                                    {isSubmitting ? 'Yayınlanıyor...' : 'Yayınla'} <Send size={18} />
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
                        <motion.div layout key={prompt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass card-hover" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', border: isLiked ? '1px solid var(--primary)' : '1px solid var(--glass-border)', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', fontWeight: 800 }}>{categories.find(c => c.id === prompt.category)?.label}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                                            <Clock size={10} /> {new Date(getTimestamp(prompt.createdAt)).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>{prompt.title}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                                            <User size={12} color="var(--primary)" />
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{prompt.author || 'Anonim'}</span>
                                    </div>
                                </div>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', lineHeight: '1.7', height: '80px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{prompt.content}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <button onClick={() => handleLike(prompt.id)} style={{ background: isLiked ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', color: isLiked ? 'white' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', fontWeight: 700, transition: 'all 0.3s ease' }}>
                                    <ThumbsUp size={18} fill={isLiked ? "white" : "none"} /> <span>{prompt.votes || 0}</span>
                                </button>
                                <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem', borderRadius: '12px' }} onClick={() => { navigator.clipboard.writeText(prompt.content); alert('Prompt kopyalandı!'); }}><Copy size={18} /> Kopyala</button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {!loading && filteredPrompts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '120px 40px', color: 'var(--text-dim)' }} className="glass">
                    <Search size={64} style={{ marginBottom: '24px', opacity: 0.2 }} />
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Sonuç Bulunamadı</h4>
                    <p>Farklı bir arama terimi deneyin veya ilk promptu siz ekleyin!</p>
                </div>
            )}
        </div>
    );
};

export default AiPromptLibrary;
