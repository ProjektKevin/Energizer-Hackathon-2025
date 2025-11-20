import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SamplePage from './pages/SamplePage';
import NotFoundPage from './pages/NotFoundPage';
import RecordPage from './pages/RecordPage';
import NavBar from './components/navbar';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="sample" element={<SamplePage />} />
        <Route path="record" element={<RecordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <NavBar />
    </BrowserRouter>
  )
}

export default App