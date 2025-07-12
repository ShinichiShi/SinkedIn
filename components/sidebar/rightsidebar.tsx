import React from 'react';
import { BookOpen, Briefcase, Building, Users, Heart, Activity, Gamepad2 } from 'lucide-react';

const FAILURE_CATEGORIES = [
  { 
    id: 'academic', 
    title: 'Academic', 
    description: 'Exams, thesis',
    icon: BookOpen,
    color: 'text-blue-600'
  },
  { 
    id: 'jobhunt', 
    title: 'Job Hunt', 
    description: 'Interviews, apps',
    icon: Briefcase,
    color: 'text-green-600'
  },
  { 
    id: 'workplace', 
    title: 'Workplace', 
    description: 'Office, promotions',
    icon: Building,
    color: 'text-purple-600'
  },
  { 
    id: 'startup', 
    title: 'Startup', 
    description: 'Launches, investors',
    icon: Users,
    color: 'text-orange-600'
  },
  { 
    id: 'personal', 
    title: 'Personal', 
    description: 'Relations, family',
    icon: Heart,
    color: 'text-red-600'
  },
  { 
    id: 'health', 
    title: 'Health', 
    description: 'Mental, fitness',
    icon: Activity,
    color: 'text-pink-600'
  },
  { 
    id: 'hobby', 
    title: 'Creative', 
    description: 'Art, sports',
    icon: Gamepad2,
    color: 'text-indigo-600'
  }
];

export function RightSidebar() {
  return (
    <div className="hidden md:block fixed top-16 right-0 h-[calc(100vh-4rem)] w-full md:w-[18%] lg:w-[16%] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-3">
      <div className="h-full flex flex-col">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">Categories</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Find your tribe
          </p>
        </div>

        <div className="flex-1 space-y-2">
          {FAILURE_CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            return (
              <a 
                href={`/category/${category.id}`} 
                key={category.id} 
                className="flex items-center space-x-2 p-2 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <IconComponent className={`w-4 h-4 ${category.color} flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {category.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {category.description}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}