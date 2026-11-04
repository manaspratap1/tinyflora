import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { requireAdmin } from "@/lib/auth";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized. Admin privileges required." },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    let files = formData.getAll("files");
    if (!files || files.length === 0) {
      files = formData.getAll("file");
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: "No files uploaded" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedUrls = [];

    for (const file of files) {
      if (typeof file === "string" || !file.name) {
        continue;
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { message: `Invalid file type: ${file.name}. Only JPEG, PNG, WebP, and AVIF are permitted.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: `File too large: ${file.name}. Maximum size is 5MB.` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name).toLowerCase() || ".jpg";
      const sanitizedBase = path
        .basename(file.name, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 30);

      // Generate unique name: timestamp + random hex + sanitized name
      const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${sanitizedBase || "img"}${ext}`;
      const filePath = path.join(uploadDir, uniqueName);

      await fs.writeFile(filePath, buffer);
      uploadedUrls.push(`/uploads/products/${uniqueName}`);
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { message: "No valid image files were processed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      primaryUrl: uploadedUrls[0],
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { message: "An error occurred while uploading images." },
      { status: 500 }
    );
  }
}