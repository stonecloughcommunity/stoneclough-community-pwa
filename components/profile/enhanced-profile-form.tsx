'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Heart, 
  Users, 
  Shield,
  Bell,
  Eye,
  EyeOff,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { EnhancedProfile } from '@/lib/types/departments';

const profileSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  village: z.enum(['Stoneclough', 'Prestolee', 'Ringley']).optional(),
  age_group: z.enum(['under-18', '18-30', '31-50', '51-70', 'over-70']).optional(),
  faith_preference: z.enum(['christian', 'other-faith', 'no-preference', 'private']).optional(),
  department_interests: z.array(z.string()),
  accessibility_needs: z.array(z.string()),
  senior_mode_enabled: z.boolean(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  availability: z.string().optional(),
  notification_preferences: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
  privacy_settings: z.object({
    profile_visible: z.boolean(),
    contact_visible: z.boolean(),
  }),
  emergency_contact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  }).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EnhancedProfileFormProps {
  profile?: Partial<EnhancedProfile>;
  onSave: (data: ProfileFormData) => Promise<void>;
}

const departments = [
  { id: '1', name: 'Faith & Culture', slug: 'faith-culture' },
  { id: '2', name: 'Community & Wellbeing', slug: 'community-wellbeing' },
  { id: '3', name: 'Economy & Enterprise', slug: 'economy-enterprise' },
  { id: '4', name: 'Land, Food & Sustainability', slug: 'land-food-sustainability' },
  { id: '5', name: 'Technology & Platform', slug: 'technology-platform' },
  { id: '6', name: 'Governance & Growth', slug: 'governance-growth' },
];

const accessibilityOptions = [
  'Large text/fonts',
  'High contrast display',
  'Screen reader compatible',
  'Keyboard navigation',
  'Audio descriptions',
  'Simplified interface',
  'Voice commands',
  'Motor accessibility',
];

const commonSkills = [
  'Teaching', 'Cooking', 'Gardening', 'Technology', 'Carpentry', 'Plumbing',
  'Electrical work', 'Childcare', 'Elder care', 'First aid', 'Driving',
  'Languages', 'Music', 'Art', 'Writing', 'Photography', 'Event planning',
  'Administration', 'Accounting', 'Legal advice', 'Healthcare', 'Counseling'
];

const commonInterests = [
  'Reading', 'Music', 'Sports', 'Cooking', 'Gardening', 'Travel',
  'Photography', 'Art', 'History', 'Nature', 'Technology', 'Volunteering',
  'Community events', 'Faith activities', 'Environmental issues', 'Politics',
  'Health & fitness', 'Education', 'Local business', 'Social justice'
];

export function EnhancedProfileForm({ profile, onSave }: EnhancedProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      village: profile?.village,
      age_group: profile?.age_group,
      faith_preference: profile?.faith_preference,
      department_interests: profile?.department_interests || [],
      accessibility_needs: profile?.accessibility_needs || [],
      senior_mode_enabled: profile?.senior_mode_enabled || false,
      skills: profile?.skills || [],
      interests: profile?.interests || [],
      availability: profile?.availability || '',
      notification_preferences: {
        email: profile?.notification_preferences?.email ?? true,
        push: profile?.notification_preferences?.push ?? true,
        sms: profile?.notification_preferences?.sms ?? false,
      },
      privacy_settings: {
        profile_visible: profile?.privacy_settings?.profile_visible ?? true,
        contact_visible: profile?.privacy_settings?.contact_visible ?? false,
      },
      emergency_contact: profile?.emergency_contact || {
        name: '',
        phone: '',
        relationship: '',
      },
    },
  });

  const handleSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      await onSave(data);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = (skill: string) => {
    const currentSkills = form.getValues('skills');
    if (skill && !currentSkills.includes(skill)) {
      form.setValue('skills', [...currentSkills, skill]);
    }
    setSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues('skills');
    form.setValue('skills', currentSkills.filter(skill => skill !== skillToRemove));
  };

  const addInterest = (interest: string) => {
    const currentInterests = form.getValues('interests');
    if (interest && !currentInterests.includes(interest)) {
      form.setValue('interests', [...currentInterests, interest]);
    }
    setInterestInput('');
  };

  const removeInterest = (interestToRemove: string) => {
    const currentInterests = form.getValues('interests');
    form.setValue('interests', currentInterests.filter(interest => interest !== interestToRemove));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="How you'd like to be known in the community" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us a bit about yourself..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Share what makes you unique and what you're passionate about (max 500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="village"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Village</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your village" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Stoneclough">Stoneclough</SelectItem>
                        <SelectItem value="Prestolee">Prestolee</SelectItem>
                        <SelectItem value="Ringley">Ringley</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age Group</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="under-18">Under 18</SelectItem>
                        <SelectItem value="18-30">18-30</SelectItem>
                        <SelectItem value="31-50">31-50</SelectItem>
                        <SelectItem value="51-70">51-70</SelectItem>
                        <SelectItem value="over-70">Over 70</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This helps us show age-appropriate content and events
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Your phone number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional - only visible to other members if you enable contact visibility
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Your address (optional)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional - helps with local event recommendations
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Department Interests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Department Interests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="department_interests"
              render={() => (
                <FormItem>
                  <FormLabel>Which departments interest you?</FormLabel>
                  <FormDescription>
                    Select the areas you'd like to see content from and participate in
                  </FormDescription>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {departments.map((department) => (
                      <FormField
                        key={department.id}
                        control={form.control}
                        name="department_interests"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={department.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(department.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, department.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== department.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {department.name}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Faith Preference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Faith Preference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="faith_preference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faith Content Preference</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your preference" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="christian">Christian</SelectItem>
                      <SelectItem value="other-faith">Other Faith</SelectItem>
                      <SelectItem value="no-preference">No Preference</SelectItem>
                      <SelectItem value="private">Prefer Not to Say</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This helps us show relevant faith-based content while respecting your preferences
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="min-w-[120px]">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
