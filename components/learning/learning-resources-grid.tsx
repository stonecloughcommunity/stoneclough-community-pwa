'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Video, 
  FileText, 
  ExternalLink, 
  GraduationCap,
  Clock,
  Star,
  Eye,
  Heart,
  Download,
  Play,
  User,
  Calendar,
  TrendingUp,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { LearningResource } from '@/lib/types/departments';

interface LearningResourcesGridProps {
  resources: LearningResource[];
  loading?: boolean;
  viewMode?: 'grid' | 'list';
  onResourceClick?: (resourceId: string) => void;
  onLike?: (resourceId: string) => void;
}

const resourceTypeIcons = {
  'article': FileText,
  'video': Video,
  'document': BookOpen,
  'link': ExternalLink,
  'course': GraduationCap,
};

const resourceTypeColors = {
  'article': 'bg-blue-100 text-blue-800',
  'video': 'bg-red-100 text-red-800',
  'document': 'bg-green-100 text-green-800',
  'link': 'bg-purple-100 text-purple-800',
  'course': 'bg-orange-100 text-orange-800',
};

const difficultyColors = {
  'beginner': 'bg-green-100 text-green-800',
  'intermediate': 'bg-yellow-100 text-yellow-800',
  'advanced': 'bg-red-100 text-red-800',
};

// Mock data for development
const mockResources: LearningResource[] = [
  {
    id: '1',
    title: 'Digital Skills for Seniors',
    content: 'A comprehensive guide to using smartphones, tablets, and computers. Learn at your own pace with step-by-step instructions and helpful tips.',
    department_id: '5',
    resource_type: 'course',
    difficulty_level: 'beginner',
    estimated_duration: 120,
    tags: ['technology', 'seniors', 'digital-skills', 'smartphones'],
    is_featured: true,
    view_count: 245,
    like_count: 32,
    status: 'published',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z',
    is_faith_content: false,
    author: {
      id: 'user1',
      display_name: 'Tech Support Team'
    }
  },
  {
    id: '2',
    title: 'Community Gardening Basics',
    content: 'Learn the fundamentals of sustainable gardening, from soil preparation to harvest. Perfect for beginners wanting to start their own garden.',
    department_id: '4',
    resource_type: 'video',
    difficulty_level: 'beginner',
    estimated_duration: 45,
    tags: ['gardening', 'sustainability', 'environment', 'beginners'],
    is_featured: false,
    view_count: 189,
    like_count: 28,
    status: 'published',
    created_at: '2024-01-08T16:00:00Z',
    updated_at: '2024-01-14T11:20:00Z',
    is_faith_content: false,
    author: {
      id: 'user2',
      display_name: 'Sarah Green'
    }
  },
  {
    id: '3',
    title: 'Starting a Local Business',
    content: 'A practical guide to launching your own business in the local community. Covers legal requirements, funding options, and marketing strategies.',
    department_id: '3',
    resource_type: 'article',
    difficulty_level: 'intermediate',
    estimated_duration: 30,
    tags: ['business', 'entrepreneurship', 'local-economy', 'startup'],
    is_featured: false,
    view_count: 156,
    like_count: 19,
    status: 'published',
    created_at: '2024-01-05T09:30:00Z',
    updated_at: '2024-01-12T15:45:00Z',
    is_faith_content: false,
    author: {
      id: 'user3',
      display_name: 'Emma Wilson'
    }
  },
  {
    id: '4',
    title: 'Mental Health First Aid',
    content: 'Learn how to recognize signs of mental health issues and provide initial support. Essential skills for community members who want to help others.',
    department_id: '2',
    resource_type: 'course',
    difficulty_level: 'intermediate',
    estimated_duration: 180,
    tags: ['mental-health', 'first-aid', 'community-support', 'wellbeing'],
    is_featured: true,
    view_count: 298,
    like_count: 45,
    status: 'published',
    created_at: '2024-01-03T14:00:00Z',
    updated_at: '2024-01-16T10:15:00Z',
    is_faith_content: false,
    author: {
      id: 'user4',
      display_name: 'Dr. James Mitchell'
    }
  }
];

