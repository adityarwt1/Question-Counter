import { HttpStatusCode, HttpStatusText } from "@/enums/Reponse";
import { GetSubjectInterfacev2 } from "@/interface/Subject/Subject";
import { TokenInterface } from "@/interface/TokenPayload/toknePayload";
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken'
import { mongoconnect } from "@/lib/mongodb";
import Subject from "@/models/Subject";
import mongoose from "mongoose";

export async function GET(req:NextRequest) :Promise<NextResponse<GetSubjectInterfacev2>> {

    try {
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

        let decodedToken: TokenInterface

        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as TokenInterface;
        } catch (error) {
            return NextResponse.json({
                success: false,
                status: HttpStatusCode.BAD_REQUEST,
                error: HttpStatusText.BAD_REQUEST,
                message: (error as Error).message
            }, { status: HttpStatusCode.BAD_REQUEST });
        }

        if(!decodedToken._id){
            return NextResponse.json({
                status:HttpStatusCode.UNAUTHORIZED, 
                success:false,
                error:HttpStatusText.UNAUTHORIZED,
            },{
                status:HttpStatusCode.UNAUTHORIZED
            })
        }

        const isConnected = await mongoconnect();

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

        const subjects = await Subject.aggregate([
            { 
                $match: { 
                userId: new mongoose.Types.ObjectId(decodedToken._id) 
                } 
            },
            { 
                $project: { 
                _id: 1, 
                subjectName: 1, 
                dppCount: 1,
                classCount: 1,
                pyqCount: 1,
                bookCount: 1,
                chatGptCount: 1,
                totalcount: { 
                    $add: [ 
                    "$dppCount", 
                    "$classCount", 
                    "$pyqCount", 
                    "$bookCount", 
                    "$chatGptCount" 
                    ] 
                }
                }
            },
            {
                $group: {
                _id: null,
                subjects: { $push: "$$ROOT" },
                overallCount: { 
                    $sum: { 
                    $add: [ 
                        "$dppCount", 
                        "$classCount", 
                        "$pyqCount", 
                        "$bookCount", 
                        "$chatGptCount" 
                    ] 
                    } 
                }
                }
            },
            {
                $project: {
                _id: 0,
                subjects: 1,
                overallCount: 1
                }
            }
            ]);
        return NextResponse.json({
            success:true,
            status:HttpStatusCode.OK,
            subjects:subjects
        },{
            status:HttpStatusCode.OK
        })
    } catch (error) {
        console.log(error)
        return NextResponse.json({
            success:false,
            status:HttpStatusCode.INTERNAL_SERVER_ERROR,
            error:HttpStatusText.INTERNAL_SERVER_ERROR,
            message:(error as Error).message
        },{
            status:HttpStatusCode.INTERNAL_SERVER_ERROR
        })
    }
    
}