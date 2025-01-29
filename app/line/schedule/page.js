"use client";

import React from "react";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function SchedulePage() {
  const tasks = [
    { time: "8:00 AM", description: "Light Changing - Room 101, Building A" },
    { time: "10:00 AM", description: "AC Maintenance - Room 102, Building B" },
    { time: "2:00 PM", description: "Fan Repair - Room 203, Building C" },
  ];

  return (
    <div className="p-5 bg-white rounded-lg shadow-md min-h-screen">
      <header className="text-center mb-5">
        <h1 className="text-2xl font-bold">Schedule</h1>
      </header>

      <div className="mb-5">
        <Calendar className="mx-auto border border-gray-300 rounded-lg shadow" />
      </div>

      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-3">Tasks</h2>
        {tasks.map((task, index) => (
          <div
            key={index}
            className="bg-gray-100 p-4 rounded-lg shadow mb-3 flex justify-between items-center"
          >
            <p className="font-medium text-gray-800">{task.time}</p>
            <p className="text-gray-600">{task.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
