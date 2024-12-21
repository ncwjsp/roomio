"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const NoUnits = () => {
  const [units, setUnits] = useState([]); // Assuming no units at start
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#EBECE1]">
      {units.length === 0 ? (
        <div className="text-center p-6 bg-white rounded-[10px] shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-700">
            No Units Found
          </h1>
          <p className="text-gray-600 mb-6">
            It looks like you haven't added any units yet. Create one to get
            started!
          </p>
          <button
            className="bg-[#898F63] text-white px-6 py-2 rounded-md font-semibold shadow-md hover:bg-[#6c734c] transition"
            onClick={() => router.push("/units/create")} // Replace with the actual path to the create page
          >
            Create New Unit
          </button>
        </div>
      ) : (
        <div>
          {/* This would display units if they exist */}
          <h1 className="text-2xl font-bold mb-4">Your Units</h1>
          <ul>
            {units.map((unit) => (
              <li key={unit.id}>{unit.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NoUnits;
