import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  Home,
  Users,
  Trophy,
  DollarSign,
  FileText,
  Image,
  BarChart3,
  Calendar,
  Medal,
  FileEdit
} from 'lucide-react';

export default function AdminLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Teams', path: '/admin/teams' },
    { icon: Calendar, label: 'Seasons', path: '/admin/seasons' },
    { icon: BarChart3, label: 'Standings', path: '/admin/standings' },
    { icon: Trophy, label: 'Playoffs', path: '/admin/playoffs' },
    { icon: DollarSign, label: 'Salaries', path: '/admin/salaries' },
    { icon: FileText, label: 'Weekly Recaps', path: '/admin/weekly-recaps' },
    { icon: FileEdit, label: 'Pages', path: '/admin/pages' },
    { icon: Image, label: 'Media', path: '/admin/media' },
    { icon: Medal, label: 'Pantheon', path: '/admin/pantheon' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/admin/dashboard" className="flex items-center">
                <Trophy className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Gridiron Guild Admin
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
