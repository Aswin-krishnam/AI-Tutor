
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './components/home/Home';
import Chat from './components/Chat';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import UserDashboard from './components/Dashboard/UserDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import AITutorChat from './components/Chat/AITutorChat';
import AdminCourses from './components/Admin/AdminCourses';
import CoursesBrowse from './components/Users/CoursesBrowse';
import CourseDetail from './components/Users/CourseDetail';
import CourseLearning from './components/Users/CourseLearning';
import StudyMaterials from './components/StudyMaterials';

import ProfessionalStudyMaterials from './components/Users/ProfessionalStudyMaterials';
import StudyMaterialsManager from './components/Admin/StudyMaterialsManager';
import StudyMaterialsDashboard from './components/Admin/StudyMaterialsDashboard';
import ProgressDashboard from './components/Users/Progress/ProgressDashboard';
import Assessment from './components/Users/Assessment/Assessment';
import AssessmentManagement from './components/Admin/AssessmentManagement';
import AssessmentEditor from './components/Admin/AssessmentEditor';
import CourseCertificate from './components/Users/CourseCertificate';
import ConnectionProgress from './components/Users/Connections/ConnectionProgress';

import MyCourses from './components/Users/Standalone/MyCourses';
import LearningHistory from './components/Users/Standalone/LearningHistory';
import MyProgress from './components/Users/Standalone/MyProgress';
import ModuleForum from './components/Users/Forum/ModuleForum';
import NewDiscussion from './components/Users/Forum/NewDiscussion';
import DiscussionView from './components/Users/Forum/DiscussionView';






function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Dashboard Routes */}
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* New Standalone Pages */}
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/learning-history" element={<LearningHistory />} />
        <Route path="/my-progress" element={<MyProgress />} />

        {/* Course Related Routes */}
        <Route path="/courses" element={<CoursesBrowse />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/course/:id/learn" element={<CourseLearning />} />
        <Route path="/course/:courseId/study-materials" element={<ProfessionalStudyMaterials />} />
        <Route path="/course/:courseId/progress" element={<ProgressDashboard />} />
        <Route path="/course/:courseId/assessment/:moduleIndex" element={<Assessment />} />
        <Route path="/course/:courseId/certificate" element={<CourseCertificate />} />

        {/* Forum Routes */}
        <Route path="/course/:courseId/forum/:moduleIndex" element={<ModuleForum />} />
        <Route path="/course/:courseId/forum/:moduleIndex/new" element={<NewDiscussion />} />
        <Route path="/course/:courseId/forum/:moduleIndex/discussion/:discussionId" element={<DiscussionView />} />

        {/* Connections */}
        <Route path="/connection/:connectionId/progress" element={<ConnectionProgress />} />

        {/* AI Tutor Chat */}
        <Route path="/ai-chat" element={<AITutorChat />} />
        <Route path="/test" element={<Chat />} />

        {/* Admin Routes */}
        <Route path="/admin/courses" element={<AdminCourses />} />
        <Route path="/admin/course/:courseId/study-materials" element={<StudyMaterialsManager />} />
        <Route path="/admin/study-materials" element={<StudyMaterialsDashboard />} />
        <Route path="/admin/courses/:courseId/assessments" element={<AssessmentManagement />} />
        <Route path="/admin/assessment/:assessmentId" element={<AssessmentEditor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
