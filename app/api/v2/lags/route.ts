import { BadRequest, FailedToConnectDatabse, InternalServerIssue, TestingTest, Unauthorized, UnExpectedError, VerifyToken } from "@/DRY/apiresponse";
import { HttpStatusCode } from "@/enums/Reponse";
import { LagResponoseData, LagUpadateResponoseData } from "@/interface/Lags/lagresponse";
import { StanderedResponse } from "@/interface/Responses/Standered/standeredResponse";
import { mongoconnect } from "@/lib/mongodb";
import Lags from "@/models/lag/Lags";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest) :Promise<NextResponse<LagResponoseData>>{
    try {
        const authenticationInfo = await VerifyToken(req);
        const searchParms = req.nextUrl.searchParams;

        const limit = Number(searchParms.get("limit")) || 20;
        const page = Number(searchParms.get("page"))|| 1
        const skip = (page -1) * limit
        if(!authenticationInfo.isVerified){
            return Unauthorized()
        }

        const isConnected = await mongoconnect()

        if(!isConnected){
            return FailedToConnectDatabse()
        }

        if(!authenticationInfo.user?._id){
            return UnExpectedError("User id not present in the token!")
        }

        
            const data = await Lags.aggregate([
                {
                    $match: {
                    userIds: new mongoose.Types.ObjectId(authenticationInfo.user._id)
                    }
                },
                {
                    $sort:{
                        createdAt:-1
                    }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                },{
                    $project: {
                    _id: 1,
                    subjectName: 1,
                    }
                }
                ]);
        return NextResponse.json({
            status:HttpStatusCode.OK,
            success:true,
            data,
            message:"Lags fetch successfully!",
            page,
            limit,
            skip
        })
    } catch (error) {
        console.log(error)
       return InternalServerIssue(error)
    }
}


export async function POST(req:NextRequest) :Promise<NextResponse<StanderedResponse>> {
    try {
        const authenticationInfo = await VerifyToken(req)

        if(!authenticationInfo.isVerified){
            return Unauthorized()
        }
        const {subjectName} = await req.json()

        if(!subjectName){
            return BadRequest("SubjectName not provided in body!")
        }
        const isConnected = await mongoconnect()

        if(!isConnected){
            return InternalServerIssue()
        }

        if(!authenticationInfo.user?._id){
            return UnExpectedError("Userid not found in the token!")
        }
        const added = await Lags.create({
            subjectName,
            userIds:authenticationInfo.user._id
        })

        if(!added){
            return InternalServerIssue(new Error("Failed to add lag!"))
        }

        return NextResponse.json({
            status:HttpStatusCode.CREATED,
            success:true,
            data:{
                _id:added._id,
                subjectName:added.subjectName
            }
        },{
            status:HttpStatusCode.CREATED
        })
    } catch (error) {
        console.log(error)
        return InternalServerIssue(error)
    }
    
}

export async function PATCH(req:NextRequest):Promise<NextResponse<LagUpadateResponoseData>> {
    try {
        const authentication = await VerifyToken(req)

        if(!authentication.isVerified){
            return Unauthorized()
        }

        const {_id, subjectName } = await req.json()

        if(!_id || !subjectName){
            return BadRequest("Field not provided properly!")
        }

        const isConnected = await mongoconnect()

        if(!isConnected){
            return FailedToConnectDatabse()
        }

        const data = await Lags.findOneAndUpdate({
            _id
        },{
            subjectName
        },{
            new:true
        }).select("_id subjectName")

        if(!data){
            return UnExpectedError("Failed to update!")
        }
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

export async function DELETE(req:NextRequest):Promise<NextResponse<StanderedResponse>> {
    try {
        const authenticatedData = await VerifyToken(req)

        if(!authenticatedData.isVerified ){
            return Unauthorized()
        };
        const {_id} = await req.json()

        if(!_id){
            return BadRequest("_id not provided")
        }
        const isConnected = await mongoconnect()

        if(!isConnected){
            return FailedToConnectDatabse()
        }
        try {
        await Lags.findOneAndDelete({
            _id
        })
        } catch (error) {
            return UnExpectedError("Failed to delete!")
        }
        
        return NextResponse.json({
            status:HttpStatusCode.OK,
            success:true
        })
    } catch (error) {
        console.log(error)
        return InternalServerIssue(error)
    }
}