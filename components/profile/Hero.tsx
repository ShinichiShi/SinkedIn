import React from 'react'
import { Pencil, LogOut, MapPin, Calendar, Award, AlertTriangle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserData } from '@/types/index';
import Image from "next/image";

export interface HeroProps{
    handleOpenModal: ()=>void,
    handleLogout:()=>void,
    userData: UserData | null
}

const Hero: React.FC<HeroProps> = ({
    userData,
    handleOpenModal,
    handleLogout,
}) => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="relative w-full min-h-[300px] sm:h-80 overflow-hidden">
        {/* Background Image or Gradient */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
          style={{
            backgroundImage: userData?.backgroundImage 
              ? `url(${userData.backgroundImage})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        {/* Profile Content - Unified Layout */}
        <div className="absolute justify-end p-5 sm:top-30 left-0 right-0 bottom-0 flex flex-col">
          <div className="flex flex-col justify-center sm:flex-row items-center sm:items-end sm:justify-center gap-4 sm:gap-6">
            {/* Profile Picture */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gray-200">
                {userData?.profilepic ? (
                  <Image
                    src={userData.profilepic}
                    alt={userData.username || "Profile"}
                    fill
                    className="object-cover rounded-full"
                    sizes="(max-width: 640px) 96px, 128px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl sm:text-4xl font-bold text-gray-600 bg-gray-100 rounded-full">
                    {userData?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
                    <div className="flex-1 text-center sm:text-left sm:pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        {/* User Details */}
                        <div className="space-y-2 sm:space-y-3">
                          <h1 className="text-2xl sm:text-4xl font-bold text-white">
                            {userData?.username || 'Unknown User'}
                          </h1>
                          
                          {userData?.bio && (
                            <p className="text-gray-200 text-sm sm:text-lg px-2 sm:px-0 max-w-md sm:mx-0 mx-auto">
                              {userData.bio}
                            </p>
                          )}
                          
                          {/* Stats and Location */}
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-6">
                            {userData?.location && (
                              <div className="flex items-center gap-1 text-gray-300 text-sm sm:text-base">
                                <MapPin className="h-4 w-4" />
                                <span>{userData.location}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-300">
                              <span className="font-medium">
                                {userData?.followers?.length || 0} Followers
                              </span>
                              <span className="font-medium">
                                {userData?.following?.length || 0} Following
                              </span>
                            </div>
                          </div>
                  
                   {/* Profile Sections */}
                {/* <div>
                  
                    <div className="flex flex-col gap-1">

                      {userData?.failedExperience && userData.failedExperience.length > 0 && (
                        <div className="bg-gradient-to-br flex p-1 gap-1 from-red-50 to-red-100 rounded-xl border border-red-200">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <h3 className="font-semibold text-red-800 text-sm sm:text-base">Failed Experiences</h3>
                          </div>
                          <div className="space-y-2">
                            {userData.failedExperience.map((experience, index) => (
                              <div key={index} className="bg-white/70 rounded-lg gap-1 flex items-center text-xs sm:text-sm text-gray-700 border border-red-200/50">
                                <span className="font-medium text-red-700">#{index + 1}</span> 
                                <p className="mt-1">{experience}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {userData?.misEducation && userData.misEducation.length > 0 && (
                        <div className="bg-gradient-to-br p-1 from-orange-50 gap-1 to-orange-100 rounded-xl flex border border-orange-200">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-orange-600" />
                            <h3 className="font-semibold text-orange-800 text-sm sm:text-base">Mis-Education</h3>
                          </div>
                          <div className="space-y-2">
                            {userData.misEducation.map((education, index) => (
                              <div key={index} className="bg-white/70 rounded-lg flex items-center gap-1 text-xs sm:text-sm text-gray-700 border border-orange-200/50">
                                <span className="font-medium text-orange-700">#{index + 1}</span>
                                <p className="mt-1">{education}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {userData?.failureHighlights && userData.failureHighlights.length > 0 && (
                        <div className="bg-gradient-to-br p-1 from-purple-50 flex gap-1 to-purple-100 rounded-xl border border-purple-200">
                          <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-purple-600" />
                            <h3 className="font-semibold text-purple-800 text-sm sm:text-base">Failure Highlights </h3>
                          </div>
                          <div className="space-y-2">
                            {userData.failureHighlights.map((highlight, index) => (
                              <div key={index} className="bg-white/70 rounded-lg flex items-center gap-1 text-xs sm:text-sm text-gray-700 border border-purple-200/50">
                                <span className="font-medium text-purple-700">#{index + 1}</span>
                                <p className="">{highlight}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                    
                    {(!userData?.failedExperience?.length && !userData?.misEducation?.length && !userData?.failureHighlights?.length) && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">N/A</h3>
                      </div>
                    )}
                </div> */}
                </div>
                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3 shrink-0">
                  <Button
                    onClick={handleOpenModal}
                    variant="outline"
                    size={typeof window !== 'undefined' && window.innerWidth < 640 ? "sm" : "default"}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm text-xs sm:text-sm"
                  >
                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    size={typeof window !== 'undefined' && window.innerWidth < 640 ? "sm" : "default"}
                    className="bg-red-500/80 hover:bg-red-600 border-none text-xs sm:text-sm text-white"
                  >
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

     
    </div>
  )
}

export default Hero;