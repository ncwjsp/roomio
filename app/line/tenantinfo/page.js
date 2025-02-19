"use client";

import { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import dayjs from "dayjs";
import {
  Person,
  Email,
  Phone,
  MeetingRoom,
  Apartment,
  Stairs,
  AttachMoney,
  CalendarMonth,
  ElectricBolt,
  WaterDrop,
  MonetizationOn,
} from "@mui/icons-material";

export default function TenantInfoPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const { searchParams } = new URL(window.location.href);
        const id = searchParams.get("id");

        if (!id) {
          throw new Error("ID not provided in URL");
        }

        // Get LIFF configuration
        const response = await fetch(`/api/user/line-config?id=${id}`);
        const data = await response.json();

        if (!data.lineConfig.liffIds.tenantInfo) {
          throw new Error("LIFF ID not configured for tenant info feature");
        }

        // Initialize LIFF
        const liff = (await import("@line/liff")).default;
        await liff.init({
          liffId: data.lineConfig.liffIds.tenantInfo,
        });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        // Get tenant info
        const profile = await liff.getProfile();
        const tenantResponse = await fetch(`/api/tenant/line/${profile.userId}`);
        const tenantData = await tenantResponse.json();

        if (!tenantResponse.ok) {
          throw new Error(tenantData.error || "Failed to fetch tenant information");
        }

        setTenantInfo(tenantData);
      } catch (error) {
        console.error("Error initializing LIFF:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLiff();
  }, []);

  const InfoItem = ({ icon, label, value, className = "" }) => (
    <div className={`bg-white rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div className="text-[#898F63]">{icon}</div>
        <div className="flex-1">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-gray-800 font-medium mt-1">{value}</p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#EBECE1]">
        <CircularProgress sx={{ color: "#898F63" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 bg-[#EBECE1]">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBECE1] p-4 pb-8">
      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          {tenantInfo?.pfp ? (
            <img
              src={tenantInfo.pfp}
              alt={tenantInfo.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#898F63] text-white flex items-center justify-center text-2xl">
              {tenantInfo?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-[#898F63]">
              {tenantInfo?.name}
            </h1>
            <p className="text-gray-500">Tenant</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem
            icon={<Email />}
            label="Email"
            value={tenantInfo?.email}
          />
          <InfoItem
            icon={<Phone />}
            label="Phone"
            value={tenantInfo?.phone}
          />
        </div>
      </div>

      {/* Room Information */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Room Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem
            icon={<MeetingRoom />}
            label="Room Number"
            value={tenantInfo?.room?.roomNumber}
          />
          <InfoItem
            icon={<Apartment />}
            label="Building"
            value={`Building ${tenantInfo?.room?.floor?.building?.name}`}
          />
          <InfoItem
            icon={<Stairs />}
            label="Floor"
            value={`Floor ${tenantInfo?.room?.floor?.floorNumber}`}
          />
          <InfoItem
            icon={<MonetizationOn />}
            label="Monthly Rent"
            value={`฿${tenantInfo?.room?.price.toLocaleString()}`}
          />
        </div>
      </div>

      {/* Utility Rates */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Utility Rates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem
            icon={<ElectricBolt />}
            label="Electricity Rate"
            value={`฿${tenantInfo?.room?.floor?.building?.electricityRate.toLocaleString()} / kWh`}
          />
          <InfoItem
            icon={<WaterDrop />}
            label="Water Rate"
            value={`฿${tenantInfo?.room?.floor?.building?.waterRate.toLocaleString()} / m³`}
          />
        </div>
      </div>

      {/* Lease Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Lease Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem
            icon={<CalendarMonth />}
            label="Lease Start Date"
            value={dayjs(tenantInfo?.fromDate).format("MMMM D, YYYY")}
          />
          <InfoItem
            icon={<CalendarMonth />}
            label="Lease End Date"
            value={dayjs(tenantInfo?.toDate).format("MMMM D, YYYY")}
          />
          <InfoItem
            icon={<AttachMoney />}
            label="Deposit Amount"
            value={`฿${tenantInfo?.depositAmount.toLocaleString()}`}
          />
        </div>
      </div>
    </div>
  );
}