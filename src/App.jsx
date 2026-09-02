import { Routes, Route } from 'react-router-dom'
import ScrollToHash from './components/ScrollToHash'
import RequireAuth from './components/RequireAuth'
import Home    from './pages/Home'
import Leaders from './pages/Leaders'
import Pastors from './pages/Pastors'
import Events  from './pages/Events'

import Dashboard     from './pages/member/Dashboard'
import Login          from './pages/member/Login'
import Onboarding    from './pages/member/Onboarding'
import SetPassword   from './pages/member/SetPassword'
import CourseLibrary from './pages/member/CourseLibrary'
import CourseDetail  from './pages/member/CourseDetail'
import Player        from './pages/member/Player'
import Progress      from './pages/member/Progress'
import Members            from './pages/admin/Members'
import UploadResources    from './pages/admin/UploadResources'
import UploadCourses      from './pages/admin/UploadCourses'
import UploadLiveSessions from './pages/admin/UploadLiveSessions'

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
        <Route path="/login"          element={<Login />} />
        <Route path="/dashboard"      element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/admin/members"  element={<RequireAuth adminOnly><Members /></RequireAuth>} />
        <Route path="/admin/resources" element={<RequireAuth adminOnly><UploadResources /></RequireAuth>} />
        <Route path="/admin/courses" element={<RequireAuth adminOnly><UploadCourses /></RequireAuth>} />
        <Route path="/admin/live-sessions" element={<RequireAuth adminOnly><UploadLiveSessions /></RequireAuth>} />
        <Route path="/courses"        element={<CourseLibrary />} />
        <Route path="/courses/detail" element={<CourseDetail />} />
        <Route path="/player"         element={<Player />} />
        <Route path="/progress"       element={<Progress />} />

        <Route path="*" element={<Home />} />
      </Routes>
    </>
  )
}
