import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Accept various image MIME types including mobile formats (HEIC, HEIF, PNG, JPG, WEBP, etc.)
    const validExtensions = ["png", "jpg", "jpeg", "webp", "heic", "heif", "bmp"];
    
    let ext = (file.name && file.name.includes(".") ? file.name.split(".").pop() || "" : "").toLowerCase();
    const isMimeValid = file.type ? (file.type.startsWith("image/") || file.type === "application/octet-stream") : false;
    const isExtValid = validExtensions.includes(ext);

    if (!isMimeValid && !isExtValid) {
      return NextResponse.json({ error: "Invalid file format. Please upload a PNG, JPG, WEBP, or HEIC screenshot image." }, { status: 400 });
    }

    // Determine clean extension for saving
    if (!validExtensions.includes(ext)) {
      if (file.type === "image/jpeg" || file.type === "image/jpg") ext = "jpg";
      else if (file.type === "image/webp") ext = "webp";
      else if (file.type === "image/heic" || file.type === "image/heif") ext = "heic";
      else ext = "png";
    }

    // Limit file size to 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds maximum limit of 20MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filename = `proof_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
