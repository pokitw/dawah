import { Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import Home from './pages/Home'
import Learn from './pages/Learn'
import Debate from './pages/Debate'
import Ask from './pages/Ask'
import Profile from './pages/Profile'
import DebateRoom from './pages/DebateRoom'
import Scorecard from './pages/Scorecard'
import Library from './pages/Library'
import LibraryItem from './pages/LibraryItem'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/debate" element={<Debate />} />
          <Route path="/debate/:id" element={<DebateRoom />} />
          <Route path="/debate/:id/scorecard" element={<Scorecard />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:slug" element={<LibraryItem />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <BottomNav />
    </>
  )
}
