import React from 'react';
import Link from 'next/link';
import { 
  Plus,
  Package,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  Gift,
  Tag,
  Search,
  Wrench,
  Home,
  Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarketplaceGrid } from '@/components/marketplace/marketplace-grid';

export default function MarketplacePage() {
  const stats = {
    totalItems: 127,
    activeUsers: 89,
    itemsThisWeek: 23,
    categories: 6
  };

  const categories = [
    {
      name: 'Free Items',
      slug: 'free',
      icon: Gift,
      count: 34,
      color: 'bg-green-100 text-green-800',
      description: 'Items being given away for free'
    },
    {
      name: 'For Sale',
      slug: 'for-sale',
      icon: Tag,
      count: 45,
      color: 'bg-blue-100 text-blue-800',
      description: 'Items for sale by community members'
    },
    {
      name: 'Wanted',
      slug: 'wanted',
      icon: Search,
      count: 18,
      color: 'bg-purple-100 text-purple-800',
      description: 'Items people are looking for'
    },
    {
      name: 'Services',
      slug: 'services',
      icon: Wrench,
      count: 22,
      color: 'bg-orange-100 text-orange-800',
      description: 'Local services and skills offered'
    },
    {
      name: 'Housing',
      slug: 'housing',
      icon: Home,
      count: 5,
      color: 'bg-red-100 text-red-800',
      description: 'Rental properties and housing'
    },
    {
      name: 'Transport',
      slug: 'transport',
      icon: Car,
      count: 3,
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Vehicles and transport services'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Community Marketplace
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Buy, sell, trade, and share with your neighbors. Support local commerce 
            and build community connections.
          </p>
        </div>
        <Button asChild className="mt-4 sm:mt-0">
          <Link href="/marketplace/create">
            <Plus className="h-4 w-4 mr-2" />
            List an Item
          </Link>
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{stats.itemsThisWeek}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold">{stats.categories}</p>
              </div>
              <Tag className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Browse by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              
              return (
                <Link 
                  key={category.slug} 
                  href={`/marketplace?category=${category.slug}`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${category.color}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{category.count}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Items */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Recent Items</h2>
          <Button variant="outline" asChild>
            <Link href="/marketplace/all">
              View All Items
            </Link>
          </Button>
        </div>
        
        <MarketplaceGrid />
      </div>

      {/* Community Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-green-600">✓ Do</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Provide accurate descriptions and photos</li>
                <li>• Respond promptly to inquiries</li>
                <li>• Meet in safe, public locations</li>
                <li>• Be respectful and honest in all dealings</li>
                <li>• Update or remove sold/unavailable items</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-red-600">✗ Don't</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Post illegal or inappropriate items</li>
                <li>• Spam or post duplicate listings</li>
                <li>• Share personal financial information</li>
                <li>• Engage in discriminatory practices</li>
                <li>• Use the marketplace for commercial advertising</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Safety First:</strong> Always meet in public places, bring a friend if possible, 
              and trust your instincts. Report any suspicious activity to the community moderators.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: 'Community Marketplace | Stoneclough Community',
  description: 'Buy, sell, trade, and share with your neighbors in the Stoneclough, Prestolee & Ringley community marketplace.',
};
