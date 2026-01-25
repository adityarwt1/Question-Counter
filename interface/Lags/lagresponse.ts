import mongoose from "mongoose";
import { StanderedResponse } from "../Responses/Standered/standeredResponse";

interface LagResponseDataInterface {
    subjectName:string,
    id:mongoose.Types.ObjectId | string,
}
export interface LagResponoseData extends StanderedResponse {
    data?:LagResponoseData[]
}