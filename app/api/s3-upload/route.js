import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function uploadFileToS3(file, fileName) {
  try {
    const fileBuffer = file;
    console.log("Uploading file:", fileName);

    if (!process.env.AWS_BUCKET_NAME || !process.env.AWS_REGION) {
      throw new Error("Missing required AWS configuration");
    }

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${fileName}`,
      Body: fileBuffer,
      ContentType: "image/jpeg",
    };

    console.log("Upload params:", { ...params, Body: "[Buffer]" });

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    return params.Key;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { message: "File is required" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = await uploadFileToS3(buffer, file.name);

    const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    console.log("Generated S3 URL:", s3Url);

    return NextResponse.json({
      message: "File uploaded successfully",
      url: s3Url,
    });
  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { message: error.message || "Error uploading file" },
      { status: 500 }
    );
  }
}
