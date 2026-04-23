import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { CartProvider } from '@/lib/CartContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from '@/components/layout/ScrollToTop';

import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Blog from './pages/Blog';
import BlogPostPage from './pages/BlogPost';
import FAQPage from './pages/FAQPage';
import Contact from './pages/Contact';
import Returns from './pages/Returns';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Reviews from './pages/Reviews';
import Checkout from './pages/Checkout';
import HypReturn from './pages/HypReturn';
import HypMock from './pages/HypMock';
import EmailPreview from './pages/EmailPreview';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/Shop" element={<Shop />} />
        <Route path="/Shop/:category" element={<Shop />} />
        <Route path="/ProductDetail" element={<ProductDetail />} />
        <Route path="/About" element={<About />} />
        <Route path="/Blog" element={<Blog />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/BlogPost" element={<BlogPostPage />} />
        <Route path="/FAQ" element={<FAQPage />} />
        <Route path="/Contact" element={<Contact />} />
        <Route path="/Returns" element={<Returns />} />
        <Route path="/Terms" element={<Terms />} />
        <Route path="/Privacy" element={<Privacy />} />
        <Route path="/Reviews" element={<Reviews />} />
        <Route path="/Checkout" element={<Checkout />} />
      </Route>
      <Route path="/checkout/hyp-return" element={<HypReturn />} />
      <Route path="/checkout/hyp-mock" element={<HypMock />} />
      <Route path="/email-preview" element={<EmailPreview />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <CartProvider>
              <Router>
                <ScrollToTop />
                <AuthenticatedApp />
              </Router>
              <Toaster />
            </CartProvider>
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  )
}

export default App