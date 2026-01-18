import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Copy, ThumbsUp, Plus, X, Send, User, Clock, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
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

    // Use state for UI and Ref for synchronous logic to prevent race conditions
    const [likedPrompts, setLikedPrompts] = useState(() => {
        const saved = localStorage.getItem('parguszu_liked_prompts');
        // Ensure all saved IDs are converted to strings to prevent type mismatches
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
        const q = query(collection(db, 'prompts'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const promptData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPrompts(promptData);
            console.log("Prompts loaded:", promptData.length, "v1.3");
        });
        return () => unsubscribe();
    }, []);

    const handleAddPrompt = (e) => {
        e.preventDefault();

        if (!newPrompt.title || !newPrompt.content || !newPrompt.author) {
            alert("Lütfen tüm alanları doldurunuz (Adınız, Başlık ve Prompt İçeriği).");
            return;
        }

        setIsSubmitting(true);

        // Firestore işlemi arka planda devam etsin (Optimistic UI)
        // Kullanıcıyı bekletmemek için modalı hemen kapatıyoruz.
        addDoc(collection(db, 'prompts'), {
            ...newPrompt,
            votes: 0,
            createdAt: new Date().toISOString()
        })
            .then(() => {
                console.log("Prompt başarıyla sunucuya iletildi.");
            })
            .catch((error) => {
                console.error("Error adding prompt:", error);
                alert(`Bir hata oluştu: ${error.message}`);
            });

        // Formu temizle ve kapat
        setNewPrompt({ title: '', content: '', category: 'code', author: '' });
        setShowAddForm(false);
        setIsSubmitting(false);
    };

    const handleLike = async (id) => {
        if (votingInProgress.has(id)) return;

        // Ensure id is treated consistently (as string)
        const promptId = String(id);
        const isCurrentlyLiked = likedPrompts.includes(promptId);

        console.log(`Toggling like for: ${promptId}, currently liked: ${isCurrentlyLiked}`);

        setVotingInProgress(prev => new Set(prev).add(promptId));

        try {
            const promptRef = doc(db, 'prompts', promptId);

            if (isCurrentlyLiked) {
                // Unlike
                const newLikedPrompts = likedPrompts.filter(pId => pId !== promptId);
                setLikedPrompts(newLikedPrompts);
                await updateDoc(promptRef, {
                    votes: increment(-1)
                });
            } else {
                // Like
                const newLikedPrompts = [...likedPrompts, promptId];
                setLikedPrompts(newLikedPrompts);
                await updateDoc(promptRef, {
                    votes: increment(1)
                });
            }
        } catch (error) {
            console.error("Error updating votes:", error);
            // Revert on error
            if (isCurrentlyLiked) {
                setLikedPrompts(prev => [...prev, promptId]);
            } else {
                setLikedPrompts(prev => prev.filter(pId => pId !== promptId));
            }
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
        if (sortBy === 'popular') {
            return (b.votes || 0) - (a.votes || 0);
        } else {
            // Newest - default sort
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className="glass"
                            style={{
                                padding: '8px 20px',
                                borderRadius: '30px',
                                color: activeCategory === cat.id ? 'var(--primary)' : 'var(--text-dim)',
                                backgroundColor: activeCategory === cat.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px' }}>
                    <button
                        onClick={() => setSortBy('newest')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            background: sortBy === 'newest' ? 'var(--bg-card)' : 'transparent',
                            color: sortBy === 'newest' ? 'white' : 'var(--text-dim)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            transition: 'all 0.3s ease',
                            boxShadow: sortBy === 'newest' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        <Calendar size={14} /> Yeni
                    </button>
                    <button
                        onClick={() => setSortBy('popular')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            background: sortBy === 'popular' ? 'var(--bg-card)' : 'transparent',
                            color: sortBy === 'popular' ? 'white' : 'var(--text-dim)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            transition: 'all 0.3s ease',
                            boxShadow: sortBy === 'popular' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        <TrendingUp size={14} /> Popüler
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                    <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} color="var(--text-dim)" />
                        <input
                            type="text"
                            placeholder="Prompt veya yazar ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                        />
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => setShowAddForm(true)}
                        style={{ padding: '12px 24px', borderRadius: '14px' }}
                    >
                        <Plus size={20} /> <span className="mobile-hide">Yeni Ekle</span>
                    </button>
                </div>
            </div>

            {/* Add Prompt Modal */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="glass"
                            style={{ width: '100%', maxWidth: '550px', padding: '40px', position: 'relative', border: '1px solid var(--primary-glow)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                        >
                            <button onClick={() => setShowAddForm(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                            <h3 style={{ fontSize: '1.8rem', marginBottom: '8px', fontWeight: 800 }} className="shimmer-text">Prompt Paylaş</h3>
                            <p style={{ color: 'var(--text-dim)', marginBottom: '32px' }}>Toplulukla en iyi AI komutlarını paylaşın.</p>

                            <form onSubmit={handleAddPrompt} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Kullanıcı Adı</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="İsminiz..."
                                            className="glass"
                                            style={{ width: '100%', padding: '14px', color: 'white', border: '1px solid var(--glass-border)', outline: 'none', borderRadius: '12px' }}
                                            value={newPrompt.author}
                                            onChange={(e) => setNewPrompt({ ...newPrompt, author: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Kategori</label>
                                        <select
                                            className="glass"
                                            style={{ width: '100%', padding: '14px', color: 'white', border: '1px solid var(--glass-border)', outline: 'none', borderRadius: '12px', backgroundColor: 'var(--bg-deep)' }}
                                            value={newPrompt.category}
                                            onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                                        >
                                            {categories.filter(c => c.id !== 'all').map(c => (
                                                <option key={c.id} value={c.id}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Başlık</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Kısa ve öz bir başlık..."
                                        className="glass"
                                        style={{ width: '100%', padding: '14px', color: 'white', border: '1px solid var(--glass-border)', outline: 'none', borderRadius: '12px' }}
                                        value={newPrompt.title}
                                        onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Prompt İçeriği</label>
                                    <textarea
                                        required
                                        placeholder="Komutu buraya yazın..."
                                        className="glass"
                                        style={{ width: '100%', height: '140px', padding: '14px', color: 'white', border: '1px solid var(--glass-border)', outline: 'none', resize: 'none', borderRadius: '12px' }}
                                        value={newPrompt.content}
                                        onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                                    />
                                </div>
                                <button className="btn-primary" disabled={isSubmitting} style={{ justifyContent: 'center', marginTop: '10px', padding: '16px', fontSize: '1rem', boxShadow: '0 0 20px var(--primary-glow)' }}>
                                    {isSubmitting ? 'Gönderiliyor...' : 'Paylaş ve İlham Ver'} <Send size={18} />
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                {filteredPrompts.map(prompt => {
                    const isLiked = likedPrompts.includes(prompt.id);
                    const isVoting = votingInProgress.has(prompt.id);

                    return (
                        <motion.div
                            layout
                            key={prompt.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass card-hover"
                            style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', border: isLiked ? '1px solid var(--primary)' : '1px solid var(--glass-border)', overflow: 'hidden' }}
                        >
                            {isLiked && (
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle at top right, var(--primary-glow) 0%, transparent 70%)', opacity: 0.2, pointerEvents: 'none' }}></div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', fontWeight: 800 }}>
                                            {categories.find(c => c.id === prompt.category)?.label}
                                        </span>
                                        {prompt.createdAt && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                                                <Clock size={10} /> {new Date(prompt.createdAt).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.3px' }}>{prompt.title}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                                            <User size={12} color="var(--primary)" />
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{prompt.author || 'Anonim'}</span>
                                    </div>
                                </div>
                            </div>

                            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', lineHeight: '1.7', height: '80px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                {prompt.content}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleLike(prompt.id)}
                                        disabled={isVoting}
                                        className={isLiked ? "liked" : ""}
                                        style={{
                                            background: isLiked ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                            border: 'none',
                                            color: isLiked ? 'white' : 'var(--text-dim)',
                                            cursor: isVoting ? 'wait' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '10px 18px',
                                            borderRadius: '12px',
                                            fontWeight: 700,
                                            boxShadow: isLiked ? '0 5px 15px var(--primary-glow)' : 'none',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            opacity: isVoting ? 0.7 : 1
                                        }}
                                    >
                                        <ThumbsUp size={18} fill={isLiked ? "white" : "none"} style={{ transition: 'transform 0.3s ease' }} />
                                        <span>{prompt.votes || 0}</span>
                                    </motion.button>
                                </div>
                                <button
                                    className="btn-primary"
                                    style={{ padding: '10px 24px', fontSize: '0.9rem', borderRadius: '12px' }}
                                    onClick={() => {
                                        navigator.clipboard.writeText(prompt.content);
                                        alert('Prompt kopyalandı!');
                                    }}
                                >
                                    <Copy size={18} /> <span style={{ marginLeft: '8px' }}>Kopyala</span>
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            {filteredPrompts.length === 0 && (
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
