import { NextRequest, NextResponse } from "next/server";
import {
  getFileExtension,
  isAllowedImageExtension,
  validateAttachmentBatch,
  type NoteAttachment,
} from "@/lib/note-content";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "note-attachments";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  svg: "image/svg+xml",
  heic: "image/heic",
  raw: "application/octet-stream",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
};

function isSafeUserPath(path: string, userId: string): boolean {
  return (
    path.startsWith(`${userId}/`) &&
    !path.includes("..") &&
    !path.includes("\\")
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập để tải tệp lên." },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Dữ liệu tải lên không hợp lệ." },
      { status: 400 },
    );
  }

  const rawExistingSize = Number(formData.get("existingSize") ?? 0);
  const existingSize =
    Number.isFinite(rawExistingSize) && rawExistingSize >= 0
      ? rawExistingSize
      : 0;

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json(
      { error: "Vui lòng chọn ít nhất một tệp đính kèm." },
      { status: 400 },
    );
  }

  const check = validateAttachmentBatch(
    existingSize,
    files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
  );
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const uploaded: NoteAttachment[] = [];

  for (const file of files) {
    const ext = getFileExtension(file.name);
    if (!isAllowedImageExtension(ext)) {
      return NextResponse.json(
        { error: `Định dạng tệp "${file.name}" không được hỗ trợ.` },
        { status: 400 },
      );
    }

    const id = crypto.randomUUID();
    const path = `${user.id}/${id}.${ext}`;
    const contentType =
      MIME_BY_EXT[ext] || file.type || "application/octet-stream";

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: false });

    if (error) {
      if (uploaded.length > 0) {
        await supabase.storage
          .from(BUCKET)
          .remove(uploaded.map((item) => item.path));
      }
      return NextResponse.json(
        {
          error:
            "Không thể lưu tệp lên Supabase Storage. Hãy kiểm tra bạn đã chạy migration bucket note-attachments.",
        },
        { status: 500 },
      );
    }

    uploaded.push({
      id,
      name: file.name,
      size: file.size,
      ext,
      mimeType: contentType,
      path,
      url: `/api/note-attachments?path=${encodeURIComponent(path)}`,
    });
  }

  return NextResponse.json({ attachments: uploaded });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path") ?? "";
  if (!isSafeUserPath(path, user.id)) {
    return NextResponse.json(
      { error: "Đường dẫn không hợp lệ." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) {
    return NextResponse.json({ error: "Không tìm thấy tệp." }, { status: 404 });
  }

  const ext = getFileExtension(path);
  const contentType =
    MIME_BY_EXT[ext] || data.type || "application/octet-stream";
  const bytes = await data.arrayBuffer();
  const total = bytes.byteLength;

  const baseHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    "Cache-Control": "private, max-age=3600",
  };

  const rangeHeader = request.headers.get("range");
  const rangeMatch = rangeHeader ? /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader) : null;
  if (rangeMatch && total > 0) {
    const start = rangeMatch[1] ? Number(rangeMatch[1]) : 0;
    const end = rangeMatch[2]
      ? Math.min(Number(rangeMatch[2]), total - 1)
      : total - 1;
    if (
      Number.isInteger(start) &&
      Number.isInteger(end) &&
      start >= 0 &&
      start <= end &&
      end < total
    ) {
      const chunk = bytes.slice(start, end + 1);
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Content-Length": String(chunk.byteLength),
        },
      });
    }
  }

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      ...baseHeaders,
      "Content-Length": String(total),
    },
  });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path") ?? "";
  if (!isSafeUserPath(path, user.id)) {
    return NextResponse.json(
      { error: "Đường dẫn không hợp lệ." },
      { status: 403 },
    );
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    return NextResponse.json(
      { error: "Không thể xoá tệp đính kèm." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
