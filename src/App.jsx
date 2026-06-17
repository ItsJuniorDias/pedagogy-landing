import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import AppLayout from './components/app/AppLayout.jsx'
import Home from './pages/app/Home.jsx'
import Profile from './pages/app/Profile.jsx'
import Stories from './pages/app/Stories.jsx'
import StoryReader from './pages/app/StoryReader.jsx'
import Path from './pages/app/Path.jsx'
import LessonReader from './pages/app/LessonReader.jsx'
import Paywall from './pages/app/Paywall.jsx'
import ComingSoon from './pages/app/ComingSoon.jsx'

export default function App() {
  return (
    <Routes>
      {/* public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* logged-in app */}
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="stories" element={<Stories />} />
        <Route path="stories/:storyId" element={<StoryReader />} />
        <Route path="path" element={<Path />} />
        <Route path="path/:courseId" element={<LessonReader />} />
        <Route path="path/:courseId/:lessonId" element={<LessonReader />} />
        <Route path="paywall" element={<Paywall />} />
        <Route
          path="games"
          element={<ComingSoon emoji="🎮" title="Games" blurb="Practice-as-play mini-games. Mocks coming soon!" />}
        />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
