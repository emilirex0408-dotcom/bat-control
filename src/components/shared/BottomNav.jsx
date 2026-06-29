import { Dumbbell, CreditCard, Landmark } from 'lucide-react'
import BatLogo from './BatLogo'

export default function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'gym', label: 'Gym', icon: Dumbbell },
    { id: 'expenses', label: 'Credito', icon: CreditCard },
    { id: 'debit', label: 'Debito', icon: Landmark },
  ]

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-bat-night border-r border-bat-border flex-col items-center py-6 gap-8 z-50">
        <BatLogo size={36} className="drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]" />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
              activeTab === tab.id
                ? 'bg-bat-gold/10 text-bat-gold shadow-bat border border-bat-gold/20'
                : 'text-bat-muted hover:text-bat-light hover:bg-bat-panel'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </button>
        ))}
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bat-night/95 backdrop-blur-md border-t border-bat-border px-4 py-2">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition ${
                activeTab === tab.id
                  ? 'text-bat-gold'
                  : 'text-bat-muted'
              }`}
            >
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]' : ''}`} />
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}