'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Church, 
  Heart, 
  Briefcase, 
  Leaf, 
  Monitor, 
  Users,
  Filter,
  Search,
  ChevronDown,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DepartmentService } from '@/lib/services/departments';
import type { Department, DepartmentFilter } from '@/lib/types/departments';

const DEPARTMENT_ICONS = {
  'faith-culture': Church,
  'community-wellbeing': Heart,
  'economy-enterprise': Briefcase,
  'land-food-sustainability': Leaf,
  'technology-platform': Monitor,
  'governance-growth': Users,
};

interface DepartmentNavigationProps {
  currentDepartment?: Department;
  showSearch?: boolean;
  showFilters?: boolean;
  onFilterChange?: (filter: DepartmentFilter) => void;
  onSearchChange?: (searchTerm: string) => void;
}

export function DepartmentNavigation({
  currentDepartment,
  showSearch = true,
  showFilters = true,
  onFilterChange,
  onSearchChange,
}: DepartmentNavigationProps) {
  const pathname = usePathname();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<DepartmentFilter>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await DepartmentService.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  const handleFilterChange = (newFilter: Partial<DepartmentFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    onFilterChange?.(updatedFilter);
  };

  const getDepartmentIcon = (slug: string) => {
    const IconComponent = DEPARTMENT_ICONS[slug as keyof typeof DEPARTMENT_ICONS];
    return IconComponent || Users;
  };

  const isActiveDepartment = (department: Department) => {
    return pathname.includes(`/departments/${department.slug}`) || 
           currentDepartment?.id === department.id;
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-4 p-4">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Department Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Link href="/dashboard">
            <Button
              variant={!currentDepartment ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              All Departments
            </Button>
          </Link>
          
          {departments.map((department) => {
            const IconComponent = getDepartmentIcon(department.slug);
            const isActive = isActiveDepartment(department);
            
            return (
              <Link key={department.id} href={`/departments/${department.slug}`}>
                <Button
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                  style={{
                    backgroundColor: isActive ? department.color : undefined,
                    borderColor: department.color,
                    color: isActive ? 'white' : department.color,
                  }}
                >
                  <IconComponent className="h-4 w-4" />
                  {department.name}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Search and Filters */}
        {(showSearch || showFilters) && (
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search */}
            {showSearch && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {/* Filters */}
            {showFilters && (
              <div className="flex items-center gap-2">
                {/* Content Type Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Content Type
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuCheckboxItem
                      checked={filter.content_type === undefined}
                      onCheckedChange={() => handleFilterChange({ content_type: undefined })}
                    >
                      All Content
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={filter.content_type === 'posts'}
                      onCheckedChange={() => handleFilterChange({ content_type: 'posts' })}
                    >
                      Community Posts
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filter.content_type === 'events'}
                      onCheckedChange={() => handleFilterChange({ content_type: 'events' })}
                    >
                      Events
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filter.content_type === 'resources'}
                      onCheckedChange={() => handleFilterChange({ content_type: 'resources' })}
                    >
                      Learning Resources
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filter.content_type === 'marketplace'}
                      onCheckedChange={() => handleFilterChange({ content_type: 'marketplace' })}
                    >
                      Marketplace
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Faith Content Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Church className="h-4 w-4" />
                      Faith Content
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => handleFilterChange({ 
                        include_faith_content: undefined,
                        exclude_faith_content: undefined 
                      })}
                    >
                      All Content
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleFilterChange({ 
                        include_faith_content: true,
                        exclude_faith_content: false 
                      })}
                    >
                      Include Faith Content
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleFilterChange({ 
                        include_faith_content: false,
                        exclude_faith_content: true 
                      })}
                    >
                      Exclude Faith Content
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Age Group Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Age Group
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => handleFilterChange({ age_group: undefined })}
                    >
                      All Ages
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleFilterChange({ age_group: 'under-18' })}
                    >
                      Under 18
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleFilterChange({ age_group: '18-30' })}
                    >
                      18-30
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleFilterChange({ age_group: '31-50' })}
                    >
                      31-50
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleFilterChange({ age_group: '51-70' })}
                    >
                      51-70
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleFilterChange({ age_group: 'over-70' })}
                    >
                      Over 70
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        )}

        {/* Active Filters Display */}
        {(filter.content_type || filter.age_group || filter.include_faith_content !== undefined) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
            <span className="text-sm text-gray-600">Active filters:</span>
            
            {filter.content_type && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filter.content_type}
                <button
                  onClick={() => handleFilterChange({ content_type: undefined })}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
            
            {filter.age_group && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filter.age_group}
                <button
                  onClick={() => handleFilterChange({ age_group: undefined })}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
            
            {filter.include_faith_content === true && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Faith Content Only
                <button
                  onClick={() => handleFilterChange({ 
                    include_faith_content: undefined,
                    exclude_faith_content: undefined 
                  })}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
            
            {filter.exclude_faith_content === true && (
              <Badge variant="secondary" className="flex items-center gap-1">
                No Faith Content
                <button
                  onClick={() => handleFilterChange({ 
                    include_faith_content: undefined,
                    exclude_faith_content: undefined 
                  })}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilter({});
                onFilterChange?.({});
              }}
              className="text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
