import React, { useState, useEffect } from "react";

const Notification = ({
  type = "normal",
  message = "Notification Message",
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.(); // Call the onClose callback
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  // Determine styles based on the type prop
  const typeStyles = {
    good: "bg-green-500 text-white",
    bad: "bg-red-500 text-white",
    normal: "bg-white text-gray-700",
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex items-start justify-center z-50">
      <div
        className={`
            mt-4 shadow-lg rounded-lg 
            p-4 flex items-center justify-between
            transform transition-all duration-300 ease-in-out font-semibold
            ${typeStyles[type]} // Apply styles dynamically
            ${
              isLeaving
                ? "translate-x-full opacity-0"
                : "translate-x-0 opacity-100"
            }
          `}
      >
        <p>{message}</p>
      </div>
    </div>
  );
};

export default Notification;
