import { useState } from 'react'
import BottomNav from './components/shared/BottomNav'
import GymApp from './components/gym/GymApp'
import ExpenseApp from './components/expenses/ExpenseApp'
import DebitApp from './components/debit/DebitApp'

export default function App() {
  const [activeTab, setActiveTab] = useState('gym')

  return (
    <div className="min-h-screen bg-bat-black text-bat-white">
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="md:ml-20 pb-20 md:pb-0">
        {activeTab === 'gym' && <GymApp />}
        {activeTab === 'expenses' && <ExpenseApp />}
        {activeTab === 'debit' && <DebitApp />}
      </main>
    </div>
  )
}