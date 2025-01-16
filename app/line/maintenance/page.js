"use client"
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function MaintenanceServicePage() {
  const [buildingNo, setBuildingNo] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [details, setDetails] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [isServiceConfirmed, setIsServiceConfirmed] = useState(false);

  const availableTimes = ['7:30 AM', '8:30 AM', '10:00 AM', '11:30 AM', '3:00 PM'];

  const datePickerCustomStyles = `
    .react-datepicker {
      font-size: 16px;
    }
    .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
      width: 2.9rem;
      line-height: 2.9rem;
      margin: 0.166rem;
    }
    .react-datepicker__header {
      background-color: white;
      border-bottom: none;
    }
    .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
      border-radius: 50%;
      background-color: #FF0000; // Red background for selected day
      color: white;
    }
    .react-datepicker__day:hover {
      background-color: #FFCCCC; // Light red for hover
    }
  `;

  const flexRowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '20px'
  };

  const flexColumnStyle = {
    display: 'flex',
    flexDirection: 'column',
    marginRight: '10px',
    flex: 1
  };

  const inputStyle = {
    padding: '10px',
    fontSize: '16px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    width: '100%'
  };

  const labelStyle = {
    marginBottom: '5px'
  };

  const buttonStyle = {
    padding: '10px 20px',
    fontSize: '16px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    margin: '0 10px',
  };

  const confirmButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#E9EDD3',
    color: '#898F63',
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#D85C5C',
    color: 'white'
  };

  const handleConfirmation = () => {
    if (window.confirm("Are you sure you want to confirm this service request?")) {
      setIsServiceConfirmed(true);
    }
  };

  const handleCancellation = () => {
    if (window.confirm("Are you sure you want to cancel this service request?")) {
      setIsServiceConfirmed(false);
    }
  };

  return (
    <div className="p-5 font-sans">
      <style>{datePickerCustomStyles}</style>
      <header className="text-2xl font-bold mb-5">Maintenance Service</header>

      <div style={flexRowStyle}>
        <div style={flexColumnStyle}>
          <label style={labelStyle}>Building No.:</label>
          <input
            type="text"
            placeholder="Enter building number"
            value={buildingNo}
            onChange={(e) => setBuildingNo(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={flexColumnStyle}>
          <label style={labelStyle}>Room No.:</label>
          <input
            type="text"
            placeholder="Enter room number"
            value={roomNo}
            onChange={(e) => setRoomNo(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={flexRowStyle}>
        <div style={flexColumnStyle}>
          <label style={labelStyle}>Service Type:</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            style={inputStyle}
          >
            <option value="">Choose the service</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="cleaning">Cleaning</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style={{ ...flexColumnStyle, marginRight: 0 }}>
          <label style={labelStyle}>Details:</label>
          <textarea
            placeholder="Tell more about the problem"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            style={{ ...inputStyle, height: '100px' }} // Adjusted for textarea
          />
        </div>
      </div>

      <label className="block mb-2">Select Time Slot:</label>
      <div className="grid grid-cols-3 gap-4 mb-5">
        {availableTimes.map((time, index) => (
          <button
            key={index}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: selectedTime === time ? '#E9EDD3' : 'white',
              color: selectedTime === time ? '#898F63' : 'black',
              cursor: 'pointer',
              fontWeight: selectedTime === time ? 'bold' : 'normal',
            }}
            onClick={() => setSelectedTime(time)}
          >
            {time}
          </button>
        ))}
      </div>

      <div className="mb-5" style={{ display: 'flex', justifyContent: 'center' }}>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          inline
          calendarClassName="custom-calendar"
        />
      </div>

      <div className="flex justify-end">
        {isServiceConfirmed ? (
          <button
            style={cancelButtonStyle}
            onClick={handleCancellation}
          >
            Cancel Service
          </button>
        ) : (
          <button
            style={confirmButtonStyle}
            onClick={handleConfirmation}
          >
            Confirm Service
          </button>
        )}
      </div>
    </div>
  );
}
