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
  plan: { type: String, required: true },
  names: { type: String, required: true },
  date: { type: String, required: true },
  youtubeUrl: { type: String }, // Mudamos de 'music' para 'youtubeUrl'
  message: { type: String },
  photoUrls: [{ type: String }],
  contact: { type: String },
  status: { type: String, default: "PENDING" },
  createdAt: { type: Date, default: Date.now },
});

export const Page = mongoose.models.Page || mongoose.model("Page", PageSchema);