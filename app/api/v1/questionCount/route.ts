import { HttpStatusCode, HttpStatusText } from "@/enums/Reponse";
import { SubjectAndQuestionCount, SummaryQuestoinResponse } from "@/interface/Summary/totalQuestion";
import { mongoconnect } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken'
import { TokenInterface } from "@/interface/TokenPayload/toknePayload";
import Subject from "@/models/Subject";
import mongoose from "mongoose";

export async function GET(req:NextRequest) :Promise<NextResponse<SummaryQuestoinResponse>> {
    try {
        const header = req.headers;
        const token = header.get("authorization")?.split(" ")[1];
        console.log(token)
        if(!token){
            return NextResponse.json({
                status:HttpStatusCode.UNAUTHORIZED,
                success:false,
                error:HttpStatusText.UNAUTHORIZED,
            },{
                status:HttpStatusCode.UNAUTHORIZED
            })
        }

        
            let decoded;
            try {
              decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenInterface;
            } catch (error) {
              return NextResponse.json({
                success: false,
                status: HttpStatusCode.BAD_REQUEST,
                error: HttpStatusText.BAD_REQUEST,
                message: (error as Error).message
              }, { status: HttpStatusCode.BAD_REQUEST });
            }
        
            const isConnected = await mongoconnect();
            if (!isConnected) {
              return NextResponse.json({
                status: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false,
                error: HttpStatusText.INTERNAL_SERVER_ERROR,
                message: "Failed to connect mongodb."
              }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
            }
        const subjects = await Subject.aggregate([
                {
                    $match: {
                    userId: new mongoose.Types.ObjectId(decoded._id),
                    },
                },
                {
                    $project: {
                    subjectName: 1,
                    count: {
                        $add: [
                        "$dppCount",
                        "$classCount",
                        "$pyqCount",
                        "$bookCount",
                        "$chatGptCount",
                        ],
                    },
                    },
                },
                {
                    $facet: {
                    subjects: [
                        {
                        $project: {
                            _id: 0,
                            subjectName: 1,
                            count: 1,
                        },
                        },
                    ],
                    total: [
                        {
                        $group: {
                            _id: null,
                            totalCount: { $sum: "$count" },
                        },
                        },
                    ],
                    },
                },
                ]);

            
                return NextResponse.json({
                    status:HttpStatusCode.OK,
                    success:true,
                    subjects,
                })
    } catch (error) {
        console.log(error)
        return NextResponse.json({
            status:HttpStatusCode.INTERNAL_SERVER_ERROR,
            success:false,
            error:HttpStatusText.INTERNAL_SERVER_ERROR,
            message:"failed in finding total question."
        })
    }
}