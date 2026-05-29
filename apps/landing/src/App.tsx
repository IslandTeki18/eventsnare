import { Route, Routes } from 'react-router';
import { Welcome } from '@/Welcome';
// @scaffold:imports

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/" element={<Welcome />} />
        {/* @scaffold:routes */}
      </Routes>
    </div>
  );
}
