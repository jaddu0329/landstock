import { BarChart3, Wallet } from 'lucide-react';
export default function Navbar({ setView }) {
  return (
    <nav className="sticky top-0 z-[1000] bg-ls-dark/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
        <div className="w-10 h-10 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-xl flex items-center justify-center">
          <BarChart3 className="text-white" size={24} />
        </div>
        <h1 className="text-xl font-bold">LandScope</h1>
      </div>
      <div className="w-10 h-10 rounded-full bg-ls-card flex items-center justify-center"><Wallet size={18} /></div>
    </nav>
  );
}