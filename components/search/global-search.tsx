'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Calendar, 
  MessageSquare, 
  Package, 
  BookOpen, 
  Users, 
  Church,
  Clock,
  TrendingUp,
  Filter,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { createClient } from '@/lib/supabase/client';

interface SearchResult {
  id: string;
  title: string;
  content?: string;
  type: 'post' | 'event' | 'marketplace' | 'resource' | 'group' | 'faith';
  department?: string;
  url: string;
  created_at: string;
  author?: {
    display_name: string;
  };
  tags?: string[];
  relevance_score?: number;
}

interface SearchFilters {
  types: string[];
  departments: string[];
  dateRange: 'all' | 'week' | 'month' | 'year';
  sortBy: 'relevance' | 'date' | 'popularity';
}

interface GlobalSearchProps {
  trigger?: React.ReactNode;
  placeholder?: string;
  showFilters?: boolean;
}

const contentTypeIcons = {
  post: MessageSquare,
  event: Calendar,
  marketplace: Package,
  resource: BookOpen,
  group: Users,
  faith: Church,
};

const contentTypeColors = {
  post: 'bg-blue-100 text-blue-800',
  event: 'bg-green-100 text-green-800',
  marketplace: 'bg-purple-100 text-purple-800',
  resource: 'bg-orange-100 text-orange-800',
  group: 'bg-pink-100 text-pink-800',
  faith: 'bg-indigo-100 text-indigo-800',
};

