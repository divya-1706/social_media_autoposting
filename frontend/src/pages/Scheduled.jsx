import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "https://social-media-autoposting.onrender.com";

export default function Scheduled() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState({}); // id -> {date, time, ampm}
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/scheduled/`, { headers: { Authorization: `Bearer ${token}` } });
      setPosts(res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
      console.error(err);
    }
    setLoading(false);
  };

  const cancel = async (id) => {
    try {
      await axios.delete(`${API}/scheduled/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchList();
    } catch (err) { console.error(err); }
  };

  const openReschedule = (p) => {
    // split p.scheduled_time (ISO) into date, time, ampm local
    const d = new Date(p.scheduled_time);
    const date = d.toISOString().slice(0,10);
    let hours = d.getHours();
    const minutes = ("0" + d.getMinutes()).slice(-2);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12; if (hours === 0) hours = 12;
    const time = ("0" + hours).slice(-2) + ":" + minutes;
    setRescheduling(prev => ({ ...prev, [p.id]: { date, time, ampm } }));
  };

  const doReschedule = async (id) => {
    const r = rescheduling[id];
    if (!r) return;
    // compose ISO from date + time + ampm in local
    let [hh, mm] = r.time.split(":"); hh = parseInt(hh,10); mm = parseInt(mm,10);
    if (r.ampm === "PM" && hh < 12) hh += 12;
    if (r.ampm === "AM" && hh === 12) hh = 0;
    const parts = r.date.split("-");
    const y = parseInt(parts[0],10), m = parseInt(parts[1],10)-1, day = parseInt(parts[2],10);
    const dt = new Date(y, m, day, hh, mm, 0);
    const iso = dt.toISOString();
    try {
      await axios.put(`${API}/scheduled/${id}`, { scheduled_time: iso }, { headers: { Authorization: `Bearer ${token}` } });
      setRescheduling(prev => { const np = { ...prev }; delete np[id]; return np; });
      fetchList();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2>Scheduled Posts</h2>
      {loading ? <div>Loading...</div> : (
        posts.length === 0 ? <div>No scheduled posts</div> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {posts.map(p => (
              <div key={p.id} style={{ background: '#0b1220', padding: 12, borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 88, height: 88, background: '#051018', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.thumbnail ? <img src={p.thumbnail} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 6 }} /> : <div style={{ color: '#64748b' }}>{p.image_count} imgs</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e2e8f0', fontWeight: 700 }}>{p.platform.toUpperCase()}</div>
                  <div style={{ color: '#94a3b8', marginTop: 6 }}>{p.text}</div>
                  <div style={{ marginTop: 8, color: p.processed ? '#00ff88' : '#ffd166' }}>{p.processed ? 'Posted' : 'Pending'}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(p.scheduled_time).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {!p.processed && <button onClick={() => cancel(p.id)} style={{ padding: '8px 12px' }}>Cancel</button>}
                  {!p.processed && <button onClick={() => openReschedule(p)} style={{ padding: '8px 12px' }}>Reschedule</button>}
                </div>
                {rescheduling[p.id] && (
                  <div style={{ marginLeft: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type='date' value={rescheduling[p.id].date} onChange={(e)=> setRescheduling(prev=> ({...prev,[p.id]: {...prev[p.id], date: e.target.value}}))} />
                    <input type='time' value={rescheduling[p.id].time} onChange={(e)=> setRescheduling(prev=> ({...prev,[p.id]: {...prev[p.id], time: e.target.value}}))} />
                    <select value={rescheduling[p.id].ampm} onChange={(e)=> setRescheduling(prev=> ({...prev,[p.id]: {...prev[p.id], ampm: e.target.value}}))}>
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                    <button onClick={()=> doReschedule(p.id)}>Save</button>
                    <button onClick={()=> setRescheduling(prev=> { const np={...prev}; delete np[p.id]; return np; })}>Close</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
