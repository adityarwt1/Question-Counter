import { HttpStatusCode, HttpStatusText } from "@/enums/Reponse";
import { SignInInterface } from "@/interface/Auth/validations";
import { StanderedResponse } from "@/interface/Responses/Standered/standeredResponse";
import { TokenInterface } from "@/interface/TokenPayload/toknePayload";
import { mongoconnect } from "@/lib/mongodb";
import User from "@/models/User";
import { signinValidaton } from "@/zod/authValidation";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken'
export async function POST(req:NextRequest):Promise<NextResponse<StanderedResponse>> {
    const cookie = await cookies()
    try {``
        const body:SignInInterface = await req.json()

        if(!body){
            return NextResponse.json({
                status:HttpStatusCode.BAD_REQUEST,
                success:false,
                error:HttpStatusText.BAD_REQUEST
            },
            {
                status:400
            }
        )
        }

        const isValidBody = signinValidaton.safeParse(body)

        if(!isValidBody.success){
            return NextResponse.json({
                success:false,
                status:HttpStatusCode.BAD_REQUEST,
                error: HttpStatusText.BAD_REQUEST,
            },
        {
            status:400
        })
        }

        const isConnected = await mongoconnect()

        if(!isConnected){
            return NextResponse.json({
                success:false,
                status:HttpStatusCode.INTERNAL_SERVER_ERROR,
                error:HttpStatusText.INTERNAL_SERVER_ERROR,
                message:"Failed to connect database!"
            },
        {
            status:HttpStatusCode.INTERNAL_SERVER_ERROR
        })
        }

        const isExist = await User.findOne({
            email:body.email
        })

        if(isExist){
            return NextResponse.json({
                status:HttpStatusCode.CONFLICT,
                success:false,
                error:"User already register please login!",
                message:"user already register."
            },{
                status:409
            })
        }

        const user = await User.create(body)

        if(!user){
            return NextResponse.json({
                status:HttpStatusCode.INTERNAL_SERVER_ERROR,
                success:false,
                error:HttpStatusText.INTERNAL_SERVER_ERROR,
                message:"Failed when cretin the user!"
            },{
                status:HttpStatusCode.INTERNAL_SERVER_ERROR
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
            status:HttpStatusCode.INTERNAL_SERVER_ERROR,
            error:HttpStatusText.INTERNAL_SERVER_ERROR,
            success:false,
            message:(error as Error).message
        },{
            status:HttpStatusCode.INTERNAL_SERVER_ERROR
        })
    }
    
}