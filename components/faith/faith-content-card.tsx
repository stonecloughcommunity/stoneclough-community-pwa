'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  Share2, 
  BookOpen, 
  Clock, 
  User,
  Eye,
  MessageCircle,
  Star,
  Church,
  Bookmark,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { FaithContent } from '@/lib/types/departments';

interface FaithContentCardProps {
  content: FaithContent;
  showFullContent?: boolean;
  onLike?: (contentId: string) => void;
  onShare?: (contentId: string) => void;
  onBookmark?: (contentId: string) => void;
}

const contentTypeColors = {
  'devotional': 'bg-purple-100 text-purple-800',
  'prayer': 'bg-blue-100 text-blue-800',
  'scripture': 'bg-green-100 text-green-800',
  'reflection': 'bg-orange-100 text-orange-800',
  'sermon': 'bg-red-100 text-red-800',
  'study': 'bg-indigo-100 text-indigo-800',
};

const contentTypeIcons = {
  'devotional': Heart,
  'prayer': Church,
  'scripture': BookOpen,
  'reflection': MessageCircle,
  'sermon': User,
  'study': Star,
};

export function FaithContentCard({ 
  content, 
  showFullContent = false, 
  onLike, 
  onShare, 
  onBookmark 
}: FaithContentCardProps) {
  const [isExpanded, setIsExpanded] = useState(showFullContent);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const IconComponent = contentTypeIcons[content.content_type] || BookOpen;
  const typeColor = contentTypeColors[content.content_type] || 'bg-gray-100 text-gray-800';

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(content.id);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.(content.id);
  };

  const handleShare = () => {
    onShare?.(content.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getContentPreview = (text: string, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${typeColor}`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div>
              <Badge className={typeColor} variant="secondary">
                {content.content_type}
              </Badge>
              {content.is_featured && (
                <Badge variant="default" className="ml-2 bg-yellow-100 text-yellow-800">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Eye className="h-4 w-4" />
            <span>{content.view_count}</span>
          </div>
        </div>
        
        <CardTitle className="text-xl leading-tight">
          {content.title}
        </CardTitle>

        {content.scripture_reference && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <BookOpen className="h-4 w-4" />
            <span className="font-medium">{content.scripture_reference}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content */}
        <div className="prose prose-sm max-w-none">
          {isExpanded ? (
            <div className="whitespace-pre-wrap text-gray-700">
              {content.content}
            </div>
          ) : (
            <div className="text-gray-700">
              {getContentPreview(content.content)}
            </div>
          )}
          
          {content.content.length > 200 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-800"
            >
              {isExpanded ? (
                <>
                  Show less <ChevronUp className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Read more <ChevronDown className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {content.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {content.author_id ? 'A' : 'S'}
                </AvatarFallback>
              </Avatar>
              <span>
                {content.author_id ? 'Community Member' : 'System'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(content.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-1 ${
                isLiked ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{content.like_count + (isLiked ? 1 : 0)}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className={`${isBookmarked ? 'text-blue-600' : 'text-gray-500'}`}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-gray-500"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Faith Content Grid Component
interface FaithContentGridProps {
  contents: FaithContent[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function FaithContentGrid({ 
  contents, 
  loading = false, 
  onLoadMore, 
  hasMore = false 
}: FaithContentGridProps) {
  if (loading && contents.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Church className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No faith content yet</h3>
          <p className="text-gray-600 mb-6">
            Be the first to share spiritual insights and reflections with the community.
          </p>
          <Button asChild>
            <Link href="/faith/create">
              Share Faith Content
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contents.map((content) => (
          <FaithContentCard key={content.id} content={content} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button 
            onClick={onLoadMore} 
            variant="outline" 
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
