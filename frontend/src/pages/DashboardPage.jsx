import React, { useState, useEffect } from 'react';
import api from '../api';
import { Play, Square, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
    const [status, setStatus] = useState({ whatsapp: 'offline', telegram: 'offline' });

    const fetchStatus = async () => {
        try {
            const res = await api.get('/settings');
            setStatus({
                whatsapp: res.data.whatsapp_status || 'offline',
                telegram: res.data.telegram_status || 'offline'
            });
        } catch (error) {
            console.error('Error fetching status', error);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const toggleBot = async (platform, currentStatus) => {
        const action = currentStatus === 'offline' ? 'start' : 'stop';
        try {
            await api.post(`/bot/${platform}/${action}`);
            fetchStatus();
        } catch (err) {
            alert('Xəta baş verdi: ' + err.message);
        }
    };

    const StatusBadge = ({ state }) => {
        const lower = String(state).toLowerCase();
        if (lower === 'online') return <span className="status-badge status-online">Aktiv (Online)</span>;
        if (lower === 'offline') return <span className="status-badge status-offline">Deaktiv (Offline)</span>;
        return <span className="status-badge status-starting">{state}</span>;
    };

    const handleTestTrigger = async () => {
        if(window.confirm('Bu günə uyğun gələn bütün bayram/təbrik mesajları siyahılardan oxunaraq dərhal göndəriləcək. Davam edilsin?')) {
            try {
                await api.post('/test-trigger');
                alert('Təbrik mesajları uğurla yola salındı! Əgər sistem işləyirsə mesajların gəldiyini görəcəksiniz. Hər hansı problem varsa "Xəta.log" bölməsinə baxın.');
            } catch(e) {
                alert('Xəta baş verdi!');
            }
        }
    };

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <h2 className="page-title">Bot Paneli</h2>
                <button className="btn btn-outline" style={{borderColor: 'var(--success-color)', color: 'var(--success-color)'}} onClick={handleTestTrigger}>
                    <Play size={16}/> Bugünkü Mesajları İndi Göndər
                </button>
            </div>
            
            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>WhatsApp Bot</h3>
                        <StatusBadge state={status.whatsapp} />
                    </div>
                    <div className="flex gap-2">
                        <button 
                            className={`btn ${status.whatsapp === 'offline' ? 'btn-primary' : 'btn-danger'}`}
                            onClick={() => toggleBot('whatsapp', status.whatsapp)}
                            disabled={status.whatsapp === 'starting'}
                        >
                            {status.whatsapp === 'offline' ? <><Play size={16}/> Başlat</> : <><Square size={16}/> Dayandır</>}
                        </button>
                        <Link to="/settings" className="btn btn-outline" title="Qeydiyyatdan Keç"><SettingsIcon size={16}/> QR/Login</Link>
                    </div>
                </div>
                {status.whatsapp === 'waiting_qr' && (
                    <p style={{marginTop: '16px', color: '#ff9500'}}>Sistem aktivləşdirilir, lakin hələ QR kod oxudulmayıb. Xahiş olunur QR kodu oxutmaq üçün <b>Tənzimləmələr (QR/Login)</b> bölməsinə keçin.</p>
                )}
            </div>

            <div className="card">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Telegram Bot</h3>
                        <StatusBadge state={status.telegram} />
                    </div>
                    <button 
                        className={`btn ${status.telegram === 'offline' ? 'btn-primary' : 'btn-danger'}`}
                        onClick={() => toggleBot('telegram', status.telegram)}
                    >
                        {status.telegram === 'offline' ? <><Play size={16}/> Başlat</> : <><Square size={16}/> Dayandır</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
