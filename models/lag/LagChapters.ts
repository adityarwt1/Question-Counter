import mongoose , {Schema , Document} from "mongoose";

interface LagChapters extends Document {
    subjectId: mongoose.Types.ObjectId,
    chapterName:string
}

const LagChapterSchema :Schema<LagChapters> = new Schema({
    subjectId:{
        type:Schema.Types.ObjectId,
        required:true
    },
    chapterName:{
        type:String,
        required:true
    }
},{
    timestamps:true
});

const LagChapters = mongoose.models.LagChapters || mongoose.model<LagChapters>("LagChapters", LagChapterSchema)
export default  LagChapters;
