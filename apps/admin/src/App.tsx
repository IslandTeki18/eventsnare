import { Route, Routes } from 'react-router';
import { SignIn, SignUp } from '@/features/auth';
import { AdminGate } from '@/features/admin-gate';
import {
  AdminLayout,
  AdminOverview,
  AdminUsers,
  AdminSystem,
} from '@/features/admin-dashboard';
import { BlogIndex, BlogEditor } from '@/features/blog-dashboard';

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/sign-up/*" element={<SignUp />} />
        <Route
          path="/"
          element={
            <AdminGate>
              <AdminLayout>
                <AdminOverview />
              </AdminLayout>
            </AdminGate>
          }
        />
        <Route
          path="/users"
          element={
            <AdminGate>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </AdminGate>
          }
        />
        <Route
          path="/blog"
          element={
            <AdminGate>
              <AdminLayout>
                <BlogIndex />
              </AdminLayout>
            </AdminGate>
          }
        />
        <Route
          path="/blog/new"
          element={
            <AdminGate>
              <AdminLayout>
                <BlogEditor />
              </AdminLayout>
            </AdminGate>
          }
        />
        <Route
          path="/blog/:postId"
          element={
            <AdminGate>
              <AdminLayout>
                <BlogEditor />
              </AdminLayout>
            </AdminGate>
          }
        />
        <Route
          path="/system"
          element={
            <AdminGate>
              <AdminLayout>
                <AdminSystem />
              </AdminLayout>
            </AdminGate>
          }
        />
      </Routes>
    </div>
  );
}
