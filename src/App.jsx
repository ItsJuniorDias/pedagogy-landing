import { lazy, Suspense } from 'react'
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

// Games pulls in three.js / R3F / drei — lazy-load it so that weight only
// downloads when the player actually opens the Games tab.
const Games = lazy(() => import('./pages/app/Games.jsx'))

function GamesFallback() {
  return (
    <div className="grid place-items-center py-24">
      <div className="text-5xl animate-bounce">🏓</div>
    </div>
  )
}

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
          element={
            <Suspense fallback={<GamesFallback />}>
              <Games />
            </Suspense>
          }
        />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
