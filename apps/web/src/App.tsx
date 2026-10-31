import { Route, Routes } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { NotFound } from "./components/common/UIComponents";
import { LandingPage } from "./pages/LandingPage";
import { ExplorePage } from "./pages/ExplorePage";
import { CourseDetailsPage } from "./pages/CourseDetailsPage";
import { AuthPage } from "./pages/AuthPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { InstructorDashboard } from "./pages/InstructorDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { InstructorApplicationPage } from "./pages/InstructorApplicationPage";
import { LearningRoom } from "./pages/LearningRoom";
import { VerifyCertificate } from "./pages/VerifyCertificate";
import { CheckoutReturn } from "./pages/CheckoutReturn";
import { useAppDispatch, useAppSelector } from "./store";
import { closeLiveRoom } from "./slices/uiSlice";
import { LiveRoom } from "./components/live/LiveRoom";

export function App() {
  const dispatch = useAppDispatch();
  const activeLiveRoom = useAppSelector((state) => state.ui.activeLiveRoom);

  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/course/:courseId" element={<CourseDetailsPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/teach" element={<InstructorApplicationPage />} />
          <Route path="/learn/:courseId" element={<LearningRoom />} />
          <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
          <Route path="/checkout/return" element={<CheckoutReturn />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      {activeLiveRoom && (
        <LiveRoom
          sessionId={activeLiveRoom.sessionId}
          url={activeLiveRoom.url}
          token={activeLiveRoom.token}
          title={activeLiveRoom.title}
          onClose={() => dispatch(closeLiveRoom())}
        />
      )}
    </>
  );
}

export default App;
