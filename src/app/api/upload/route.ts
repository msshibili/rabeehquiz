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

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file selected. Please select a valid screenshot image." }, { status: 400 });
    }

    // Limit file size to 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds maximum limit of 20MB." }, { status: 400 });
    }

    const validExtensions = ["png", "jpg", "jpeg", "webp", "heic", "heif", "bmp"];
    let ext = (file.name && file.name.includes(".") ? file.name.split(".").pop() || "" : "").toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      if (file.type?.includes("jpeg") || file.type?.includes("jpg")) ext = "jpg";
      else if (file.type?.includes("webp")) ext = "webp";
      else if (file.type?.includes("heic") || file.type?.includes("heif")) ext = "heic";
      else ext = "png";
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let publicUrl = "";
    const filename = `proof_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    // Attempt 1: Save to public/uploads directory (Local server / VPS)
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, filename);
      await fs.writeFile(filePath, buffer);
      publicUrl = `/uploads/${filename}`;
    } catch (fsErr) {
      console.warn("Disk write failed (serverless environment detected). Falling back to Base64 Data URI.");
      // Attempt 2: Fallback to Base64 Data URI (Vercel / Serverless / Read-Only Filesystems)
      const base64 = buffer.toString("base64");
      const mime = file.type || `image/${ext === "jpg" ? "jpeg" : ext}`;
      publicUrl = `data:${mime};base64,${base64}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file. Please try again." }, { status: 500 });
  }
}
