import { Route, Routes } from 'react-router-dom';
import { PinGate } from './auth/PinGate';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { DisplayPage } from './pages/display/DisplayPage';
import { HostPage } from './pages/host/HostPage';
import { QuestionsPage } from './pages/host/QuestionsPage';
import { SharePage } from './pages/host/SharePage';
import { TallyPage } from './pages/host/TallyPage';
import { SurveyPage } from './pages/survey/SurveyPage';
import { BuzzerPage } from './pages/buzzer/BuzzerPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/display" element={<DisplayPage />} />
      <Route path="/host" element={<PinGate><HostPage /></PinGate>} />
      <Route path="/host/questions" element={<PinGate><QuestionsPage /></PinGate>} />
      <Route path="/host/tally/:id" element={<PinGate><TallyPage /></PinGate>} />
      <Route path="/host/share" element={<PinGate><SharePage /></PinGate>} />
      <Route path="/survey" element={<SurveyPage />} />
      <Route path="/buzzer" element={<BuzzerPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
