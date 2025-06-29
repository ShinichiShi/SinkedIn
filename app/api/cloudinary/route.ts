
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
  const { image } = await req.json();

  if (!image) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  try {
    const result = await cloudinary.uploader.upload(image, {
      folder: 'posts', 
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (err: any) {
    console.error('Upload failed:', err.message);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
