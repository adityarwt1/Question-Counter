import mongoose from "mongoose";
import { StanderedResponse } from "../Responses/Standered/standeredResponse";

interface LagChapterInterfaceData {
    _id:mongoose.Types.ObjectId | string
    chapterName:string
}

export interface LagChapterInterface extends StanderedResponse {
    data?: LagChapterInterfaceData[]
}