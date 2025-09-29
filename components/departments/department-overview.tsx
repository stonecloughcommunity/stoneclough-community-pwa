'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  Calendar, 
  BookOpen, 
  MessageSquare,
  TrendingUp,
  Plus,
  Eye,
  Heart,
  Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DepartmentService } from '@/lib/services/departments';
import type { 
  Department, 
  DepartmentStatsResponse, 
  DepartmentContent 
} from '@/lib/types/departments';

interface DepartmentOverviewProps {
  department: Department;
}

export function DepartmentOverview({ department }: DepartmentOverviewProps) {
  const [stats, setStats] = useState<DepartmentStatsResponse | null>(null);
  const [recentContent, setRecentContent] = useState<DepartmentContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartmentData();
  }, [department.id]);

  const loadDepartmentData = async () => {
    try {
      const [statsData, contentData] = await Promise.all([
        DepartmentService.getDepartmentStats(department.id),
        DepartmentService.getDepartmentContent(department.id, {}, 1, 5)
      ]);
      
      setStats(statsData);
      setRecentContent(contentData.data);
    } catch (error) {
      console.error('Error loading department data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: department.color }}
              >
                {department.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{department.name}</h1>
                <p className="text-gray-600 mt-1 max-w-2xl">{department.description}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {stats?.stats.members_count || 0} members
                  </Badge>
                  <Badge variant="outline">
                    Active Department
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button asChild>
                <Link href={`/departments/${department.slug}/create`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Content
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Community Posts</p>
                <p className="text-2xl font-bold">{stats?.stats.posts_count || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Events</p>
                <p className="text-2xl font-bold">{stats?.stats.events_count || 0}</p>
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
                <p className="text-2xl font-bold">{stats?.stats.resources_count || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Groups</p>
                <p className="text-2xl font-bold">{stats?.stats.groups_count || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentContent.length > 0 ? (
                <div className="space-y-4">
                  {recentContent.map((content) => (
                    <div key={content.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                            {content.title}
                          </h3>
                          {content.content && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {content.content.substring(0, 150)}...
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {getInitials(content.author?.display_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-500">
                                {content.author?.display_name || 'Anonymous'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(content.created_at)}
                            </span>
                            {content.is_faith_content && (
                              <Badge variant="outline" className="text-xs">
                                Faith Content
                              </Badge>
                            )}
                          </div>
                          {content.tags && content.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {content.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {content.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{content.tags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                  <p className="text-gray-600 mb-4">
                    Be the first to share something in this department!
                  </p>
                  <Button asChild>
                    <Link href={`/departments/${department.slug}/create`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Post
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href={`/departments/${department.slug}/posts/create`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Post
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/departments/${department.slug}/events/create`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/departments/${department.slug}/resources/create`}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Add Resource
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/departments/${department.slug}/groups/create`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create Group
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Department Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link 
                href={`/departments/${department.slug}/posts`}
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                View All Posts →
              </Link>
              <Link 
                href={`/departments/${department.slug}/events`}
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                View All Events →
              </Link>
              <Link 
                href={`/departments/${department.slug}/resources`}
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                View All Resources →
              </Link>
              <Link 
                href={`/departments/${department.slug}/groups`}
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                View All Groups →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
