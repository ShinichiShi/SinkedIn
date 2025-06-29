import React, { useState } from 'react'
import Image from 'next/image'
import { UserData } from '@/types/index';

export interface EditModalProps {
  handleCloseModal: () => void;
  edit: UserData;
  isUploading: boolean;
  uploadToCloudinary: (file: File) => Promise<string>;
  handleEditChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleArrayFieldChange: (field: keyof UserData, values: string[]) => void;
  handleSave: () => void;
}

const Editmodal: React.FC<EditModalProps> = ({
  handleCloseModal,
  edit,
  isUploading,
  uploadToCloudinary,
  handleEditChange,
  handleArrayFieldChange,
  handleSave,
}) => {
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [newFailedExperience, setNewFailedExperience] = useState('');
  const [newMisEducation, setNewMisEducation] = useState('');
  const [newFailureHighlight, setNewFailureHighlight] = useState('');

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProfile(true);
    try {
      const url = await uploadToCloudinary(file);
      const syntheticEvent = {
        target: { id: 'profilepic', value: url }
      } as React.ChangeEvent<HTMLInputElement>;
      handleEditChange(syntheticEvent);
    } catch (error) {
      console.error("Error uploading profile image:", error);
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBackground(true);
    try {
      const url = await uploadToCloudinary(file);
      const syntheticEvent = {
        target: { id: 'backgroundImage', value: url }
      } as React.ChangeEvent<HTMLInputElement>;
      handleEditChange(syntheticEvent);
    } catch (error) {
      console.error("Error uploading background image:", error);
    } finally {
      setUploadingBackground(false);
    }
  };

  const addArrayItem = (field: 'failedExperience' | 'misEducation' | 'failureHighlights', value: string) => {
    if (value.trim()) {
      const currentValues = edit[field] || [];
      handleArrayFieldChange(field, [...currentValues, value.trim()]);
      
      // Clear the input
      if (field === 'failedExperience') setNewFailedExperience('');
      if (field === 'misEducation') setNewMisEducation('');
      if (field === 'failureHighlights') setNewFailureHighlight('');
    }
  };

  const removeArrayItem = (field: 'failedExperience' | 'misEducation' | 'failureHighlights', index: number) => {
    const currentValues = edit[field] || [];
    const newValues = currentValues.filter((_, i) => i !== index);
    handleArrayFieldChange(field, newValues);
  };

  const renderArrayField = (
    field: 'failedExperience' | 'misEducation' | 'failureHighlights',
    label: string,
    placeholder: string,
    newValue: string,
    setNewValue: (value: string) => void
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="space-y-2">
        {(edit[field] || []).map((item, index) => (
          <div key={index} className="flex items-center gap-2 bg-slate-700 p-2 rounded-md">
            <span className="flex-1 text-white text-sm">{item}</span>
            <button
              type="button"
              onClick={() => removeArrayItem(field, index)}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addArrayItem(field, newValue);
              }
            }}
          />
          <button
            type="button"
            onClick={() => addArrayItem(field, newValue)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">Edit Profile</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Background Image */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Background Image</label>
                {edit.backgroundImage && (
                  <div className="relative h-24 sm:h-32 w-full rounded-lg border-2 border-dashed border-slate-600 overflow-hidden mb-2">
                    <Image
                      src={edit.backgroundImage}
                      alt="Background"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 32rem"
                      priority
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageUpload}
                    className="hidden"
                    id="background-upload"
                    disabled={uploadingBackground}
                  />
                  <label
                    htmlFor="background-upload"
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md cursor-pointer transition-colors text-sm disabled:opacity-50"
                  >
                    {uploadingBackground ? 'Uploading...' : 'Choose Background'}
                  </label>
                  {uploadingBackground && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                </div>
              </div>

              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Profile Picture</label>
                {edit.profilepic && (
                  <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full border-2 border-dashed border-slate-600 overflow-hidden mx-auto mb-2">
                    <Image
                      src={edit.profilepic}
                      alt="Profile"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 32rem"
                      priority
                    />
                  </div>
                )}
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    className="hidden"
                    id="profile-upload"
                    disabled={uploadingProfile}
                  />
                  <label
                    htmlFor="profile-upload"
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md cursor-pointer transition-colors text-sm"
                  >
                    {uploadingProfile ? 'Uploading...' : 'Choose Profile Picture'}
                  </label>
                  {uploadingProfile && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                  <input
                    type="text"
                    id="username"
                    value={edit.username}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={edit.email}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  id="location"
                  value={edit.location || ''}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="Where are you located?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                <textarea
                  id="bio"
                  value={edit.bio || ''}
                  onChange={handleEditChange}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="Write a short bio..."
                />
              </div>

              {/* Array Fields
              {renderArrayField(
                'failedExperience',
                'Failed Experiences',
                'Add a failed experience...',
                newFailedExperience,
                setNewFailedExperience
              )}

              {renderArrayField(
                'misEducation',
                'Mis-Education',
                'Add a mis-education experience...',
                newMisEducation,
                setNewMisEducation
              )}

              {renderArrayField(
                'failureHighlights',
                'Failure Highlights',
                'Add a failure highlight...',
                newFailureHighlight,
                setNewFailureHighlight
              )} */}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6 sm:mt-8">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-slate-600 text-gray-300 hover:bg-slate-700 transition-all order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUploading || uploadingProfile || uploadingBackground}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                >
                  {(isUploading || uploadingProfile || uploadingBackground) ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Editmodal;