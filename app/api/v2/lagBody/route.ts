import { BadRequest, FailedToConnectDatabse, InternalServerIssue, Unauthorized, UnExpectedError, VerifyToken } from "@/DRY/apiresponse";
import { HttpStatusCode } from "@/enums/Reponse";
import { LagChapterInterface, LagChapterUpadateInterface } from "@/interface/lagChapter/lagchapter";
import { StanderedResponse } from "@/interface/Responses/Standered/standeredResponse";
import { mongoconnect } from "@/lib/mongodb";
import LagBody from "@/models/lag/LagBody";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest): Promise<NextResponse<LagChapterInterface>> {
    try {
        const authenticatedUser = await VerifyToken(req)
        const searchParams = req.nextUrl.searchParams;
        const lagChapterId = searchParams.get("lagChapterId")
        const page = Number(searchParams.get("page")) || 1;
        const limit = Number(searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit
        const query = searchParams.get("q") // This is your search string

        if (!authenticatedUser.isVerified || !authenticatedUser.user?._id) {
            return Unauthorized()
        }

        if (!lagChapterId) {
            return BadRequest("lagChapterId not provided in query params!")
        }

        const isConnected = await mongoconnect()
        if (!isConnected) {
            return FailedToConnectDatabse()
        }

        // 1. Define the base match criteria
        const matchCriteria: any = {
            lagChapterId: new mongoose.Types.ObjectId(lagChapterId)
        };

        // 2. If a search query exists, add a regex filter for the 'body' field
        if (query) {
            matchCriteria.body = { $regex: query, $options: "i" }; // "i" makes it case-insensitive
        }

        const data = await LagBody.aggregate([
            {
                $match: matchCriteria
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            },
            {
                $project: {
                    _id: 1,
                    body: 1
                }
            },
        ])

        return NextResponse.json({
            status: HttpStatusCode.OK,
            success: true,
            data,
            skip,
            limit,
            page
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

        const {_id, body} = await req.json()

        if(!_id || !body){
            return BadRequest("lagChapterId and body not provided!")
        }

        const isConenected = await mongoconnect()

        if(!isConenected){
            return InternalServerIssue(new Error("failed to connect database!"))
        }
        const data = await LagBody.create({
            lagChapterId:_id,
            body
        })

        if(!data){
            return InternalServerIssue("failed to create chapter for subject!")
        }

        return NextResponse.json({
            success:true,
            status:HttpStatusCode.CREATED,
            data:{
                _id:data._id,
                body:data.body,
            }
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

        const {_id, body} = await req.json()

        if(!_id || !body){
            return BadRequest("chapter is not provided or body!")
        }

        const isConenected = await mongoconnect()

        if(!isConenected){
            return FailedToConnectDatabse()
        }

        const data = await LagBody.findOneAndUpdate({
            _id
        },
        {
            body
        },{
            new :true
        }
        ).select("body _id").lean()
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
            await LagBody.findOneAndDelete({
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