export function LearningResourcesGrid({ 
  resources = mockResources, 
  loading = false, 
  viewMode = 'grid',
  onResourceClick,
  onLike
}: LearningResourcesGridProps) {
  const [likedResources, setLikedResources] = useState<Set<string>>(new Set());

  const handleLike = (resourceId: string) => {
    setLikedResources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
    onLike?.(resourceId);
  };

  const getResourceTypeIcon = (type: string) => {
    const IconComponent = resourceTypeIcons[type as keyof typeof resourceTypeIcons] || BookOpen;
    return IconComponent;
  };

  const getResourceTypeColor = (type: string) => {
    return resourceTypeColors[type as keyof typeof resourceTypeColors] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (level?: string) => {
    if (!level) return 'bg-gray-100 text-gray-800';
    return difficultyColors[level as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Unknown duration';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (loading) {
    return (
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={viewMode === 'grid' ? 'h-80 bg-gray-200 rounded-lg animate-pulse' : 'h-32 bg-gray-200 rounded-lg animate-pulse'} />
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No learning resources yet</h3>
          <p className="text-gray-600 mb-6">
            Be the first to share educational content and help others learn new skills.
          </p>
          <Button asChild>
            <Link href="/learning/create">
              Add Learning Resource
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {resources.map((resource) => {
          const TypeIcon = getResourceTypeIcon(resource.resource_type);
          const typeColor = getResourceTypeColor(resource.resource_type);
          const difficultyColor = getDifficultyColor(resource.difficulty_level);
          const isLiked = likedResources.has(resource.id);

          return (
            <Card key={resource.id} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${typeColor} flex-shrink-0`}>
                    <TypeIcon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={typeColor} variant="secondary">
                          {resource.resource_type}
                        </Badge>
                        {resource.difficulty_level && (
                          <Badge className={difficultyColor} variant="secondary">
                            {resource.difficulty_level}
                          </Badge>
                        )}
                        {resource.is_featured && (
                          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{resource.view_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(resource.estimated_duration)}</span>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {resource.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {resource.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {resource.author?.display_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{resource.author?.display_name || 'Anonymous'}</span>
                        </div>
                        <span>{formatDate(resource.created_at)}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(resource.id)}
                          className={isLiked ? 'text-red-600' : 'text-gray-500'}
                        >
                          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                          <span className="ml-1">{resource.like_count + (isLiked ? 1 : 0)}</span>
                        </Button>
                        
                        <Button size="sm" onClick={() => onResourceClick?.(resource.id)}>
                          {resource.resource_type === 'video' ? (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Watch
                            </>
                          ) : resource.resource_type === 'course' ? (
                            <>
                              <GraduationCap className="h-4 w-4 mr-1" />
                              Start
                            </>
                          ) : (
                            <>
                              <BookOpen className="h-4 w-4 mr-1" />
                              Read
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((resource) => {
        const TypeIcon = getResourceTypeIcon(resource.resource_type);
        const typeColor = getResourceTypeColor(resource.resource_type);
        const difficultyColor = getDifficultyColor(resource.difficulty_level);
        const isLiked = likedResources.has(resource.id);

        return (
          <Card key={resource.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Badge className={typeColor} variant="secondary">
                    <TypeIcon className="h-3 w-3 mr-1" />
                    {resource.resource_type}
                  </Badge>
                  {resource.difficulty_level && (
                    <Badge className={difficultyColor} variant="secondary">
                      {resource.difficulty_level}
                    </Badge>
                  )}
                </div>
                {resource.is_featured && (
                  <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>

              <CardTitle className="text-lg leading-tight">
                {resource.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm line-clamp-3">
                {resource.content}
              </p>

              {/* Resource Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{resource.view_count}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(resource.estimated_duration)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current text-red-600' : ''}`} />
                  <span>{resource.like_count + (isLiked ? 1 : 0)}</span>
                </div>
              </div>

              {/* Tags */}
              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {resource.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{resource.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              <Separator />

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {resource.author?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs text-gray-500">
                    <div>{resource.author?.display_name || 'Anonymous'}</div>
                    <div>{formatDate(resource.created_at)}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(resource.id)}
                    className={isLiked ? 'text-red-600' : 'text-gray-500'}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  </Button>
                  
                  <Button size="sm" onClick={() => onResourceClick?.(resource.id)}>
                    {resource.resource_type === 'video' ? (
                      <Play className="h-4 w-4" />
                    ) : resource.resource_type === 'course' ? (
                      <GraduationCap className="h-4 w-4" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
