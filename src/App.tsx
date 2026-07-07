import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import AuthProvider from './components/auth/AuthProvider';
import { ProtectedRoute, AdminRoute } from './components/auth/RouteGuards';

import Layout        from './components/layout/Layout';
import Home          from './pages/Home';
import Store         from './pages/Store';
import ProductDetail from './pages/ProductDetail';
import Cart          from './pages/Cart';
import Checkout      from './pages/Checkout';
import Wishlist      from './pages/Wishlist';
import Compare       from './pages/Compare';
import Wholesale     from './pages/Wholesale';
import AIBuilder     from './pages/AIBuilder';
import Dashboard     from './pages/Dashboard';
import Contact       from './pages/Contact';
import About         from './pages/About';
import Settings      from './pages/Settings';
import Admin         from './pages/Admin';
import Login         from './pages/Login';
import Register      from './pages/Register';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index              element={<Home />} />
              <Route path="store"       element={<Store />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="cart"        element={<Cart />} />
              <Route path="checkout"    element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="wishlist"    element={<Wishlist />} />
              <Route path="compare"     element={<Compare />} />
              <Route path="wholesale"   element={<Wholesale />} />
              <Route path="ai"          element={<AIBuilder />} />
              <Route path="dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="contact"     element={<Contact />} />
              <Route path="about"       element={<About />} />
              <Route path="settings"    element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="admin"       element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="login"       element={<Login />} />
              <Route path="register"    element={<Register />} />
              <Route path="*"           element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
}
