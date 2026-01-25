import mongoose from "mongoose";
import { StanderedResponse } from "../Responses/Standered/standeredResponse";

export interface LagResponseDataInterface {
    subjectName:string,
    _id:mongoose.Types.ObjectId | string,
}
export interface LagResponoseData extends StanderedResponse {
    data?:LagResponseDataInterface[]
}
export interface LagUpadateResponoseData extends StanderedResponse {
    data?:LagResponseDataInterface
}

