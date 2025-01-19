import dbConnect from "@/lib/mongodb";
import Maintenance from "@/app/models/Maintenance";

export async function GET(req) {
  await dbConnect();
  try {
    const maintenanceRequests = await Maintenance.find();
    return new Response(JSON.stringify(maintenanceRequests), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Failed to fetch maintenance requests", error }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { roomNo, building, name, date, workType, status, assignedTo } = body;

    if (!roomNo || !building || !name || !date || !workType || !status || !assignedTo) {
      return new Response(JSON.stringify({ message: "All fields are required." }), {
        status: 400,
      });
    }

    const newRequest = await Maintenance.create({
      roomNo,
      building,
      name,
      date,
      workType,
      status,
      assignedTo,
    });

    return new Response(JSON.stringify(newRequest), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Failed to create maintenance request", error }), {
      status: 500,
    });
  }
}

export async function PUT(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { id, updates } = body;

    const updatedRequest = await Maintenance.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedRequest) {
      return new Response(JSON.stringify({ message: "Maintenance request not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(updatedRequest), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Failed to update maintenance request", error }), {
      status: 500,
    });
  }
}

export async function DELETE(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { ids } = body;

    await Maintenance.deleteMany({ _id: { $in: ids } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Failed to delete maintenance requests", error }), {
      status: 500,
    });
  }
}
