import React from 'react';
import Link from 'next/link';
import { 
  Church, 
  Heart, 
  Briefcase, 
  Leaf, 
  Monitor, 
  Users,
  ArrowRight,
  TrendingUp,
  Calendar,
  FileText,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data for departments - in production this would come from the database
const departments = [
  {
    id: '1',
    name: 'Faith & Culture',
    slug: 'faith-culture',
    description: 'Spiritual life, worship, interfaith dialogue, and cultural heritage preservation',
    icon: Church,
    color: '#8B5CF6',
    stats: { posts: 24, events: 8, resources: 12, members: 156 }
  },
  {
    id: '2',
    name: 'Community & Wellbeing',
    slug: 'community-wellbeing',
    description: 'Health, mental wellbeing, social connections, and community support',
    icon: Heart,
    color: '#EF4444',
    stats: { posts: 42, events: 15, resources: 18, members: 203 }
  },
  {
    id: '3',
    name: 'Economy & Enterprise',
    slug: 'economy-enterprise',
    description: 'Local business, job opportunities, skills development, and economic growth',
    icon: Briefcase,
    color: '#F59E0B',
    stats: { posts: 31, events: 6, resources: 22, members: 178 }
  },
  {
    id: '4',
    name: 'Land, Food & Sustainability',
    slug: 'land-food-sustainability',
    description: 'Environmental stewardship, community gardens, and sustainable living',
    icon: Leaf,
    color: '#10B981',
    stats: { posts: 28, events: 12, resources: 15, members: 134 }
  },
  {
    id: '5',
    name: 'Technology & Platform',
    slug: 'technology-platform',
    description: 'Digital literacy, platform development, and technology support',
    icon: Monitor,
    color: '#3B82F6',
    stats: { posts: 19, events: 4, resources: 25, members: 89 }
  },
  {
    id: '6',
    name: 'Governance & Growth',
    slug: 'governance-growth',
    description: 'Community leadership, partnerships, and strategic development',
    icon: Users,
    color: '#6366F1',
    stats: { posts: 16, events: 7, resources: 11, members: 112 }
  }
];

export default function DepartmentsPage() {
  const totalStats = departments.reduce((acc, dept) => ({
    posts: acc.posts + dept.stats.posts,
    events: acc.events + dept.stats.events,
    resources: acc.resources + dept.stats.resources,
    members: acc.members + dept.stats.members
  }), { posts: 0, events: 0, resources: 0, members: 0 });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Community Departments
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl">
          Our community is organized into six key departments, each focusing on different aspects 
          of village life. Explore the areas that interest you most and connect with like-minded neighbors.
        </p>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold">{totalStats.posts}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{totalStats.events}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resources</p>
                <p className="text-2xl font-bold">{totalStats.resources}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-bold">{totalStats.members}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {departments.map((department) => {
          const IconComponent = department.icon;
          
          return (
            <Card key={department.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: department.color }}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {department.stats.members}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{department.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {department.description}
                </p>
                
                {/* Department Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{department.stats.posts}</p>
                    <p className="text-xs text-gray-500">Posts</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{department.stats.events}</p>
                    <p className="text-xs text-gray-500">Events</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{department.stats.resources}</p>
                    <p className="text-xs text-gray-500">Resources</p>
                  </div>
                </div>

                <Button asChild className="w-full" style={{ backgroundColor: department.color }}>
                  <Link href={`/departments/${department.slug}`}>
                    Explore Department
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Get Started
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Join Departments</h3>
              <p className="text-sm text-gray-600 mb-3">
                Select the departments that interest you to personalize your experience
              </p>
              <Button asChild variant="outline">
                <Link href="/settings/preferences">
                  Update Preferences
                </Link>
              </Button>
            </div>
            
            <div className="text-center p-4">
              <FileText className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Share Content</h3>
              <p className="text-sm text-gray-600 mb-3">
                Create posts, share resources, and contribute to your community
              </p>
              <Button asChild variant="outline">
                <Link href="/community/create">
                  Create Post
                </Link>
              </Button>
            </div>
            
            <div className="text-center p-4">
              <Calendar className="h-12 w-12 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Attend Events</h3>
              <p className="text-sm text-gray-600 mb-3">
                Discover and participate in events happening in your areas of interest
              </p>
              <Button asChild variant="outline">
                <Link href="/events">
                  Browse Events
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
