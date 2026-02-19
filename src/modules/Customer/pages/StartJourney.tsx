// pages/StartJourney.tsx
import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Info,
  ArrowLeft,
  Plane,
} from 'lucide-react';

interface StartJourneyProps {
  tripTitle: string;
  plannedStartDate: string; // ISO format date
  totalMembers: number;
  onSubmit: (journeyData: JourneyData) => void;
  onBack: () => void;
}

interface JourneyData {
  departureLocation: string;
  departureCity: string;
  departureDate: string;
  departureTime: string;
  joinedMembersCount: number;
}

export const StartJourney: React.FC<StartJourneyProps> = ({
  tripTitle,
  plannedStartDate,
  totalMembers,
  onSubmit,
  onBack,
}) => {
  const [formData, setFormData] = useState<JourneyData>({
    departureLocation: '',
    departureCity: '',
    departureDate: '',
    departureTime: '',
    joinedMembersCount: totalMembers,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof JourneyData, string>>>({});
  const [isOverdue, setIsOverdue] = useState(false);
  const [daysDifference, setDaysDifference] = useState(0);

  // Check if selected date is overdue
  useEffect(() => {
    if (formData.departureDate && plannedStartDate) {
      const parseLocalDate = (s: string) => {
        if (!s) return new Date();

        // Handle YYYY-MM-DD
        const parts = s.split('-');
        if (parts.length === 3) {
          return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }

        // Handle "Feb 10" or "Feb 10 - Feb 15" (take first part)
        // If year is missing, Date.parse might default to 2001 in some environments
        const date = new Date(s);
        if (date.getFullYear() === 2001) {
          const now = new Date();
          date.setFullYear(now.getFullYear());
          // If the date is in the past (e.g. user is planning for next year but only put Month Day), add 1 year
          // But strict "2001" check implies it was just missing year.
          // Let's just set it to current year for now.
        }
        return date;
      };

      const planned = parseLocalDate(plannedStartDate);
      const selected = parseLocalDate(formData.departureDate);

      // Reset time to compare only dates
      planned.setHours(0, 0, 0, 0);
      selected.setHours(0, 0, 0, 0);

      const diffTime = selected.getTime() - planned.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // Use round for safer day diff

      setDaysDifference(diffDays);
      setIsOverdue(diffDays > 0);
    }
  }, [formData.departureDate, plannedStartDate]);

  const handleInputChange = (field: keyof JourneyData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof JourneyData, string>> = {};

    if (!formData.departureLocation.trim()) {
      newErrors.departureLocation = 'Departure location is required';
    }

    if (!formData.departureCity.trim()) {
      newErrors.departureCity = 'City is required';
    }

    if (!formData.departureDate) {
      newErrors.departureDate = 'Departure date is required';
    }

    if (!formData.departureTime) {
      newErrors.departureTime = 'Departure time is required';
    }

    if (formData.joinedMembersCount < 1) {
      newErrors.joinedMembersCount = 'At least 1 member must join';
    }

    if (formData.joinedMembersCount > totalMembers) {
      newErrors.joinedMembersCount = `Cannot exceed ${totalMembers} members`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const formatPlannedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    let date: Date;

    if (parts.length === 3) {
      // Local time parsing for YYYY-MM-DD
      date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      date = new Date(dateStr);
      // Fix for missing year defaulting to 2001
      if (date.getFullYear() === 2001) {
        date.setFullYear(new Date().getFullYear());
      }
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
      <main className="flex-1 overflow-y-auto w-full pb-24">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Centered Editorial Title with Back Button */}
          <div className="max-w-7xl mx-auto mb-10 md:mb-16">
            <div className="flex flex-col md:flex-row md:items-center justify-center gap-6 relative">
              <button
                onClick={onBack}
                className="md:absolute left-0 p-3 bg-white text-gray-400 hover:text-teal-600 rounded-full border border-gray-100 transition-all active:scale-95 shadow-sm group flex items-center gap-2 px-4 md:px-3 mb-4 md:mb-0 w-fit self-start md:self-auto"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest md:hidden">Back</span>
              </button>

              <div className="text-center w-full px-2">
                <h1 className="text-2xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight leading-tight">
                  Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">Journey</span>
                </h1>
                <p className="text-xs md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                  {tripTitle} • Admin Setup
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column - Trip Information */}
              <div className="lg:col-span-5 space-y-8">
                {/* Trip Info Card */}
                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="bg-gradient-to-r from-teal-50/50 to-blue-50/50 px-8 py-6 border-b border-gray-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 text-gray-900">
                          <Plane className="w-5 h-5 md:w-6 md:h-6 text-teal-600" />
                          Trip <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Information</span>
                        </h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Journey Overview</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-teal-50/50 to-cyan-50/50 border border-teal-100/50">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                        <Plane className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Trip Name</p>
                        <p className="text-base font-black text-gray-900 mt-1">{tripTitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-transparent hover:border-teal-100 transition-all">
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Planned Start</p>
                        <p className="text-sm font-black text-gray-900 mt-1">{formatPlannedDate(plannedStartDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-transparent hover:border-teal-100 transition-all">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Members</p>
                        <p className="text-sm font-black text-gray-900 mt-1">{totalMembers} Travelers</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Status Alert */}
                {formData.departureDate && (
                  <div
                    className={`rounded-[1.5rem] border p-6 flex items-start gap-4 animate-in slide-in-from-left-4 duration-500 ${isOverdue
                      ? 'bg-red-50/50 border-red-200/50'
                      : daysDifference === 0
                        ? 'bg-green-50/50 border-green-200/50'
                        : 'bg-blue-50/50 border-blue-200/50'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOverdue ? 'bg-red-100' : daysDifference === 0 ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                      {isOverdue ? (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      {isOverdue ? (
                        <>
                          <p className="text-sm font-black uppercase tracking-widest leading-none mb-1 text-red-900">Departure Delayed</p>
                          <p className="text-xs font-medium text-red-700/80">
                            Selected date is {Math.abs(daysDifference)} day{Math.abs(daysDifference) !== 1 ? 's' : ''} after the planned start date.
                          </p>
                        </>
                      ) : daysDifference === 0 ? (
                        <>
                          <p className="text-sm font-black uppercase tracking-widest leading-none mb-1 text-green-900">On Schedule</p>
                          <p className="text-xs font-medium text-green-700/80">
                            Departure date matches the planned start date.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-black uppercase tracking-widest leading-none mb-1 text-blue-900">Early Departure</p>
                          <p className="text-xs font-medium text-blue-700/80">
                            Selected date is {Math.abs(daysDifference)} day{Math.abs(daysDifference) !== 1 ? 's' : ''} before the planned start date.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50/50 border border-blue-200/50 rounded-[1.5rem] p-6 flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest leading-none mb-1 text-blue-900">Admin Information</p>
                    <p className="text-xs font-medium text-blue-700/80">
                      Once you submit, all members will be notified about the journey start details.
                      Make sure all information is correct before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Departure Form */}
              <div className="lg:col-span-7">
                <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md sticky top-8">
                  <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 px-8 py-6 border-b border-gray-50/50">
                    <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 text-gray-900">
                      <MapPin className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                      Departure <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Details</span>
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Fill in the journey information</p>
                  </div>

                  <div className="p-8 space-y-6">
                    {/* Departure Location */}
                    <div>
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                        <MapPin className="w-4 h-4 text-teal-500" />
                        Departure Location
                      </label>
                      <input
                        type="text"
                        value={formData.departureLocation}
                        onChange={(e) => handleInputChange('departureLocation', e.target.value)}
                        placeholder="e.g., John F. Kennedy International Airport"
                        className={`w-full px-6 py-4 rounded-2xl border ${errors.departureLocation
                          ? 'border-red-300 bg-red-50/50'
                          : 'border-gray-200 bg-gray-50/50'
                          } text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium`}
                      />
                      {errors.departureLocation && (
                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {errors.departureLocation}
                        </p>
                      )}
                    </div>

                    {/* Departure City */}
                    <div>
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                        <MapPin className="w-4 h-4 text-teal-500" />
                        Departure City
                      </label>
                      <input
                        type="text"
                        value={formData.departureCity}
                        onChange={(e) => handleInputChange('departureCity', e.target.value)}
                        placeholder="e.g., New York, USA"
                        className={`w-full px-6 py-4 rounded-2xl border ${errors.departureCity
                          ? 'border-red-300 bg-red-50/50'
                          : 'border-gray-200 bg-gray-50/50'
                          } text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium`}
                      />
                      {errors.departureCity && (
                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {errors.departureCity}
                        </p>
                      )}
                    </div>

                    {/* Date and Time Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Departure Date */}
                      <div>
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          Departure Date
                        </label>
                        <input
                          type="date"
                          value={formData.departureDate}
                          onChange={(e) => handleInputChange('departureDate', e.target.value)}
                          className={`w-full px-6 py-4 rounded-2xl border ${errors.departureDate || (isOverdue && formData.departureDate)
                            ? 'border-red-300 bg-red-50/50'
                            : 'border-gray-200 bg-gray-50/50'
                            } text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium`}
                        />
                        {errors.departureDate && (
                          <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {errors.departureDate}
                          </p>
                        )}
                      </div>

                      {/* Departure Time */}
                      <div>
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                          <Clock className="w-4 h-4 text-purple-500" />
                          Departure Time
                        </label>
                        <input
                          type="time"
                          value={formData.departureTime}
                          onChange={(e) => handleInputChange('departureTime', e.target.value)}
                          className={`w-full px-6 py-4 rounded-2xl border ${errors.departureTime
                            ? 'border-red-300 bg-red-50/50'
                            : 'border-gray-200 bg-gray-50/50'
                            } text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium`}
                        />
                        {errors.departureTime && (
                          <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {errors.departureTime}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Joined Members Count */}
                    <div>
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                        <Users className="w-4 h-4 text-blue-500" />
                        Number of Members Joining
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max={totalMembers}
                          value={formData.joinedMembersCount}
                          onChange={(e) => handleInputChange('joinedMembersCount', parseInt(e.target.value) || 0)}
                          className={`w-full px-6 py-4 rounded-2xl border ${errors.joinedMembersCount
                            ? 'border-red-300 bg-red-50/50'
                            : 'border-gray-200 bg-gray-50/50'
                            } text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium`}
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">
                          / {totalMembers}
                        </div>
                      </div>
                      {errors.joinedMembersCount && (
                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {errors.joinedMembersCount}
                        </p>
                      )}
                      <p className="text-[10px] font-medium text-gray-500 mt-2 uppercase tracking-wider">
                        Total members confirmed: {totalMembers}
                      </p>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="bg-gray-50/50 px-8 py-6 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={onBack}
                      className="px-6 py-3 text-gray-600 hover:text-gray-900 font-bold transition-colors text-sm uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-lg shadow-teal-600/10 active:scale-95 text-sm uppercase tracking-wider"
                    >
                      Start Journey
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StartJourney;