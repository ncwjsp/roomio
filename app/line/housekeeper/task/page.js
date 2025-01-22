"use client"

import React from 'react';

export default function TasksPage() {
  const tasksToday = [
    { name: 'Nine', room: '101', status: 'incomplete' },
  ];
  const tasksHistory = [
    { name: 'Nine', room: '101', status: 'completed' },
    { name: 'Nine', room: '101', status: 'completed' },
  ];

  return (
    <div className="p-5 bg-white rounded-lg shadow-md min-h-screen">
      <header className="text-center mb-5">
        <h1 className="text-2xl font-bold">Tasks</h1>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <input
          type="text"
          placeholder="Enter building number"
          className="p-3 border border-gray-300 rounded bg-gray-100 text-gray-800 w-full"
        />
        <input
          type="text"
          placeholder="Enter room number"
          className="p-3 border border-gray-300 rounded bg-gray-100 text-gray-800 w-full"
        />
      </div>

      <section className="mb-5">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Tasks List</h2>
        <div>
          <p className="text-orange-500 font-medium mb-2">Today</p>
          {tasksToday.map((task, index) => (
            <div
              key={index}
              className="bg-gray-100 p-4 rounded-lg shadow mb-3 flex justify-between items-center"
            >
              <div>
                <p className="font-bold text-gray-800">Room Cleaning</p>
                <p className="text-gray-600">Name: {task.name} | Room no: {task.room}</p>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded ${task.status === 'completed' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {task.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-3">History</h2>
        {tasksHistory.map((task, index) => (
          <div
            key={index}
            className="bg-gray-100 p-4 rounded-lg shadow mb-3 flex justify-between items-center"
          >
            <div>
              <p className="font-bold text-gray-800">Room Cleaning</p>
              <p className="text-gray-600">Name: {task.name} | Room no: {task.room}</p>
            </div>
            <span className="text-sm font-bold px-3 py-1 rounded bg-green-500 text-white">
              Completed
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

