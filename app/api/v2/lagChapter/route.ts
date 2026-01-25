import { BadRequest, FailedToConnectDatabse, InternalServerIssue, Unauthorized, UnExpectedError, VerifyToken } from "@/DRY/apiresponse";
import { HttpStatusCode } from "@/enums/Reponse";
import { LagChapterInterface, LagChapterUpadateInterface } from "@/interface/lagChapter/lagchapter";
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

export async function PATCH(req:NextRequest):Promise<NextResponse<LagChapterUpadateInterface>> {
    try {
        const authenticatedData = await VerifyToken(req)

        if(!authenticatedData.isVerified){
            return Unauthorized()
        }

        const {_id, chapterName} = await req.json()

        if(!_id || !chapterName){
            return BadRequest("chapter is not provided or chapterName!")
        }

        const isConenected = await mongoconnect()

        if(!isConenected){
            return FailedToConnectDatabse()
        }

        const data = await LagChapters.findOneAndUpdate({
            _id
        },
        {
            chapterName
        },{
            new :true
        }
        )
        return NextResponse.json({
            status:HttpStatusCode.OK,
            success:true,
            data
        })
    } catch (error) {
        console.log(error)
        return InternalServerIssue(error)
    }
}

export async function DELETE(req:NextRequest) :Promise<NextResponse<StanderedResponse>> {
    try {
        const authenticationData = await VerifyToken(req)        

        if(!authenticationData.isVerified){
            return Unauthorized()
        }

        const {_id} = await req.json()

        if(!_id){
            return BadRequest("_id not provided in body!")
        }

        const isConnected = await mongoconnect()

        if(!isConnected){
            return FailedToConnectDatabse()
        }

        try {
            await LagChapters.findOneAndDelete({
                _id
            })
        } catch (error) {
            return UnExpectedError("Failed to delete chapter!")
        }

        return NextResponse.json({
            success:true,
            status:HttpStatusCode.OK
        })
    } catch (error) {
        console.log(error)
        return InternalServerIssue(error)
    }
}