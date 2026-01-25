import { BadRequest, FailedToConnectDatabse, InternalServerIssue, Unauthorized, VerifyToken } from "@/DRY/apiresponse";
import { HttpStatusCode } from "@/enums/Reponse";
import { LagChapterInterface } from "@/interface/lagChapter/lagchapter";
import { mongoconnect } from "@/lib/mongodb";
import LagChapters from "@/models/lag/LagChapters";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest):Promise<NextResponse<LagChapterInterface>> {
    try {
        const authenticatedUser = await VerifyToken(req)
        const searchParams = req.nextUrl.searchParams;
        const lagId = searchParams.get("chapterId")
        const page = Number(searchParams.get("page"))|| 1;
        const limit = Number(searchParams.get("limit")) || 10;
        const skip = (page -1)* limit


        if(!authenticatedUser.isVerified || !authenticatedUser.user?._id){
            return Unauthorized()
        }

        if(!lagId){
            return BadRequest("lagId not provided in body!")
        }
        const isConnected = await mongoconnect()

        if(!isConnected){
            return FailedToConnectDatabse()
        }
        
        const data = await LagChapters.aggregate([
            {
                $match:{
                    chapterId:new mongoose.Types.ObjectId(authenticatedUser.user._id)
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