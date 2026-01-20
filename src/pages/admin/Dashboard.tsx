import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trophy,
  Users,
  DollarSign,
  FileText,
  Image,
  BarChart3,
  Calendar,
  Medal
} from 'lucide-react';

export default function Dashboard() {
  const adminCards = [
    {
      title: 'Teams',
      description: 'Manage league teams and owners',
      icon: Users,
      link: '/admin/teams',
      color: 'text-blue-600',
    },
    {
      title: 'Seasons',
      description: 'Configure league seasons',
      icon: Calendar,
      link: '/admin/seasons',
      color: 'text-green-600',
    },
    {
      title: 'Standings',
      description: 'Update regular season standings',
      icon: BarChart3,
      link: '/admin/standings',
      color: 'text-purple-600',
    },
    {
      title: 'Playoffs',
      description: 'Manage playoff outcomes and stats',
      icon: Trophy,
      link: '/admin/playoffs',
      color: 'text-yellow-600',
    },
    {
      title: 'Players & Salaries',
      description: 'Update player contracts and salaries',
      icon: DollarSign,
      link: '/admin/salaries',
      color: 'text-emerald-600',
    },
    {
      title: 'Blog Posts',
      description: 'Create and manage blog content',
      icon: FileText,
      link: '/admin/blog',
      color: 'text-orange-600',
    },
    {
      title: 'Media Library',
      description: 'Upload and organize images',
      icon: Image,
      link: '/admin/media',
      color: 'text-pink-600',
    },
    {
      title: 'Hall of Fame',
      description: 'Manage championship records',
      icon: Medal,
      link: '/admin/pantheon',
      color: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to the Gridiron Guild content management system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {adminCards.map((card) => (
          <Link key={card.link} to={card.link}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-100 ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </div>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
