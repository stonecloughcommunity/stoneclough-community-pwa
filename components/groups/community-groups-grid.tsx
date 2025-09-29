'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  MapPin, 
  Calendar, 
  Lock, 
  Globe, 
  UserPlus,
  Settings,
  MessageSquare,
  Heart,
  Briefcase,
  Leaf,
  Church,
  Monitor,
  UserCheck,
  Clock,
  Star,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { CommunityGroup } from '@/lib/types/departments';

interface CommunityGroupsGridProps {
  groups: CommunityGroup[];
  loading?: boolean;
  userMemberships?: string[]; // Group IDs the user is a member of
  onJoinGroup?: (groupId: string) => void;
  onLeaveGroup?: (groupId: string) => void;
}

const groupTypeIcons = {
  'public': Globe,
  'private': Users,
  'invite-only': Lock,
};

const groupTypeColors = {
  'public': 'bg-green-100 text-green-800',
  'private': 'bg-blue-100 text-blue-800',
  'invite-only': 'bg-purple-100 text-purple-800',
};

const departmentIcons = {
  'faith-culture': Church,
  'community-wellbeing': Heart,
  'economy-enterprise': Briefcase,
  'land-food-sustainability': Leaf,
  'technology-platform': Monitor,
  'governance-growth': Users,
};

// Mock data for development
const mockGroups: CommunityGroup[] = [
  {
    id: '1',
    title: 'Village Gardeners',
    content: 'A group for sharing gardening tips, organizing community garden projects, and promoting sustainable growing practices in our villages.',
    department_id: '4',
    creator_id: 'user1',
    group_type: 'public',
    current_members: 24,
    max_members: 50,
    is_faith_based: false,
    meeting_schedule: 'First Saturday of each month, 10am',
    location: 'Community Garden, Stoneclough',
    tags: ['gardening', 'sustainability', 'community', 'environment'],
    status: 'active',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z',
    is_faith_content: false,
    author: {
      id: 'user1',
      display_name: 'Sarah Green'
    }
  },
  {
    id: '2',
    title: 'Faith & Fellowship',
    content: 'An inclusive interfaith group welcoming all denominations and faith backgrounds. We meet for prayer, discussion, and community service projects.',
    department_id: '1',
    creator_id: 'user2',
    group_type: 'public',
    current_members: 18,
    is_faith_based: true,
    meeting_schedule: 'Every Wednesday, 7pm',
    location: 'St. Saviour\'s Church Hall',
    tags: ['faith', 'prayer', 'interfaith', 'community service'],
    status: 'active',
    created_at: '2024-01-08T16:00:00Z',
    updated_at: '2024-01-14T11:20:00Z',
    is_faith_content: true,
    author: {
      id: 'user2',
      display_name: 'Rev. Michael Thompson'
    }
  },
  {
    id: '3',
    title: 'Local Business Network',
    content: 'Connecting local entrepreneurs, freelancers, and small business owners. Share opportunities, collaborate, and support each other\'s ventures.',
    department_id: '3',
    creator_id: 'user3',
    group_type: 'private',
    current_members: 15,
    max_members: 30,
    is_faith_based: false,
    meeting_schedule: 'Monthly networking breakfast',
    location: 'Various local venues',
    tags: ['business', 'networking', 'entrepreneurship', 'collaboration'],
    status: 'active',
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
    title: 'Senior Citizens Circle',
    content: 'A welcoming group for our senior community members to connect, share experiences, and organize activities that promote wellbeing and social connection.',
    department_id: '2',
    creator_id: 'user4',
    group_type: 'public',
    current_members: 32,
    is_faith_based: false,
    meeting_schedule: 'Every Tuesday and Thursday, 2pm',
    location: 'Community Centre',
    tags: ['seniors', 'wellbeing', 'social', 'activities'],
    status: 'active',
    created_at: '2024-01-03T14:00:00Z',
    updated_at: '2024-01-16T10:15:00Z',
    is_faith_content: false,
    author: {
      id: 'user4',
      display_name: 'Margaret Davies'
    }
  }
];

export function CommunityGroupsGrid({ 
  groups = mockGroups, 
  loading = false, 
  userMemberships = [],
  onJoinGroup,
  onLeaveGroup
}: CommunityGroupsGridProps) {
  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set());

  const handleJoinGroup = async (groupId: string) => {
    setJoiningGroups(prev => new Set(prev).add(groupId));
    try {
      await onJoinGroup?.(groupId);
    } finally {
      setJoiningGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    setJoiningGroups(prev => new Set(prev).add(groupId));
    try {
      await onLeaveGroup?.(groupId);
    } finally {
      setJoiningGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    }
  };

  const getGroupTypeIcon = (type: string) => {
    const IconComponent = groupTypeIcons[type as keyof typeof groupTypeIcons] || Users;
    return IconComponent;
  };

  const getGroupTypeColor = (type: string) => {
    return groupTypeColors[type as keyof typeof groupTypeColors] || 'bg-gray-100 text-gray-800';
  };

  const getDepartmentIcon = (departmentId: string) => {
    // This would normally map department IDs to slugs via a lookup
    const IconComponent = departmentIcons['community-wellbeing'] || Users;
    return IconComponent;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const isMember = (groupId: string) => userMemberships.includes(groupId);
  const isJoining = (groupId: string) => joiningGroups.has(groupId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups yet</h3>
          <p className="text-gray-600 mb-6">
            Be the first to create a community group and bring people together around shared interests.
          </p>
          <Button asChild>
            <Link href="/groups/create">
              Create First Group
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group) => {
        const TypeIcon = getGroupTypeIcon(group.group_type);
        const typeColor = getGroupTypeColor(group.group_type);
        const DepartmentIcon = getDepartmentIcon(group.department_id || '');
        const memberStatus = isMember(group.id);
        const joining = isJoining(group.id);

        return (
          <Card key={group.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Badge className={typeColor} variant="secondary">
                    <TypeIcon className="h-3 w-3 mr-1" />
                    {group.group_type.replace('-', ' ')}
                  </Badge>
                  {group.is_faith_based && (
                    <Badge variant="outline" className="text-xs">
                      <Church className="h-3 w-3 mr-1" />
                      Faith-based
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>{group.current_members}</span>
                  {group.max_members && (
                    <span>/{group.max_members}</span>
                  )}
                </div>
              </div>

              <CardTitle className="text-lg leading-tight">
                {group.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm line-clamp-3">
                {group.content}
              </p>

              {/* Meeting Info */}
              {(group.meeting_schedule || group.location) && (
                <div className="space-y-2 text-sm text-gray-600">
                  {group.meeting_schedule && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{group.meeting_schedule}</span>
                    </div>
                  )}
                  {group.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{group.location}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {group.tags && group.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {group.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {group.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{group.tags.length - 3} more
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
                      {group.author?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs text-gray-500">
                    <div>{group.author?.display_name || 'Anonymous'}</div>
                    <div>{formatDate(group.created_at)}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {memberStatus ? (
                    <>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/groups/${group.id}`}>
                          <MessageSquare className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleLeaveGroup(group.id)}
                        disabled={joining}
                        className="text-red-600 hover:text-red-700"
                      >
                        {joining ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                        ) : (
                          'Leave'
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={joining || (group.max_members && group.current_members >= group.max_members)}
                    >
                      {joining ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-1" />
                      )}
                      {group.group_type === 'invite-only' ? 'Request' : 'Join'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
