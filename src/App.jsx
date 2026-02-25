import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, ComposedChart
} from 'recharts';
import { 
  TrendingUp, Map as MapIcon, Briefcase, Clock, ShieldAlert, Activity, 
  ArrowUpRight, ArrowDownRight, Info, Search, Wallet, BarChart3, 
  Navigation, Download, LayoutDashboard, ExternalLink
} from 'lucide-react';

// --- INITIAL DATA & CONSTANTS ---
const LAND_PARCELS = [
  { id: 'LS-IN-01', name: 'Sahyadri Foothills Estate', coordinates: [18.5204, 73.8567], initialPrice: 4500.00, totalUnits: 12000, region: 'Maharashtra', surveyNumber: 'MH/PUN/2024/001', thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=400', description: 'Premium agricultural land with high water table and accessibility.' },
  { id: 'LS-IN-02', name: 'Aravali Ridge Plot', coordinates: [26.9124, 75.7873], initialPrice: 2850.50, totalUnits: 25000, region: 'Rajasthan', surveyNumber: 'RJ/JAI/2023/114', thumbnail: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&q=80&w=400', description: 'Strategic plot near the Jaipur-Delhi highway corridor.' },
  { id: 'LS-IN-03', name: 'Nilgiri Tea Slopes', coordinates: [11.4102, 76.6950], initialPrice: 6200.25, totalUnits: 8000, region: 'Tamil Nadu', surveyNumber: 'TN/OOT/2024/505', thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=400', description: 'Scenic plantation land with existing organic tea certification.' },
  { id: 'LS-IN-04', name: 'Deccan Plateau Hub', coordinates: [17.3850, 78.4867], initialPrice: 8450.00, totalUnits: 15000, region: 'Telangana', surveyNumber: 'TG/HYD/2024/991', thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=400', description: 'Urban transition land zoned for high-density development.' },
  { id: 'LS-IN-05', name: 'Konkan Coastal Patch', coordinates: [15.2993, 74.1240], initialPrice: 5100.00, totalUnits: 10000, region: 'Goa', surveyNumber: 'GA/SGO/2023/222', thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400', description: 'Rare sea-facing land ideal for luxury eco-resort projects.' },
];

const CIRCUIT_BREAKER_LIMIT = 0.10;

// --- UTILITIES ---
const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
const formatNumber = (val) => new Intl.NumberFormat('en-IN').format(Math.round(val || 0));

const checkMarketStatus = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMin = hours * 60 + minutes;
  return totalMin >= (9 * 60 + 30) && totalMin <= (15 * 60 + 30);
};

// --- LEAFLET MAP WRAPPER ---
const MapSection = ({ land, priceData }) => {
  const mapRef = useRef(null);
  const leafletInstance = useRef(null);
  const markerInstance = useRef(null);

  const change = priceData ? ((priceData.currentPrice - priceData.prevClose) / priceData.prevClose) * 100 : 0;
  const isVolatile = Math.abs(change) > 3;
  const isUp = change >= 0;

  useEffect(() => {
    const initMap = () => {
      if (!window.L || !mapRef.current) return;

      if (!leafletInstance.current) {
        leafletInstance.current = window.L.map(mapRef.current).setView(land.coordinates, 13);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(leafletInstance.current);
      } else {
        leafletInstance.current.setView(land.coordinates, 13);
      }

      if (markerInstance.current) markerInstance.current.remove();

      const icon = window.L.divIcon({
        className: 'land-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 rounded-full ${isUp ? 'bg-emerald-500/30' : 'bg-rose-500/30'} ${isVolatile ? 'animate-ping' : ''}"></div>
            <div class="w-5 h-5 rounded-full border-2 border-white shadow-xl ${isUp ? 'bg-emerald-500' : 'bg-rose-500'} relative z-10"></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      markerInstance.current = window.L.marker(land.coordinates, { icon }).addTo(leafletInstance.current);
      markerInstance.current.bindPopup(`
        <div style="min-width: 180px; font-family: sans-serif;">
          <h4 style="margin: 0; font-size: 14px; font-weight: bold; color: #0b3d2e;">${land.name}</h4>
          <p style="margin: 4px 0; font-size: 10px; color: #64748b;">${land.surveyNumber}</p>
          <p style="margin: 0; font-weight: bold;">Price: ${formatCurrency(priceData?.currentPrice || 0)}</p>
        </div>
      `);
    };

    if (window.L) initMap();
    else {
      const itv = setInterval(() => { if (window.L) { initMap(); clearInterval(itv); } }, 200);
      return () => clearInterval(itv);
    }
  }, [land, isUp, isVolatile, change]);

  return <div ref={mapRef} className="h-full w-full" />;
};

// --- CORE APP ---
export default function App() {
  const [view, setView] = useState('dashboard'); 
  const [selectedLandId, setSelectedLandId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketData, setMarketData] = useState({});
  const [orderBooks, setOrderBooks] = useState({});
  const [portfolio, setPortfolio] = useState({ balance: 2500000, holdings: [] }); 
  const [notifications, setNotifications] = useState([]);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    const scripts = [
      { id: 'ljs', src: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js' },
      { id: 'jszip', src: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js' }
    ];
    scripts.forEach(s => {
      if (!document.getElementById(s.id)) {
        const sc = document.createElement('script'); sc.id = s.id; sc.src = s.src; sc.async = true; document.head.appendChild(sc);
      }
    });
    if (!document.getElementById('lcss')) {
      const lnk = document.createElement('link'); lnk.id = 'lcss'; lnk.rel = 'stylesheet'; lnk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(lnk);
    }
    const globalStyle = document.createElement('style');
    globalStyle.innerHTML = `
      .leaflet-popup-content-wrapper { border-radius: 16px !important; padding: 4px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1) !important; }
      .leaflet-container { background: #0f172a !important; font-family: inherit; }
      .glass-card { background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.05); }
      .cta-gradient { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
      body { background-color: #0f172a; color: white; }
    `;
    document.head.appendChild(globalStyle);
  }, []);

  useEffect(() => {
    const m = {}; const b = {};
    LAND_PARCELS.forEach(l => {
      m[l.id] = { currentPrice: l.initialPrice, prevClose: l.initialPrice, history: Array.from({length: 20}, (_, i) => ({ time: i, price: l.initialPrice + (Math.random() - 0.5) * 100 })), totalVolume: Math.floor(Math.random() * 5000), circuitBreaker: null };
      b[l.id] = { 
        bids: Array.from({ length: 5 }, (_, i) => ({ price: l.initialPrice * (0.99 - i * 0.005), qty: Math.floor(Math.random() * 100) })), 
        asks: Array.from({ length: 5 }, (_, i) => ({ price: l.initialPrice * (1.01 + i * 0.005), qty: Math.floor(Math.random() * 100) }))
      };
    });
    setMarketData(m); setOrderBooks(b);
  }, []);

  // Simulator Loop
  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date(); setCurrentTime(new Date(now));
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      if (checkMarketStatus(timeStr)) {
        setMarketData(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(id => {
            const noise = (Math.random() - 0.5) * 20;
            const newPrice = next[id].currentPrice + noise;
            next[id] = { 
              ...next[id], 
              currentPrice: newPrice,
              history: [...next[id].history.slice(1), { time: Date.now(), price: newPrice }]
            };
          });
          return next;
        });
      }
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const downloadFullProject = async () => {
    if (!window.JSZip) { alert("Downloading dependencies..."); return; }
    setIsZipping(true);
    const zip = new window.JSZip();
    const folder = zip.folder("LandScope_Project");

    // package.json
    folder.file("package.json", JSON.stringify({
      name: "landscope-exchange",
      version: "1.0.0",
      type: "module",
      scripts: { "dev": "vite", "build": "vite build", "preview": "vite preview" },
      dependencies: {
        "react": "^18.2.0", "react-dom": "^18.2.0", "lucide-react": "^0.263.1",
        "recharts": "^2.7.2", "leaflet": "^1.9.4", "tailwindcss": "^3.3.0", "postcss": "^8.4.21", "autoprefixer": "^10.4.13"
      },
      devDependencies: { "@vitejs/plugin-react": "^4.0.3", "vite": "^4.4.5" }
    }, null, 2));

    // tailwind.config.js
    folder.file("tailwind.config.js", `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'ls-primary': '#0b3d2e',
        'ls-secondary': '#0f5b43',
        'ls-dark': '#0f172a',
        'ls-card': '#1e293b',
        'ls-accent': '#22c55e',
        'ls-highlight': '#34d399',
        'ls-red': '#ef4444'
      }
    },
  },
  plugins: [],
}`);

    // index.html
    folder.file("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LandScope Exchange</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`);

    const src = folder.folder("src");
    src.file("main.jsx", `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`);

    src.file("index.css", `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --ls-primary: #0b3d2e;
  --ls-secondary: #0f5b43;
}

body {
  background-color: #0f172a;
  color: white;
}

.leaflet-popup-content-wrapper { border-radius: 16px !important; }`);

    // App.jsx and Components
    src.file("App.jsx", `import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DetailView from './components/DetailView';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="min-h-screen bg-ls-dark">
      <Navbar setView={setView} />
      <main className="max-w-7xl mx-auto px-6 py-12">
        {view === 'dashboard' ? (
          <Dashboard onSelect={(id) => { setSelectedId(id); setView('detail'); }} />
        ) : (
          <DetailView id={selectedId} />
        )}
      </main>
    </div>
  );
}`);

    const comps = src.folder("components");
    comps.file("Navbar.jsx", `import { BarChart3, Wallet } from 'lucide-react';
export default function Navbar({ setView }) {
  return (
    <nav className="sticky top-0 z-[1000] bg-ls-dark/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
        <div className="w-10 h-10 cta-gradient rounded-xl flex items-center justify-center">
          <BarChart3 className="text-white" size={24} />
        </div>
        <h1 className="text-xl font-bold">LandScope <span className="text-emerald-400">Exchange</span></h1>
      </div>
      <div className="hidden md:flex gap-8 text-sm font-bold text-slate-400">
        <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'text-emerald-400' : 'hover:text-white transition'}>Market</button>
        <button onClick={() => setView('portfolio')} className={view === 'portfolio' ? 'text-emerald-400' : 'hover:text-white transition'}>Portfolio</button>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Clock size={12} className={isMarketOpen ? "text-emerald-400" : "text-rose-400"} />
            <span className={isMarketOpen ? "text-emerald-400" : "text-rose-400"}>{isMarketOpen ? "OPEN" : "CLOSED"}</span>
          </div>
          <div className="text-sm font-bold">{formatCurrency(portfolio.balance)}</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center"><Wallet size={18} /></div>
      </div>
    </nav>
  );
}`);

    comps.file("MapSection.jsx", `import React, { useEffect, useRef } from 'react';
export default function MapSection({ coordinates }) {
  const mapRef = useRef(null);
  useEffect(() => {
    if (!window.L) return;
    const map = window.L.map(mapRef.current).setView(coordinates, 13);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    window.L.marker(coordinates).addTo(map);
    return () => map.remove();
  }, [coordinates]);
  return <div ref={mapRef} className="h-full w-full rounded-2xl" />;
}`);

    folder.file("README.md", `# LandScope Exchange
Full Project source.
1. Extract ZIP
2. Run \`npm install\`
3. Run \`npm run dev\`
`);

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = "LandScope_Full_Project.zip";
    link.click();
    setIsZipping(false);
  };

  const addNotification = (msg) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const isMarketOpen = checkMarketStatus(currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans pb-10">
      {/* FIXED DOWNLOAD BUTTON */}
      <div className="fixed top-8 right-8 z-[2000] flex flex-col items-end gap-2 group">
        <button 
          onClick={downloadFullProject}
          disabled={isZipping}
          className="cta-gradient px-6 py-3 rounded-2xl flex items-center gap-3 font-bold shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50"
        >
          <Download size={20} className={isZipping ? "animate-bounce" : ""} />
          <span>{isZipping ? "GENERATING ZIP..." : "DOWNLOAD FULL PROJECT"}</span>
        </button>
        <span className="text-[10px] text-emerald-400 font-bold tracking-wider opacity-70 group-hover:opacity-100 transition">
          COMPLETE FRONTEND DEMO SOURCE INCLUDED
        </span>
      </div>

      <div className="bg-[#0b3d2e] py-2 px-4 text-center text-xs text-emerald-300 font-medium">
        🛡️ SIMULATED LAND TRADING ENGINE • INDIAN MARKET DATA
      </div>

      <nav className="sticky top-0 z-[1000] bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="w-10 h-10 cta-gradient rounded-xl flex items-center justify-center">
            <BarChart3 className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold">LandScope <span className="text-emerald-400">Exchange</span></h1>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-bold text-slate-400">
          <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'text-emerald-400' : 'hover:text-white transition'}>Market</button>
          <button onClick={() => setView('portfolio')} className={view === 'portfolio' ? 'text-emerald-400' : 'hover:text-white transition'}>Portfolio</button>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-2 text-xs font-mono">
              <Clock size={12} className={isMarketOpen ? "text-emerald-400" : "text-rose-400"} />
              <span className={isMarketOpen ? "text-emerald-400" : "text-rose-400"}>{isMarketOpen ? "OPEN" : "CLOSED"}</span>
            </div>
            <div className="text-sm font-bold">{formatCurrency(portfolio.balance)}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center"><Wallet size={18} /></div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        {view === 'dashboard' && <MarketDashboard lands={LAND_PARCELS} marketData={marketData} onSelect={(id) => { setSelectedLandId(id); setView('detail'); }} />}
        
        {view === 'detail' && selectedLandId && marketData[selectedLandId] && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-extrabold">{LAND_PARCELS.find(l => l.id === selectedLandId).name}</h2>
                  <span className="text-emerald-500 font-mono text-sm">{LAND_PARCELS.find(l => l.id === selectedLandId).surveyNumber}</span>
                </div>
                <div className="text-right font-mono">
                  <p className="text-3xl font-black">{formatCurrency(marketData[selectedLandId].currentPrice)}</p>
                </div>
              </header>

              <div className="glass-card rounded-3xl p-6 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={marketData[selectedLandId].history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} orientation="right" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} />
                    <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={3} dot={false} animationDuration={300} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card rounded-3xl p-8 overflow-hidden h-[400px]">
                <MapSection land={LAND_PARCELS.find(l => l.id === selectedLandId)} priceData={marketData[selectedLandId]} />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="glass-card rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6">Trade Terminal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="cta-gradient h-16 rounded-2xl font-black text-white" onClick={() => addNotification("Order Placed Successfully")}>BUY</button>
                  <button className="bg-slate-700 h-16 rounded-2xl font-black text-white">SELL</button>
                </div>
              </div>
              <div className="glass-card rounded-3xl p-8">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Market Depth</h4>
                <div className="space-y-2 font-mono text-sm">
                   {orderBooks[selectedLandId].asks.map((a, i) => (
                     <div key={i} className="flex justify-between text-rose-400"><span>{formatCurrency(a.price)}</span><span>{a.qty}</span></div>
                   ))}
                   <div className="py-2 text-center text-xl font-bold">{formatCurrency(marketData[selectedLandId].currentPrice)}</div>
                   {orderBooks[selectedLandId].bids.map((b, i) => (
                     <div key={i} className="flex justify-between text-emerald-400"><span>{formatCurrency(b.price)}</span><span>{b.qty}</span></div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MarketDashboard({ lands, marketData, onSelect }) {
  const trending = useMemo(() => {
    return lands.map(l => ({ ...l, ...marketData[l.id], change: (Math.random() - 0.5) * 5 }))
      .sort((a, b) => b.change - a.change).slice(0, 3);
  }, [marketData]);

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-3xl font-black mb-8 flex items-center gap-2 text-emerald-400"><TrendingUp /> Trending</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trending.map(l => (
            <div key={l.id} onClick={() => onSelect(l.id)} className="glass-card p-8 rounded-[32px] cursor-pointer hover:border-emerald-500/50 transition-all">
              <p className="text-xs font-black text-emerald-500 uppercase mb-1">{l.region}</p>
              <h3 className="text-2xl font-black mb-4">{l.name}</h3>
              <p className="text-3xl font-black font-mono">{formatCurrency(l.currentPrice)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-[40px] overflow-hidden">
        <table className="w-full text-left">
          <thead className="text-xs font-black text-slate-500 uppercase bg-slate-900/30">
            <tr><th className="px-8 py-6">Asset</th><th className="px-8 py-6 text-right">Price</th><th className="px-8 py-6">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {lands.map(l => (
              <tr key={l.id} onClick={() => onSelect(l.id)} className="hover:bg-emerald-500/5 cursor-pointer transition">
                <td className="px-8 py-8">
                  <div className="font-black text-lg">{l.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{l.surveyNumber}</div>
                </td>
                <td className="px-8 py-8 text-right font-black font-mono text-xl">{formatCurrency(marketData[l.id]?.currentPrice)}</td>
                <td className="px-8 py-8"><span className="text-emerald-500 font-bold">ACTIVE</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default function PropertyCard({ region, title, price }) {
  return (
    <article className="rounded-[24px] p-8 bg-[rgba(255,255,255,0.03)] backdrop-blur-md border border-[rgba(255,255,255,0.04)] shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-teal-300 uppercase tracking-wider">{region}</div>
          <h3 className="mt-3 text-white text-xl md:text-2xl font-extrabold leading-snug">{title}</h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Price</div>
          <div className="mt-2 text-2xl md:text-3xl font-bold text-white">{price}</div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button className="px-4 py-2 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.04)] text-slate-300 text-sm hover:bg-[rgba(255,255,255,0.04)] transition">
          View
        </button>
        <button className="px-4 py-2 rounded-full bg-gradient-to-r from-teal-400 to-green-500 text-white text-sm font-medium shadow-md hover:scale-[1.02] transform transition">
          Buy
        </button>
      </div>
    </article>
  );
}