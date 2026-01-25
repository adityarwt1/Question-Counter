import { FailedToConnectDatabse, InternalServerIssue, TestingTest, Unauthorized, UnExpectedError, VerifyToken } from "@/DRY/apiresponse";
import { HttpStatusCode } from "@/enums/Reponse";
import { LagResponoseData } from "@/interface/Lags/lagresponse";
import { mongoconnect } from "@/lib/mongodb";
import Lags from "@/models/lag/Lags";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest) :Promise<NextResponse<LagResponoseData>>{
    try {
        const authenticationInfo = await VerifyToken(req);

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

        const data = await Lags.find({
            userId: authenticationInfo.user._id
        })

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