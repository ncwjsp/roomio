"use client"

import React, { useState } from 'react';

export default function TasksPage() {
  const [tasksToday, setTasksToday] = useState([
    { id: 1, name: 'Nine', room: '101', status: 'incomplete', details: 'Clean the entire room including windows and bathroom.' },
  ]);
  const [tasksHistory, setTasksHistory] = useState([
    { id: 2, name: 'Nine', room: '101', status: 'completed', details: 'Room cleaning completed successfully.' },
    { id: 3, name: 'Nine', room: '101', status: 'completed', details: 'Room cleaning completed successfully.' },
  ]);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleMarkAsDone = () => {
    if (selectedTask) {
      const updatedTasks = tasksToday.map((task) =>
        task.id === selectedTask.id ? { ...task, status: 'completed' } : task
      );
      setTasksToday(updatedTasks);
      setTasksHistory([...tasksHistory, { ...selectedTask, status: 'completed' }]);
      setSelectedTask(null);
    }
  };

  return (
    <div className="p-5 bg-white rounded-lg shadow-md min-h-screen">
      {selectedTask ? (
        <div>
          <header className="text-center mb-5">
            <h1 className="text-2xl font-bold">Task Details</h1>
          </header>
          <div className="bg-gray-100 p-5 rounded-lg shadow mb-5">
            <p className="font-bold text-gray-800">Task: Room Cleaning</p>
            <p className="text-gray-600">Name: {selectedTask.name} | Room no: {selectedTask.room}</p>
            <p className="text-gray-600">Details: {selectedTask.details}</p>
            <span className={`text-sm font-bold px-3 py-1 rounded ${selectedTask.status === 'completed' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              {selectedTask.status}
            </span>
          </div>
          {selectedTask.status === 'incomplete' && (
            <button
              onClick={handleMarkAsDone}
              className="bg-green-500 text-white px-5 py-2 rounded hover:bg-green-600"
            >
              Mark as Done
            </button>
          )}
          <button
            onClick={() => setSelectedTask(null)}
            className="ml-3 bg-gray-500 text-white px-5 py-2 rounded hover:bg-gray-600"
          >
            Back to Tasks
          </button>
        </div>
      ) : (
        <div>
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
              {tasksToday.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="bg-gray-100 p-4 rounded-lg shadow mb-3 flex justify-between items-center cursor-pointer hover:bg-gray-200"
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
            {tasksHistory.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="bg-gray-100 p-4 rounded-lg shadow mb-3 flex justify-between items-center cursor-pointer hover:bg-gray-200"
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
      )}
    </div>
  );
}