export function GlobalSearch({ 
  trigger, 
  placeholder = "Search community...", 
  showFilters = true 
}: GlobalSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches] = useState<string[]>([
    'community events',
    'volunteer opportunities',
    'local services',
    'faith activities',
    'marketplace',
    'learning resources'
  ]);
  const [filters, setFilters] = useState<SearchFilters>({
    types: [],
    departments: [],
    dateRange: 'all',
    sortBy: 'relevance'
  });
  
  const supabase = createClient();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('stoneclough-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      // Debounce search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, filters]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search community posts
      if (filters.types.length === 0 || filters.types.includes('post')) {
        const { data: posts } = await supabase
          .from('community_posts')
          .select(`
            id,
            title,
            content,
            created_at,
            tags,
            department_id,
            author:profiles(display_name)
          `)
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
          .limit(10);

        if (posts) {
          searchResults.push(...posts.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            type: 'post' as const,
            department: post.department_id,
            url: `/community/${post.id}`,
            created_at: post.created_at,
            author: post.author,
            tags: post.tags,
          })));
        }
      }

      // Search events
      if (filters.types.length === 0 || filters.types.includes('event')) {
        const { data: events } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            start_time,
            location,
            tags,
            department_id,
            organizer:profiles(display_name)
          `)
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(10);

        if (events) {
          searchResults.push(...events.map(event => ({
            id: event.id,
            title: event.title,
            content: event.description,
            type: 'event' as const,
            department: event.department_id,
            url: `/events/${event.id}`,
            created_at: event.start_time,
            author: event.organizer,
            tags: event.tags,
          })));
        }
      }

      // Search marketplace items
      if (filters.types.length === 0 || filters.types.includes('marketplace')) {
        const { data: items } = await supabase
          .from('marketplace_items')
          .select(`
            id,
            title,
            content,
            created_at,
            tags,
            department_id,
            seller:profiles(display_name)
          `)
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
          .eq('status', 'active')
          .limit(10);

        if (items) {
          searchResults.push(...items.map(item => ({
            id: item.id,
            title: item.title,
            content: item.content,
            type: 'marketplace' as const,
            department: item.department_id,
            url: `/marketplace/${item.id}`,
            created_at: item.created_at,
            author: item.seller,
            tags: item.tags,
          })));
        }
      }

      // Search learning resources
      if (filters.types.length === 0 || filters.types.includes('resource')) {
        const { data: resources } = await supabase
          .from('learning_resources')
          .select(`
            id,
            title,
            content,
            created_at,
            tags,
            department_id,
            author:profiles(display_name)
          `)
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
          .eq('status', 'published')
          .limit(10);

        if (resources) {
          searchResults.push(...resources.map(resource => ({
            id: resource.id,
            title: resource.title,
            content: resource.content,
            type: 'resource' as const,
            department: resource.department_id,
            url: `/learning/${resource.id}`,
            created_at: resource.created_at,
            author: resource.author,
            tags: resource.tags,
          })));
        }
      }

      // Search community groups
      if (filters.types.length === 0 || filters.types.includes('group')) {
        const { data: groups } = await supabase
          .from('community_groups')
          .select(`
            id,
            title,
            content,
            created_at,
            tags,
            department_id,
            creator:profiles(display_name)
          `)
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
          .eq('status', 'active')
          .limit(10);

        if (groups) {
          searchResults.push(...groups.map(group => ({
            id: group.id,
            title: group.title,
            content: group.content,
            type: 'group' as const,
            department: group.department_id,
            url: `/groups/${group.id}`,
            created_at: group.created_at,
            author: group.creator,
            tags: group.tags,
          })));
        }
      }

      // Search faith content
      if (filters.types.length === 0 || filters.types.includes('faith')) {
        const { data: faithContent } = await supabase
          .from('faith_content')
          .select(`
            id,
            title,
            content,
            created_at,
            tags
          `)
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
          .eq('status', 'published')
          .limit(10);

        if (faithContent) {
          searchResults.push(...faithContent.map(content => ({
            id: content.id,
            title: content.title,
            content: content.content,
            type: 'faith' as const,
            url: `/faith/${content.id}`,
            created_at: content.created_at,
            tags: content.tags,
          })));
        }
      }

      // Sort results by relevance or date
      const sortedResults = searchResults.sort((a, b) => {
        if (filters.sortBy === 'date') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        // Default to relevance (could be enhanced with proper scoring)
        return 0;
      });

      setResults(sortedResults.slice(0, 20));
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('stoneclough-recent-searches', JSON.stringify(newRecentSearches));

    // Navigate to result
    router.push(result.url);
    setOpen(false);
    setQuery('');
  };

  const handleQuickSearch = (searchTerm: string) => {
    setQuery(searchTerm);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getContentPreview = (content?: string) => {
    if (!content) return '';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-muted-foreground">
            <Search className="mr-2 h-4 w-4" />
            {placeholder}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">Search Community</DialogTitle>
        </DialogHeader>
        
        <Command className="rounded-lg border-none shadow-none">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder={placeholder}
              value={query}
              onValueChange={setQuery}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery('')}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <CommandList className="max-h-[400px] overflow-y-auto">
            {!query && (
              <>
                {recentSearches.length > 0 && (
                  <CommandGroup heading="Recent Searches">
                    {recentSearches.map((search, index) => (
                      <CommandItem
                        key={index}
                        onSelect={() => handleQuickSearch(search)}
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4 text-gray-400" />
                        {search}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                <CommandGroup heading="Popular Searches">
                  {popularSearches.map((search, index) => (
                    <CommandItem
                      key={index}
                      onSelect={() => handleQuickSearch(search)}
                      className="flex items-center gap-2"
                    >
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      {search}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {query && !loading && results.length === 0 && (
              <CommandEmpty>No results found for "{query}"</CommandEmpty>
            )}

            {query && loading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}

            {results.length > 0 && (
              <CommandGroup heading={`Results (${results.length})`}>
                {results.map((result) => {
                  const IconComponent = contentTypeIcons[result.type];
                  const typeColor = contentTypeColors[result.type];
                  
                  return (
                    <CommandItem
                      key={`${result.type}-${result.id}`}
                      onSelect={() => handleResultClick(result)}
                      className="p-3"
                    >
                      <div className="flex items-start space-x-3 w-full">
                        <div className={`p-1.5 rounded ${typeColor}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-sm truncate">{result.title}</h3>
                            <Badge variant="secondary" className="text-xs ml-2">
                              {result.type}
                            </Badge>
                          </div>
                          {result.content && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {getContentPreview(result.content)}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              {result.author && (
                                <span>{result.author.display_name}</span>
                              )}
                              <span>•</span>
                              <span>{formatDate(result.created_at)}</span>
                            </div>
                            {result.tags && result.tags.length > 0 && (
                              <div className="flex space-x-1">
                                {result.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>

        {showFilters && (
          <div className="border-t p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Press Enter to search • ↑↓ to navigate</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                Filters
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
