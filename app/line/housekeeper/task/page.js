"use client"

import React, { useState } from 'react';

export default function CleanerTasksPage() {
  const [tasksToday, setTasksToday] = useState([
    { id: 1, name: 'Room Cleaning', room: '101', building: 'A', time: '10:30 AM', status: 'incomplete', cost: 200, details: 'Clean the room, bathroom, and windows.' },
  ]);
  const [tasksHistory, setTasksHistory] = useState([
    { id: 2, name: 'Room Cleaning', room: '102', building: 'B', time: '9:00 AM', status: 'completed', cost: 150, details: 'Completed room cleaning.' },
  ]);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleMarkAsDone = () => {
    if (selectedTask) {
      const updatedTasks = tasksToday.filter((task) => task.id !== selectedTask.id);
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
            <h1 className="text-2xl font-bold">{selectedTask.name}</h1>
          </header>
          <div className="bg-gray-100 p-5 rounded-lg shadow mb-5">
            <p className="font-bold text-gray-800">Room no: {selectedTask.room}</p>
            <p className="text-gray-600">Building: {selectedTask.building}</p>
            <p className="text-gray-600">Time: {selectedTask.time}</p>
            <p className="text-gray-600">Cost: {selectedTask.cost} Bath</p>
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
            <h1 className="text-2xl font-bold">Cleaner Tasks</h1>
          </header>
          <section className="mb-5">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Tasks List</h2>
            <div>
              {tasksToday.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="bg-gray-100 p-4 rounded-lg shadow mb-3 flex justify-between items-center cursor-pointer hover:bg-gray-200"
                >
                  <div>
                    <p className="font-bold text-gray-800">{task.name}</p>
                    <p className="text-gray-600">Room: {task.room} | Building: {task.building}</p>
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
                  <p className="font-bold text-gray-800">{task.name}</p>
                  <p className="text-gray-600">Room: {task.room} | Building: {task.building}</p>
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
