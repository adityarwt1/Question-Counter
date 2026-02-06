import { HttpStatusCode, HttpStatusText } from "@/enums/Reponse";
import { StanderedResponse } from "@/interface/Responses/Standered/standeredResponse";
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken'
import { TokenInterface } from "@/interface/TokenPayload/toknePayload";
import { mongoconnect } from "@/lib/mongodb";
import Subject from "@/models/Subject";
import mongoose from "mongoose";

export async function PATCH(req: NextRequest): Promise<NextResponse<StanderedResponse>> {
  try {
    const header = req.headers;
    const searchParams = req.nextUrl.searchParams;
    const token = header.get("authorization")?.split(' ')[1];
    const _id = searchParams.get("_id");
    const type = searchParams.get("type");
    const action = searchParams.get("action");
    const count = Number(searchParams.get("count") ||0 )

    if (!_id || !type || !action  || count === 0) {
      return NextResponse.json({
        status: HttpStatusCode.BAD_REQUEST,
        success: false,
        error: HttpStatusText.BAD_REQUEST,
      }, { status: HttpStatusCode.BAD_REQUEST });
    }

    if (!token) {
      return NextResponse.json({
        status: HttpStatusCode.UNAUTHORIZED,
        success: false,
        error: HttpStatusText.UNAUTHORIZED
      }, { status: HttpStatusCode.UNAUTHORIZED });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenInterface;
    } catch (error) {
      return NextResponse.json({
        success: false,
        status: HttpStatusCode.BAD_REQUEST,
        error: HttpStatusText.BAD_REQUEST,
        message: (error as Error).message
      }, { status: HttpStatusCode.BAD_REQUEST });
    }

    const isConnected = await mongoconnect();
    if (!isConnected) {
      return NextResponse.json({
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        success: false,
        error: HttpStatusText.INTERNAL_SERVER_ERROR,
        message: "Failed to connect mongodb."
      }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }

    // Validate type
    const validTypes = ['dppCount', 'classCount', 'pyqCount', 'bookCount', 'chatGptCount'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        status: HttpStatusCode.BAD_REQUEST,
        success: false,
        error: "Invalid type. Must be one of: dppCount, classCount, pyqCount, bookCount, chatGptCount"
      }, { status: HttpStatusCode.BAD_REQUEST });
    }

    // Validate action
    if (action !== 'increment' && action !== 'decrement') {
      return NextResponse.json({
        status: HttpStatusCode.BAD_REQUEST,
        success: false,
        error: "Invalid action. Must be 'increment' or 'decrement'"
      }, { status: HttpStatusCode.BAD_REQUEST });
    }

    // Build update query
    const incrementValue = action === 'increment' ? count : -count;
    const updateQuery = {
      $inc: { [type]: incrementValue }
    };

    const update = await Subject.updateOne(
      {
        userId: new mongoose.Types.ObjectId(decoded._id),
        _id: new mongoose.Types.ObjectId(_id)
      },
      updateQuery
    );

    if (update.matchedCount === 0) {
      return NextResponse.json({
        status: HttpStatusCode.NOT_FOUND,
        success: false,
        error: "Subject not found"
      }, { status: HttpStatusCode.NOT_FOUND });
    }

    return NextResponse.json({
      status: HttpStatusCode.OK,
      success: true,
      message: `${type} ${action}ed successfully`
    });

  } catch (error) {
    console.log(error);
    return NextResponse.json({
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      success: false,
      error: HttpStatusText.INTERNAL_SERVER_ERROR
    }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
  }
}