import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Por favor, defina a variável MONGODB_URI no seu arquivo .env");
}

export const connectToDatabase = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("🚀 MongoDB Conectado");
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error);
  }
};

const PageSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  plan: { type: String, required: true }, // Faltava este
  names: { type: String, required: true },
  date: { type: String, required: true },
  music: { type: String },
  message: { type: String }, // Faltava este
  photoUrls: [{ type: String }], // Use sempre plural para array
  contact: { type: String }, // Faltava este
  status: { type: String, default: "PENDING" },
  createdAt: { type: Date, default: Date.now },
});

export const Page = mongoose.models.Page || mongoose.model("Page", PageSchema);