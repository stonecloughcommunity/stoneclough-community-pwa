'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Church,
  Heart,
  Briefcase,
  Leaf,
  Monitor,
  Handshake,
  User,
  MapPin,
  Bell,
  Shield,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { NotificationService } from '@/lib/services/notifications';
import { toast } from 'sonner';

interface OnboardingData {
  display_name: string;
  village: string;
  age_group: string;
  faith_preference: string;
  department_interests: string[];
  accessibility_needs: string[];
  notification_preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  bio?: string;
  interests: string[];
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => Promise<void>;
  initialData?: Partial<OnboardingData>;
}

const departments = [
  {
    id: '1',
    name: 'Faith & Culture',
    slug: 'faith-culture',
    icon: Church,
    color: '#8B5CF6',
    description: 'Spiritual life, worship, and cultural heritage'
  },
  {
    id: '2',
    name: 'Community & Wellbeing',
    slug: 'community-wellbeing',
    icon: Heart,
    color: '#EF4444',
    description: 'Health, social connections, and community support'
  },
  {
    id: '3',
    name: 'Economy & Enterprise',
    slug: 'economy-enterprise',
    icon: Briefcase,
    color: '#F59E0B',
    description: 'Local business, jobs, and economic development'
  },
  {
    id: '4',
    name: 'Land, Food & Sustainability',
    slug: 'land-food-sustainability',
    icon: Leaf,
    color: '#10B981',
    description: 'Environmental stewardship and sustainable living'
  },
  {
    id: '5',
    name: 'Technology & Platform',
    slug: 'technology-platform',
    icon: Monitor,
    color: '#3B82F6',
    description: 'Digital literacy and technology support'
  },
  {
    id: '6',
    name: 'Governance & Growth',
    slug: 'governance-growth',
    icon: Handshake,
    color: '#6366F1',
    description: 'Community leadership and partnerships'
  }
];

const accessibilityOptions = [
  'Large text/fonts',
  'High contrast display',
  'Screen reader compatible',
  'Keyboard navigation',
  'Audio descriptions',
  'Simplified interface',
  'Voice commands',
  'Motor accessibility'
];

const commonInterests = [
  'Reading', 'Music', 'Sports', 'Cooking', 'Gardening', 'Travel',
  'Photography', 'Art', 'History', 'Nature', 'Technology', 'Volunteering',
  'Community events', 'Faith activities', 'Environmental issues',
  'Health & fitness', 'Education', 'Local business'
];

