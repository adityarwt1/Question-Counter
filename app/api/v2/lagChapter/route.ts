import { BadRequest, FailedToConnectDatabse, InternalServerIssue, Unauthorized, VerifyToken } from "@/DRY/apiresponse";
import { HttpStatusCode } from "@/enums/Reponse";
import { LagChapterInterface } from "@/interface/lagChapter/lagchapter";
import { StanderedResponse } from "@/interface/Responses/Standered/standeredResponse";
import { mongoconnect } from "@/lib/mongodb";
import LagChapters from "@/models/lag/LagChapters";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest):Promise<NextResponse<LagChapterInterface>> {
    try {
        const authenticatedUser = await VerifyToken(req)
        const searchParams = req.nextUrl.searchParams;
        const subjectId = searchParams.get("subjectId")
        const page = Number(searchParams.get("page"))|| 1;
        const limit = Number(searchParams.get("limit")) || 10;
        const skip = (page -1)* limit


        if(!authenticatedUser.isVerified || !authenticatedUser.user?._id){
            return Unauthorized()
        }

        if(!subjectId){
            return BadRequest("subjectId not provided in body!")
        }
        const isConnected = await mongoconnect()

        if(!isConnected){
            return FailedToConnectDatabse()
        }
        
        const data = await LagChapters.aggregate([
            {
                $match:{
                    subjectId:new mongoose.Types.ObjectId(subjectId)
                }
            },{
                $project:{
                    _id:1,
                    chapterName:1
                }
            },
            {
                $skip:skip
            },{
                $limit:limit
            }
        ])

        return NextResponse.json({
            status:HttpStatusCode.OK,
            success:true,
            data,
        })
    } catch (error) {
        console.log(error)   
        return InternalServerIssue(error)
    }
}

export async function POST(req:NextRequest):Promise<NextResponse<StanderedResponse>> {
    try {
        const authenticationdata = await VerifyToken(req)

        if(!authenticationdata.isVerified){
            return Unauthorized()
        }

        const {subjectId, chapterName} = await req.json()

        if(!subjectId || !chapterName){
            return BadRequest("subjectId and chapterName not provided!")
        }

        const data = await LagChapters.create({
            subjectId,
            chapterName
        })

        if(!data){
            return InternalServerIssue("failed to create chapter for subject!")
        }

        return NextResponse.json({
            success:true,
            status:HttpStatusCode.CREATED,
        },{
            status:HttpStatusCode.CREATED
        })
    } catch (error) {
        console.log(error)
        return InternalServerIssue(error)
    }
}