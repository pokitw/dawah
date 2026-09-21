import { Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import Home from './pages/Home'
import Learn from './pages/Learn'
import Debate from './pages/Debate'
import Ask from './pages/Ask'
import Profile from './pages/Profile'
import DebateRoom from './pages/DebateRoom'
import Scorecard from './pages/Scorecard'
import Module from './pages/Module'
import Quiz from './pages/Quiz'
import Flashcards from './pages/Flashcards'
import Trainers from './pages/Trainers'
import FallacyTrainer from './pages/FallacyTrainer'
import WeakAnswerTrainer from './pages/WeakAnswerTrainer'
import SteelmanTrainer from './pages/SteelmanTrainer'
import RapidFire from './pages/RapidFire'
import Daily from './pages/Daily'
import Glossary from './pages/Glossary'
import Sources from './pages/Sources'
import Notes from './pages/Notes'
import History from './pages/History'
import Weakness from './pages/Weakness'
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
          <Route path="/learn/module/:id" element={<Module />} />
          <Route path="/learn/quiz/:id" element={<Quiz />} />
          <Route path="/learn/flashcards" element={<Flashcards />} />
          <Route path="/debate" element={<Debate />} />
          <Route path="/debate/:id" element={<DebateRoom />} />
          <Route path="/debate/:id/scorecard" element={<Scorecard />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:slug" element={<LibraryItem />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/history" element={<History />} />
          <Route path="/weakness" element={<Weakness />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/train" element={<Trainers />} />
          <Route path="/train/fallacy" element={<FallacyTrainer />} />
          <Route path="/train/weak-answer" element={<WeakAnswerTrainer />} />
          <Route path="/train/steelman" element={<SteelmanTrainer />} />
          <Route path="/train/rapid" element={<RapidFire />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <BottomNav />
    </>
  )
}
