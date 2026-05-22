import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './store/UserContext';
import { ConsultSessionProvider } from './store/consultSession';

const HomePage = lazy(() => import('./pages/home/index.jsx'));
// const ConsultationPage = lazy(() => import('./pages/consultation/index.jsx'));
const KnowledgePage = lazy(() => import('./pages/knowledge/index.jsx'));
const KnowledgeDetailPage = lazy(() => import('./pages/knowledge/detail.jsx'));
const CommunityPage = lazy(() => import('./pages/community/index.jsx'));
const PersonalInfoPage = lazy(() => import('./pages/my/PersonalInfo.jsx'));

const LoginPage = lazy(() => import('./pages/auth/login.jsx'));
const RegisterPage = lazy(() => import('./pages/auth/register.jsx'));
const MyPage = lazy(() => import('./pages/my/index.jsx'));
const HistoryPage = lazy(() => import('./pages/consultation/history.jsx'));
const ChatPage = lazy(() => import('./pages/consultation/chat.jsx'));

const ContributeHistoryPage = lazy(() => import('./pages/workspace/contributeHistory.jsx'));
const ContributePage = lazy(() => import('./pages/workspace/contribute.jsx'));
const ReviewPage = lazy(() => import('./pages/workspace/review.jsx'));
const ReviewDetailPage = lazy(() => import('./pages/workspace/reviewDetail.jsx'));

function NotFound() {
  return <div style={{ padding: 32, textAlign: 'center' }}>404 Not Found</div>;
}

function App() {
  // 组件挂载后打印环境变量
  useEffect(() => {
    // 打印所有暴露的环境变量（最直观）
    console.log('📝 所有环境变量：', import.meta.env);
    
    // 打印指定的自定义变量（按需查看）
    console.log('🔑 项目标题：', import.meta.env.VITE_APP_TITLE);
    console.log('🔑 API地址：', import.meta.env.VITE_API_BASE_URL);
    
    // 打印Vite内置环境变量（辅助验证环境）
    console.log('🔧 当前环境模式：', import.meta.env.MODE); // development/production
    console.log('🔧 是否为开发环境：', import.meta.env.DEV); // true/false
  }, []);

  return (
    <BrowserRouter>
      <UserProvider>
        <ConsultSessionProvider>
          <Suspense fallback={<div style={{ padding: 32, textAlign: 'center' }}>页面加载中...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomePage />} />
              {/* <Route path="/consultation" element={<ConsultationPage />} /> */}
              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/knowledge/:id" element={<KnowledgeDetailPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/my" element={<MyPage />} />
              <Route path="/my/personal-info" element={<PersonalInfoPage />} />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/consultation/history" element={<HistoryPage />} />
              <Route path="/consultation/chat/:id" element={<ChatPage />} />
              <Route path="/workspace/contribute" element={<ContributeHistoryPage />} />
              <Route path="/workspace/contribute/edit" element={<ContributePage />} />
              <Route path="/workspace/review" element={<ReviewPage />} />
              <Route path="/workspace/review/:id" element={<ReviewDetailPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ConsultSessionProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
