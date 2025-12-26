import mongoose, { Document, Schema } from "mongoose";

export interface SubjectDocument extends Document{
    userId:mongoose.Types.ObjectId ,
    subjectName:string,
    dppCount:number,
    classCount:number,
    pyqCount:number,
    bookCount:number,
    chatGptCount:number
}

const SubjectShema:Schema<SubjectDocument> = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        required:true
    },
    subjectName:{
        type:String,
        required:true,
    },
    dppCount:{
        type: Number,
        default:0
    },
    classCount:{
        type:Number,
        default:0,
    },
    pyqCount:{
        type:Number,
        default:0
    },
    chatGptCount:{
        type:Number,
        default:0
    },
    bookCount:{
        type:Number,
        default:0
    },
},{timestamps:true})

const Subject = mongoose.models.Subject || mongoose.model<SubjectDocument>("Subject", SubjectShema)
export default Subject;