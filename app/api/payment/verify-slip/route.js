import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bill from "@/app/models/Bill";
import Tenant from "@/app/models/Tenant";
import User from "@/app/models/User";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    await dbConnect();

    const formData = await request.formData();
    const file = formData.get("file");
    const billId = formData.get("billId");
    const lineUserId = formData.get("lineUserId");
    const landlordId = formData.get("landlordId");

    if (!file || !billId || !lineUserId || !landlordId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get landlord's bank details
    const landlord = await User.findById(landlordId).select(
      "bankCode accountNumber accountName"
    );

    if (!landlord) {
      return NextResponse.json(
        { error: "Landlord not found" },
        { status: 404 }
      );
    }

    // Verify tenant exists and has access to this bill
    const tenant = await Tenant.findOne({
      lineUserId: lineUserId,
      landlordId: landlordId,
      active: true,
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Get bill details
    const bill = await Bill.findById(billId);
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Create a new FormData for the EasySlip API
    const apiFormData = new FormData();
    apiFormData.append("file", file);

    // Call EasySlip API
    const response = await fetch(
      "https://developer.easyslip.com/api/v1/verify",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SLIP_ACCESS_TOKEN}`,
        },
        body: apiFormData,
      }
    );

    const verificationResult = await response.json();
    console.log("Verification result:", verificationResult);

    if (verificationResult.status === 200) {
      // Check if payment details match
      const slipData = verificationResult.data;

      // Initialize variables with default values
      let receiverAccount = null;
      let accountMatch = false;
      const landlordAccount = landlord.accountNumber.replace(/[^0-9]/g, "");

      console.log(slipData);

      // Get bank codes
      const receiverBank = slipData.receiver.bank?.id || "";
      const senderBank = slipData.sender.bank.id;
      const slipAmount = slipData.amount.amount;

      // Handle account checks
      if (senderBank !== "025" && slipData.receiver.account.bank) {
        // Only for non-Krungsri bank transfers
        receiverAccount = slipData.receiver.account.bank.account.replace(
          /[^0-9]/g,
          ""
        );

        // Check if the visible parts of the account numbers match
        accountMatch = receiverAccount.split("x").every((part) => {
          if (part === "") return true; // Skip masked parts
          return landlordAccount.includes(part);
        });
      } else {
        // For Krungsri bank transfers, skip account matching
        accountMatch = true;
      }

      // Create a function to standardize names for comparison
      function standardizeName(name) {
        if (!name) return "";

        // Convert to uppercase
        let standardized = name.toUpperCase();

        // Remove common prefixes
        standardized = standardized.replace(/^(MR\.|MS\.|MRS\.|DR\.)?\s*/, "");

        // Remove special characters and extra spaces
        standardized = standardized.replace(/[^\w\s]/g, "").trim();

        // Split into words
        const nameParts = standardized.split(/\s+/);

        // Return all parts that are longer than 1 character
        return nameParts.filter((part) => part.length > 1);
      }

      // Check if names match by comparing standardized parts
      function areNamesMatching(name1, name2) {
        const parts1 = standardizeName(name1);
        const parts2 = standardizeName(name2);

        // Look for at least one significant name part match
        return parts1.some((part) =>
          parts2.some(
            (otherPart) => otherPart.includes(part) || part.includes(otherPart)
          )
        );
      }

      const bankMatch =
        senderBank === "025" ? true : receiverBank === landlord.bankCode;

      const nameMatch = areNamesMatching(
        landlord.accountName,
        slipData.receiver.account.name?.en || slipData.sender.account.name?.en
      );

      const amountMatch = Math.abs(slipAmount - bill.totalAmount) < 0.01;

      const detailsMatch = {
        bankMatch,
        accountMatch,
        amountMatch,
        nameMatch,
      };

      if (
        detailsMatch.bankMatch &&
        detailsMatch.accountMatch &&
        detailsMatch.amountMatch &&
        detailsMatch.nameMatch
      ) {
        // Convert file to buffer for S3 upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const fileExtension = file.type.split("/")[1];
        const fileName = `slips/${billId}/${uuidv4()}.${fileExtension}`;

        // Upload to S3
        try {
          await s3Client.send(
            new PutObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: fileName,
              Body: buffer,
              ContentType: file.type,
            })
          );

          const slipUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

          // Update bill with payment verification and S3 URL
          const updatedBill = await Bill.findByIdAndUpdate(
            billId,
            {
              $set: {
                paymentStatus: "paid",
                slipData: slipUrl,
                paymentDate: new Date(verificationResult.data.date),
                // Preserve all the calculated values
                waterAmount: bill.waterAmount,
                electricityAmount: bill.electricityAmount,
                totalAmount: bill.totalAmount,
                waterUsage: bill.waterUsage,
                electricityUsage: bill.electricityUsage,
                waterRate: bill.waterRate,
                electricityRate: bill.electricityRate,
                rentAmount: bill.rentAmount,
                actualRentAmount: bill.actualRentAmount,
                additionalFees: bill.additionalFees,
              },
            },
            {
              new: true,
              runValidators: true,
            }
          );

          console.log("Updated bill values:", {
            waterAmount: updatedBill.waterAmount,
            electricityAmount: updatedBill.electricityAmount,
            totalAmount: updatedBill.totalAmount,
            paymentStatus: updatedBill.paymentStatus,
          });

          return NextResponse.json({
            status: 200,
            message: "Payment verified successfully",
            data: {
              slipUrl,
              verificationDate: verificationResult.data.date,
              billDetails: {
                waterAmount: updatedBill.waterAmount,
                electricityAmount: updatedBill.electricityAmount,
                totalAmount: updatedBill.totalAmount,
              },
            },
          });
        } catch (s3Error) {
          console.error("Error uploading to S3:", s3Error);
          return NextResponse.json(
            { error: "Failed to upload slip" },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json({
          status: 400,
          error: "Payment details do not match",
          details: {
            bankMatch: detailsMatch.bankMatch,
            accountMatch: detailsMatch.accountMatch,
            amountMatch: detailsMatch.amountMatch,
            nameMatch: detailsMatch.nameMatch,
            expected: {
              bank: landlord.bankCode,
              account: landlordAccount,
              amount: bill.totalAmount,
              name: landlord.accountName,
            },
            received: {
              bank: receiverBank,
              account: receiverAccount,
              amount: slipAmount,
              name:
                slipData.receiver.account.name?.en ||
                slipData.sender.account.name?.en,
            },
          },
        });
      }
    } else {
      return NextResponse.json(
        {
          error: "Slip verification failed",
          details: verificationResult,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying slip:", error);
    return NextResponse.json(
      { error: "Failed to verify slip", details: error.message },
      { status: 500 }
    );
  }
}
