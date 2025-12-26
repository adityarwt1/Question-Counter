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

export async function POST(req:NextRequest):Promise<NextResponse<AuthResponseInterface>> {
    const cookie = await cookies()
    try {
        const body:SignInInterface = await req.json()

        // zod validaton 
        const isValidFormat = signinValidaton.safeParse(body)

        if(!isValidFormat.success){
            return NextResponse.json({
                success:false,
                error:'Validation errror!',
                status:HttpStatusCode.BAD_REQUEST
            },{
                status:400
            })
        }

        const isConnected = await mongoconnect()

        if(!isConnected){
            return NextResponse.json({
                status:HttpStatusCode.INTERNAL_SERVER_ERROR,
                success:false,
                error:HttpStatusText.INTERNAL_SERVER_ERROR,
                message:"Failed to connect mongodb."
            },{
                status:HttpStatusCode.INTERNAL_SERVER_ERROR
            }
        )
        }

        const user = await User.findOne({
            email:body.email
        }).lean()

        if(!user){
            return NextResponse.json({
                status:HttpStatusCode.NOT_FOUND,
                success:false,
                error:"User not found"
            },{
                status:HttpStatusCode.NOT_FOUND
            })
        }

        // confirmig password 
        const isCorrectPassword = await bcrypt.compare(user.password, body.password)

        if(!isCorrectPassword){
            return NextResponse.json({
                status:HttpStatusCode.BAD_REQUEST,
                success:false,
                error:"Wrong password!",
            },{
                status:HttpStatusCode.NOT_FOUND
            })
        }

        const tokenPayload :TokenInterface = {
            _id:user._id
        }

        const token  = jwt.sign(tokenPayload, process.env.JWT_SECRET as string,{
            expiresIn:7*24 * 60 * 60 
        })

        //save into databse
        user.token = token

        await user.save()

        const cookieName = process.env.COOKIE_NAME as string;

        cookie.set(cookieName , token);

        return NextResponse.json({
            status:HttpStatusCode.OK,
            success:true,
            token
        })


    } catch (error) {
        console.log(error)
        return NextResponse.json({
            status:500,
            success:false,
            error:HttpStatusText.INTERNAL_SERVER_ERROR
        })
    }
}