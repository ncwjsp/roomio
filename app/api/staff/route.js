import dbConnect from "@/lib/mongodb";
import Staff from "@/app/models/Staff";

export async function GET(req) {
  await dbConnect();
  try {
    const staffList = await Staff.find();
    return new Response(JSON.stringify(staffList), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Failed to fetch staff", error }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { firstName, lastName, building, position, salary, gender, age, dateOfBirth, firstDayOfWork, lineId, phone } = body;

    if (!firstName || !lastName || !building || !position || !salary) {
      return new Response(JSON.stringify({ message: "Missing required fields" }), {
        status: 400,
      });
    }

    const newStaff = await Staff.create({
      firstName,
      lastName,
      building,
      position,
      salary,
      gender,
      age,
      dateOfBirth,
      firstDayOfWork,
      lineId,
      phone,
    });

    return new Response(JSON.stringify(newStaff), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Failed to add staff", error }), {
      status: 500,
    });
  }
}

export async function PUT(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { id, updates } = body;

    const updatedStaff = await Staff.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedStaff) {
      return new Response(JSON.stringify({ message: "Staff member not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(updatedStaff), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Failed to update staff", error }), {
      status: 500,
    });
  }
}

export async function DELETE(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { ids } = body;

    await Staff.deleteMany({ _id: { $in: ids } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Failed to delete staff", error }), {
      status: 500,
    });
  }
}
