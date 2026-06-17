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

import Games from './pages/app/Games.jsx'

// The actual games pull in three.js — lazy-load each so that weight only
// downloads when the player opens that specific game.
const Pong = lazy(() => import('./pages/app/Pong.jsx'))
const Farm = lazy(() => import('./pages/app/Farm.jsx'))

function GameFallback({ emoji = '🎮' }) {
  return (
    <div className="grid place-items-center py-24">
      <div className="text-5xl animate-bounce">{emoji}</div>
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
        <Route path="games">
          <Route index element={<Games />} />
          <Route
            path="farm"
            element={
              <Suspense fallback={<GameFallback emoji="🌾" />}>
                <Farm />
              </Suspense>
            }
          />
          <Route
            path="pong"
            element={
              <Suspense fallback={<GameFallback emoji="🏓" />}>
                <Pong />
              </Suspense>
            }
          />
        </Route>
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
