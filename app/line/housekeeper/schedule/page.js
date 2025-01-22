"use client"

import React from 'react';
import { Calendar } from 'react-calendar'; // Install react-calendar if not already installed
import 'react-calendar/dist/Calendar.css';

export default function SchedulePage() {
  const tasks = [
    { time: '8:00 AM', description: 'A301 Cleaning' },
    { time: '10:00 AM', description: 'Hallway Cleaning' },
    { time: '10:30 AM', description: 'B301 Cleaning' },
  ];

  return (
    <div className="p-5 bg-white rounded-lg shadow-md">
      <header className="text-center mb-5">
        <h1 className="text-2xl font-bold">Schedule</h1>
      </header>

      <div className="mb-5">
        <Calendar className="mx-auto" />
      </div>

      <section>
        {tasks.map((task, index) => (
          <div key={index} className="mb-3 flex justify-between text-gray-700">
            <p className="font-medium">{task.time}</p>
            <p>{task.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
