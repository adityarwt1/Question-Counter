import { HttpStatusCode, HttpStatusText } from "@/enums/Reponse";
import { StanderedResponse } from "@/interface/Responses/Standered/standeredResponse";
import { TokenInterface } from "@/interface/TokenPayload/toknePayload";
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken'
import { mongoconnect } from "@/lib/mongodb";
import Subject from "@/models/Subject";
export async function POST(req:NextRequest):Promise<NextResponse<StanderedResponse>> {

    try {
        const searchParams = req.nextUrl.searchParams;
        const _id = searchParams.get("_id");
        const header = req.headers;
        const token = header.get("authorization")?.split(" ")[1];

        if(!token){
            return NextResponse.json({
                status:HttpStatusCode.UNAUTHORIZED,
                success:false,
                error:HttpStatusText.UNAUTHORIZED,
            },{
                status:HttpStatusCode.UNAUTHORIZED
            })
        }

        let decoded:TokenInterface;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenInterface;
        } catch (error) {
            console.log(error)
            return NextResponse.json({
                success:false,
                status:HttpStatusCode.BAD_REQUEST,
                error:HttpStatusText.BAD_REQUEST,
                message:(error as Error).message
            },{
                status:HttpStatusCode.BAD_REQUEST
            })
        }
        const body = await req.json();
        
        const {  count , type} = body;

        if( !count || !_id || !type){
            return NextResponse.json({
                status:HttpStatusCode.BAD_REQUEST,
                success:false,
                error:HttpStatusText.BAD_REQUEST,
                message:"Please provide increment or decrement or count value."
            },{
                status:HttpStatusCode.BAD_REQUEST
            })
        }


        const isConnected = mongoconnect();

        if(!isConnected){
            return NextResponse.json({
                status:HttpStatusCode.INTERNAL_SERVER_ERROR,
                success:false,
                error:HttpStatusText.INTERNAL_SERVER_ERROR,
                message:"Failed to connect mongodb."
            },{
                status:HttpStatusCode.INTERNAL_SERVER_ERROR
            })
        }

        const updateData = await Subject.findOneAndUpdate(
            { _id: _id},
            {
                $inc: {
                    [type]: count > 0 ? count : -count,
                }
            },
            { new: true }
        );

        if(!updateData){
            return NextResponse.json({
                status:HttpStatusCode.NOT_FOUND,
                success:false,
                error:HttpStatusText.NOT_FOUND,
                message:"Subject data not found."
            },{
                status:HttpStatusCode.NOT_FOUND
            })
        }

        return NextResponse.json({
            status:HttpStatusCode.OK,
            success:true,
            message:"Question count updated successfully.",
            data:{
                questionCount:updateData.questionCount
            }
        },{
            status:HttpStatusCode.OK
        })
    } catch (error) {
        console.log(error)

        return NextResponse.json({
            status:HttpStatusCode.INTERNAL_SERVER_ERROR,
            success:false,
            error:HttpStatusText.INTERNAL_SERVER_ERROR,
            message:(error as Error).message
        },{
            status:HttpStatusCode.INTERNAL_SERVER_ERROR
        })
    }
    
}