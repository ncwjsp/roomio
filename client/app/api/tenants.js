import mongoose from "mongoose";

const TenantSchema = new mongoose.Schema({
  roomNo: { type: String, required: true },
  name: { type: String },
  phone: { type: String },
  lineID: { type: String },
  status: { type: String, enum: ["Available", "Occupied"], default: "Available" },
});

const Tenant = mongoose.models.Tenant || mongoose.model("Tenant", TenantSchema);

export default async function handler(req, res) {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  if (req.method === "GET") {
    const tenants = await Tenant.find({});
    res.status(200).json(tenants);
  } else if (req.method === "POST") {
    const newTenant = await Tenant.create(req.body);
    res.status(201).json(newTenant);
  } else if (req.method === "PUT") {
    const { id } = req.query;
    const updatedTenant = await Tenant.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json(updatedTenant);
  } else if (req.method === "DELETE") {
    const { id } = req.query;
    await Tenant.findByIdAndDelete(id);
    res.status(200).send("Tenant deleted");
  }
}
