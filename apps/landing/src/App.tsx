import { Route, Routes } from 'react-router'
import { Home } from '@/pages/Home'

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  )
}
