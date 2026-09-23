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

import Dashboard     from './pages/member/Dashboard'
import Login          from './pages/member/Login'
import Onboarding    from './pages/member/Onboarding'
import SetPassword   from './pages/member/SetPassword'
import ForgotPassword from './pages/member/ForgotPassword'
import ResetPassword  from './pages/member/ResetPassword'
import CourseLibrary from './pages/member/CourseLibrary'
import CourseDetail  from './pages/member/CourseDetail'
import LiveSessionDetail from './pages/member/LiveSessionDetail'
import Player        from './pages/member/Player'
import Progress      from './pages/member/Progress'
import PaymentHistory from './pages/member/PaymentHistory'
import Profile        from './pages/member/Profile'
import FinishSetup    from './pages/member/FinishSetup'
import Members            from './pages/admin/Members'
import UploadResources    from './pages/admin/UploadResources'
import UploadCourses      from './pages/admin/UploadCourses'
import NewCourse          from './pages/admin/NewCourse'
import ManageCourse       from './pages/admin/ManageCourse'
import UploadLiveSessions from './pages/admin/UploadLiveSessions'
import Analytics          from './pages/admin/Analytics'
import Orders             from './pages/admin/Orders'
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

        <Route path="/onboarding"     element={<Onboarding />} />
        <Route path="/signup/complete" element={<SetPassword />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/dashboard"      element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/admin/members"  element={<RequireAuth adminOnly><Members /></RequireAuth>} />
        <Route path="/admin/courses" element={<RequireAuth adminOnly><UploadCourses /></RequireAuth>} />
        <Route path="/admin/courses/new" element={<RequireAuth adminOnly><NewCourse /></RequireAuth>} />
        {/* /:courseId is the old (pre-dedicated-create-page) canonical URL for the
            editor — kept rendering the same component so bookmarked/linked
            copies of it keep working, per task #1. /:courseId/edit is the new
            canonical URL every in-app link now points to. */}
        <Route path="/admin/courses/:courseId" element={<RequireAuth adminOnly><ManageCourse /></RequireAuth>} />
        <Route path="/admin/courses/:courseId/edit" element={<RequireAuth adminOnly><ManageCourse /></RequireAuth>} />
        <Route path="/admin/courses/:courseId/episodes" element={<RequireAuth adminOnly><ManageCourse /></RequireAuth>} />
        <Route path="/admin/analytics" element={<RequireAuth adminOnly><Analytics /></RequireAuth>} />
        <Route path="/admin/orders" element={<RequireAuth adminOnly><Orders /></RequireAuth>} />
        <Route path="/admin/settings" element={<RequireAuth adminOnly><AdminSettings /></RequireAuth>} />
        <Route path="/courses"        element={<CourseLibrary />} />
        <Route path="/courses/:id"    element={<CourseDetail />} />
        <Route path="/live-sessions"  element={<RequireAuth><UploadLiveSessions /></RequireAuth>} />
        <Route path="/live-sessions/:id" element={<RequireAuth><LiveSessionDetail /></RequireAuth>} />
        <Route path="/resources"      element={<UploadResources />} />
        <Route path="/player"         element={<Player />} />
        <Route path="/progress"       element={<RequireAuth memberOnly><Progress /></RequireAuth>} />
        <Route path="/payments"       element={<RequireAuth memberOnly><PaymentHistory /></RequireAuth>} />
        <Route path="/profile"        element={<RequireAuth memberOnly><Profile /></RequireAuth>} />
        <Route path="/finish-setup"   element={<RequireAuth><FinishSetup /></RequireAuth>} />

        <Route path="*" element={<Home />} />
      </Routes>
    </>
  )
}
