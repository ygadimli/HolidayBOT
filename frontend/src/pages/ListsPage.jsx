import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Plus, Trash, Download } from 'lucide-react';

export default function ListsPage() {
    const [lists, setLists] = useState([]);
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        fetchLists();
    }, []);

    const fetchLists = async () => {
        const res = await api.get('/lists');
        setLists(res.data);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/lists', { title: newTitle, date_mm_dd: newDate, default_message: newMessage });
            setNewTitle('');
            setNewDate('');
            setNewMessage('');
            fetchLists();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Siyahını silməyə əminsiniz?')) {
            await api.delete(`/lists/${id}`);
            fetchLists();
        }
    };

    const handleDownload = async (list) => {
        try {
            const res = await api.get(`/lists/${list.id}/contacts`);
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ ...list, contacts: res.data }, null, 2));
            const dl = document.createElement('a');
            dl.setAttribute("href", dataStr);
            dl.setAttribute("download", `siyahi-${list.date_mm_dd}.json`);
            dl.click();
        } catch (err) {
            alert('Yükləmәdə xəta');
        }
    }

    return (
        <div>
            <div className="page-header">
                <h2 className="page-title">Siyahılar</h2>
            </div>

            <div className="card mb-6">
                <h3 className="mb-4" style={{ fontWeight: 600 }}>Yeni Siyahı Yarat</h3>
                <form onSubmit={handleCreate}>
                    <div className="flex gap-4 mb-4">
                        <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                            <label className="form-label">Başlıq</label>
                            <input className="form-control" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Məs: Novruz Bayramı" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Tarix (A-G)</label>
                            <input className="form-control" value={newDate} onChange={e => setNewDate(e.target.value)} placeholder="03-20" required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Standart Mesaj</label>
                        <textarea className="form-control" value={newMessage} onChange={e => setNewMessage(e.target.value)} rows="2" placeholder="Günə uyğun ümumi təbrik"></textarea>
                    </div>
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Yarat</button>
                </form>
            </div>

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Tarix</th>
                            <th>Başlıq</th>
                            <th>Əməliyyatlar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lists.length === 0 && (
                            <tr><td colSpan="3" style={{ textAlign: 'center' }}>Siyahı yoxdur.</td></tr>
                        )}
                        {lists.map(list => (
                            <tr key={list.id}>
                                <td>{list.date_mm_dd}</td>
                                <td>
                                    <Link to={`/lists/${list.id}`} style={{ fontWeight: 500, color: 'var(--accent-color)' }}>
                                        {list.title}
                                    </Link>
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        <button className="btn btn-outline" onClick={() => handleDownload(list)} title="JSON Kimi Yüklə"><Download size={14} /></button>
                                        <button className="btn btn-danger" onClick={() => handleDelete(list.id)} title="Sil"><Trash size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
