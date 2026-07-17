import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../src/server/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bucket = "listing-images";
const maxFiles = 12;
const maxFileSize = 8 * 1024 * 1024;

function safeFileName(name) {
  const fallback = "listing-image";
  const cleaned = String(name || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || fallback;
}

async function ensureBucket() {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.storage.getBucket(bucket);
  if (!error) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: maxFileSize,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });

  if (createError && !String(createError.message).toLowerCase().includes("already exists")) {
    throw createError;
  }
}

export async function POST(request) {
  try {
    await ensureBucket();
    const supabaseAdmin = getSupabaseAdmin();

    const form = await request.formData();
    const files = form.getAll("images").filter((item) => item && typeof item === "object" && "arrayBuffer" in item);

    if (!files.length) {
      return NextResponse.json({ error: "Choose at least one image." }, { status: 400 });
    }

    if (files.length > maxFiles) {
      return NextResponse.json({ error: `Upload ${maxFiles} images or fewer.` }, { status: 400 });
    }

    const listingDraftId = String(form.get("listingDraftId") || crypto.randomUUID());
    const uploaded = [];

    for (const file of files) {
      if (!String(file.type || "").startsWith("image/")) {
        return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
      }

      if (file.size > maxFileSize) {
        return NextResponse.json({ error: "Each image must be 8 MB or smaller." }, { status: 400 });
      }

      const fileName = safeFileName(file.name);
      const path = `listings/${listingDraftId}/${Date.now()}-${crypto.randomUUID()}-${fileName}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        cacheControl: "31536000",
        upsert: false,
      });

      if (uploadError) throw uploadError;

      const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
      uploaded.push({ path, url: data.publicUrl, name: file.name, size: file.size, type: file.type });
    }

    return NextResponse.json({ images: uploaded });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to upload images." }, { status: 500 });
  }
}
