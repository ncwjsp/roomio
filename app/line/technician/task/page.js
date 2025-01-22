"use client"

import React, { useState } from 'react';

export default function TechnicianTasksPage() {
  const [tasksToday, setTasksToday] = useState([
    { id: 1, name: 'Light Changing', room: '101', building: 'A', time: '10:30 AM', status: 'incomplete', cost: 200, details: 'Change the light bulb in the room.', defaultRate: 100, options: [
      { name: '1 light bulb', cost: 100 },
      { name: '2 light bulbs', cost: 200 },
    ], selectedOption: null },
  ]);
  const [tasksHistory, setTasksHistory] = useState([
    { id: 2, name: 'AC Maintenance', room: '102', building: 'B', time: '9:00 AM', status: 'completed', cost: 500, details: 'Cleaned and maintained the AC unit.' },
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

  const handleOptionChange = (e) => {
    const option = selectedTask.options.find((opt) => opt.name === e.target.value);
    setSelectedTask({ ...selectedTask, selectedOption: option });
  };

  const calculateTotalCost = () => {
    return selectedTask.defaultRate + (selectedTask.selectedOption?.cost || 0);
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
            <p className="text-gray-600">Default Rate: {selectedTask.defaultRate} Bath</p>
            <div className="mt-3">
              <label className="font-bold text-gray-800">Add more options</label>
              <select
                className="p-2 border border-gray-300 rounded w-full mt-2"
                onChange={handleOptionChange}
              >
                <option value="">Select an option</option>
                {selectedTask.options.map((option, index) => (
                  <option key={index} value={option.name}>
                    {option.name} - {option.cost} Bath
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-5">
              <p className="font-bold text-gray-800">Receipt</p>
              <p className="text-gray-600">Default Rate: {selectedTask.defaultRate} Bath</p>
              {selectedTask.selectedOption && (
                <p className="text-gray-600">
                  Added Cost ({selectedTask.selectedOption.name}): {selectedTask.selectedOption.cost} Bath
                </p>
              )}
              <p className="font-bold text-gray-800">Total Cost: {calculateTotalCost()} Bath</p>
            </div>
          </div>
          {selectedTask.status === 'incomplete' && (
            <button
              onClick={handleMarkAsDone}
              className="bg-green-500 text-white px-5 py-2 rounded hover:bg-green-600"
            >
              Finish Work
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
            <h1 className="text-2xl font-bold">Technician Tasks</h1>
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
                  <span className="text-sm font-bold px-3 py-1 rounded bg-red-500 text-white">
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
