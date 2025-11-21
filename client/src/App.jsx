import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SamplePage from './pages/SamplePage';
import NotFoundPage from './pages/NotFoundPage';
import RecordPage from './pages/RecordPage';
import FoodSearch from './pages/FoodSearch';  // Add this
import NavBar from './components/navbar';
import FoodDetail from './pages/FoodDetail'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="sample" element={<SamplePage />} />
        <Route path="record" element={<RecordPage />} />
        <Route path="search" element={<FoodSearch />} /> 
        <Route path="*" element={<NotFoundPage />} />
        <Route path="food/:id" element={<FoodDetail />} />
      </Routes>
      <NavBar />
    </BrowserRouter>
  )
}

export default App