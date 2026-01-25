import { BadRequest, FailedToConnectDatabse, InternalServerIssue, TestingTest, Unauthorized, UnExpectedError, VerifyToken } from "@/DRY/apiresponse";
import { HttpStatusCode } from "@/enums/Reponse";
import { LagResponoseData } from "@/interface/Lags/lagresponse";
import { StanderedResponse } from "@/interface/Responses/Standered/standeredResponse";
import { mongoconnect } from "@/lib/mongodb";
import Lags from "@/models/lag/Lags";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest) :Promise<NextResponse<LagResponoseData>>{
    try {
        const authenticationInfo = await VerifyToken(req);
        console.log(authenticationInfo.user)
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
                    userId: new mongoose.Types.ObjectId(authenticationInfo.user._id)
                    }
                },
                {
                    $project: {
                    _id: 1,
                    subjectName: 1,
                    }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                }
                ]);
        return NextResponse.json({
            status:HttpStatusCode.OK,
            success:true,
            data,
            message:"Lags fetch successfully!"
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
            userId:authenticationInfo.user._id
        })

        if(!added){
            return InternalServerIssue(new Error("Failed to add lag!"))
        }

        return NextResponse.json({
            status:HttpStatusCode.CREATED,
            success:true,
        },{
            status:HttpStatusCode.CREATED
        })
    } catch (error) {
        console.log(error)
        return InternalServerIssue(error)
    }
    
}

export async function PATCH(req:NextRequest):Promise<NextResponse<StanderedResponse>> {
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
        })

        if(!data){
            return UnExpectedError("Failed to update!")
        }
        return NextResponse.json({
            status:HttpStatusCode.OK,
            success:true,
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