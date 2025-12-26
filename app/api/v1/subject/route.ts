import { HttpStatusCode, HttpStatusText } from "@/enums/Reponse";
import { StanderedResponse } from "@/interface/Responses/Standered/standeredResponse";
import { AddSubjectInterface } from "@/interface/Subject/Subject";
import { mongoconnect } from "@/lib/mongodb";
import Subject from "@/models/Subject";
import { AddSubject } from "@/zod/subjectValidations";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken"
import { TokenInterface } from "@/interface/TokenPayload/toknePayload";

export async function POST(req:NextRequest):Promise<NextResponse<StanderedResponse>> {
    try {
    // token authenctication part 
    const header = req.headers
    const token = header.get("autherization")?.split(' ')[1];
    
    if(!token){
        return NextResponse.json({
            status:HttpStatusCode.UNAUTHORIZED,
            success:false,
            error:HttpStatusText.UNAUTHORIZED
        },{
            status:HttpStatusCode.UNAUTHORIZED
        })
    }

    // token verification
    let decoded 

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenInterface
    } catch (error) {
        return NextResponse.json({
            success:false,
            status:HttpStatusCode.BAD_REQUEST,
            error:HttpStatusText.BAD_REQUEST,
            message:(error as Error).message
        })
    }

    const body:AddSubjectInterface = await req.json()
    
    if(!body){
        return NextResponse.json({
            success:false,
            status:HttpStatusCode.BAD_REQUEST,
            error:HttpStatusText.BAD_REQUEST,
        },{
            status:HttpStatusCode.BAD_REQUEST
        })
    }
    const isValidRequest = AddSubject.safeParse(body)

    if(!isValidRequest.success){
        return NextResponse.json({
            status:HttpStatusCode.BAD_REQUEST,
            success:false,
            error:HttpStatusText.BAD_REQUEST,
        },{
            status:HttpStatusCode.BAD_REQUEST
        })
    }

    const isConnected   = await mongoconnect()

    if(!isConnected){
        return NextResponse.json({
            status:HttpStatusCode.INTERNAL_SERVER_ERROR,
            success:false,
            error:HttpStatusText.INTERNAL_SERVER_ERROR,
        },{
            status:HttpStatusCode.INTERNAL_SERVER_ERROR
        })
    }

    const subject = await Subject.create({...body, userId:decoded._id})
    

    if(!subject){
        return NextResponse.json({
            success:false,
            status:HttpStatusCode.INTERNAL_SERVER_ERROR,
            error: HttpStatusText.INTERNAL_SERVER_ERROR
        })
    }

    return NextResponse.json({
        status:HttpStatusCode.OK,
        success:true,
    })
    } catch (error) {
        return NextResponse.json({
            status:HttpStatusCode.INTERNAL_SERVER_ERROR,
            success:false,
            error:HttpStatusText.INTERNAL_SERVER_ERROR
        })
    }
}


// delte api

export async function DELETE(req:NextRequest):Promise<NextResponse<StanderedResponse>>{
    
    try {
    const header = req.headers
    const searchParams = req.nextUrl.searchParams;
    const token = header.get("autherization")?.split(' ')[1];
    const _id = searchParams.get("_id");
    

    if(!token){
        return NextResponse.json({
            status:HttpStatusCode.UNAUTHORIZED,
            success:false,
            error:HttpStatusText.UNAUTHORIZED
        },{
            status:HttpStatusCode.UNAUTHORIZED
        })
    }

    if(!_id){
        return NextResponse.json({
            success:false,
            status:HttpStatusCode.BAD_REQUEST,
            error:HttpStatusText.BAD_REQUEST
        },{
            status:HttpStatusCode.BAD_REQUEST
        })
    }
    // token verification
    let decoded 

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenInterface
    } catch (error) {
        return NextResponse.json({
            success:false,
            status:HttpStatusCode.BAD_REQUEST,
            error:HttpStatusText.BAD_REQUEST,
            message:(error as Error).message
        },{
            status:HttpStatusCode.BAD_REQUEST
        })
    }

    const isConnected   = await mongoconnect()

    if(!isConnected){
        return NextResponse.json({
            status:HttpStatusCode.INTERNAL_SERVER_ERROR,
            success:false,
            error:HttpStatusText.INTERNAL_SERVER_ERROR,
        },{
            status:HttpStatusCode.INTERNAL_SERVER_ERROR
        })
    }
    
    try {
        await Subject.deleteOne({_id})
    } catch (error) {
        return NextResponse.json({
            status:HttpStatusCode.INTERNAL_SERVER_ERROR,
            success:false,
            error:HttpStatusText.INTERNAL_SERVER_ERROR,
            message:"Failed to delete from databse"
        })
    }

    return NextResponse.json({
        status:HttpStatusCode.OK,
        success:true,
    })
    } catch (error) {

        return NextResponse.json({
            status:HttpStatusCode.INTERNAL_SERVER_ERROR,
            success:false,
            error:HttpStatusText.INTERNAL_SERVER_ERROR
        })
    }

}

