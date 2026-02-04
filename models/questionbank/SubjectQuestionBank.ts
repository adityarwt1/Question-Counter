import mongoose ,{Schema, Document} from "mongoose";

interface SubjectQuestionBank extends Document {
    subjectName:string,
    userId:mongoose.Types.ObjectId
}

const SubjectSchema:Schema<SubjectQuestionBank> = new Schema({
    subjectName:{
        type:String,
        required:true
    },
    userId:{
        type:Schema.Types.ObjectId,
        required:true
    }
},{
    timestamps:true
})

const SubjectQuestionBank = mongoose.models.SubjectQuestionBank || mongoose.model<SubjectQuestionBank>("SubjectQuestionBank", SubjectSchema)

export default SubjectQuestionBank