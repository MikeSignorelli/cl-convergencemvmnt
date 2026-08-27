import { Routes, Route } from 'react-router-dom'
import { TierProvider } from './context/TierContext'
import Home       from './pages/Home'
import Leaders    from './pages/Leaders'
import Pastors    from './pages/Pastors'
import Events     from './pages/Events'
import Dashboard  from './pages/Dashboard'
import Onboarding from './pages/Onboarding'

export default function App() {
  return (
    <TierProvider>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/leaders"     element={<Leaders />} />
        <Route path="/pastors"     element={<Pastors />} />
        <Route path="/events"      element={<Events />} />
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/onboarding"  element={<Onboarding />} />
        {/* fallback */}
        <Route path="*"            element={<Home />} />
      </Routes>
    </TierProvider>
  )
}
