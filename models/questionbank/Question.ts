import mongoose , {Schema, Document} from "mongoose";

interface QuestionInterface extends Document {
    chapterId:mongoose.Types.ObjectId
    src:string,
    answer:number
}

const QuestionSchema :Schema<QuestionInterface> = new Schema({
    chapterId:{
        type:Schema.Types.ObjectId,
        required:true
    },
    src:{
        type:String,
        required:true
    },
    answer:{
        type:Number,
        required:true
    }
},{
    timestamps:true
}) 

const Question = mongoose.models.Question || mongoose.model<QuestionInterface>("Question", QuestionSchema)

export default Question