import mongoose, { Document, Schema } from "mongoose";

interface SubjectDocument extends Document{
    subjectName:string,
    dppCount:number,
    classCount:number,
    pyqCount:number,
}

const SubjectShema:Schema<SubjectDocument> = new Schema({
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
    }
},{timestamps:true})

const Subject = mongoose.models.Subject || mongoose.model<SubjectDocument>("Subject", SubjectShema)

export default Subject;