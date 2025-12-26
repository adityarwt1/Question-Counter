import { HttpStatusCode, HttpStatusText } from "@/enums/Reponse";
import { AuthResponseInterface, SignInInterface } from "@/interface/Auth/validations";
import { TokenInterface } from "@/interface/TokenPayload/toknePayload";
import { mongoconnect } from "@/lib/mongodb";
import User from "@/models/User";
import { signinValidaton } from "@/zod/authValidation";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken'
import { cookies } from "next/headers";

export async function POST(req: NextRequest): Promise<NextResponse<AuthResponseInterface>> {
  const cookie = await cookies();
  try {
    const body: SignInInterface = await req.json();

    // zod validation 
    const isValidFormat = signinValidaton.safeParse(body);

    if (!isValidFormat.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation error!',
        status: HttpStatusCode.BAD_REQUEST
      }, {
        status: 400
      });
    }

    const isConnected = await mongoconnect();

    if (!isConnected) {
      return NextResponse.json({
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        success: false,
        error: HttpStatusText.INTERNAL_SERVER_ERROR,
        message: "Failed to connect mongodb."
      }, {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR
      });
    }

    // Remove .lean() so we get a Mongoose document
    const user = await User.findOne({
      email: body.email
    });

    if (!user) {
      return NextResponse.json({
        status: HttpStatusCode.NOT_FOUND,
        success: false,
        error: "User not found"
      }, {
        status: HttpStatusCode.NOT_FOUND
      });
    }

    // Fix: Compare body.password with user.password (correct order)
    const isCorrectPassword = await bcrypt.compare(body.password, user.password);

    if (!isCorrectPassword) {
      return NextResponse.json({
        status: HttpStatusCode.BAD_REQUEST,
        success: false,
        error: "Wrong password!",
      }, {
        status: HttpStatusCode.BAD_REQUEST
      });
    }

    const tokenPayload: TokenInterface = {
      _id: user._id
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET as string, {
      expiresIn: 7 * 24 * 60 * 60
    });

    // Save into database
    user.token = token;
    await user.save();

    const cookieName = process.env.COOKIE_NAME as string;
    cookie.set(cookieName, token);

    return NextResponse.json({
      status: HttpStatusCode.OK,
      success: true,
      token
    });

  } catch (error) {
    console.log(error);
    return NextResponse.json({
      status: 500,
      success: false,
      error: HttpStatusText.INTERNAL_SERVER_ERROR
    }, {
      status: 500
    });
  }
}