import React from 'react';
import { notFound } from 'next/navigation';
import { 
  Church, 
  Heart, 
  Briefcase, 
  Leaf, 
  Monitor, 
  Users 
} from 'lucide-react';
import { DepartmentOverview } from '@/components/departments/department-overview';
import { DepartmentNavigation } from '@/components/departments/department-navigation';
import type { Department } from '@/lib/types/departments';

// Mock departments data - in production this would come from the database
const departments: Record<string, Department> = {
  'faith-culture': {
    id: '1',
    name: 'Faith & Culture',
    slug: 'faith-culture',
    description: 'Spiritual life, worship, interfaith dialogue, and cultural heritage preservation. This department serves as a bridge between different faith communities while celebrating our shared values and diverse traditions.',
    icon: 'church',
    color: '#8B5CF6',
    sort_order: 1,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  'community-wellbeing': {
    id: '2',
    name: 'Community & Wellbeing',
    slug: 'community-wellbeing',
    description: 'Health, mental wellbeing, social connections, and community support. We focus on creating a caring community where everyone feels supported and valued, with resources for physical and mental health.',
    icon: 'heart',
    color: '#EF4444',
    sort_order: 2,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  'economy-enterprise': {
    id: '3',
    name: 'Economy & Enterprise',
    slug: 'economy-enterprise',
    description: 'Local business, job opportunities, skills development, and economic growth. Supporting local entrepreneurs, creating employment opportunities, and building a thriving local economy.',
    icon: 'briefcase',
    color: '#F59E0B',
    sort_order: 3,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  'land-food-sustainability': {
    id: '4',
    name: 'Land, Food & Sustainability',
    slug: 'land-food-sustainability',
    description: 'Environmental stewardship, community gardens, and sustainable living. Working together to protect our environment, grow local food, and create a sustainable future for our villages.',
    icon: 'leaf',
    color: '#10B981',
    sort_order: 4,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  'technology-platform': {
    id: '5',
    name: 'Technology & Platform',
    slug: 'technology-platform',
    description: 'Digital literacy, platform development, and technology support. Helping our community embrace technology, providing digital skills training, and maintaining our community platform.',
    icon: 'monitor',
    color: '#3B82F6',
    sort_order: 5,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  'governance-growth': {
    id: '6',
    name: 'Governance & Growth',
    slug: 'governance-growth',
    description: 'Community leadership, partnerships, and strategic development. Fostering democratic participation, building partnerships with local organizations, and planning for our community\'s future.',
    icon: 'users',
    color: '#6366F1',
    sort_order: 6,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
};

interface DepartmentPageProps {
  params: {
    slug: string;
  };
}

export default function DepartmentPage({ params }: DepartmentPageProps) {
  const department = departments[params.slug];

  if (!department) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Department Navigation */}
      <DepartmentNavigation 
        currentDepartment={department}
        showSearch={true}
        showFilters={true}
      />

      {/* Department Overview */}
      <DepartmentOverview department={department} />
    </div>
  );
}

// Generate static params for all departments
export async function generateStaticParams() {
  return Object.keys(departments).map((slug) => ({
    slug,
  }));
}

// Generate metadata for each department page
export async function generateMetadata({ params }: DepartmentPageProps) {
  const department = departments[params.slug];

  if (!department) {
    return {
      title: 'Department Not Found',
    };
  }

  return {
    title: `${department.name} | Stoneclough Community`,
    description: department.description,
    openGraph: {
      title: `${department.name} | Stoneclough Community`,
      description: department.description,
      type: 'website',
    },
  };
}
