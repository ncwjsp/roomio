// import dbConnect from "@/lib/mongodb";
// import Cleaning from "@/app/models/Cleaning";

// export async function GET(req) {
//   await dbConnect();
//   try {
//     const cleaningRequests = await Cleaning.find();
//     return new Response(JSON.stringify(cleaningRequests), { status: 200 });
//   } catch (error) {
//     return new Response(JSON.stringify({ message: "Failed to fetch cleaning requests", error }), { status: 500 });
//   }
// }

// export async function POST(req) {
//   await dbConnect();
//   try {
//     const body = await req.json();
//     const { roomNumber, building, floor, name, date, status, assignedTo, timeSlot } = body;

//     if (!roomNumber || !building || !floor || !name || !date || !status || !assignedTo || !timeSlot) {
//       return new Response(JSON.stringify({ message: "All fields are required." }), { status: 400 });
//     }

//     const newRequest = await Cleaning.create({
//       roomNumber,
//       building,
//       floor,
//       name,
//       date,
//       status,
//       assignedTo,
//       timeSlot,
//     });

//     return new Response(JSON.stringify(newRequest), { status: 201 });
//   } catch (error) {
//     return new Response(JSON.stringify({ message: "Failed to create cleaning request", error }), { status: 500 });
//   }
// }

// export async function PUT(req) {
//   await dbConnect();
//   try {
//     const body = await req.json();
//     const { id, updates } = body;

//     const updatedRequest = await Cleaning.findByIdAndUpdate(id, updates, { new: true });

//     if (!updatedRequest) {
//       return new Response(JSON.stringify({ message: "Cleaning request not found" }), { status: 404 });
//     }

//     return new Response(JSON.stringify(updatedRequest), { status: 200 });
//   } catch (error) {
//     return new Response(JSON.stringify({ message: "Failed to update cleaning request", error }), { status: 500 });
//   }
// }

// export async function DELETE(req) {
//   await dbConnect();
//   try {
//     const body = await req.json();
//     const { ids } = body;

//     await Cleaning.deleteMany({ _id: { $in: ids } });
//     return new Response(null, { status: 204 });
//   } catch (error) {
//     return new Response(JSON.stringify({ message: "Failed to delete cleaning requests", error }), { status: 500 });
//   }
// }
