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

// Definindo o Schema da Página do Casal
const PageSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  names: { type: String, required: true },
  date: { type: String, required: true },
  music: { type: String },
  photoUrl: { type: String },
  status: { type: String, default: "PENDING" }, // PENDING ou APPROVED
  createdAt: { type: Date, default: Date.now },
});

// Exporta o modelo
export const Page = mongoose.models.Page || mongoose.model("Page", PageSchema);