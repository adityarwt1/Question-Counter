import mongoose, {Schema, Document} from "mongoose";

interface ChapterInterface extends Document {
    chapterName:string,
    subjectId:mongoose.Types.ObjectId
}

const ChapterSchema: Schema<ChapterInterface> = new Schema({
    chapterName:{
        type:String,
        required:true,

    },
    subjectId:{
        type:Schema.Types.ObjectId,
        required:true
    }
},{
    timestamps:true
})

const ChapterQuestionBank = mongoose.models.ChapterQuestionBank || mongoose.model<ChapterInterface>("ChapterQuestionBank", ChapterSchema)

export default ChapterQuestionBank