import { useState } from 'react'
import BottomNav from './components/shared/BottomNav'
import GymApp from './components/gym/GymApp'
import ExpenseApp from './components/expenses/ExpenseApp'
import DebitApp from './components/debit/DebitApp'
import UserSelector from './components/shared/UserSelector'
import UserMenu from './components/shared/UserMenu'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('gym')

  if (!currentUser) return <UserSelector />

  const allowedTabs = currentUser.role === 'admin'
    ? ['gym', 'expenses', 'debit']
    : ['gym']

  const safeTab = allowedTabs.includes(activeTab) ? activeTab : 'gym'

  return (
    <div className="min-h-screen bg-bat-black text-bat-white">
      <UserMenu />
      <BottomNav activeTab={safeTab} onTabChange={setActiveTab} />

      <main className="md:ml-20 pb-20 md:pb-0">
        {safeTab === 'gym' && <GymApp />}
        {safeTab === 'expenses' && <ExpenseApp />}
        {safeTab === 'debit' && <DebitApp />}
      </main>
    </div>
  )
}