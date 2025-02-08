"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";

export default function MaintenanceList({ params }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const lineUserId = searchParams.get("liff.state");
  const landlordId = params.id;

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch(
          `/api/maintenance?lineUserId=${lineUserId}&landlordId=${landlordId}`
        );
        if (response.ok) {
          const data = await response.json();
          setTickets(data.tickets || []);
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    if (lineUserId && landlordId) {
      fetchTickets();
    }
  }, [lineUserId, landlordId]);

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Assigned: "bg-blue-100 text-blue-800",
      "In Progress": "bg-purple-100 text-purple-800",
      Completed: "bg-green-100 text-green-800",
      Cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Maintenance Requests
        </h1>
        <Link
          href={`/line/maintenance/${landlordId}/request?liff.state=${lineUserId}`}
          className="bg-[#889F63] text-white px-4 py-2 rounded-lg inline-block shadow-sm hover:bg-[#7A8F53] transition-colors"
        >
          New Request
        </Link>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {!tickets?.length ? (
          <div className="text-center py-8 text-gray-500">
            No maintenance requests found
          </div>
        ) : (
          tickets.map((ticket) => (
            <Link
              key={ticket?._id}
              href={`/line/maintenance/${landlordId}/ticket/${ticket?._id}?liff.state=${lineUserId}`}
              className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">
                  {ticket?.problem}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                    ticket?.currentStatus
                  )}`}
                >
                  {ticket?.currentStatus}
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-2">
                Room {ticket?.room?.roomNumber}
              </div>

              <div className="text-sm text-gray-500">
                {ticket?.createdAt &&
                  format(new Date(ticket.createdAt), "MMM d, yyyy")}
              </div>

              {ticket?.staff && (
                <div className="text-sm text-gray-600 mt-2">
                  Assigned to: {ticket.staff.name}
                </div>
              )}
            </Link>
          ))
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Link
          href={`/line/maintenance/${landlordId}/request?liff.state=${lineUserId}`}
          className="block w-full bg-[#889F63] text-white py-3 rounded-lg text-center font-medium shadow-sm hover:bg-[#7A8F53] transition-colors"
        >
          Submit New Request
        </Link>
      </div>

      {/* Bottom Padding for Fixed Navigation */}
      <div className="h-20"></div>
    </div>
  );
}
