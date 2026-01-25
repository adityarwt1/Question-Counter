import mongoose from "mongoose";
import { StanderedResponse } from "../Responses/Standered/standeredResponse";

export interface LagChapterInterfaceData {
    _id:mongoose.Types.ObjectId | string
    chapterName:string
}

export interface LagChapterInterface extends StanderedResponse {
    data?: LagChapterInterfaceData[]
}
export interface LagChapterUpadateInterface extends StanderedResponse {
    data?: LagChapterInterfaceData
}