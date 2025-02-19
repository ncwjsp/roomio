"use client";
import { useState, useEffect, Suspense } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import Loading from "../components/loading";

const AnnouncementPage = () => {
  const [userId, setUserId] = useState("");
  const [announcements, setAnnouncements] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const { searchParams } = new URL(window.location.href);
        const id = searchParams.get("id"); // landlord's id

        if (!id) {
          throw new Error("ID not provided in URL");
        }

        // Get the announcement-specific LIFF ID for this landlord
        const response = await fetch(`/api/user/line-config?id=${id}`);
        const data = await response.json();

        if (!data.lineConfig.liffIds.announcement) {
          throw new Error("LIFF ID not configured for announcement feature");
        }

        const liff = (await import("@line/liff")).default;
        await liff.init({
          liffId: data.lineConfig.liffIds.announcement,
        });

        if (!liff.isLoggedIn()) {
          await liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setUserId(profile.userId);

        // Fetch Announcement for this tenant
        fetchAnnouncementsByLineIdAndLandlord(profile.userId, id);
      } catch (error) {
        console.error("Failed to initialize LIFF:", error);
        setError("Failed to initialize LINE login");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAnnouncementsByLineIdAndLandlord = async (
      lineUserId,
      landlordId
    ) => {
      try {
        setIsLoading(true);
        console.log("Fetching announcements for:", { lineUserId, landlordId });

        const response = await fetch(
          `/api/announcement/tenant?lineId=${lineUserId}&landlordId=${landlordId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch announcements");
        }

        const data = await response.json();
        console.log("Received announcements:", data);

        setAnnouncements(data.announcements);
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
        setError("Failed to load announcements");
      } finally {
        setIsLoading(false);
      }
    };

    initializeLiff();
  }, []);

  const getSortedAnnouncements = () => {
    if (!announcements) return [];
    let sorted = [...announcements];

    sorted.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  };

  return (
    <Suspense fallback={<Loading />}>
      {isLoading || !announcements ? (
        <Loading />
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : (
        <div className="p-4 min-h-screen">
          <div className="flex justify-between">
          <h1 className="text-2xl font-semibold mb-2">Announcement</h1>

          <div className="flex justify-end mb-4">
            <IconButton
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              size="small"
              sx={{
                width: "40px",
                height: "40px",
              }}
            >
              {sortOrder === "asc" ? <ArrowUpward /> : <ArrowDownward />}
            </IconButton>
          </div>
          </div>

          

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : getSortedAnnouncements().length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No Announcement found
            </div>
          ) : (
            <div className="space-y-4">
              {getSortedAnnouncements().map((announcement) => (
                <div
                  key={announcement._id}
                  className="p-4 rounded-lg shadow bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="font-medium text-lg">
                        {announcement.title}
                      </h2>
                      <p className="mt-2 text-gray-600">
                        {announcement.content}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Posted:{" "}
                    {new Date(announcement.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Suspense>
  );
};

export default AnnouncementPage;
