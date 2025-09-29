'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search,
  Filter,
  MapPin,
  Clock,
  Eye,
  Heart,
  Share2,
  Tag,
  Package,
  Home,
  Car,
  Wrench,
  Gift,
  ChevronDown,
  Grid3X3,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MarketplaceItem } from '@/lib/types/departments';

interface MarketplaceGridProps {
  items?: MarketplaceItem[];
  loading?: boolean;
  onSearch?: (term: string) => void;
  onFilter?: (filters: MarketplaceFilters) => void;
}

interface MarketplaceFilters {
  category?: string;
  priceRange?: string;
  condition?: string;
  location?: string;
  department?: string;
}

const categoryIcons = {
  'free': Gift,
  'for-sale': Tag,
  'wanted': Search,
  'services': Wrench,
  'housing': Home,
  'transport': Car,
};

const categoryColors = {
  'free': 'bg-green-100 text-green-800',
  'for-sale': 'bg-blue-100 text-blue-800',
  'wanted': 'bg-purple-100 text-purple-800',
  'services': 'bg-orange-100 text-orange-800',
  'housing': 'bg-red-100 text-red-800',
  'transport': 'bg-yellow-100 text-yellow-800',
};

// Mock data for development
const mockItems: MarketplaceItem[] = [
  {
    id: '1',
    title: 'Vintage Dining Table',
    content: 'Beautiful oak dining table, seats 6 people. Some wear but very sturdy. Perfect for family meals.',
    seller_id: 'user1',
    department_id: '1',
    category: 'for-sale',
    price: 150,
    currency: 'GBP',
    condition: 'good',
    location: 'Stoneclough',
    images: ['/placeholder-furniture.jpg'],
    tags: ['furniture', 'dining', 'oak', 'vintage'],
    status: 'active',
    view_count: 24,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    is_faith_content: false,
    author: {
      id: 'user1',
      display_name: 'Sarah Johnson'
    }
  },
  {
    id: '2',
    title: 'Free Garden Plants',
    content: 'Giving away various garden plants - lavender, rosemary, and some flowering plants. Perfect for new gardeners!',
    seller_id: 'user2',
    department_id: '4',
    category: 'free',
    price: 0,
    currency: 'GBP',
    condition: 'good',
    location: 'Prestolee',
    images: ['/placeholder-plants.jpg'],
    tags: ['plants', 'garden', 'herbs', 'flowers'],
    status: 'active',
    view_count: 18,
    created_at: '2024-01-14T14:30:00Z',
    updated_at: '2024-01-14T14:30:00Z',
    is_faith_content: false,
    author: {
      id: 'user2',
      display_name: 'Mike Green'
    }
  },
  {
    id: '3',
    title: 'Looking for Piano Teacher',
    content: 'Seeking a piano teacher for my 8-year-old daughter. Preferably someone local who can come to our home.',
    seller_id: 'user3',
    department_id: '2',
    category: 'wanted',
    currency: 'GBP',
    location: 'Ringley',
    images: [],
    tags: ['music', 'piano', 'lessons', 'children'],
    status: 'active',
    view_count: 12,
    created_at: '2024-01-13T09:15:00Z',
    updated_at: '2024-01-13T09:15:00Z',
    is_faith_content: false,
    author: {
      id: 'user3',
      display_name: 'Emma Wilson'
    }
  },
  {
    id: '4',
    title: 'Handyman Services',
    content: 'Experienced handyman available for small repairs, painting, and general maintenance. Reasonable rates and reliable service.',
    seller_id: 'user4',
    department_id: '3',
    category: 'services',
    price: 25,
    currency: 'GBP',
    location: 'Stoneclough',
    images: ['/placeholder-tools.jpg'],
    tags: ['handyman', 'repairs', 'painting', 'maintenance'],
    status: 'active',
    view_count: 31,
    created_at: '2024-01-12T16:45:00Z',
    updated_at: '2024-01-12T16:45:00Z',
    is_faith_content: false,
    author: {
      id: 'user4',
      display_name: 'Tom Builder'
    }
  }
];

export function MarketplaceGrid({ 
  items = mockItems, 
  loading = false, 
  onSearch, 
  onFilter 
}: MarketplaceGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<MarketplaceFilters>({});

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleFilterChange = (newFilters: Partial<MarketplaceFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilter?.(updatedFilters);
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Package;
    return IconComponent;
  };

  const getCategoryColor = (category: string) => {
    return categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search marketplace..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Select onValueChange={(value) => handleFilterChange({ category: value })}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="for-sale">For Sale</SelectItem>
                  <SelectItem value="wanted">Wanted</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="housing">Housing</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => handleFilterChange({ location: value })}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  <SelectItem value="Stoneclough">Stoneclough</SelectItem>
                  <SelectItem value="Prestolee">Prestolee</SelectItem>
                  <SelectItem value="Ringley">Ringley</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Price: Low to High</DropdownMenuItem>
                  <DropdownMenuItem>Price: High to Low</DropdownMenuItem>
                  <DropdownMenuItem>Newest First</DropdownMenuItem>
                  <DropdownMenuItem>Most Viewed</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem>Show Free Items Only</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>Show Items with Images</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
      }>
        {items.map((item) => {
          const IconComponent = getCategoryIcon(item.category);
          const categoryColor = getCategoryColor(item.category);

          return (
            <Card key={item.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={categoryColor}>
                    <IconComponent className="h-3 w-3 mr-1" />
                    {item.category.replace('-', ' ')}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Eye className="h-3 w-3" />
                    {item.view_count}
                  </div>
                </div>

                {/* Item Image */}
                {item.images && item.images.length > 0 && (
                  <div className="relative h-48 mb-3 rounded-lg overflow-hidden bg-gray-100">
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="h-12 w-12" />
                    </div>
                  </div>
                )}

                {/* Item Details */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg line-clamp-2">{item.title}</h3>
                  
                  {item.price !== undefined && (
                    <p className="text-2xl font-bold text-green-600">
                      {formatPrice(item.price, item.currency)}
                      {item.category === 'services' && <span className="text-sm font-normal">/hour</span>}
                    </p>
                  )}

                  <p className="text-gray-600 text-sm line-clamp-2">{item.content}</p>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Item Meta */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {item.author?.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-500">
                        {item.author?.display_name || 'Anonymous'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      {item.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button size="sm" asChild>
                      <Link href={`/marketplace/${item.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button asChild>
              <Link href="/marketplace/create">
                List Your First Item
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
