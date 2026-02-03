import { InternalServerIssue } from "@/DRY/apiresponse";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) : Promise<NextResponse> {

    try {
        return NextResponse.json({
            success:true
        })
    } catch (error) {
        console.log(error)
        return InternalServerIssue(error)
    }
    
}