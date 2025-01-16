import dbConnect from "@/lib/mongodb";
import Parcel from "@/app/models/Parcels";

export async function GET(req) {
  await dbConnect();
  try {
    const parcels = await Parcel.find();
    return new Response(JSON.stringify(parcels), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Failed to fetch parcels", error }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { roomNo, name, trackingNumber, building, status } = body;

    if (!roomNo || !name || !trackingNumber || !building) {
      return new Response(JSON.stringify({ message: "All fields are required." }), {
        status: 400,
      });
    }

    const newParcel = await Parcel.create({
      roomNo,
      name,
      trackingNumber,
      building,
      status: status || "haven't collected",
    });

    return new Response(JSON.stringify(newParcel), { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return new Response(JSON.stringify({ message: "Tracking number already exists." }), {
        status: 400,
      });
    }
    return new Response(JSON.stringify({ message: "Failed to create parcel", error }), {
      status: 500,
    });
  }
}

export async function PUT(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { trackingNumber, updates } = body;

    const updatedParcel = await Parcel.findOneAndUpdate(
      { trackingNumber },
      { $set: updates },
      { new: true }
    );

    if (!updatedParcel) {
      return new Response(JSON.stringify({ message: "Parcel not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(updatedParcel), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Failed to update parcel", error }), {
      status: 500,
    });
  }
}

export async function DELETE(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { trackingNumbers } = body;

    await Parcel.deleteMany({ trackingNumber: { $in: trackingNumbers } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Failed to delete parcels", error }), {
      status: 500,
    });
  }
}
