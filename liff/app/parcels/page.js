"use client";
import React, { useState } from "react";
import Head from "next/head";

const ParcelsPage = () => {
  const [buildingNo, setBuildingNo] = useState("");
  const [roomNo, setRoomNo] = useState("");

  // Mock data for parcel status
  const parcels = [
    {
      id: "TH372480845392",
      name: "Nine",
      room: "101",
      status: "Uncollected",
      date: "Today",
    },
    {
      id: "TH372480845392",
      name: "Nine",
      room: "101",
      status: "Uncollected",
      date: "21/02/23",
    },
    {
      id: "TH372480390192",
      name: "Nine",
      room: "101",
      status: "Collected",
      date: "History",
    },
    {
      id: "TH945755873223",
      name: "Nine",
      room: "101",
      status: "Collected",
      date: "History",
    },
  ];

  return (
    <>
      <Head>
        <title>Parcels</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="p-5 bg-gray-100 font-sans">
        <header className="text-2xl font-bold mb-5">Parcels</header>

        <div className="flex gap-2 mb-5">
          <input
            type="text"
            placeholder="Enter parcel tracking number"
            value={buildingNo}
            onChange={(e) => setBuildingNo(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-md text-lg"
          />
        </div>

        <div className="flex flex-col gap-4">
          {parcels.map((parcel, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-md">
              {index === 0 || parcels[index - 1].date !== parcel.date ? (
                <div className="font-bold mb-2">{parcel.date}</div>
              ) : null}
              <div className="flex flex-col gap-2">
                <div className="font-bold text-lg">{parcel.id}</div>
                <div>Name: {parcel.name}</div>
                <div>Room no. {parcel.room}</div>
                <div
                  className={
                    parcel.status === "Collected"
                      ? "bg-green-500 text-white rounded-md px-3 py-1 inline-block"
                      : "bg-red-500 text-white rounded-md px-3 py-1 inline-block"
                  }
                >
                  {parcel.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ParcelsPage;
