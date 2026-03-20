import React, { useState, useEffect } from 'react';
import api from '../api';
import { Save, Play, Square } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({ telegram_token: '', openai_key: '', whatsapp_status: 'offline' });
    const [qrCode, setQrCode] = useState(null);

    useEffect(() => {
        fetchSettings();
        const interval = setInterval(fetchSettings, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            setSettings({
                telegram_token: res.data.telegram_token || '',
                openai_key: res.data.openai_key || '',
                whatsapp_status: res.data.whatsapp_status || 'offline'
            });

            if (res.data.whatsapp_status === 'waiting_qr') {
                const qrRes = await api.get('/bot/whatsapp/qr');
                setQrCode(qrRes.data.qr);
            } else {
                setQrCode(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/settings', { key: 'telegram_token', value: settings.telegram_token });
            await api.post('/settings', { key: 'openai_key', value: settings.openai_key });
            alert('Yadda saxlanıldı');
        } catch(err) {
            alert('Xəta');
        }
    };

    const toggleBot = async (platform, currentStatus) => {
        const action = currentStatus === 'offline' ? 'start' : 'stop';
        try {
            await api.post(`/bot/${platform}/${action}`);
            fetchSettings();
        } catch (err) {
            alert('Xəta baş verdi: ' + err.message);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h2 className="page-title">Tənzimləmələr</h2>
            </div>

            <div className="card" style={{ maxWidth: '600px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>WhatsApp (QR Kod İlə Giriş)</h3>
                <div className="flex justify-between items-center mb-4">
                    <span style={{fontWeight: 500}}>Status: {settings.whatsapp_status === 'online' ? <span style={{color: 'green'}}>Aktiv</span> : <span style={{color: 'red'}}>Offline və ya QR gözləyir</span>}</span>
                    <button 
                        className={`btn ${settings.whatsapp_status === 'offline' ? 'btn-primary' : 'btn-danger'}`}
                        onClick={() => toggleBot('whatsapp', settings.whatsapp_status)}
                        disabled={settings.whatsapp_status === 'starting'}
                    >
                        {settings.whatsapp_status === 'offline' ? <><Play size={16}/> Başlat (Login)</> : <><Square size={16}/> Dayandır / Çıxış</>}
                    </button>
                </div>

                {settings.whatsapp_status === 'waiting_qr' && qrCode && (
                    <div style={{ padding: '24px', backgroundColor: '#f9f9f9', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                        <p className="mb-4">WhatsApp botunu aktivləşdirmək üçün bu QR kodu telefonunuzla oxudun:</p>
                        <div style={{ background: '#fff', padding: '16px', display: 'inline-block', borderRadius: '8px' }}>
                            <QRCodeSVG value={qrCode} size={256} />
                        </div>
                    </div>
                )}
                {settings.whatsapp_status === 'starting' && (
                    <p style={{ textAlign: 'center', color: '#666', padding: '24px' }}>Sistem işə salınır, QR kod generasiya olunur, xahiş olunur gözləyin...</p>
                )}
                {settings.whatsapp_status === 'online' && (
                    <p style={{ textAlign: 'center', color: 'var(--success-color)', fontWeight: 600, padding: '24px' }}>Sistem aktivdir və Whatsapp-a uğurla qoşulmuşdur.</p>
                )}
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label className="form-label">Telegram Bot Token (BotFather-dən alınan)</label>
                        <input className="form-control" type="password" value={settings.telegram_token} onChange={e=>setSettings({...settings, telegram_token: e.target.value})} placeholder="123456:ABC-DEF..." />
                    </div>

                    <div className="form-group mb-6">
                        <label className="form-label">OpenAI API Key (AI Avtomatik cavab üçün)</label>
                        <input className="form-control" type="password" value={settings.openai_key} onChange={e=>setSettings({...settings, openai_key: e.target.value})} placeholder="sk-..." />
                    </div>

                    <button className="btn btn-primary" type="submit"><Save size={16}/> Yadda Saxla</button>
                </form>
            </div>
        </div>
    );
}
