import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Play, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const InterviewSimulator = () => {
    const [stage, setStage] = useState('setup'); // setup, quiz, results
    const [level, setLevel] = useState('junior');
    const [lang, setLang] = useState('javascript');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    const questions = {
        javascript: [
            { q: "Closure nedir?", a: "Closure, bir fonksiyonun kendi kapsamı dışındaki değişkenlere erişebilme yeteneğidir. Fonksiyon oluşturulduğunda bu kapsamı 'hatırlar'." },
            { q: "Event Delegation mantığı nasıldır?", a: "Event listener'ı tek tek elemanlara değil, ortak bir üst elemana (parent) ekleyerek event bubbling sayesinde olayları yakalama tekniğidir." },
            { q: "Promise.all ve Promise.race farkı nedir?", a: "Promise.all tüm promiselerin tamamlanmasını bekler, race ise ilk tamamlanan (veya hata alan) promisenin sonucunu döner." }
        ],
        python: [
            { q: "List Comprehension nedir?", a: "Mevcut bir liste veya iterable üzerinden yeni bir liste oluşturmak için kullanılan kısa ve okunabilir bir sözdizimidir." },
            { q: "GIL (Global Interpreter Lock) nedir?", a: "Python'ın aynı anda sadece bir thread'in Python bytecode çalıştırmasına izin veren mekanizmasıdır." }
        ]
    };

    const activeQuestions = questions[lang] || [];

    return (
        <div className="glass" style={{ padding: '40px', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
            {stage === 'setup' && (
                <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                    <Brain size={64} color="var(--primary)" style={{ marginBottom: '24px' }} />
                    <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Teknik Mülakat Simülasyonu</h2>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '40px' }}>
                        Dilini ve seviyeni seç, karşına çıkan soruları yanıtla ve ideal cevaplarla kendini kıyasla.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            {['javascript', 'python', 'react', 'sql'].map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    className="glass"
                                    style={{ padding: '12px 24px', borderRadius: '12px', border: lang === l ? '2px solid var(--primary)' : '1px solid var(--glass-border)', color: lang === l ? 'var(--primary)' : 'white', cursor: 'pointer', textTransform: 'capitalize' }}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            {['junior', 'mid', 'senior'].map(lv => (
                                <button
                                    key={lv}
                                    onClick={() => setLevel(lv)}
                                    className="glass"
                                    style={{ padding: '10px 20px', borderRadius: '12px', border: level === lv ? '2px solid var(--accent)' : '1px solid var(--glass-border)', color: level === lv ? 'var(--accent)' : 'white', cursor: 'pointer', textTransform: 'capitalize' }}
                                >
                                    {lv}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        className="btn-primary"
                        style={{ padding: '16px 40px', fontSize: '1.1rem', margin: '0 auto', justifyContent: 'center' }}
                        onClick={() => setStage('quiz')}
                    >
                        Simülasyonu Başlat <Play size={18} />
                    </button>
                </div>
            )}

            {stage === 'quiz' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Soru {currentQuestion + 1} / {activeQuestions.length}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{lang.toUpperCase()} - {level.toUpperCase()}</span>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '40px', borderRadius: '20px', border: '1px solid var(--glass-border)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '24px' }}>
                            {activeQuestions[currentQuestion].q}
                        </h3>

                        <AnimatePresence>
                            {showAnswer && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    style={{ marginTop: '24px', padding: '24px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--text-main)', borderLeft: '4px solid var(--primary)' }}
                                >
                                    <p style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ShieldCheck size={18} /> İdeal Cevap:
                                    </p>
                                    <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{activeQuestions[currentQuestion].a}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
                        <button
                            className="glass"
                            style={{ padding: '12px 24px', border: 'none', color: 'white', cursor: 'pointer' }}
                            onClick={() => setShowAnswer(!showAnswer)}
                        >
                            {showAnswer ? 'Cevabı Gizle' : 'Cevabı Gör'}
                        </button>
                        <button
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            onClick={() => {
                                if (currentQuestion < activeQuestions.length - 1) {
                                    setCurrentQuestion(currentQuestion + 1);
                                    setShowAnswer(false);
                                } else {
                                    setStage('results');
                                }
                            }}
                        >
                            Sonraki Soru <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {stage === 'results' && (
                <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <CheckCircle size={80} color="#10b981" style={{ marginBottom: '24px' }} />
                    <h2 style={{ fontSize: '2.2rem', marginBottom: '16px' }}>Simülasyon Tamamlandı!</h2>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '40px' }}>
                        Tüm soruları başarıyla inceledin. Hazır olduğunda daha zor seviyeleri deneyebilirsin.
                    </p>
                    <button className="btn-primary" style={{ alignSelf: 'center' }} onClick={() => setStage('setup')}>
                        Başa Dön
                    </button>
                </div>
            )}
        </div>
    );
};

export default InterviewSimulator;
