import { Routes, Route } from 'react-router-dom';
import GamePage from './pages/GamePage';
import HistoryPage from './pages/HistoryPage';
import AdventureDetailPage from './pages/AdventureDetailPage'; // <-- 1. Importe a nova página

function App() {
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      <Route path="/historias" element={<HistoryPage />} />
      {}
      <Route path="/historias/:adventureId" element={<AdventureDetailPage />} />
    </Routes>
  );
}

export default App;