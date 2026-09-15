import { Routes, Route } from 'react-router-dom'
import ScrollToHash from './components/ScrollToHash'
import RequireAuth from './components/RequireAuth'
import Home    from './pages/Home'
import Leaders from './pages/Leaders'
import Pastors from './pages/Pastors'
import Events  from './pages/Events'
import Membership from './pages/Membership'
import Programs from './pages/Programs'
import LockPreview from './pages/LockPreview'
import VimeoPreview from './pages/VimeoPreview'

import Dashboard     from './pages/member/Dashboard'
import Login          from './pages/member/Login'
import Onboarding    from './pages/member/Onboarding'
import SetPassword   from './pages/member/SetPassword'
import ForgotPassword from './pages/member/ForgotPassword'
import ResetPassword  from './pages/member/ResetPassword'
import CourseLibrary from './pages/member/CourseLibrary'
import CourseDetail  from './pages/member/CourseDetail'
import Player        from './pages/member/Player'
import Progress      from './pages/member/Progress'
import PaymentHistory from './pages/member/PaymentHistory'
import Profile        from './pages/member/Profile'
import FinishSetup    from './pages/member/FinishSetup'
import Members            from './pages/admin/Members'
import UploadResources    from './pages/admin/UploadResources'
import UploadCourses      from './pages/admin/UploadCourses'
import UploadLiveSessions from './pages/admin/UploadLiveSessions'
import Analytics          from './pages/admin/Analytics'
import AdminSettings      from './pages/admin/AdminSettings'

export default function App() {
  return (
    <>
      <ScrollToHash />
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/leaders" element={<Leaders />} />
        <Route path="/pastors" element={<Pastors />} />
        <Route path="/events"  element={<Events />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/lock-preview" element={<LockPreview />} />
        <Route path="/vimeo-preview" element={<VimeoPreview />} />

        <Route path="/onboarding"     element={<Onboarding />} />
        <Route path="/signup/complete" element={<SetPassword />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/dashboard"      element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/admin/members"  element={<RequireAuth adminOnly><Members /></RequireAuth>} />
        <Route path="/admin/courses" element={<RequireAuth adminOnly><UploadCourses /></RequireAuth>} />
        <Route path="/admin/analytics" element={<RequireAuth adminOnly><Analytics /></RequireAuth>} />
        <Route path="/admin/settings" element={<RequireAuth adminOnly><AdminSettings /></RequireAuth>} />
        <Route path="/courses"        element={<CourseLibrary />} />
        <Route path="/courses/:id"    element={<CourseDetail />} />
        <Route path="/live-sessions"  element={<UploadLiveSessions />} />
        <Route path="/resources"      element={<UploadResources />} />
        <Route path="/player"         element={<Player />} />
        <Route path="/progress"       element={<Progress />} />
        <Route path="/payments"       element={<RequireAuth><PaymentHistory /></RequireAuth>} />
        <Route path="/profile"        element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/finish-setup"   element={<RequireAuth><FinishSetup /></RequireAuth>} />

        <Route path="*" element={<Home />} />
      </Routes>
    </>
  )
}
