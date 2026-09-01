import { Routes, Route } from 'react-router-dom'
import ScrollToHash from './components/ScrollToHash'
import Home    from './pages/Home'
import Leaders from './pages/Leaders'
import Pastors from './pages/Pastors'
import Events  from './pages/Events'

import Dashboard     from './pages/member/Dashboard'
import Onboarding    from './pages/member/Onboarding'
import SetPassword   from './pages/member/SetPassword'
import CourseLibrary from './pages/member/CourseLibrary'
import CourseDetail  from './pages/member/CourseDetail'
import Player        from './pages/member/Player'
import Progress      from './pages/member/Progress'

export default function App() {
  return (
    <>
      <ScrollToHash />
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/leaders" element={<Leaders />} />
        <Route path="/pastors" element={<Pastors />} />
        <Route path="/events"  element={<Events />} />

        <Route path="/onboarding"     element={<Onboarding />} />
        <Route path="/signup/complete" element={<SetPassword />} />
        <Route path="/dashboard"      element={<Dashboard />} />
        <Route path="/courses"        element={<CourseLibrary />} />
        <Route path="/courses/detail" element={<CourseDetail />} />
        <Route path="/player"         element={<Player />} />
        <Route path="/progress"       element={<Progress />} />

        <Route path="*" element={<Home />} />
      </Routes>
    </>
  )
}
