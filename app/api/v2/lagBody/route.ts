import { BadRequest, FailedToConnectDatabse, InternalServerIssue, Unauthorized, UnExpectedError, VerifyToken } from "@/DRY/apiresponse";
import { HttpStatusCode } from "@/enums/Reponse";
import { LagChapterInterface, LagChapterUpadateInterface } from "@/interface/lagChapter/lagchapter";
import { StanderedResponse } from "@/interface/Responses/Standered/standeredResponse";
import { mongoconnect } from "@/lib/mongodb";
import LagBody from "@/models/lag/LagBody";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { LagType } from "@/types/lagType"

export async function GET(req: NextRequest): Promise<NextResponse<StanderedResponse>> {
    try {
        const authenticatedUser = await VerifyToken(req)
        const searchParams = req.nextUrl.searchParams;
        const lagChapterId = searchParams.get("lagChapterId")
        const page = Number(searchParams.get("page")) || 1;
        const limit = Number(searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit
        const query = searchParams.get("q") // Search string
        const typeFilter = searchParams.get("type") as LagType | null // Type filter

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
            matchCriteria.body = { $regex: query, $options: "i" };
        }

        // 3. If a type filter exists, add it to match criteria
        if (typeFilter && ["question", "formula", "theory", "approach", "mistake", "learning", "trick", "revisit"].includes(typeFilter)) {
            matchCriteria.type = typeFilter;
        }

        const data = await LagBody.aggregate([
            { $match: matchCriteria },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $project: { _id: 1, body: 1, type: 1 } },
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

export async function POST(req: NextRequest): Promise<NextResponse<StanderedResponse>> {
    try {
        const authenticationdata = await VerifyToken(req)
        if (!authenticationdata.isVerified) {
            return Unauthorized()
        }

        const { _id, body, type } = await req.json()

        if (!_id || !body || !type) {
            return BadRequest("lagChapterId, body, and type not provided!")
        }

        const isConenected = await mongoconnect()
        if (!isConenected) {
            return InternalServerIssue(new Error("failed to connect database!"))
        }

        const data = await LagBody.create({
            lagChapterId: _id,
            body,
            type
        })

        if (!data) {
            return InternalServerIssue("failed to create chapter for subject!")
        }

        return NextResponse.json({
            success: true,
            status: HttpStatusCode.CREATED,
            data: {
                _id: data._id,
                body: data.body,
                type: data.type
            }
        }, { status: HttpStatusCode.CREATED })
    } catch (error) {
        console.log(error)
        return InternalServerIssue(error)
    }
}

export async function PATCH(req: NextRequest): Promise<NextResponse<StanderedResponse>> {
    try {
        const authenticatedData = await VerifyToken(req)
        if (!authenticatedData.isVerified) {
            return Unauthorized()
        }

        const { _id, body, type } = await req.json()

        if (!_id || (!body && !type)) {
            return BadRequest("_id and at least body or type must be provided!")
        }

        const isConenected = await mongoconnect()
        if (!isConenected) {
            return FailedToConnectDatabse()
        }

        const updateData: any = {}
        if (body) updateData.body = body
        if (type) updateData.type = type

        const data = await LagBody.findOneAndUpdate(
            { _id },
            updateData,
            { new: true }
        ).select("body _id type").lean()

        return NextResponse.json({
            status: HttpStatusCode.OK,
            success: true,
            data
        })
    } catch (error) {
        console.log(error)
        return InternalServerIssue(error)
    }
}

export async function DELETE(req: NextRequest): Promise<NextResponse<StanderedResponse>> {
    try {
        const authenticationData = await VerifyToken(req)
        if (!authenticationData.isVerified) {
            return Unauthorized()
        }

        const { _id } = await req.json()

        if (!_id) {
            return BadRequest("_id not provided in body!")
        }

        const isConnected = await mongoconnect()
        if (!isConnected) {
            return FailedToConnectDatabse()
        }

        try {
            await LagBody.findOneAndDelete({ _id })
        } catch (error) {
            return UnExpectedError("Failed to delete chapter!")
        }

        return NextResponse.json({
            success: true,
            status: HttpStatusCode.OK
        })
    } catch (error) {
        console.log(error)
        return InternalServerIssue(error)
    }
}