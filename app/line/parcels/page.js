"use client";
import { useState, useEffect } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";

const ParcelsPage = () => {
  const [userId, setUserId] = useState("");
  const [parcels, setParcels] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isFetching, setIsFetching] = useState(false);
  const [tenantInfo, setTenantInfo] = useState(null);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const { searchParams } = new URL(window.location.href);
        const id = searchParams.get("id"); // landlord's id

        if (!id) {
          throw new Error("ID not provided in URL");
        }

        // Get the parcels-specific LIFF ID for this landlord
        const response = await fetch(`/api/user/line-config?id=${id}`);
        const data = await response.json();

        if (!data.lineConfig.liffIds.parcels) {
          throw new Error("LIFF ID not configured for parcels feature");
        }

        const liff = (await import("@line/liff")).default;
        await liff.init({
          liffId: data.lineConfig.liffIds.parcels,
        });

        if (!liff.isLoggedIn()) {
          await liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setUserId(profile.userId);

        // Modified to fetch parcels for specific landlord
        fetchParcelsByLineIdAndLandlord(profile.userId, id);
      } catch (error) {
        console.error("Failed to initialize LIFF:", error);
        setError("Failed to initialize LINE login");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchParcelsByLineIdAndLandlord = async (lineUserId, landlordId) => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/parcels/tenant?lineId=${lineUserId}`
        );
        const data = await response.json();

        setParcels(data.parcels);
      } catch (error) {
        console.error("Failed to fetch parcels:", error);
        setError("Failed to load parcels");
      } finally {
        setIsLoading(false);
      }
    };

    initializeLiff();
  }, []);

  const getSortedAndFilteredParcels = () => {
    if (!parcels) return [];
    let filtered = [...parcels];

    if (statusFilter !== "all") {
      filtered = filtered.filter((parcel) =>
        statusFilter === "collected"
          ? parcel.status === "collected"
          : parcel.status === "uncollected"
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 min-h-screen">
      <h1 className="text-2xl font-semibold mb-2">My Parcels</h1>
      {tenantInfo && (tenantInfo.roomNo || tenantInfo.building) && (
        <div className="mb-4 text-gray-600">
          {tenantInfo.roomNo && `Room ${tenantInfo.roomNo}`}
          {tenantInfo.roomNo && tenantInfo.building && ` • `}
          {tenantInfo.building && `Building ${tenantInfo.building}`}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-4">
        <FormControl size="small" sx={{ width: "150px" }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
            }}
            label="Status"
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="collected">Collected</MenuItem>
            <MenuItem value="uncollected">Not Collected</MenuItem>
          </Select>
        </FormControl>

        <IconButton
          onClick={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
          size="small"
          sx={{
            mt: 0.5,
            width: "40px",
            height: "40px",
          }}
        >
          {sortOrder === "asc" ? <ArrowUpward /> : <ArrowDownward />}
        </IconButton>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : parcels === null ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : getSortedAndFilteredParcels().length === 0 ? (
        <div className="text-center text-gray-500 py-8">No parcels found</div>
      ) : (
        <div className="space-y-4">
          {getSortedAndFilteredParcels().map((parcel) => (
            <div
              key={parcel._id}
              className={`p-4 rounded-lg shadow ${
                parcel.status === "uncollected"
                  ? "bg-white border-l-4 border-red-500"
                  : "bg-white border-l-4 border-green-500"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{parcel.trackingNumber}</p>
                </div>
                <span
                  className={`px-2 py-1 text-sm rounded ${
                    parcel.status === "uncollected"
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {parcel.status === "uncollected"
                    ? "Not Collected"
                    : "Collected"}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <div>
                  Arrived:{" "}
                  {new Date(parcel.createdAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </div>
                {parcel.status === "collected" && (
                  <div>
                    Received:{" "}
                    {new Date(parcel.updatedAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParcelsPage;
