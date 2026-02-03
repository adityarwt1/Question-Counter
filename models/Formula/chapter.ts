import mongoose, {Schema, Document} from "mongoose";

interface ChapterFormula extends Document {
    chapterName:string,
    subjectId:mongoose.Types.ObjectId
}

const ChapterSchema: Schema<ChapterFormula> = new Schema({
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

const ChapterFormula = mongoose.models.ChapterFormula || mongoose.model<ChapterFormula>("ChapterFormula", ChapterSchema)

export default ChapterFormula