export function OnboardingFlow({ onComplete, initialData }: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    display_name: '',
    village: '',
    age_group: '',
    faith_preference: '',
    department_interests: [],
    accessibility_needs: [],
    notification_preferences: {
      email: true,
      push: true,
      sms: false,
    },
    bio: '',
    interests: [],
    ...initialData
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete(data);
      toast.success('Welcome to the Stoneclough community!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to complete onboarding. Please try again.');
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const toggleDepartmentInterest = (departmentId: string) => {
    const interests = data.department_interests.includes(departmentId)
      ? data.department_interests.filter(id => id !== departmentId)
      : [...data.department_interests, departmentId];
    updateData({ department_interests: interests });
  };

  const toggleAccessibilityNeed = (need: string) => {
    const needs = data.accessibility_needs.includes(need)
      ? data.accessibility_needs.filter(n => n !== need)
      : [...data.accessibility_needs, need];
    updateData({ accessibility_needs: needs });
  };

  const toggleInterest = (interest: string) => {
    const interests = data.interests.includes(interest)
      ? data.interests.filter(i => i !== interest)
      : [...data.interests, interest];
    updateData({ interests });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.display_name.trim().length > 0;
      case 2:
        return data.village && data.age_group;
      case 3:
        return data.faith_preference;
      case 4:
        return data.department_interests.length > 0;
      case 5:
        return true; // Optional step
      case 6:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-green-800">Welcome to Stoneclough!</h1>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-600 mt-2">Step {currentStep} of {totalSteps}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <User className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h2 className="text-xl font-semibold">Tell us about yourself</h2>
                <p className="text-gray-600">Let's start with the basics</p>
              </div>

              <div>
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  placeholder="How would you like to be known?"
                  value={data.display_name}
                  onChange={(e) => updateData({ display_name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us a bit about yourself..."
                  value={data.bio}
                  onChange={(e) => updateData({ bio: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Location & Demographics */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <MapPin className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h2 className="text-xl font-semibold">Where are you from?</h2>
                <p className="text-gray-600">Help us connect you with your neighbors</p>
              </div>

              <div>
                <Label htmlFor="village">Village *</Label>
                <Select value={data.village} onValueChange={(value) => updateData({ village: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your village" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stoneclough">Stoneclough</SelectItem>
                    <SelectItem value="Prestolee">Prestolee</SelectItem>
                    <SelectItem value="Ringley">Ringley</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="age_group">Age Group *</Label>
                <Select value={data.age_group} onValueChange={(value) => updateData({ age_group: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your age group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-18">Under 18</SelectItem>
                    <SelectItem value="18-30">18-30</SelectItem>
                    <SelectItem value="31-50">31-50</SelectItem>
                    <SelectItem value="51-70">51-70</SelectItem>
                    <SelectItem value="over-70">Over 70</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  This helps us show age-appropriate content and events
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Faith Preference */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Church className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h2 className="text-xl font-semibold">Faith & Spirituality</h2>
                <p className="text-gray-600">We welcome all backgrounds and beliefs</p>
              </div>

              <div>
                <Label>Faith Content Preference *</Label>
                <div className="grid grid-cols-1 gap-3 mt-3">
                  {[
                    { value: 'christian', label: 'Christian', desc: 'I\'d like to see Christian content and activities' },
                    { value: 'other-faith', label: 'Other Faith', desc: 'I follow another faith tradition' },
                    { value: 'no-preference', label: 'No Preference', desc: 'I\'m open to all spiritual content' },
                    { value: 'private', label: 'Prefer Not to Say', desc: 'I\'d rather keep this private' }
                  ].map((option) => (
                    <div
                      key={option.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        data.faith_preference === option.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => updateData({ faith_preference: option.value })}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          data.faith_preference === option.value
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`} />
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-gray-600">{option.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Department Interests */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Heart className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h2 className="text-xl font-semibold">What interests you?</h2>
                <p className="text-gray-600">Choose the areas you'd like to explore (select at least one)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {departments.map((dept) => {
                  const IconComponent = dept.icon;
                  const isSelected = data.department_interests.includes(dept.id);
                  
                  return (
                    <div
                      key={dept.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => toggleDepartmentInterest(dept.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: dept.color }}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{dept.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{dept.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Accessibility & Notifications */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h2 className="text-xl font-semibold">Accessibility & Notifications</h2>
                <p className="text-gray-600">Customize your experience</p>
              </div>

              {/* Accessibility Needs */}
              <div>
                <Label>Accessibility Needs (Optional)</Label>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {accessibilityOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={data.accessibility_needs.includes(option)}
                        onCheckedChange={() => toggleAccessibilityNeed(option)}
                      />
                      <Label htmlFor={option} className="text-sm">{option}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Preferences */}
              <div>
                <Label>Notification Preferences</Label>
                <div className="space-y-3 mt-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email"
                      checked={data.notification_preferences.email}
                      onCheckedChange={(checked) => 
                        updateData({ 
                          notification_preferences: { 
                            ...data.notification_preferences, 
                            email: checked as boolean 
                          } 
                        })
                      }
                    />
                    <Label htmlFor="email">Email notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="push"
                      checked={data.notification_preferences.push}
                      onCheckedChange={(checked) => 
                        updateData({ 
                          notification_preferences: { 
                            ...data.notification_preferences, 
                            push: checked as boolean 
                          } 
                        })
                      }
                    />
                    <Label htmlFor="push">Push notifications</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review & Complete */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h2 className="text-xl font-semibold">You're all set!</h2>
                <p className="text-gray-600">Review your information and join the community</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <strong>Name:</strong> {data.display_name}
                </div>
                <div>
                  <strong>Village:</strong> {data.village}
                </div>
                <div>
                  <strong>Interests:</strong> {data.department_interests.length} departments selected
                </div>
                <div>
                  <strong>Faith Preference:</strong> {
                    data.faith_preference === 'christian' ? 'Christian' :
                    data.faith_preference === 'other-faith' ? 'Other Faith' :
                    data.faith_preference === 'no-preference' ? 'No Preference' :
                    'Prefer Not to Say'
                  }
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Explore content from your selected departments</li>
                  <li>• Join community groups and events</li>
                  <li>• Connect with neighbors in your village</li>
                  <li>• Share your own posts and resources</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
