  "use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  isSameDay,
  isBefore,
  startOfToday,
} from "date-fns";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// Loading Spinner Component
const LoadingSpinner = () => {
  return (
    <div className="w-16 h-16 inline-block overflow-hidden bg-transparent">
      <div className="w-full h-full relative transform scale-100 origin-[0_0]">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute left-[30px] top-[16px] w-[3px] h-[8px] rounded-[2px] bg-[#898f63] origin-[2px_20px]"
            style={{
              transform: `rotate(${i * 30}deg)`,
              animation: `spinner-fade 1s linear infinite`,
              animationDelay: `${-0.0833 * (12 - i)}s`
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes spinner-fade {
          0% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>
    </div>
  );
};

export default function CreateSchedulePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const [selectedDays, setSelectedDays] = useState([]);
  const [slotDuration, setSlotDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState({
    hours: "1",
    minutes: "0",
  });
  const [timeRanges, setTimeRanges] = useState([
    {
      start: "09:00",
      end: "12:00",
    },
  ]);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [hasExistingSchedule, setHasExistingSchedule] = useState(false);
  const [existingSchedules, setExistingSchedules] = useState({});

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/cleaning/schedule?month=${month}`);
        if (!response.ok) throw new Error("Failed to fetch buildings");
        const data = await response.json();
        setBuildings(data.buildings || []);

        // Create a map of building IDs to their schedules
        const scheduleMap = {};
        (data.schedules || []).forEach(schedule => {
          scheduleMap[schedule.buildingId] = schedule;
        });
        setExistingSchedules(scheduleMap);
      } catch (error) {
        console.error("Error fetching buildings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuildings();
  }, [month]);

  useEffect(() => {
    setHasExistingSchedule(!!selectedBuilding && !!existingSchedules[selectedBuilding]);
  }, [selectedBuilding, existingSchedules]);

  const handleAddTimeRange = () => {
    setTimeRanges([...timeRanges, { start: "13:00", end: "17:00" }]);
  };

  const handleRemoveTimeRange = (index) => {
    setTimeRanges(timeRanges.filter((_, i) => i !== index));
  };

  const handleTimeRangeChange = (index, field, value) => {
    const newTimeRanges = [...timeRanges];
    newTimeRanges[index] = {
      ...newTimeRanges[index],
      [field]: value,
    };
    setTimeRanges(newTimeRanges);
  };

  // Calculate preview slots for all time ranges
  const getPreviewSlots = () => {
    // Return empty array if slot duration is 0 or invalid
    if (!slotDuration || slotDuration <= 0) {
      return [];
    }

    const allSlots = [];

    timeRanges.forEach((range) => {
      const [startHour, startMinute] = range.start.split(":").map(Number);
      const [endHour, endMinute] = range.end.split(":").map(Number);

      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      for (let time = startTime; time < endTime; time += slotDuration) {
        const hour = Math.floor(time / 60);
        const minute = time % 60;
        allSlots.push(
          `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`
        );
      }
    });

    return allSlots;
  };

  // Get all days in the selected month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth),
  });

  const handleDayToggle = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      if (!selectedBuilding) {
        setSnackbar({
          open: true,
          message: 'Please select a building',
          severity: 'error'
        });
        return;
      }

      if (existingSchedules[selectedBuilding]) {
        setSnackbar({
          open: true,
          message: 'A schedule already exists for this building in the selected month',
          severity: 'error'
        });
        return;
      }

      setIsSubmitting(true);

      // Get all dates in the selected month
      const [year, monthStr] = month.split("-");
      const startDate = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthStr), 0);

      const dayMapping = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      // Get all dates that match the selected days, filtering out past dates
      const dates = [];
      const currentDate = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time part for proper comparison

      while (currentDate <= endDate) {
        const dayName = Object.keys(dayMapping).find(
          (key) => dayMapping[key] === currentDate.getDay()
        );

        if (selectedDays.includes(dayName) && currentDate >= today) {
          dates.push(currentDate.getDate().toString());
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (dates.length === 0) {
        setSnackbar({
          open: true,
          message: 'No valid future dates selected for this month',
          severity: 'error'
        });
        setIsSubmitting(false);
        return;
      }

      console.log("Calculated dates for selected days:", {
        selectedDays,
        dates,
      });

      const scheduleData = {
        month,
        selectedDays: dates,
        slotDuration,
        timeRanges,
        buildingId: selectedBuilding,
      };

      console.log("About to send this data:", scheduleData);

      const response = await fetch("/api/cleaning/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Server response:", data);
        throw new Error(data.error || "Failed to create schedule");
      }

      setSnackbar({
        open: true,
        message: 'Schedule created successfully!',
        severity: 'success'
      });
      
      // Navigate back to cleaning page after successful creation
      router.push('/cleaning');
    } catch (error) {
      console.error("Error creating schedule:", error);
      setSnackbar({
        open: true,
        message: `Failed to create schedule: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get preview days for the selected month
  const getPreviewDays = () => {
    const days = eachDayOfInterval({
      start: startOfMonth(selectedMonth),
      end: endOfMonth(selectedMonth),
    });

    // For current month, filter out past days
    if (isSameDay(startOfMonth(selectedMonth), startOfMonth(new Date()))) {
      return days.filter(
        (date) =>
          selectedDays.includes(format(date, "EEEE")) &&
          !isBefore(date, startOfToday())
      );
    }

    return days.filter((date) => selectedDays.includes(format(date, "EEEE")));
  };

  // Update slotDuration when customDuration changes
  const handleDurationChange = (field, value) => {
    // Allow any input including empty string
    const newValue = value;
    
    setCustomDuration(prev => ({
      ...prev,
      [field]: newValue
    }));

    // For calculations, treat empty or invalid as 0
    const hours = parseInt(field === "hours" ? newValue : customDuration.hours) || 0;
    const minutes = parseInt(field === "minutes" ? newValue : customDuration.minutes) || 0;
    
    // Ensure non-negative values
    const validHours = Math.max(0, hours);
    const validMinutes = Math.max(0, minutes);
    
    setSlotDuration(validHours * 60 + validMinutes);
  };

  const handleMonthChange = (direction) => {
    setSelectedMonth((prev) => {
      const newMonth = addMonths(prev, direction);
      // Don't allow selecting months before current month
      const currentMonth = startOfMonth(new Date());
      if (isBefore(newMonth, currentMonth)) {
        return prev;
      }
      // Update the month state with the new month's format
      setMonth(format(newMonth, "yyyy-MM"));
      return newMonth;
    });
  };

  // Check if previous month button should be disabled
  const isPrevMonthDisabled = isBefore(
    addMonths(selectedMonth, -1),
    startOfMonth(new Date())
  );

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#EBECE1]">
        <LoadingSpinner  />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {hasExistingSchedule && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  A schedule already exists for this building in {format(selectedMonth, 'MMMM yyyy')}. Creating a new schedule will not be possible.
                </p>
              </div>
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold mb-6">Create Cleaning Schedule</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Building
          </label>
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#898F63] focus:border-[#898F63] sm:text-sm rounded-md"
          >
            <option value="">Select a building</option>
            {buildings.map((building) => (
              <option
                key={building._id}
                value={building._id}
                disabled={!!existingSchedules[building._id]}
              >
                {building.name} {existingSchedules[building._id] ? '(Schedule exists)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Month Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Month
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleMonthChange(-1)}
              disabled={isPrevMonthDisabled}
              className={`px-3 py-2 border rounded ${
                isPrevMonthDisabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              ←
            </button>
            <div className="px-4 py-2 border rounded bg-white">
              {format(selectedMonth, "MMMM yyyy")}
            </div>
            <button
              onClick={() => handleMonthChange(1)}
              className="px-3 py-2 border rounded hover:bg-gray-100"
            >
              →
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            For current month, only future dates will be included
          </p>
        </div>

        {/* Day Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Days
          </label>
          <div className="grid grid-cols-7 gap-2">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <button
                key={day}
                onClick={() => handleDayToggle(day)}
                className={`p-2 rounded ${
                  selectedDays.includes(day)
                    ? "bg-[#898f63] text-white"
                    : "bg-white border hover:bg-gray-50"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Slot Duration */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slot Duration
          </label>
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Hours
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  max="23"
                  value={customDuration.hours}
                  onChange={(e) => handleDurationChange("hours", e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Minutes
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  max="59"
                  value={customDuration.minutes}
                  onChange={(e) => handleDurationChange("minutes", e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total: {slotDuration} minutes
            </div>
          </div>
          {slotDuration === 0 && (
            <p className="mt-2 text-sm text-red-500">
              Duration must be greater than 0 minutes
            </p>
          )}
        </div>

        {/* Time Ranges */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Ranges
          </label>
          <div className="space-y-4">
            {timeRanges.map((range, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm"
              >
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={range.start}
                      onChange={(e) =>
                        handleTimeRangeChange(index, "start", e.target.value)
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={range.end}
                      onChange={(e) =>
                        handleTimeRangeChange(index, "end", e.target.value)
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
                {timeRanges.length > 1 && (
                  <button
                    onClick={() => handleRemoveTimeRange(index)}
                    className="text-red-500 hover:text-red-700 bg-transparent"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleAddTimeRange}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 bg-transparent"
            >
              + Add Time Range
            </button>
          </div>
        </div>

        {/* Schedule Preview */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Schedule Preview</h2>
          {selectedDays.length > 0 ? (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="mb-4">
                <h3 className="font-medium text-gray-700">
                  Selected Days in {format(selectedMonth, "MMMM yyyy")}:
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {getPreviewDays().map((date) => (
                    <div
                      key={date.toString()}
                      className="bg-[#898f63] text-white px-3 py-1 rounded-full text-sm"
                    >
                      {format(date, "EEE, MMM d")}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Time Slots:</h3>
                {slotDuration > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {getPreviewSlots().map((slot, index) => (
                      <div
                        key={`${slot}-${index}`}
                        className="bg-gray-100 text-gray-800 px-3 py-2 rounded text-sm text-center"
                      >
                        {slot}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500 text-sm">Please set a valid duration greater than 0 minutes</p>
                )}
              </div>

              <div className="mt-4 bg-[#898f63]/10 p-4 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-2">Summary:</h3>
                <ul className="text-sm text-{yellow-800} space-y-1">
                  <li>
                    • {getPreviewDays().length} cleaning days in{" "}
                    {format(selectedMonth, "MMMM")}
                  </li>
                  <li>• {getPreviewSlots().length} time slots per day</li>
                  <li>
                    • {customDuration.hours} hours {customDuration.minutes}{" "}
                    minutes per slot
                  </li>
                  <li>• Time ranges:</li>
                  {timeRanges.map((range, index) => (
                    <li key={index} className="ml-4">
                      ◦ {range.start} - {range.end}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-100 rounded-lg">
              <p className="text-gray-500">
                Select days to see the schedule preview
              </p>
            </div>
          )}
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreateSchedule}
          disabled={
            selectedDays.length === 0 ||
            slotDuration === 0 ||
            isBefore(selectedMonth, startOfMonth(new Date())) ||
            isSubmitting ||
            hasExistingSchedule
          }
          className={`w-full mt-6 py-2 rounded flex items-center justify-center ${
            selectedDays.length === 0 ||
            slotDuration === 0 ||
            isBefore(selectedMonth, startOfMonth(new Date())) ||
            isSubmitting ||
            hasExistingSchedule
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-[#898F63] hover:bg-[#707454]"
          } text-white`}
        >
          {isSubmitting ? (
            <LoadingSpinner  />
          ) : (
            "Create Schedule"
          )}
        </button>
      </div>
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
